import {
  WorkflowEntrypoint,
  WorkflowStep,
  WorkflowEvent,
} from "cloudflare:workers";
import { Env, WorkflowParams } from "../types";
import { fetchContent } from "../utils/fetchers";
import chunkText from "../utils/chunkers";
import { database, eq, inArray } from "@supermemory/db";
import {
  ChunkInsert,
  contentToSpace,
  documents,
  spaces,
} from "@supermemory/db/schema";
import { chunk } from "@supermemory/db/schema";
import { NonRetryableError } from "cloudflare:workflows";
import {
  MemorySyncPayload,
  ensureDocumentTracking,
  syncMemoryTargets,
  computeContentHash,
} from "../services/memorySync";
import { bumpMemoryRevision } from "../services/memoryRevision";

// TODO: handle errors properly here.

export class ContentWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
  async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
    // Step 0: Check if user has reached memory limit
    await step.do("check memory limit", async () => {
      const existingMemories = await database(
        this.env.HYPERDRIVE.connectionString
      )
        .select()
        .from(documents)
        .where(eq(documents.userId, event.payload.userId));

      if (existingMemories.length >= 2000) {
        await database(this.env.HYPERDRIVE.connectionString)
          .delete(documents)
          .where(eq(documents.uuid, event.payload.uuid));
        throw new NonRetryableError(
          "You have reached the maximum limit of 2000 memories"
        );
      }
    });

    // Step 1: Get and format the content.
    const rawContent =
      event.payload.prefetched ??
      (await step.do(
        "fetch content",
        async () => await fetchContent(event.payload, this.env, step)
      ));

    // check that the rawcontent is not too big
    if (rawContent.contentToVectorize.length > 100000) {
      await database(this.env.HYPERDRIVE.connectionString)
        .delete(documents)
        .where(eq(documents.uuid, event.payload.uuid));
      throw new NonRetryableError("The content is too big (maximum 20 pages)");
    }

    const chunked = await step.do("chunk content", async () =>
      chunkText(rawContent.contentToVectorize, 768)
    );

    // Step 2: Create the document in the database.
    const document = await step.do("create document", async () => {
      try {
        // First check if document exists
        const existingDoc = await database(this.env.HYPERDRIVE.connectionString)
          .select()
          .from(documents)
          .where(eq(documents.uuid, event.payload.uuid))
          .limit(1);

        return await database(this.env.HYPERDRIVE.connectionString)
          .insert(documents)
          .values({
            userId: event.payload.userId,
            type: event.payload.type,
            uuid: event.payload.uuid,
            ...(event.payload.url && { url: event.payload.url }),
            title: rawContent.title,
            content: rawContent.contentToSave,
            description:
              "description" in rawContent
                ? (rawContent.description ?? "")
                : (event.payload.prefetched?.description ?? undefined),
            ogImage:
              "image" in rawContent
                ? (rawContent.image ?? "")
                : (event.payload.prefetched?.ogImage ?? undefined),
            raw: rawContent.contentToVectorize,
            isSuccessfullyProcessed: false,
            updatedAt: new Date(),
            ...(event.payload.createdAt && {
              createdAt: new Date(event.payload.createdAt),
            }),
          })
          .onConflictDoUpdate({
            target: documents.uuid,
            set: {
              title: rawContent.title,
              content: rawContent.contentToSave,
              description:
                "description" in rawContent
                  ? (rawContent.description ?? "")
                  : (event.payload.prefetched?.description ?? undefined),
              ogImage:
                "image" in rawContent
                  ? (rawContent.image ?? "")
                  : (event.payload.prefetched?.ogImage ?? undefined),
              raw: rawContent.contentToVectorize,
              isSuccessfullyProcessed: false,
              updatedAt: new Date(),
            },
          })
          .returning();
      } catch (error) {
        console.log("here's the error", error);
        // Check if error is a unique constraint violation
        if (
          error instanceof Error &&
          error.message.includes("document_url_user_id_idx")
        ) {
          // Document already exists for this user, stop workflow
          await database(this.env.HYPERDRIVE.connectionString)
            .delete(documents)
            .where(eq(documents.uuid, event.payload.uuid));
          throw new NonRetryableError("Document already exists for this user");
        }
        if (
          error instanceof Error &&
          error.message.includes("document_raw_user_idx")
        ) {
          await database(this.env.HYPERDRIVE.connectionString)
            .delete(documents)
            .where(eq(documents.uuid, event.payload.uuid));
          throw new NonRetryableError("The exact same document already exists");
        }
        throw error; // Re-throw other errors
      }
    });

    if (!document || document.length === 0) {
      throw new Error(
        "Failed to create/update document - no document returned"
      );
    }

    const persistedDocument = document[0];

    // Step 3: Generate embeddings
    const { data: embeddings } = await this.env.AI.run(
      "@cf/baai/bge-base-en-v1.5",
      {
        text: chunked,
      }
    );

    // Step 4: Prepare chunk data
    const chunkInsertData: ChunkInsert[] = await step.do(
      "prepare chunk data",
      async () =>
        chunked.map((chunk, index) => ({
          documentId: persistedDocument.id,
          textContent: chunk,
          orderInDocument: index,
          embeddings: embeddings[index],
        }))
    );

    // Step 5: Insert chunks
    if (chunkInsertData.length > 0) {
      await step.do("insert chunks", async () =>
        database(this.env.HYPERDRIVE.connectionString).transaction(
          async (trx) => {
            await trx.insert(chunk).values(chunkInsertData);
          }
        )
      );
    }

    // step 6: add content to spaces
    if (event.payload.spaces) {
      await step.do("add content to spaces", async () => {
        await database(this.env.HYPERDRIVE.connectionString).transaction(
          async (trx) => {
            // First get the space IDs from the UUIDs
            const spaceIds = await trx
              .select({ id: spaces.id })
              .from(spaces)
              .where(inArray(spaces.uuid, event.payload.spaces ?? []));

            if (spaceIds.length === 0) {
              return;
            }

            // Then insert the content-space mappings using the actual space IDs
            await trx.insert(contentToSpace).values(
              spaceIds.map((space) => ({
                contentId: persistedDocument.id,
                spaceId: space.id,
              }))
            );
          }
        );
      });
    }

    const normalizedContent =
      (rawContent as { contentToSave?: string }).contentToSave ??
      rawContent.contentToVectorize;

    const syncPayload: MemorySyncPayload = {
      documentId: persistedDocument.id,
      uuid: persistedDocument.uuid,
      userId: persistedDocument.userId,
      title: persistedDocument.title ?? rawContent.title,
      type: persistedDocument.type ?? event.payload.type,
      url: persistedDocument.url ?? event.payload.url ?? null,
      spaces: event.payload.spaces ?? [],
      content: normalizedContent,
      chunkCount: chunkInsertData.length,
      createdAt:
        persistedDocument.createdAt instanceof Date
          ? persistedDocument.createdAt.toISOString()
          : new Date().toISOString(),
      updatedAt:
        persistedDocument.updatedAt instanceof Date
          ? persistedDocument.updatedAt.toISOString()
          : new Date().toISOString(),
    };

    const contentHash = await computeContentHash(syncPayload.content);

    await ensureDocumentTracking(this.env, syncPayload, { contentHash });

    await step.do("sync distributed memory stack", async () => {
      await syncMemoryTargets(this.env, syncPayload, { contentHash });
    });

    // Step 7: Mark the document as successfully processed
    await step.do("mark document as successfully processed", async () => {
      await database(this.env.HYPERDRIVE.connectionString)
        .update(documents)
        .set({
          isSuccessfullyProcessed: true,
        })
        .where(eq(documents.id, persistedDocument.id));
    });

    await step.do("refresh memory revision", async () => {
      await bumpMemoryRevision(this.env, persistedDocument.userId);
    });
  }
}
