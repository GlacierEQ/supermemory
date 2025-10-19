import { Env } from "../types";
import { database, and, eq } from "@supermemory/db";
import {
  documents,
  externalMemoryTargets,
} from "@supermemory/db/schema";

type MemoryTarget = "mem0" | "neo4j" | "memgraph";

type TargetStatus = "pending" | "syncing" | "synced" | "error" | "deleted";

export type MemorySyncPayload = {
  documentId: number;
  uuid: string;
  userId: number;
  title: string;
  type: string;
  url?: string | null;
  spaces: string[];
  content: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MemoryDeletionPayload = {
  documentId: number;
  uuid: string;
  userId: number;
};

const MEM0_DEFAULT_BASE = "https://api.mem0.ai/v1";
const NEO4J_DEFAULT_DATABASE = "neo4j";
const MEMGRAPH_DEFAULT_URL = "http://localhost:7444";

function sanitizeBase(url: string | undefined, fallback: string) {
  const base = url && url.length > 0 ? url : fallback;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function createSummary(content: string, maxLength = 1800): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 3)}...`;
}

function encodeBasicAuth(username: string, password: string) {
  const value = `${username}:${password}`;
  if (typeof btoa === "function") {
    return btoa(value);
  }
  const buffer = (globalThis as Record<string, unknown>).Buffer as
    | {
        from: (input: string, encoding: string) => {
          toString: (encoding: string) => string;
        };
      }
    | undefined;
  if (buffer) {
    return buffer.from(value, "utf-8").toString("base64");
  }
  throw new Error("Base64 encoding is not available in this runtime");
}

type SyncResult = {
  externalId?: string | null;
  metadata?: Record<string, unknown> | null;
};

type SyncExecutor = () => Promise<SyncResult | void>;

async function setTargetStatus(
  env: Env,
  documentId: number,
  target: MemoryTarget,
  status: TargetStatus,
  updates: Partial<{
    externalId: string | null;
    metadata: Record<string, unknown> | null;
    error: string | null;
    lastSyncedAt: Date | null;
    retryCount: number;
  }> = {}
) {
  const db = database(env.HYPERDRIVE.connectionString);
  const now = new Date();

  await db
    .insert(externalMemoryTargets)
    .values({
      documentId,
      target,
      status,
      externalId: updates.externalId ?? null,
      lastSyncedAt: updates.lastSyncedAt ?? null,
      error: updates.error ?? null,
      metadata: updates.metadata ?? null,
      retryCount: updates.retryCount ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        externalMemoryTargets.documentId,
        externalMemoryTargets.target,
      ],
      set: {
        status,
        externalId: updates.externalId ?? null,
        lastSyncedAt: updates.lastSyncedAt ?? null,
        error: updates.error ?? null,
        metadata: updates.metadata ?? null,
        retryCount: updates.retryCount ?? 0,
        updatedAt: now,
      },
    });
}

async function incrementRetryCount(
  env: Env,
  documentId: number,
  target: MemoryTarget,
  error: string
) {
  const db = database(env.HYPERDRIVE.connectionString);
  const existing = await db
    .select({ retryCount: externalMemoryTargets.retryCount })
    .from(externalMemoryTargets)
    .where(
      and(
        eq(externalMemoryTargets.documentId, documentId),
        eq(externalMemoryTargets.target, target)
      )
    )
    .limit(1);

  const retryCount = (existing[0]?.retryCount ?? 0) + 1;
  await setTargetStatus(env, documentId, target, "error", {
    error,
    retryCount,
  });
}

async function runTargetSync(
  env: Env,
  payload: MemorySyncPayload,
  target: MemoryTarget,
  executor: SyncExecutor
) {
  await setTargetStatus(env, payload.documentId, target, "syncing", {
    metadata: { startedAt: new Date().toISOString() },
  });

  try {
    const result = (await executor()) ?? {};
    await setTargetStatus(env, payload.documentId, target, "synced", {
      externalId: result.externalId ?? null,
      metadata: {
        ...(result.metadata ?? {}),
        documentUuid: payload.uuid,
        spaces: payload.spaces,
      },
      lastSyncedAt: new Date(),
      retryCount: 0,
      error: null,
    });
  } catch (error) {
    console.error(
      `[memory-sync] Failed to sync target ${target} for document ${payload.uuid}`,
      error
    );
    const message =
      error instanceof Error ? error.message : "Unknown synchronization error";
    await incrementRetryCount(env, payload.documentId, target, message);
  }
}

async function runTargetDeletion(
  env: Env,
  payload: MemoryDeletionPayload,
  target: MemoryTarget,
  executor: () => Promise<void>
) {
  try {
    await executor();
    await setTargetStatus(env, payload.documentId, target, "deleted", {
      metadata: { deletedAt: new Date().toISOString() },
      lastSyncedAt: new Date(),
      externalId: null,
      error: null,
      retryCount: 0,
    });
  } catch (error) {
    console.error(
      `[memory-sync] Failed to delete target ${target} for document ${payload.uuid}`,
      error
    );
    const message =
      error instanceof Error ? error.message : "Unknown deletion error";
    await incrementRetryCount(env, payload.documentId, target, message);
  }
}

async function syncMem0(
  env: Env,
  payload: MemorySyncPayload,
  summary: string,
  contentHash: string
): Promise<SyncResult> {
  if (!env.MEM0_API_KEY) {
    return {};
  }

  const base = sanitizeBase(env.MEM0_BASE_URL, MEM0_DEFAULT_BASE);
  const endpoint = `${base}/memories`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MEM0_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: payload.uuid,
      user_id: String(payload.userId),
      text: summary,
      metadata: {
        title: payload.title,
        type: payload.type,
        url: payload.url,
        spaces: payload.spaces,
        content_hash: contentHash,
        chunk_count: payload.chunkCount,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Mem0 sync failed with status ${response.status}: ${errorText}`
    );
  }

  const result = (await response.json()) as {
    id?: string;
    [key: string]: unknown;
  };

  return {
    externalId: result?.id ?? payload.uuid,
    metadata: result ?? null,
  };
}

