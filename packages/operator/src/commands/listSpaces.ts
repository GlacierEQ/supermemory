import { Command } from "commander";
import { getDb } from "../db";
import { spaces } from "@supermemory/db/schema";
import { eq, and } from "@supermemory/db";

export function registerListSpaces(program: Command) {
  program
    .command("list-spaces")
    .description("List spaces owned by a user")
    .argument("<ownerId>", "User ID of the owner")
    .option("--public [state]", "Filter by public state (true or false)")
    .action(async (ownerId: string, options: { public?: string | boolean }) => {
      const db = getDb();
      const ownerCondition = eq(spaces.ownerId, parseInt(ownerId, 10));
      let query = db.select().from(spaces).where(ownerCondition);
      if (options.public !== undefined) {
        const publicFlag = options.public === true || options.public === "true";
        query = db.select().from(spaces).where(and(ownerCondition, eq(spaces.isPublic, publicFlag)));
      }
      const userSpaces = await query;
      for (const sp of userSpaces) {
        console.log(`${sp.id}: ${sp.name} (public: ${sp.isPublic})`);
      }
      process.exit(0);
    });
}
