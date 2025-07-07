import { Command } from "commander";
import { getDb } from "../db";
import { spaceMembers, users } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerListSpaceMembers(program: Command) {
  program
    .command("list-space-members")
    .description("List members of a space")
    .argument("<spaceId>", "ID of the space")
    .action(async (spaceId: string) => {
      const db = getDb();
      const members = await db
        .select({ id: users.id, email: users.email })
        .from(spaceMembers)
        .leftJoin(users, eq(spaceMembers.userId, users.id))
        .where(eq(spaceMembers.spaceId, parseInt(spaceId, 10)));
      for (const member of members) {
        console.log(`${member.id}: ${member.email}`);
      }
      process.exit(0);
    });
}
