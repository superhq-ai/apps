"""Managed provider keys must remain references; removing a key removes its override."""
import importlib.util
from pathlib import Path
import sys
import unittest

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('opencode_start', Path(__file__).parents[1] / 'apps/opencode/start.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ConfigurationTests(unittest.TestCase):
    def test_keys_are_environment_references_not_copied_values(self):
        config = module.runtime_config({'OPENROUTER_API_KEY': 'private-test-key'})
        self.assertEqual(config['provider']['openrouter']['options']['apiKey'], '{env:OPENROUTER_API_KEY}')
        self.assertNotIn('private-test-key', str(config))
        self.assertFalse(config['autoupdate'])

    def test_removed_or_blank_keys_leave_no_provider_override(self):
        self.assertNotIn('provider', module.runtime_config({}))
        self.assertNotIn('provider', module.runtime_config({'OPENAI_API_KEY': '  '}))

    def test_each_supported_provider_has_its_own_reference(self):
        config = module.runtime_config({key: 'placeholder' for key in module.PROVIDERS.values()})
        for provider, key in module.PROVIDERS.items():
            self.assertEqual(config['provider'][provider]['options']['apiKey'], '{env:' + key + '}')

    def test_origin_has_no_path_and_rejects_credentials(self):
        self.assertEqual(module.app_origin('https://app.example/'), 'https://app.example')
        self.assertEqual(module.app_origin('https://app.example/path?q=1'), 'https://app.example')
        for url in ['http://app.example', '', 'https://user:password@app.example', 'https:///missing']:
            with self.assertRaises(ValueError):
                module.app_origin(url)


if __name__ == '__main__':
    unittest.main()
