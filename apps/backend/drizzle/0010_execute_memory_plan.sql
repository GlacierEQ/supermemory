CREATE TABLE IF NOT EXISTS "external_memory_targets" (
  "id" bigserial PRIMARY KEY,
  "document_id" integer NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "target" text NOT NULL,
  "external_id" text,
  "status" text NOT NULL DEFAULT 'pending',
  "last_synced_at" timestamptz,
  "error" text,
  "metadata" jsonb,
  "retry_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_targets_doc_target_idx"
  ON "external_memory_targets" ("document_id", "target");

CREATE INDEX IF NOT EXISTS "external_targets_status_idx"
  ON "external_memory_targets" ("target", "status");
