import { Command } from "commander";
import { getDb } from "../db";
import { waitlist } from "@supermemory/db/schema";

export function registerListWaitlist(program: Command) {
  program
    .command("list-waitlist")
    .description("List waitlist entries")
    .action(async () => {
      const db = getDb();
      const entries = await db.select().from(waitlist);
      for (const entry of entries) {
        console.log(`${entry.email} - ${entry.createdAt}`);
      }
      process.exit(0);
    });
}
