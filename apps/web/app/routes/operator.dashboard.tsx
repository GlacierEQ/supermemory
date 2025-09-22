import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

import { generateContextReport, type ContextOptimizationReport } from "@supermemory/integrations";
import { parseEnvGroups, type EnvGroups } from "@supermemory/shared/env";

export const meta: MetaFunction = () => [
  { title: "Operator Command Center | Supermemory" },
  {
    name: "description",
    content: "Real-time view of context mastery metrics, integrations, and optimization levers.",
  },
];

export async function loader({ context }: LoaderFunctionArgs) {
  const cfEnv =
    context && "cloudflare" in context && context.cloudflare
      ? (context.cloudflare.env as Record<string, string | undefined>)
      : {};
  const nodeEnv =
    typeof process !== "undefined" && typeof process.env !== "undefined"
      ? (process.env as Record<string, string | undefined>)
      : {};

  const envSource = { ...nodeEnv, ...cfEnv };
  const report = generateContextReport({ env: envSource });
  const groups = parseEnvGroups(envSource);

  return json<{ report: ContextOptimizationReport; env: EnvGroups }>(
    { report, env: groups },
    {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    },
  );
}

export default function OperatorDashboard() {
  const { report, env } = useLoaderData<typeof loader>();

  const badgeStyle = {
    low: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
    medium: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
    high: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
  } as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-400">Supermemory Operator</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Context Mastery Command Center
              </h1>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-medium ${badgeStyle[report.summary.riskLevel]}`}>
              Risk Level: {report.summary.riskLevel.toUpperCase()}
            </div>
          </div>
          <p className="max-w-3xl text-lg text-slate-300">
            Monitor the health of every intelligence stream, understand cross-integration readiness, and activate the
            workflows that keep the Supermemory network responsive.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {report.performance.map((metric) => (
              <div
                key={metric.id}
                className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur transition hover:border-white/15"
              >
                <p className="text-sm font-medium text-slate-400">{metric.label}</p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {metric.value}
                  <span className="ml-1 text-base text-slate-400">{metric.unit}</span>
                </p>
                <p className="mt-3 text-sm text-slate-400">{metric.description}</p>
                <span
                  className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    metric.trend === "up"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : metric.trend === "steady"
                        ? "bg-sky-500/10 text-sky-300"
                        : "bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {metric.trend}
                </span>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 shadow-xl shadow-slate-900/30">
            <h2 className="text-lg font-semibold text-white">Integration Readiness</h2>
            <p className="mt-1 text-sm text-slate-400">
              Coverage {env.insight.configuredKeys.length}/{env.insight.totalKeys} • Global confidence
              {" "}
              <span className="font-semibold text-white">
                {Math.round(report.summary.globalConfidence * 100)}%
              </span>
            </p>
            <div className="mt-6 divide-y divide-white/5">
              {report.integrations.map((integration) => (
                <div key={integration.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div>
                    <p className="text-base font-medium text-white">{integration.label}</p>
                    <p className="text-sm text-slate-400">{integration.notes}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      Dependencies: {integration.dependencies.join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 justify-self-end">
                    <span
                      className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide ${
                        integration.configured
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {integration.configured ? "Ready" : "Pending"}
                    </span>
                    <span className="text-right text-sm text-slate-300">
                      {Math.round(integration.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
              <h3 className="text-base font-semibold text-white">Strategic Narrative</h3>
              <p className="mt-2 text-sm text-slate-300">{report.summary.narrative}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-purple-500/10 p-6">
              <h3 className="text-base font-semibold text-white">Immediate Actions</h3>
              <ul className="mt-4 space-y-3">
                {report.actions.map((action) => (
                  <li key={action.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{action.title}</p>
                      <span className="text-xs uppercase tracking-wide text-slate-400">{action.impact} impact</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{action.description}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Owner: {action.owner}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Capability Matrix</h2>
          <p className="mt-1 text-sm text-slate-400">
            Synthesized view across file orchestration, document intelligence, audio transcription, memory indexing, and
            neural architecture research.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <CapabilityCard title="Glacier EQ / FileBoss" data={report.capabilities.fileboss} accent="from-sky-500/20" />
            <CapabilityCard title="Mega-PDF Intelligence" data={report.capabilities.pdf} accent="from-purple-500/20" />
            <CapabilityCard title="WhisperX Evidence" data={report.capabilities.whisper} accent="from-amber-500/20" />
            <CapabilityCard title="Memory Layer Compiler" data={report.capabilities.memory} accent="from-emerald-500/20" />
            <CapabilityCard title="Neural Architecture Search" data={report.capabilities.nas} accent="from-fuchsia-500/20" />
          </div>
        </section>
      </div>
    </div>
  );
}

type CapabilityCardProps = {
  title: string;
  data: Record<string, string | number>;
  accent: string;
};

function CapabilityCard({ title, data, accent }: CapabilityCardProps) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${accent} via-slate-900/70 to-slate-900/40 p-5`}>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <dl className="mt-4 space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-xl bg-slate-950/50 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-400">{formatKey(key)}</dt>
            <dd className="mt-1 text-sm text-slate-200">{String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}
