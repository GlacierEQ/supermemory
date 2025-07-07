import { Command } from "commander";
import { getDb } from "../db";
import { users } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerDeleteUser(program: Command) {
  program
    .command("delete-user")
    .description("Delete a user by numeric ID")
    .argument("<id>", "ID of the user")
    .action(async (id: string) => {
      const db = getDb();
      await db.delete(users).where(eq(users.id, parseInt(id, 10)));
      console.log(`Deleted user ${id}`);
      process.exit(0);
    });
}
