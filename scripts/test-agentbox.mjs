import test from 'node:test';
import assert from 'node:assert/strict';
import { accessKey } from '../apps/agentbox/start.mjs';

test('accept only the native loopback readiness URL with a complete access key', () => {
  const key = 'aB0_-'.repeat(6) + 'ab';
  assert.equal(accessKey(`  http://127.0.0.1:18765/?token=${key}  `), key);
  for (const line of [
    `http://127.0.0.1:8080/?token=${key}`,
    `http://example.com:18765/?token=${key}`,
    `http://127.0.0.1:18765/?token=${key}extra`,
    `log http://127.0.0.1:18765/?token=${key}`,
    `http://127.0.0.1:18765/?token=${key.slice(1)}`,
    'Agentbox is starting',
  ]) assert.equal(accessKey(line), null);
});
