import { Command } from "commander";
import { getDb } from "../db";
import { users } from "@supermemory/db/schema";

export function registerListUsers(program: Command) {
  program
    .command("list-users")
    .description("List all users")
    .action(async () => {
      const db = getDb();
      const allUsers = await db.select().from(users);
      for (const u of allUsers) {
        console.log(`${u.id}: ${u.email} (${u.uuid})`);
      }
      process.exit(0);
    });
}
