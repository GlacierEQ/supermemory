import { Command } from "commander";
import { getDb } from "../db";
import { contentToSpace } from "@supermemory/db/schema";

export function registerAddDocumentToSpace(program: Command) {
  program
    .command("add-document-space")
    .description("Link a document to a space")
    .argument("<documentId>", "ID of the document")
    .argument("<spaceId>", "ID of the space")
    .action(async (documentId: string, spaceId: string) => {
      const db = getDb();
      await db
        .insert(contentToSpace)
        .values({
          contentId: parseInt(documentId, 10),
          spaceId: parseInt(spaceId, 10),
        })
        .onConflictDoNothing();
      console.log(`Linked document ${documentId} to space ${spaceId}`);
      process.exit(0);
    });
}
