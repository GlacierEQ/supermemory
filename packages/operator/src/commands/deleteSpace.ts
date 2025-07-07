import { Command } from "commander";
import { getDb } from "../db";
import { spaces } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerDeleteSpace(program: Command) {
  program
    .command("delete-space")
    .description("Delete a space by numeric ID")
    .argument("<id>", "ID of the space")
    .action(async (id: string) => {
      const db = getDb();
      await db.delete(spaces).where(eq(spaces.id, parseInt(id, 10)));
      console.log(`Deleted space ${id}`);
      process.exit(0);
    });
}
