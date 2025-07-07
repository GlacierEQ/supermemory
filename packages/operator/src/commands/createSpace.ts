import { Command } from "commander";
import { randomUUID } from "crypto";
import { getDb } from "../db";
import { spaces } from "@supermemory/db/schema";

export function registerCreateSpace(program: Command) {
  program
    .command("create-space")
    .description("Create a space for a user")
    .argument("<ownerId>", "User ID of the space owner")
    .argument("<name>", "Name of the space")
    .option("-p, --public", "Make the space public")
    .action(async (ownerId: string, name: string, options: { public?: boolean }) => {
      const db = getDb();
      const uuid = randomUUID();
      const result = await db
        .insert(spaces)
        .values({
          ownerId: parseInt(ownerId, 10),
          name,
          uuid,
          isPublic: !!options.public,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: spaces.id });
      console.log(`Created space "${name}" with id ${result[0].id} and uuid ${uuid}`);
      process.exit(0);
    });
}
