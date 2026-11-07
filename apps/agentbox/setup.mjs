import { createServer } from 'node:http';
import { spawn as nodeSpawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const commands = {
  claude: { status: ['auth', 'status', '--json'], login: ['auth', 'login', '--claudeai'], hosts: ['claude.ai', 'platform.claude.com', 'console.anthropic.com'] },
  codex: { status: ['login', 'status'], login: ['login', '--device-auth'], hosts: ['auth.openai.com'] },
};
const assets = {
  '/setup/client.js': ['setup-client.js', 'text/javascript'],
  '/setup/style.css': ['setup.css', 'text/css'],
  '/setup/icon.svg': ['icon.svg', 'image/svg+xml'],
};
const clean = text => text.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');

export function createHostedSetup({ origin, spawn = nodeSpawn, cancelNative = async () => {}, timeoutMs = 600000 }) {
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(ANTHROPIC_|CLAUDE_CODE_)|^(OPENAI_API_KEY|CODEX_API_KEY|CLAUDE_CONFIG_DIR|CODEX_HOME|CLAUDECODE|CLAUDE_PID|CLAUDE_EFFORT|CLAUDE_SECURESTORAGE_CONFIG_DIR|NODE_OPTIONS)$/.test(key)));
  const jobs = new Map();
  const checks = new Map();
  const empty = () => ({ phase: 'idle', url: null, code: null, error: null });
  const current = name => jobs.get(name) ?? empty();
  function end(job, phase = 'idle', error = null) {
    clearTimeout(job.timer);
    job.phase = phase; job.error = error; job.url = null; job.code = null; job.output = '';
    job.child?.kill('SIGTERM');
    if (job.child) {
      const child = job.child;
      const force = setTimeout(() => child.kill('SIGKILL'), 3000);
      force.unref(); child.once('exit', () => clearTimeout(force));
    }
  }
  async function connected(name) {
    if (checks.has(name)) return checks.get(name);
    const check = new Promise(resolve => {
      const child = spawn(name, commands[name].status, { env: environment, stdio: ['ignore', 'ignore', 'ignore'] });
      const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(false); }, 8000);
      timer.unref();
      child.once('error', () => { clearTimeout(timer); resolve(false); });
      child.once('exit', code => { clearTimeout(timer); resolve(code === 0); });
    }).finally(() => checks.delete(name));
    checks.set(name, check);
    return check;
  }
  async function status(name) {
    const job = current(name);
    const ready = await connected(name);
    if (ready && job.phase !== 'connected') end(job, 'connected');
    return { phase: ready ? 'connected' : job.phase === 'connected' ? 'idle' : job.phase, url: job.url, code: job.code, error: job.error };
  }
  async function start(name) {
    if (await connected(name)) return { phase: 'connected', url: null, code: null, error: null };
    const previous = jobs.get(name);
    if (previous?.phase === 'waiting') return status(name);
    if (previous) end(previous);
    await cancelNative(name);
    const job = { ...empty(), phase: 'waiting', output: '' };
    jobs.set(name, job);
    const child = spawn(name, commands[name].login, { env: environment, stdio: ['pipe', 'pipe', 'pipe'] });
    job.child = child;
    const feed = data => {
      if (jobs.get(name) !== job || job.phase !== 'waiting') return;
      job.output = (job.output + clean(String(data))).slice(-32768);
      for (const address of job.output.match(/https:\/\/[^\s<>"\x1b]+/g) ?? []) {
        try {
          const url = new URL(address);
          if (commands[name].hosts.includes(url.hostname) && !url.username && !url.password) job.url = url.href;
        } catch { /* the next chunk may complete a URL */ }
      }
      if (name === 'codex') job.code = job.output.match(/\b[A-Z0-9]{4}-[A-Z0-9]{4,5}\b/)?.[0] ?? null;
    };
    child.stdout.on('data', feed); child.stderr.on('data', feed);
    child.stdin.on('error', () => {});
    child.once('error', () => end(job, 'failed', 'The sign-in tool could not start. Try again.'));
    child.once('exit', async () => {
      if (jobs.get(name) !== job || job.phase !== 'waiting') return;
      if (await connected(name)) end(job, 'connected');
      else end(job, 'failed', 'Sign-in did not finish. For Codex, check that device sign-in is enabled in your ChatGPT account, then try again.');
    });
    job.timer = setTimeout(() => end(job, 'failed', 'This sign-in expired. Try again.'), timeoutMs);
    job.timer.unref();
    return { phase: job.phase, url: job.url, code: job.code, error: job.error };
  }
  const json = (res, code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/setup')) {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'", 'Referrer-Policy': 'no-referrer' });
        res.end(await readFile(new URL('./setup.html', import.meta.url))); return;
      }
      if (req.method === 'GET' && assets[url.pathname]) {
        const [file, type] = assets[url.pathname];
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        res.end(await readFile(new URL(file, import.meta.url))); return;
      }
      if (req.method === 'GET' && url.pathname === '/setup/api/status') {
        const states = await Promise.all(Object.keys(commands).map(async name => [name, await status(name)]));
        json(res, 200, Object.fromEntries(states)); return;
      }
      const route = url.pathname.match(/^\/setup\/api\/(claude|codex)\/(start|cancel|code)$/);
      if (!route || req.method !== 'POST') { json(res, 404, { error: 'Not found' }); return; }
      if (req.headers.origin !== origin || !req.headers['content-type']?.startsWith('application/json')) { json(res, 403, { error: 'Forbidden origin' }); return; }
      let raw = '';
      for await (const part of req) {
        raw += part;
        if (Buffer.byteLength(raw) > 8192) { json(res, 413, { error: 'Request too large' }); return; }
      }
      const body = JSON.parse(raw || '{}');
      const [, name, action] = route;
      if (action === 'start') { json(res, 200, await start(name)); return; }
      const job = jobs.get(name);
      if (action === 'cancel') { if (job) end(job); json(res, 200, empty()); return; }
      if (name !== 'claude' || job?.phase !== 'waiting' || !job.child || typeof body.code !== 'string' || !body.code.trim() || /[\r\n\x00-\x1f\x7f]/.test(body.code) || body.code.length > 4096) { json(res, 400, { error: 'Enter the single code provided by Claude.' }); return; }
      job.child.stdin.write(body.code.trim() + '\n');
      json(res, 200, { ok: true });
    } catch (error) {
      if (!res.headersSent) json(res, error instanceof SyntaxError ? 400 : 500, { error: error instanceof SyntaxError ? 'Invalid request' : 'Sign-in could not complete. Try again.' });
      else res.end();
    }
  });
  server.requestTimeout = 15000;
  return { server, stop() { for (const job of jobs.values()) end(job); } };
}