async function syncNeo4j(
  env: Env,
  payload: MemorySyncPayload,
  summary: string
): Promise<SyncResult> {
  const username = env.NEO4J_USERNAME;
  const password = env.NEO4J_PASSWORD;
  const url = env.NEO4J_URL;

  if (!username || !password || !url) {
    return {};
  }

  const base = sanitizeBase(url, url);
  const databaseName = env.NEO4J_DATABASE ?? NEO4J_DEFAULT_DATABASE;
  const endpoint = `${base}/db/${databaseName}/tx/commit`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodeBasicAuth(username, password)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      statements: [
        {
          statement: `
MERGE (u:User {id: $userId})
ON CREATE SET u.createdAt = datetime($createdAt)
SET u.updatedAt = datetime($updatedAt)
MERGE (d:Document {uuid: $uuid})
SET d.title = $title,
    d.type = $type,
    d.url = $url,
    d.summary = $summary,
    d.chunkCount = $chunkCount,
    d.updatedAt = datetime($updatedAt),
    d.createdAt = coalesce(d.createdAt, datetime($createdAt))
MERGE (u)-[:CREATED]->(d)
WITH d
UNWIND $spaces AS spaceUuid
MERGE (s:Space {uuid: spaceUuid})
ON CREATE SET s.createdAt = datetime($createdAt)
MERGE (d)-[:TAGGED_IN]->(s)
          `,
          parameters: {
            userId: payload.userId,
            uuid: payload.uuid,
            title: payload.title,
            type: payload.type,
            url: payload.url ?? null,
            summary,
            chunkCount: payload.chunkCount,
            createdAt: payload.createdAt,
            updatedAt: payload.updatedAt,
            spaces: payload.spaces,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Neo4j sync failed with status ${response.status}: ${text}`);
  }

  const json = (await response.json()) as {
    errors?: Array<{ message: string }>;
    results?: Array<{ stats?: Record<string, unknown> }>;
  };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Neo4j sync error: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  return {
    metadata: json.results?.[0]?.stats ?? null,
  };
}

async function syncMemgraph(
  env: Env,
  payload: MemorySyncPayload,
  summary: string
): Promise<SyncResult> {
  if (!env.MEMGRAPH_URL) {
    return {};
  }

  const base = sanitizeBase(env.MEMGRAPH_URL, MEMGRAPH_DEFAULT_URL);
  const endpoint = `${base}/execute`; // Memgraph HTTP interface

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.MEMGRAPH_USERNAME && env.MEMGRAPH_PASSWORD
        ? {
            Authorization: `Basic ${encodeBasicAuth(
              env.MEMGRAPH_USERNAME,
              env.MEMGRAPH_PASSWORD
            )}`,
          }
        : {}),
    },
    body: JSON.stringify({
      query: `
MERGE (u:User {id: $userId})
MERGE (d:Document {uuid: $uuid})
SET d.title = $title,
    d.type = $type,
    d.url = $url,
    d.summary = $summary,
    d.chunkCount = $chunkCount,
    d.updatedAt = datetime($updatedAt)
WITH d
UNWIND $spaces AS spaceUuid
MERGE (s:Space {uuid: spaceUuid})
MERGE (d)-[:TAGGED_IN]->(s)
MERGE (u)-[:CREATED]->(d)
      `,
      params: {
        userId: payload.userId,
        uuid: payload.uuid,
        title: payload.title,
        type: payload.type,
        url: payload.url ?? null,
        summary,
        chunkCount: payload.chunkCount,
        updatedAt: payload.updatedAt,
        spaces: payload.spaces,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Memgraph sync failed with status ${response.status}: ${text}`
    );
  }

  const json = (await response.json()) as {
    success?: boolean;
    error?: string;
  };

  if (json.error) {
    throw new Error(`Memgraph sync error: ${json.error}`);
  }

  return { metadata: json };
}

async function deleteMem0(env: Env, payload: MemoryDeletionPayload) {
  if (!env.MEM0_API_KEY) {
    return;
  }

  const base = sanitizeBase(env.MEM0_BASE_URL, MEM0_DEFAULT_BASE);
  const endpoint = `${base}/memories/${payload.uuid}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${env.MEM0_API_KEY}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Mem0 deletion failed: ${response.status} ${text}`);
  }
}

