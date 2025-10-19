import { database, eq, sql } from "@supermemory/db";
import { memoryRevisions } from "@supermemory/db/schema";
import { Env } from "../types";

const CACHE_PREFIX = "memrev:v1";
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour cache for revisions

function getCacheKey(userId: number) {
  return `${CACHE_PREFIX}:${userId}`;
}

async function writeCache(env: Env, userId: number, revision: number) {
  await env.MD_CACHE.put(getCacheKey(userId), String(revision), {
    expirationTtl: CACHE_TTL_SECONDS,
  });
}

export async function getMemoryRevision(env: Env, userId: number) {
  const cached = await env.MD_CACHE.get(getCacheKey(userId));
  if (cached) {
    const parsed = Number.parseInt(cached, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const db = database(env.HYPERDRIVE.connectionString);
  const existing = await db
    .select({ revision: memoryRevisions.revision })
    .from(memoryRevisions)
    .where(eq(memoryRevisions.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db
      .insert(memoryRevisions)
      .values({ userId, revision: 0 })
      .onConflictDoNothing();
    await writeCache(env, userId, 0);
    return 0;
  }

  const revision = existing[0]?.revision ?? 0;
  await writeCache(env, userId, revision);
  return revision;
}

export async function bumpMemoryRevision(env: Env, userId: number) {
  const db = database(env.HYPERDRIVE.connectionString);
  const now = new Date();

  const [row] = await db
    .insert(memoryRevisions)
    .values({ userId, revision: 1, updatedAt: now })
    .onConflictDoUpdate({
      target: memoryRevisions.userId,
      set: {
        revision: sql`${memoryRevisions.revision} + 1`,
        updatedAt: now,
      },
    })
    .returning({ revision: memoryRevisions.revision });

  const revision = row?.revision ?? 0;
  await writeCache(env, userId, revision);
  return revision;
}
