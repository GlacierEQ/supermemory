import { Command } from "commander";
import { getDb } from "../db";
import { users } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerUpdateUser(program: Command) {
  program
    .command("update-user")
    .description("Update user information")
    .argument("<id>", "ID of the user")
    .option("-e, --email <email>", "New email address")
    .option("--first <name>", "First name")
    .option("--last <name>", "Last name")
    .action(
      async (
        id: string,
        options: { email?: string; first?: string; last?: string }
      ) => {
        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (options.email) updates.email = options.email;
        if (options.first) updates.firstName = options.first;
        if (options.last) updates.lastName = options.last;
        const db = getDb();
        await db.update(users).set(updates).where(eq(users.id, parseInt(id, 10)));
        console.log(`Updated user ${id}`);
        process.exit(0);
      }
    );
}
