import { Env } from "../types";

const CACHE_PREFIX = "ctx:v1";
const CACHE_TTL_SECONDS = 60 * 10; // 10 minutes

type CacheKeyInput = {
  userId: number;
  query: string;
  revision: number;
};

export type CachedContextChunk = {
  id: number;
  content: string;
  orderInDocument: number;
  metadata: unknown;
  isMatch: boolean;
};

export type CachedContextResult = {
  id: number;
  title: string | null;
  description: string | null;
  url: string | null;
  type: string | null;
  content: string;
  similarity: number;
  chunks: CachedContextChunk[];
};

export type ContextCacheEntry = {
  results: CachedContextResult[];
  revision: number;
  createdAt: string;
};

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function buildKey({ userId, query, revision }: CacheKeyInput) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${revision}:${userId}:${query}`)
  );
  return `${CACHE_PREFIX}:${userId}:${revision}:${toHex(digest)}`;
}

export async function getCachedContext(env: Env, input: CacheKeyInput) {
  const key = await buildKey(input);
  const cached = await env.MD_CACHE.get(key);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached) as ContextCacheEntry;
    if (Array.isArray(parsed.results)) {
      return parsed;
    }
  } catch (error) {
    console.warn("[context-cache] failed to parse entry", error);
  }

  await env.MD_CACHE.delete(key);
  return null;
}

export async function storeCachedContext(
  env: Env,
  input: CacheKeyInput,
  results: CachedContextResult[]
) {
  const key = await buildKey(input);
  const entry: ContextCacheEntry = {
    results,
    revision: input.revision,
    createdAt: new Date().toISOString(),
  };

  await env.MD_CACHE.put(key, JSON.stringify(entry), {
    expirationTtl: CACHE_TTL_SECONDS,
  });
}
