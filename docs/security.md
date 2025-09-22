# Security Guidelines

This project uses a minimal secret management utility to avoid leaking
credentials. The `SecretManager` class in `packages/security/secret_manager.py`
retrieves secrets from HashiCorp Vault when available and falls back to
environment variables.

## Usage

1. Set `VAULT_ADDR` and `VAULT_TOKEN` to enable Vault access.
2. Store secrets in Vault under a path like `secret/data/myapp`.
3. Query values using:

```python
from packages.security import SecretManager
mgr = SecretManager()
api_key = mgr.get("secret/data/myapp", "API_KEY")
```

If Vault is not configured, the manager looks for an environment variable named
`SECRET_DATA_MYAPP_API_KEY`.

## Secure Development Practices

- Never commit real credentials to the repository.
- Rotate tokens regularly.
- Ensure `.vault` files and local vault storage remain ignored by Git (see
  `.gitignore`).
