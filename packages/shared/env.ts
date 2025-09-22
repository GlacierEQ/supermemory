const AI_KEYS = [
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "ANTHROPIC_API_KEY",
  "HUGGINGFACE_API_KEY",
  "GROQ_API_KEY",
  "ELEVENLABS_API_KEY",
  "DEEPSEEK_API_KEY",
  "PERPLEXITY_API_KEY",
  "PINECONE_API_KEY",
] as const;

const INTEGRATION_KEYS = [
  "GITHUB_TOKEN",
  "NOTION_API_KEY",
  "FIGMA_API_KEY",
  "CLICKUP_API_KEY",
  "CONFLUENCE_API_KEY",
  "TASKADE_API_KEY",
  "GOOGLE_API_KEY",
] as const;

const STORAGE_KEYS = [
  "SUPABASE_API_KEY",
  "DATABASE_URL",
  "PRISMA_POSTGRES_URL",
  "PINECONE_HIGUY_KEY",
] as const;

const MISC_KEYS = [
  "WEBHOOK_SIGNING_SECRET",
  "FIREBASE_API_KEY",
  "MEMORY_PLUGIN_PRIMARY",
  "MEMORY_PLUGIN_SPECIALIZED",
] as const;

type GroupFromKeys<T extends readonly string[]> = { [K in T[number]]: string | undefined };

export type EnvGroups = {
  ai: GroupFromKeys<typeof AI_KEYS>;
  integrations: GroupFromKeys<typeof INTEGRATION_KEYS>;
  storage: GroupFromKeys<typeof STORAGE_KEYS>;
  misc: GroupFromKeys<typeof MISC_KEYS>;
  insight: {
    totalKeys: number;
    configuredKeys: string[];
    missingKeys: string[];
    coverage: number;
  };
};

export function parseEnvGroups(
  source: Record<string, string | undefined>,
): EnvGroups {
  const ai = buildGroup(AI_KEYS, source);
  const integrations = buildGroup(INTEGRATION_KEYS, source);
  const storage = buildGroup(STORAGE_KEYS, source);
  const misc = buildGroup(MISC_KEYS, source);

  const allCategories = { ai, integrations, storage, misc };
  const configuredKeys: string[] = [];
  const missingKeys: string[] = [];

  for (const [categoryName, values] of Object.entries(allCategories)) {
    for (const [key, value] of Object.entries(values)) {
      const qualifiedKey = `${categoryName}.${key}`;
      if (value && value.trim().length > 0) {
        configuredKeys.push(qualifiedKey);
      } else {
        missingKeys.push(qualifiedKey);
      }
    }
  }

  const totalKeys = configuredKeys.length + missingKeys.length;
  const coverage = totalKeys > 0 ? configuredKeys.length / totalKeys : 0;

  return {
    ai,
    integrations,
    storage,
    misc,
    insight: {
      totalKeys,
      configuredKeys,
      missingKeys,
      coverage,
    },
  };
}

const runtimeEnv =
  typeof process !== "undefined" && typeof process.env !== "undefined"
    ? (process.env as Record<string, string | undefined>)
    : {};

export const env: EnvGroups = parseEnvGroups(runtimeEnv);

function buildGroup<T extends readonly string[]>(
  keys: T,
  source: Record<string, string | undefined>,
): GroupFromKeys<T> {
  return keys.reduce((acc, key) => {
    const value = source[key];
    acc[key] = value && value.trim().length > 0 ? value : undefined;
    return acc;
  }, Object.create(null) as GroupFromKeys<T>);
}
