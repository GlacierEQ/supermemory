"""Simple secret manager with optional HashiCorp Vault support."""
from __future__ import annotations

import os
from typing import Optional

try:  # pragma: no cover - exercised via tests with hvac installed
    import hvac  # type: ignore
except Exception:  # pragma: no cover
    hvac = None  # type: ignore


class SecretManager:
    """Retrieve secrets from HashiCorp Vault with env fallback.

    If Vault variables are not configured or the hvac client is unavailable,
    secrets are looked up from environment variables. The environment key is
    built as ``{path}_{key}`` upper-cased with slashes replaced by underscores.
    """

    def __init__(self, url: Optional[str] = None, token: Optional[str] = None) -> None:
        self.url = url or os.getenv("VAULT_ADDR")
        self.token = token or os.getenv("VAULT_TOKEN")
        self.client = None
        if hvac and self.url and self.token:
            self.client = hvac.Client(url=self.url, token=self.token)

    def get(self, path: str, key: str) -> Optional[str]:
        """Return secret value for *key* in *path*.

        Parameters
        ----------
        path: str
            Vault secret path, e.g. ``"secret/data/myapp"``.
        key: str
            Key within the secret.
        """
        if self.client:
            # HashiCorp KV v2 path structure
            secret = self.client.secrets.kv.v2.read_secret_version(path=path)
            data = secret["data"]["data"]
            if key in data:
                return data[key]

        env_key = f"{path.replace('/', '_').upper()}_{key.upper()}"
        return os.getenv(env_key)
