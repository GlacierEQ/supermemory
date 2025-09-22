import { Command } from "commander";

import { generateContextReport } from "@supermemory/integrations";
import { parseEnvGroups } from "@supermemory/shared/env";

export function registerContextStatus(program: Command) {
  program
    .command("context-status")
    .description("Display integration readiness and context optimization metrics")
    .option("--format <format>", "Output format: json or table", "json")
    .action(async (options: { format: "json" | "table" }) => {
      const envSource =
        typeof process !== "undefined" && typeof process.env !== "undefined"
          ? (process.env as Record<string, string | undefined>)
          : {};
      const report = generateContextReport({ env: envSource });
      const groups = parseEnvGroups(envSource);

      if (options.format === "table") {
        console.log("\n🔍 Context Summary");
        console.table([
          {
            metric: "Global Confidence",
            value: `${Math.round(report.summary.globalConfidence * 100)}%`,
            risk: report.summary.riskLevel,
          },
          {
            metric: "Configured Keys",
            value: `${groups.insight.configuredKeys.length}/${groups.insight.totalKeys}`,
            risk: groups.insight.coverage > 0.75 ? "low" : groups.insight.coverage > 0.55 ? "medium" : "high",
          },
        ]);

        console.log("\n📦 Integrations");
        console.table(
          report.integrations.map((integration) => ({
            Integration: integration.label,
            Ready: integration.configured ? "Yes" : "No",
            Confidence: Math.round(integration.confidence * 100),
            Notes: integration.notes,
          })),
        );

        if (report.actions.length) {
          console.log("\n🛠️  Recommended Actions");
          console.table(
            report.actions.map((action) => ({
              Action: action.title,
              Impact: action.impact,
              Owner: action.owner,
            })),
          );
        }
      } else {
        console.log(JSON.stringify({ report, groups }, null, 2));
      }
    });
}