async function deleteNeo4j(env: Env, payload: MemoryDeletionPayload) {
  const username = env.NEO4J_USERNAME;
  const password = env.NEO4J_PASSWORD;
  const url = env.NEO4J_URL;

  if (!username || !password || !url) {
    return;
  }

  const base = sanitizeBase(url, url);
  const databaseName = env.NEO4J_DATABASE ?? NEO4J_DEFAULT_DATABASE;
  const endpoint = `${base}/db/${databaseName}/tx/commit`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodeBasicAuth(username, password)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      statements: [
        {
          statement: `
MATCH (d:Document {uuid: $uuid})
DETACH DELETE d
          `,
          parameters: {
            uuid: payload.uuid,
          },
        },
      ],
    }),
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Neo4j deletion failed: ${response.status} ${text}`);
  }
}

async function deleteMemgraph(env: Env, payload: MemoryDeletionPayload) {
  if (!env.MEMGRAPH_URL) {
    return;
  }

  const base = sanitizeBase(env.MEMGRAPH_URL, MEMGRAPH_DEFAULT_URL);
  const endpoint = `${base}/execute`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.MEMGRAPH_USERNAME && env.MEMGRAPH_PASSWORD
        ? {
            Authorization: `Basic ${encodeBasicAuth(
              env.MEMGRAPH_USERNAME,
              env.MEMGRAPH_PASSWORD
            )}`,
          }
        : {}),
    },
    body: JSON.stringify({
      query: `
MATCH (d:Document {uuid: $uuid})
DETACH DELETE d
      `,
      params: {
        uuid: payload.uuid,
      },
    }),
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Memgraph deletion failed: ${response.status} ${text}`);
  }
}

export async function syncMemoryTargets(
  env: Env,
  payload: MemorySyncPayload,
  options: { contentHash?: string } = {}
) {
  const summary = createSummary(payload.content);
  const contentHash =
    options.contentHash ?? (await hashContent(payload.content));

  const targets: Array<Promise<void>> = [];

  if (env.MEM0_API_KEY) {
    targets.push(
      runTargetSync(env, payload, "mem0", () =>
        syncMem0(env, payload, summary, contentHash)
      )
    );
  }

  if (env.NEO4J_URL && env.NEO4J_USERNAME && env.NEO4J_PASSWORD) {
    targets.push(
      runTargetSync(env, payload, "neo4j", () =>
        syncNeo4j(env, payload, summary)
      )
    );
  }

  if (env.MEMGRAPH_URL) {
    targets.push(
      runTargetSync(env, payload, "memgraph", () =>
        syncMemgraph(env, payload, summary)
      )
    );
  }

  if (targets.length === 0) {
    return;
  }

  await Promise.all(targets);
}

export async function removeMemoryTargets(
  env: Env,
  payload: MemoryDeletionPayload
) {
  const tasks: Array<Promise<void>> = [];

  if (env.MEM0_API_KEY) {
    tasks.push(runTargetDeletion(env, payload, "mem0", () => deleteMem0(env, payload)));
  }

  if (env.NEO4J_URL && env.NEO4J_USERNAME && env.NEO4J_PASSWORD) {
    tasks.push(
      runTargetDeletion(env, payload, "neo4j", () => deleteNeo4j(env, payload))
    );
  }

  if (env.MEMGRAPH_URL) {
    tasks.push(
      runTargetDeletion(env, payload, "memgraph", () => deleteMemgraph(env, payload))
    );
  }

  if (tasks.length === 0) {
    return;
  }

  await Promise.all(tasks);
}

export async function markTargetsAsPending(
  env: Env,
  documentId: number,
  targets: MemoryTarget[]
) {
  await Promise.all(
    targets.map((target) =>
      setTargetStatus(env, documentId, target, "pending", {
        metadata: { queuedAt: new Date().toISOString() },
        retryCount: 0,
      })
    )
  );
}

export async function getSyncedTargets(
  env: Env,
  documentId: number
): Promise<Record<MemoryTarget, TargetStatus | undefined>> {
  const db = database(env.HYPERDRIVE.connectionString);
  const rows = await db
    .select({
      target: externalMemoryTargets.target,
      status: externalMemoryTargets.status,
    })
    .from(externalMemoryTargets)
    .where(eq(externalMemoryTargets.documentId, documentId));

  return rows.reduce((acc, row) => {
    acc[row.target as MemoryTarget] = row.status as TargetStatus;
    return acc;
  }, {} as Record<MemoryTarget, TargetStatus | undefined>);
}

export async function ensureDocumentTracking(
  env: Env,
  payload: MemorySyncPayload,
  options: { contentHash?: string } = {}
) {
  const db = database(env.HYPERDRIVE.connectionString);
  const computedHash =
    options.contentHash ?? (await hashContent(payload.content));
  await db
    .update(documents)
    .set({
      contentHash: computedHash,
      updatedAt: new Date(payload.updatedAt),
    })
    .where(eq(documents.id, payload.documentId));
}

export async function computeContentHash(content: string) {
  return hashContent(content);
}
