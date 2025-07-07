import { Command } from "commander";
import { getDb } from "../db";
import { users } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerShowUser(program: Command) {
  program
    .command("show-user")
    .description("Display details for a user")
    .argument("<id>", "ID of the user")
    .action(async (id: string) => {
      const db = getDb();
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id, 10)))
        .then((rows: unknown[]) => rows[0]);
      if (!user) {
        console.log(`User ${id} not found`);
      } else {
        console.log(JSON.stringify(user, null, 2));
      }
      process.exit(0);
    });
}
