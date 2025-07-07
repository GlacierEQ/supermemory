import { Command } from "commander";
import { getDb } from "../db";
import { spaceMembers } from "@supermemory/db/schema";
import { eq, and } from "@supermemory/db";

export function registerRemoveSpaceMember(program: Command) {
  program
    .command("remove-space-member")
    .description("Remove a user from a space")
    .argument("<spaceId>", "ID of the space")
    .argument("<userId>", "ID of the user")
    .action(async (spaceId: string, userId: string) => {
      const db = getDb();
      await db
        .delete(spaceMembers)
        .where(and(eq(spaceMembers.spaceId, parseInt(spaceId, 10)), eq(spaceMembers.userId, parseInt(userId, 10))));
      console.log(`Removed user ${userId} from space ${spaceId}`);
      process.exit(0);
    });
}
