# Memory Ecosystem Deployment & Integration Guide

This guide translates the discovered memory ecosystem into a concrete rollout plan for Supermemory. It explains how to deploy each component, connect it to our existing ingestion pipelines (including Notion), and operate the stack in production.

---

## 1. Core Architecture

| Layer | Responsibility | Primary Services |
| --- | --- | --- |
| **Acquisition** | Capture structured/unstructured data from SaaS tools and files. | Supermemory connectors, Notion importer, custom MCP tools. |
| **Short-Term Context** | Fast session storage for agent conversations and ephemeral summaries. | Redis (existing), Mem0 incremental memories. |
| **Semantic Memory** | Dense retrieval over text/audio/image embeddings. | Supermemory vector store, Mem0 hybrid store. |
| **Relational Knowledge Graph** | Entity relationships, provenance, compliance views. | Neo4j (OLTP), Memgraph (HTAP/in-memory). |
| **Long-Term Evidence Vault** | Auditable chain of records for legal and ops data. | Supermemory collections, Notion workspace, encrypted object storage. |
| **Orchestration** | Multi-agent workflows and MCP servers that expose tools. | Supermemory MCP, @memoryplugin/mcp-server, @mem0/mcp-server, Agno-AGI. |
| **Observability & Security** | Logging, metrics, secret rotation, policy enforcement. | Grafana/Loki stack, Vault/KMS, MCP Guardian. |

### Architecture Notes
* Keep Supermemory as the unified API for downstream applications; other systems sync into it via connectors or MCP tools.
* Use Mem0 for rapid conversation-scoped memories and to fan out into Redis for high-frequency access.
* Neo4j stores curated knowledge graphs (people, cases, systems) while Memgraph mirrors high-write workloads (alerts, events) for analytics dashboards.
* MCP servers expose search/write tools to Claude Desktop, Cursor, and internal agents so they can pull the same memories the backend ingests.

---

## 2. Foundational Setup

### 2.1 Secrets & Configuration
1. Create `.env.local` for local development and `.env.production` for deployments.
2. Store external API keys in HashiCorp Vault or AWS Secrets Manager (recommended) and inject them via CI/CD.
3. Map secrets into the Supermemory backend using environment variables already supported by the Next.js app (e.g., NOTION, SUPERMEMORY, Redis credentials).【F:apps/backend/src/types.ts†L25-L54】
4. For MCP servers, store tokens in dedicated config files mounted as Kubernetes secrets or Docker secrets.

### 2.2 Baseline Services
```bash
# Provision Redis (short-term context)
docker run -d --name redis -p 6379:6379 redis:7

# Launch core Supermemory stack (Next.js app + backend)
docker compose up -d
```
The compose file ships with the repository and brings up the web and backend services needed for connector configuration.【F:docker-compose.yml†L1-L88】

### 2.3 Environment Coordination
* Populate `apps/backend/.dev.vars.example` with local credentials before running `wrangler dev`; it now includes the distributed memory settings (Mem0, Neo4j, Memgraph, and Supermemory API tokens) so engineers can toggle integrations without editing code.【F:apps/backend/.dev.vars.example†L1-L22】
* Promote secrets to Cloudflare Workers using `wrangler secret put` or inject them from CI/CD during deployment.

---

## 3. MCP Memory Servers

MCP (Model Context Protocol) servers expose memory tools to LLM clients. Deploy each server behind HTTPS with mutual authentication where possible.

### 3.1 Supermemory MCP Server
* **Purpose**: Provides unified access to collections, search, and ingestion pipelines.
* **Deployment**: Follow the hosted setup in the Supermemory docs or run self-hosted mode using Docker Compose. Configure the server with a service account that has access to the same Redis and Postgres backing stores as the main app.
* **Key Config**: `SUPERMEMORY_API_KEY`, `SUPERMEMORY_MCP_TOKEN`.

### 3.2 @memoryplugin/mcp-server
* **Purpose**: MemoryPlugin server that integrates with Claude Desktop and other MCP clients.
* **Setup**:
  ```bash
  npx @memoryplugin/mcp-server --token "$MEMORY_PLUGIN_TOKEN"
  ```
* **Integration**: Register the server URL in Claude Desktop developer settings so agents can call `memory.store` and `memory.search` endpoints.

