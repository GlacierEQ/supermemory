import { Command } from "commander";
import { getDb } from "../db";
import { documents } from "@supermemory/db/schema";
import { eq, asc, desc } from "@supermemory/db";

export function registerListDocuments(program: Command) {
  program
    .command("list-documents")
    .description("List documents for a given user ID")
    .argument("<userId>", "ID of the user")
    .option(
      "--sort <field>",
      "Sort by field (created|updated|title)",
      "created"
    )
    .option("--desc", "Sort descending")
    .action(
      async (
        userId: string,
        options: { sort?: string; desc?: boolean }
      ) => {
        const db = getDb();
        let order;
        switch (options.sort) {
          case "updated":
            order = options.desc ? desc(documents.updatedAt) : asc(documents.updatedAt);
            break;
          case "title":
            order = options.desc ? desc(documents.title) : asc(documents.title);
            break;
          default:
            order = options.desc ? desc(documents.createdAt) : asc(documents.createdAt);
        }
        const docs = await db
          .select()
          .from(documents)
          .where(eq(documents.userId, parseInt(userId, 10)))
          .orderBy(order);
        for (const doc of docs) {
          console.log(`${doc.id}: ${doc.title}`);
        }
        process.exit(0);
      }
    );
}
