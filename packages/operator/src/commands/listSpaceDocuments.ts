import { Command } from "commander";
import { getDb } from "../db";
import { contentToSpace, documents } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerListSpaceDocuments(program: Command) {
  program
    .command("list-space-documents")
    .description("List documents linked to a space")
    .argument("<spaceId>", "ID of the space")
    .action(async (spaceId: string) => {
      const db = getDb();
      const docs = await db
        .select({ id: documents.id, title: documents.title })
        .from(contentToSpace)
        .leftJoin(documents, eq(contentToSpace.contentId, documents.id))
        .where(eq(contentToSpace.spaceId, parseInt(spaceId, 10)));
      for (const doc of docs) {
        console.log(`${doc.id}: ${doc.title}`);
      }
      process.exit(0);
    });
}