### 3.3 @mem0/mcp-server
* **Purpose**: Bridges Mem0’s hybrid datastore with MCP tools.
* **Setup**:
  ```bash
  npx @mem0/mcp-server --api-key "$MEM0_API_KEY" --redis-url redis://localhost:6379
  ```
* **Integration**: Point Cursor or ChatGPT custom connectors at the MCP endpoint to provide contextual memories to code assistants.

### 3.4 Operational Considerations
* Ensure TLS termination and optional mTLS between MCP clients and servers.
* Rate-limit tool invocations per client to prevent memory poisoning attacks.
* Monitor metrics (requests, latency, errors) via Prometheus exporters.

---

## 4. Memory Frameworks & Libraries

### 4.1 Agno-AGI
* **Use Case**: Multi-agent workflows with shared memory and tool orchestration.
* **Install**: `pip install agno`
* **Integration**: Configure agents to call Supermemory’s REST endpoints or MCP tools for knowledge retrieval.
* **Example**: Define an Agno agent that ingests discoveries into Supermemory collections via the backend ingestion route (`/api/memories`).【F:apps/backend/src/routes/memories.ts†L1-L120】

### 4.2 PMDK (Persistent Memory Development Kit)
* **Use Case**: High-performance persistent memory programming for experimental storage tiers.
* **Approach**:
  1. Install PMDK on lab servers with Intel Optane or similar NVDIMMs.
  2. Prototype a write-ahead log adapter that syncs Supermemory metadata to PMEM-backed storage for durability.
  3. Wrap the adapter behind feature flags before integrating into production.

### 4.3 Mem0 Core Library
* **Use Case**: Hybrid graph/vector memory store optimized for AI agents.
* **Install**: `pip install mem0`
* **Integration**: Run Mem0 as a sidecar service so the backend can push summarised conversations. Configure webhooks that forward Mem0 events into Supermemory collections for long-term storage.

---

## 5. Graph Database Stack

### 5.1 Neo4j
* **Role**: Authoritative knowledge graph for curated entities and relationships.
* **Deployment**:
  ```bash
  docker run -d \
    --name neo4j \
    -p 7474:7474 -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/strongpassword \
    neo4j:5
  ```
* **Schema**: Start with node labels for `Person`, `Organization`, `Case`, `Document`, and relationship types like `RELATES_TO`, `OWNS`, `MENTIONS`.
* **Sync Strategy**: Use Supermemory webhooks to publish entity updates and ingest them into Neo4j via the `neo4j-driver` Python or TypeScript client.

### 5.2 Memgraph
* **Role**: High-throughput, in-memory graph analytics for alerts and temporal events.
* **Deployment**:
  ```bash
  docker run -d \
    --name memgraph \
    -p 7688:7687 -p 7445:7444 \
    memgraph/memgraph-mage
  ```
* **Usage**: Mirror Neo4j entities using CDC streams or Kafka topics. Run real-time Cypher queries for anomaly detection or session correlation.
* **Analytics**: Leverage Memgraph MAGE algorithms (PageRank, community detection) to enrich Supermemory metadata prior to ingestion.

### 5.3 Data Flow
1. Ingest raw content via connectors (Notion, file uploads) into Supermemory.
2. Trigger enrichment pipeline that extracts entities and relationships.
3. Write structured knowledge to Neo4j for durable graph representation.
4. Stream events to Memgraph for analytics and alerting.
5. Feed derived insights back into Supermemory as context snippets.

---

## 6. Notion Integration Deep Dive

The existing Notion utilities fetch pages, blocks, and convert them into markdown before storing them as memories.【F:apps/backend/src/utils/notion.ts†L9-L236】 To maximize value:

1. **Workspace Sync**: Configure a Notion integration with read access to relevant databases and pages. Store the Notion API token in environment variables consumed by the backend loader.
2. **Scheduling**: Use the ingestion cron job or trigger manual imports from the integrations UI, which already displays progress and errors for providers.【F:apps/web/app/components/memories/Integrations.tsx†L497-L685】
3. **Metadata Enrichment**: Enhance the ingestion step to tag Notion pages with Neo4j node IDs and Memgraph stream identifiers for downstream linking.
4. **Review Pipeline**: Surface imported Notion content in Supermemory collections so legal and ops teams can approve classification before it syncs to external systems.

