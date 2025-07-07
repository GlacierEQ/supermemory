import { Command } from "commander";
import { getDb } from "../db";
import { waitlist } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerRemoveWaitlist(program: Command) {
  program
    .command("remove-waitlist")
    .description("Remove an email from the waitlist")
    .argument("<email>", "Email address")
    .action(async (email: string) => {
      const db = getDb();
      await db.delete(waitlist).where(eq(waitlist.email, email));
      console.log(`Removed ${email} from waitlist`);
      process.exit(0);
    });
}
