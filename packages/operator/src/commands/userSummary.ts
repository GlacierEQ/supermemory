import { Command } from "commander";
import { getDb } from "../db";
import {
  users,
  spaces,
  documents,
  spaceMembers,
  contentToSpace,
} from "@supermemory/db/schema";
import { eq, inArray } from "@supermemory/db";

export function registerUserSummary(program: Command) {
  program
    .command("user-summary")
    .description("Display a user with their spaces and documents")
    .argument("<userId>", "ID of the user")
    .action(async (userId: string) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(userId, 10)),
      });
      if (!user) {
        console.error(`User ${userId} not found`);
        process.exit(1);
      }
      const ownedSpaces = await db.query.spaces.findMany({
        where: eq(spaces.ownerId, user.id),
      });
      const memberSpaces = await db
        .select({ id: spaces.id, name: spaces.name })
        .from(spaceMembers)
        .where(eq(spaceMembers.userId, user.id))
        .innerJoin(spaces, eq(spaceMembers.spaceId, spaces.id));
      const docs: any[] = await db.query.documents.findMany({
        where: eq(documents.userId, user.id),
      });
      const docSpaces: Record<number, number[]> = {};
      if (docs.length) {
        const docIds = docs.map((d) => d.id);
        const mappings = await db
          .select({
            contentId: contentToSpace.contentId,
            spaceId: contentToSpace.spaceId,
          })
          .from(contentToSpace)
          .where(inArray(contentToSpace.contentId, docIds));
        for (const m of mappings) {
          if (!docSpaces[m.contentId]) docSpaces[m.contentId] = [];
          docSpaces[m.contentId].push(m.spaceId);
        }
      }
      const docsWithSpaces = docs.map((d) => ({
        id: d.id,
        title: d.title,
        spaces: docSpaces[d.id] || [],
      }));
      console.log(
        JSON.stringify(
          {
            user,
            ownedSpaces,
            memberSpaces,
            documents: docsWithSpaces,
          },
          null,
          2,
        ),
      );
      process.exit(0);
    });
}
