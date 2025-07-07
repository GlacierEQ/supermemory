import { Command } from "commander";
import { getDb } from "../db";
import { contentToSpace } from "@supermemory/db/schema";
import { eq, and } from "@supermemory/db";

export function registerRemoveDocumentFromSpace(program: Command) {
  program
    .command("remove-document-space")
    .description("Unlink a document from a space")
    .argument("<documentId>", "ID of the document")
    .argument("<spaceId>", "ID of the space")
    .action(async (documentId: string, spaceId: string) => {
      const db = getDb();
      await db
        .delete(contentToSpace)
        .where(
          and(
            eq(contentToSpace.contentId, parseInt(documentId, 10)),
            eq(contentToSpace.spaceId, parseInt(spaceId, 10))
          )
        );
      console.log(`Unlinked document ${documentId} from space ${spaceId}`);
      process.exit(0);
    });
}
