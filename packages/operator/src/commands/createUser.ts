import { Command } from "commander";
import { randomUUID } from "crypto";
import { getDb } from "../db";
import { users } from "@supermemory/db/schema";

export function registerCreateUser(program: Command) {
  program
    .command("create-user")
    .description("Create a new user with the provided email")
    .argument("<email>", "Email address of the user")
    .action(async (email: string) => {
      const db = getDb();
      const id = randomUUID();
      await db.insert(users).values({ uuid: id, email });
      console.log(`Created user ${email} with id ${id}`);
      process.exit(0);
    });
}
