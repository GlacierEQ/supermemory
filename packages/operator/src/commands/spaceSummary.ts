import { Command } from "commander";
import { getDb } from "../db";
import { spaces, users, spaceMembers, contentToSpace, documents } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerSpaceSummary(program: Command) {
  program
    .command("space-summary")
    .description("Display details, members and documents for a space")
    .argument("<spaceId>", "ID of the space")
    .action(async (spaceId: string) => {
      const db = getDb();
      const space = await db.query.spaces.findFirst({
        where: eq(spaces.id, parseInt(spaceId, 10))
      });
      if (!space) {
        console.error(`Space ${spaceId} not found`);
        process.exit(1);
      }
      const owner = await db.query.users.findFirst({
        where: eq(users.id, space.ownerId)
      });
      const members = await db
        .select({ id: users.id, email: users.email })
        .from(spaceMembers)
        .where(eq(spaceMembers.spaceId, space.id))
        .innerJoin(users, eq(spaceMembers.userId, users.id));
      const docs = await db
        .select({ id: documents.id, title: documents.title })
        .from(contentToSpace)
        .where(eq(contentToSpace.spaceId, space.id))
        .innerJoin(documents, eq(contentToSpace.contentId, documents.id));
      console.log(
        JSON.stringify(
          {
            space,
            owner,
            members,
            documents: docs
          },
          null,
          2
        )
      );
      process.exit(0);
    });
}

