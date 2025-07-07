import { Command } from "commander";
import { getDb } from "../db";
import { documents } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerUpdateDocument(program: Command) {
  program
    .command("update-document")
    .description("Update document metadata")
    .argument("<id>", "ID of the document")
    .option("-t, --title <title>", "New title")
    .option("-u, --url <url>", "New url")
    .action(async (id: string, options: { title?: string; url?: string }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (options.title) updates.title = options.title;
      if (options.url) updates.url = options.url;
      const db = getDb();
      await db.update(documents).set(updates).where(eq(documents.id, parseInt(id, 10)));
      console.log(`Updated document ${id}`);
      process.exit(0);
    });
}