---

## 7. Advanced Features

### 7.1 Multi-Modal Memory
* Extend the upload pipeline to store audio/image embeddings alongside text. Use services like OpenAI Whisper or Gemini Pro Vision for transcription/extraction before indexing into Supermemory and Mem0.
* For screenshots, preprocess with `libvips` or similar libraries to reduce size and improve OCR accuracy.

### 7.2 Security & Compliance
* Apply least-privilege IAM roles for each connector.
* Log all memory writes with immutable audit records stored in Supermemory’s evidence collections.
* Run automated scanners (e.g., MCP Guardian) to detect prompt injection or tool poisoning attempts.
* Encrypt sensitive exports using envelope encryption with per-tenant keys.

### 7.3 Monitoring & Alerting
* Collect metrics from MCP servers, graph databases, and the Supermemory backend via Prometheus.
* Configure Grafana dashboards for ingestion latency, vector search success rate, and MCP tool usage.
* Emit structured logs to Loki or ELK for forensic analysis.

---

## 8. Deployment Patterns

### 8.1 Docker Compose (Single Node)
* Suitable for development or demos.
* Combine Supermemory, Redis, MCP servers, and graph databases in one compose file with isolated networks.

### 8.2 Kubernetes (Production)
* Deploy each component as a Helm chart or Kustomize base.
* Use StatefulSets for Neo4j/Memgraph and Redis.
* Configure Horizontal Pod Autoscalers for MCP servers based on request throughput.
* Integrate cert-manager for automated TLS certificates.

### 8.3 High Availability
* Enable Redis replication or use Redis Enterprise.
* Run Neo4j in causal cluster mode and Memgraph with HA replication.
* Place MCP servers behind an ingress controller with sticky sessions if required by client authentication.

---

## 9. Operational Checklist

| Category | Tasks |
| --- | --- |
| **Secrets** | Rotate API keys quarterly; automate revocation on incident response. |
| **Backups** | Schedule daily backups for Neo4j, weekly snapshots for Memgraph, and continuous backup for Redis using `redis-cli --rdb`. |
| **Testing** | Add integration tests that mock MCP server responses and verify ingestion flows via the backend API layer.【F:apps/backend/src/routes/memories.ts†L1-L120】 |
| **Security** | Perform quarterly threat modeling for MCP tool exposure; validate request schemas server-side. |
| **Documentation** | Update onboarding runbooks in Notion after every major ecosystem change; sync the notes back into Supermemory for retrieval. |

---

## 10. Next Steps
1. Stand up the MCP servers in a sandbox environment and connect them to Claude Desktop and Cursor for end-to-end validation.
2. Implement the Neo4j ingestion pipeline, starting with Notion-sourced case files to support the legal evidence workflow.
3. Configure monitoring alerts for ingestion failure rates and MCP tool latencies.
4. Schedule a quarterly architecture review to assess new research from the tracked organizations and fold improvements into this stack.

---

## 11. Repository Implementation Highlights
* **External target ledger** – The new `external_memory_targets` table tracks the state, errors, and metadata for each downstream system, giving operations a single location to audit synchronization health.【F:packages/db/schema.ts†L248-L299】【F:apps/backend/drizzle/0010_execute_memory_plan.sql†L1-L17】
* **Automated synchronization worker** – `memorySync.ts` pushes every ingested document into Mem0, Neo4j, and Memgraph (when credentials are present), while maintaining retry counters and deletion handling through the shared ledger.【F:apps/backend/src/services/memorySync.ts†L83-L205】【F:apps/backend/src/services/memorySync.ts†L521-L589】
* **Workflow integration** – The content workflow now normalizes captured text, computes a stable hash, and triggers the distributed sync step once chunks are stored, ensuring the graph and MCP layers stay in lockstep with the core database.【F:apps/backend/src/workflow/index.ts†L155-L245】
* **API hygiene** – Deletions from `/v1/memories` cascade into the distributed stack so that stray graph nodes or Mem0 items never linger after a user purge.【F:apps/backend/src/routes/memories.ts†L197-L305】

With this deployment guide, Supermemory’s memory infrastructure can scale from prototype to production while maintaining a single source of truth across connectors, graph databases, and agent orchestration layers.
