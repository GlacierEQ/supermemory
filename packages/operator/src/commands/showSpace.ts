import { Command } from "commander";
import { getDb } from "../db";
import { spaces } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerShowSpace(program: Command) {
  program
    .command("show-space")
    .description("Display details for a space")
    .argument("<id>", "ID of the space")
    .action(async (id: string) => {
      const db = getDb();
      const space = await db
        .select()
        .from(spaces)
        .where(eq(spaces.id, parseInt(id, 10)))
        .then((rows: unknown[]) => rows[0]);
      if (!space) {
        console.log(`Space ${id} not found`);
      } else {
        console.log(JSON.stringify(space, null, 2));
      }
      process.exit(0);
    });
}
