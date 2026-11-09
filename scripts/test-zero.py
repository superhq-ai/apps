"""Validate the launch boundary; optionally exercise a running packaged app.

ZERO_TEST_URL=http://127.0.0.1:18080 ZERO_TEST_ORIGIN=https://localhost:18443
python3 scripts/test-zero.py
"""
import importlib.util
import os
from pathlib import Path
import re
import sys
import unittest
import urllib.error
import urllib.request

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('zero_start', Path(__file__).parents[1] / 'apps/zero/start.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class OriginTests(unittest.TestCase):
    def test_https_origins(self):
        self.assertEqual(module.app_origin('https://zero.example/'), 'https://zero.example')
        self.assertEqual(module.app_origin('https://localhost:18443'), 'https://localhost:18443')

    def test_rejects_credentials_and_non_origins(self):
        for value in ['', 'http://zero.example', '//zero.example', 'https:///missing',
                      'https://user:pass@zero.example', 'https://zero.example/path',
                      'https://zero.example?query=1', 'https://zero.example#fragment']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                module.app_origin(value)


@unittest.skipUnless(os.environ.get('ZERO_TEST_URL'), 'set ZERO_TEST_URL to test the running package')
class ProxyTests(unittest.TestCase):
    def request(self, path, headers=None):
        request = urllib.request.Request(os.environ['ZERO_TEST_URL'] + path, headers=headers or {})
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                return response.status, response.read(), response.headers
        except urllib.error.HTTPError as error:
            return error.code, error.read(), error.headers

    def setUp(self):
        status, body, _ = self.request('/')
        self.assertEqual(status, 200)
        self.token = re.search(rb'name="0-control-token" content="([^"]+)"', body).group(1).decode()

    def test_control_api_preserves_native_authentication(self):
        for token, expected in [(None, 403), ('invalid', 403), (self.token, 200)]:
            with self.subTest(token='valid' if token == self.token else token):
                headers = {'Origin': os.environ['ZERO_TEST_ORIGIN']}
                if token:
                    headers['X-0-Control-Token'] = token
                status, _, _ = self.request('/api/console/sessions', headers)
                self.assertEqual(status, expected)

    def test_foreign_origin_and_cross_site_api_are_rejected(self):
        for extra in [{'Origin': 'https://foreign.example'}, {'Sec-Fetch-Site': 'cross-site'}]:
            with self.subTest(extra=extra):
                status, _, _ = self.request('/api/console/sessions', {'X-0-Control-Token': self.token, **extra})
                self.assertEqual(status, 403)

    def test_console_navigation_still_works(self):
        status, _, headers = self.request('/', {'Sec-Fetch-Site': 'cross-site'})
        self.assertEqual(status, 200)
        self.assertIn("frame-ancestors 'none'", headers.get('Content-Security-Policy', ''))
        self.assertEqual(headers.get('X-Content-Type-Options'), 'nosniff')


if __name__ == '__main__':
    unittest.main()
