import { Command } from "commander";
import { getDb } from "../db";
import { documents } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerDeleteDocument(program: Command) {
  program
    .command("delete-document")
    .description("Delete a document by ID")
    .argument("<id>", "ID of the document")
    .action(async (id: string) => {
      const db = getDb();
      await db.delete(documents).where(eq(documents.id, parseInt(id, 10)));
      console.log(`Deleted document ${id}`);
      process.exit(0);
    });
}
