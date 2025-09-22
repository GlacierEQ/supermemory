# Environment Variable Reference

This repository relies on several groups of environment variables. Copy the sample files from the `env/` directory and provide your own values.

## AI Provider Keys

Defined in [`env/ai.env.example`](../env/ai.env.example). These keys configure access to various large language model providers like OpenAI, Anthropic, and others.

## Third-party Integrations

Defined in [`env/integrations.env.example`](../env/integrations.env.example). Credentials for external services such as GitHub, Notion, and Figma.

## Storage and Database

Defined in [`env/storage.env.example`](../env/storage.env.example). Connection strings and keys for data stores including Supabase and Prisma.

## Miscellaneous

Defined in [`env/misc.env.example`](../env/misc.env.example). Other supporting secrets like webhook signing secrets and plugin configuration.

Rename the desired `.env.example` files to `.env` and populate the values before running the application.
