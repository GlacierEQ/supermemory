import { Command } from "commander";
import { getDb } from "../db";
import { spaceMembers } from "@supermemory/db/schema";

export function registerAddSpaceMember(program: Command) {
  program
    .command("add-space-member")
    .description("Add a user to a space")
    .argument("<spaceId>", "ID of the space")
    .argument("<userId>", "ID of the user")
    .action(async (spaceId: string, userId: string) => {
      const db = getDb();
      try {
        await db.insert(spaceMembers).values({
          spaceId: parseInt(spaceId, 10),
          userId: parseInt(userId, 10),
        });
        console.log(`Added user ${userId} to space ${spaceId}`);
      } catch (err) {
        console.error(`Failed to add user ${userId} to space ${spaceId}`, err);
      }
      process.exit(0);
    });
}
