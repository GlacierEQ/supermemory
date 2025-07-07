import { Command } from "commander";
import { getDb } from "../db";
import { spaces } from "@supermemory/db/schema";
import { eq } from "@supermemory/db";

export function registerUpdateSpace(program: Command) {
  program
    .command("update-space")
    .description("Update a space's name or visibility")
    .argument("<id>", "ID of the space")
    .option("-n, --name <name>", "New name")
    .option("-p, --public <bool>", "Set public state (true or false)")
    .action(
      async (
        id: string,
        options: { name?: string; public?: string | boolean }
      ) => {
        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (options.name) updates.name = options.name;
        if (options.public !== undefined) {
          updates.isPublic = options.public === true || options.public === "true";
        }
        const db = getDb();
        await db.update(spaces).set(updates).where(eq(spaces.id, parseInt(id, 10)));
        console.log(`Updated space ${id}`);
        process.exit(0);
      }
    );
}
