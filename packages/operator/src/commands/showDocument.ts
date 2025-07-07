import { Command } from "commander";
import { getDb } from "../db";
import { documents } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerShowDocument(program: Command) {
  program
    .command("show-document")
    .description("Display details for a document")
    .argument("<id>", "ID of the document")
    .action(async (id: string) => {
      const db = getDb();
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, parseInt(id, 10)))
        .then((rows: unknown[]) => rows[0]);
      if (!doc) {
        console.log(`Document ${id} not found`);
      } else {
        console.log(JSON.stringify(doc, null, 2));
      }
      process.exit(0);
    });
}
