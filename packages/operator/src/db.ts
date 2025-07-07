import { config } from "dotenv";
import { database } from "@supermemory/db";

config();

export function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  return database(dbUrl!);
}
