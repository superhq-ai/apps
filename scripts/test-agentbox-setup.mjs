// A hosted sign-in must show the CLI's remote approval step, reject foreign
// browser writes, and stop cancelled or expired attempts without keeping codes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough, Writable } from 'node:stream';
import { createHostedSetup } from '../apps/agentbox/setup.mjs';

function harness() {
  const calls = [];
  const spawn = (command, args) => {
    const child = new EventEmitter();
    child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.input = ''; child.stdin = new Writable({ write(data, _, done) { child.input += data; done(); } });
    child.kill = () => { child.killed = true; queueMicrotask(() => child.emit('exit', null, 'SIGTERM')); };
    calls.push({ command, args, child });
    if (args.includes('status')) queueMicrotask(() => child.emit('exit', 1));
    return child;
  };
  return { calls, spawn };
}
async function fixture(options = {}) {
  const h = harness();
  const app = createHostedSetup({ origin: 'https://agent.example', spawn: h.spawn, ...options });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const request = (path, body, origin = 'https://agent.example') => fetch(base + path, body === undefined ? {} : { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ...h, ...app, request, async close() { app.stop(); await new Promise(resolve => app.server.close(resolve)); } };
}

test('Codex exposes an official device URL and code, then erases them on cancellation', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/setup/api/codex/start', {})).status, 200);
    const login = f.calls.find(c => c.args.includes('--device-auth'));
    assert.ok(login);
    login.child.stdout.write('\u001b[32mOpen https://auth.openai.com/codex/device\nEnter ABCD-12345\u001b[0m\n');
    const state = await (await f.request('/setup/api/status')).json();
    assert.equal(state.codex.url, 'https://auth.openai.com/codex/device');
    assert.equal(state.codex.code, 'ABCD-12345');
    await f.request('/setup/api/codex/cancel', {});
    const cancelled = await (await f.request('/setup/api/status')).json();
    assert.equal(cancelled.codex.url, null); assert.equal(cancelled.codex.code, null);
    assert.equal(login.child.killed, true);
  } finally { await f.close(); }
});

test('foreign Origins and unknown providers never start a CLI', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/setup/api/codex/start', {}, 'https://evil.example')).status, 403);
    assert.equal((await f.request('/setup/api/shell/start', {})).status, 404);
    assert.equal(f.calls.length, 0);
  } finally { await f.close(); }
});

test('expired sign-in stops the CLI and removes the approval code', async () => {
  const f = await fixture({ timeoutMs: 20 });
  try {
    await f.request('/setup/api/codex/start', {});
    const login = f.calls.find(c => c.args.includes('--device-auth'));
    login.child.stdout.write('https://auth.openai.com/codex/device\nABCD-12345\n');
    await new Promise(resolve => setTimeout(resolve, 40));
    const state = await (await f.request('/setup/api/status')).json();
    assert.equal(state.codex.phase, 'failed'); assert.equal(state.codex.code, null);
    assert.equal(login.child.killed, true);
  } finally { await f.close(); }
});

test('Claude accepts a single CLI code without echoing it, and refuses multiline input', async () => {
  const f = await fixture();
  try {
    await f.request('/setup/api/claude/start', {});
    const login = f.calls.find(c => c.command === 'claude' && c.args.includes('--claudeai'));
    login.child.stdout.write('Open https://claude.ai/oauth/authorize?state=example\n');
    assert.equal((await f.request('/setup/api/claude/code', { code: 'bad\ncommand' })).status, 400);
    assert.equal(login.child.input, '');
    assert.equal((await f.request('/setup/api/claude/code', { code: 'example-code#state' })).status, 200);
    assert.equal(login.child.input, 'example-code#state\n');
    const state = await (await f.request('/setup/api/status')).json();
    assert.equal(JSON.stringify(state).includes('example-code#state'), false);
    login.child.stdout.write('https://evil.example/steal\n');
    assert.equal((await (await f.request('/setup/api/status')).json()).claude.url.startsWith('https://claude.ai/'), true);
  } finally { await f.close(); }
});
