CREATE TABLE IF NOT EXISTS "memory_revisions" (
  "user_id" integer PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "revision" bigint NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "memory_revisions_updated_idx"
  ON "memory_revisions" ("updated_at");
