import { describe, expect, it } from "vitest";

import { generateContextReport } from "./index";

describe("generateContextReport", () => {
  it("builds a structured optimization report", () => {
    const report = generateContextReport({
      env: {
        OPENAI_API_KEY: "sk-test",
        GEMINI_API_KEY: "gm-test",
        GITHUB_TOKEN: "ghu-test",
        NOTION_API_KEY: "secret-notion",
        SUPABASE_API_KEY: "sb-test",
        PINECONE_API_KEY: "pc-test",
        WEBHOOK_SIGNING_SECRET: "whsec-test",
      },
    });

    expect(report.summary.globalConfidence).toBeGreaterThan(0);
    expect(report.summary.riskLevel).toMatch(/low|medium|high/);
    expect(report.integrations.length).toBeGreaterThan(3);
    expect(report.performance).toHaveLength(3);
    expect(report.actions.length).toBeGreaterThan(0);
    expect(report.capabilities.fileboss.glacierStorage.length).toBeGreaterThan(0);
    expect(report.capabilities.memory.status).toMatch(/CONNECTED|DEGRADED/);
  });

  it("highlights missing integrations when no env provided", () => {
    const report = generateContextReport({ env: {} });

    expect(report.summary.riskLevel).toBe("high");
    const missingActions = report.actions.filter((action) => action.id.startsWith("configure-"));
    expect(missingActions.length).toBeGreaterThan(0);
    expect(report.integrations.every((integration) => integration.confidence <= 0.65)).toBe(true);
  });
});
