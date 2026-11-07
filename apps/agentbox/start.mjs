import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

export function accessKey(line) {
  const match = line.trim().match(/^http:\/\/127\.0\.0\.1:18765\/\?token=([A-Za-z0-9_-]{32})$/);
  return match?.[1] ?? null;
}

export async function start() {
  if (process.getuid?.() === 0) throw new Error('Agentbox must run as the app user');
  const appUrl = new URL(process.env.APP_URL ?? '');
  if (appUrl.protocol !== 'https:' || appUrl.username || appUrl.password) throw new Error('APP_URL must be the app HTTPS address');
  const directory = path.dirname(fileURLToPath(import.meta.url));
  const store = path.join(homedir(), '.agentbox');
  const work = path.join(homedir(), 'work');
  await mkdir(store, { recursive: true, mode: 0o700 });
  await mkdir(work, { recursive: true });
  if (process.env.AGENTBOX_REPOSITORY && !(await readdir(work)).length) {
    await new Promise((resolve, reject) => {
      const child = spawn('git', ['clone', '--', process.env.AGENTBOX_REPOSITORY, work], { stdio: 'inherit' });
      child.once('error', reject);
      child.once('exit', code => code === 0 ? resolve() : reject(new Error('Repository clone failed')));
    });
  }
  let key = null;
  let proxy = null;
  let stopping = false;
  const redact = line => key ? line.replaceAll(key, '[private access key]') : line;
  const backend = spawn(process.execPath, [
    '/opt/agentbox/0.1.19/node_modules/agentbox-app/bin/agentbox.mjs',
    '--port', '18765', '--dir', store, '--no-open',
  ], { env: { ...process.env, AGENTBOX_HOME: store }, stdio: ['ignore', 'pipe', 'pipe'] });
  const stop = (code = 1) => {
    if (stopping) return;
    stopping = true;
    clearTimeout(ready);
    backend.kill('SIGTERM');
    proxy?.kill('SIGTERM');
    setTimeout(() => process.exit(code), 3500).unref();
    Promise.all([backend, proxy].filter(Boolean).map(child => child.exitCode !== null
      ? Promise.resolve() : new Promise(resolve => child.once('exit', resolve))))
      .then(() => process.exit(code));
  };
  const ready = setTimeout(() => {
    console.error('Agentbox did not become ready within 60 seconds');
    stop(1);
  }, 60000);
  backend.once('error', error => { console.error(error.message); stop(1); });
  backend.once('exit', code => stop(code === 0 ? 1 : (code ?? 1)));
  process.once('exit', () => { backend.kill('SIGTERM'); proxy?.kill('SIGTERM'); });
  createInterface({ input: backend.stderr }).on('line', line => console.error(redact(line)));
  createInterface({ input: backend.stdout }).on('line', line => {
    const token = accessKey(line);
    if (!token) { console.log(redact(line)); return; }
    if (proxy) return;
    key = token;
    clearTimeout(ready);
    const adapted = spawnSync('caddy', ['adapt', '--config', path.join(directory, 'Caddyfile'), '--adapter', 'caddyfile'], {
      env: { ...process.env, APP_URL: appUrl.origin, AGENTBOX_BACKEND_TOKEN: key }, encoding: 'utf8',
    });
    if (adapted.error || adapted.status !== 0) {
      console.error(redact(adapted.error?.message ?? adapted.stderr));
      stop(1);
      return;
    }
    const config = JSON.parse(adapted.stdout);
    config.admin = { disabled: true, config: { persist: false } };
    proxy = spawn('caddy', ['run', '--config', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
    proxy.stdin.on('error', () => stop(1));
    proxy.stdin.end(JSON.stringify(config));
    for (const stream of [proxy.stdout, proxy.stderr]) {
      createInterface({ input: stream }).on('line', line => console.log(redact(line)));
    }
    proxy.once('error', error => { console.error(redact(error.message)); stop(1); });
    proxy.once('exit', code => stop(code === 0 ? 1 : (code ?? 1)));
    console.log('Starting Agentbox browser access through SuperHQ.');
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => stop(0));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start().catch(error => { console.error(error.message); process.exit(1); });
}
