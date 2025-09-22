import { describe, expect, it } from "vitest";

import { parseEnvGroups } from "./env";

describe("parseEnvGroups", () => {
  it("categorizes provided environment variables", () => {
    const result = parseEnvGroups({
      OPENAI_API_KEY: "sk-test",
      NOTION_API_KEY: "secret",
      SUPABASE_API_KEY: "supabase-key",
      WEBHOOK_SIGNING_SECRET: "whsec",
    });

    expect(result.ai.OPENAI_API_KEY).toBe("sk-test");
    expect(result.integrations.NOTION_API_KEY).toBe("secret");
    expect(result.storage.SUPABASE_API_KEY).toBe("supabase-key");
    expect(result.misc.WEBHOOK_SIGNING_SECRET).toBe("whsec");
    expect(result.insight.totalKeys).toBeGreaterThan(0);
    expect(result.insight.configuredKeys).toContain("ai.OPENAI_API_KEY");
    expect(result.insight.missingKeys).toContain("ai.GEMINI_API_KEY");
    expect(result.insight.coverage).toBeGreaterThan(0);
    expect(result.insight.coverage).toBeLessThan(1);
  });

  it("handles empty inputs", () => {
    const result = parseEnvGroups({});

    expect(result.ai).toEqual({
      OPENAI_API_KEY: undefined,
      GEMINI_API_KEY: undefined,
      ANTHROPIC_API_KEY: undefined,
      HUGGINGFACE_API_KEY: undefined,
      GROQ_API_KEY: undefined,
      ELEVENLABS_API_KEY: undefined,
      DEEPSEEK_API_KEY: undefined,
      PERPLEXITY_API_KEY: undefined,
      PINECONE_API_KEY: undefined,
    });
    expect(result.insight.coverage).toBe(0);
    expect(result.insight.configuredKeys).toHaveLength(0);
    expect(result.insight.missingKeys.length).toBe(result.insight.totalKeys);
  });
});
