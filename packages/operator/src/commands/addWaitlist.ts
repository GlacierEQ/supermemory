import { Command } from "commander";
import { getDb } from "../db";
import { waitlist } from "@supermemory/db/schema";

export function registerAddWaitlist(program: Command) {
  program
    .command("add-waitlist")
    .description("Add an email to the waitlist")
    .argument("<email>", "Email address")
    .action(async (email: string) => {
      const db = getDb();
      try {
        await db.insert(waitlist).values({ email, createdAt: new Date() });
        console.log(`Added ${email} to waitlist`);
      } catch (err) {
        console.error(`Failed to add ${email} to waitlist`, err);
      }
      process.exit(0);
    });
}
