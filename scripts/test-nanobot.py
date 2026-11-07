"""Verify the catalog bootstrap preserves user state and credential lifecycle."""
import importlib.util
import json
from pathlib import Path
import stat
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
source = Path(__file__).resolve().parents[1] / "apps/nanobot/gateway.py"
spec = importlib.util.spec_from_file_location("nanobot_catalog_bootstrap", source)
bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap)


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.home = Path(self.directory.name)
        self.env = {"APP_URL": "https://nanobot.example.com"}

    def test_restart_preserves_user_settings_and_work(self):
        path = bootstrap.configure(self.home, self.env)
        config = json.loads(path.read_text())
        config["channels"]["telegram"] = {"enabled": False, "allowFrom": ["my-account"]}
        path.write_text(json.dumps(config))
        saved_work = self.home / ".nanobot/workspace/keep.txt"
        saved_work.parent.mkdir()
        saved_work.write_text("saved work")

        bootstrap.configure(self.home, self.env)

        updated = json.loads(path.read_text())
        self.assertEqual(updated["channels"]["telegram"]["allowFrom"], ["my-account"])
        self.assertEqual(saved_work.read_text(), "saved work")
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)

    def test_removing_managed_key_clears_its_environment_reference(self):
        path = bootstrap.configure(self.home, {**self.env, "OPENROUTER_API_KEY": "stand-in"})
        config = json.loads(path.read_text())
        self.assertEqual(config["providers"]["openrouter"]["apiKey"], "${OPENROUTER_API_KEY}")

        bootstrap.configure(self.home, self.env)

        updated = json.loads(path.read_text())
        self.assertEqual(updated["providers"]["openrouter"]["apiKey"], "")

    def test_invalid_existing_config_is_preserved_for_repair(self):
        path = bootstrap.configure(self.home, self.env)
        path.write_text("broken JSON")

        with self.assertRaises(json.JSONDecodeError):
            bootstrap.configure(self.home, self.env)

        self.assertEqual(path.read_text(), "broken JSON")


if __name__ == "__main__":
    unittest.main()
