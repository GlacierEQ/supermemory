import os
import unittest
from unittest.mock import MagicMock, patch

from packages.security.secret_manager import SecretManager, hvac


class SecretManagerTest(unittest.TestCase):
    def test_env_fallback(self):
        os.environ["MYAPP_CONFIG_KEY"] = "secret"
        mgr = SecretManager()
        self.assertEqual(mgr.get("myapp/config", "key"), "secret")
        del os.environ["MYAPP_CONFIG_KEY"]

    @unittest.skipIf(hvac is None, "hvac client not available")
    def test_vault_lookup(self):
        with patch("packages.security.secret_manager.hvac.Client") as client_cls:
            client = MagicMock()
            client.secrets.kv.v2.read_secret_version.return_value = {"data": {"data": {"KEY": "from_vault"}}}
            client_cls.return_value = client
            mgr = SecretManager(url="http://localhost:8200", token="t")
            self.assertEqual(mgr.get("secret/data/app", "KEY"), "from_vault")
            client.secrets.kv.v2.read_secret_version.assert_called_once_with(path="secret/data/app")

if __name__ == "__main__":
    unittest.main()
