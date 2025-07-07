import { Command } from "commander";
import { randomUUID } from "crypto";
import { getDb } from "../db";
import { documents } from "@supermemory/db/schema";

export function registerCreateDocument(program: Command) {
  program
    .command("create-document")
    .description("Create a document for a user")
    .argument("<userId>", "ID of the user")
    .argument("<url>", "Document URL")
    .option("-t, --title <title>", "Document title")
    .action(async (userId: string, url: string, options: { title?: string }) => {
      const db = getDb();
      const uuid = randomUUID();
      const result = await db
        .insert(documents)
        .values({
          userId: parseInt(userId, 10),
          url,
          title: options.title,
          uuid,
          createdAt: new Date(),
          updatedAt: new Date(),
          type: "webpage",
        })
        .returning({ id: documents.id });
      console.log(`Created document ${result[0].id} with uuid ${uuid}`);
      process.exit(0);
    });
}
