const panels = new Map([...document.querySelectorAll('[data-provider]')].map(panel => [panel.dataset.provider, panel]));
const connectionError = document.querySelector('#connection-error');
let reading = false;
let timer;
let pollingMs = 15000;

async function request(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('/setup/api/' + path, { signal: controller.signal, ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? 'Sign-in could not complete. Try again.');
    return result;
  } finally { clearTimeout(timeout); }
}
function render(name, state) {
  const panel = panels.get(name);
  const waiting = state.phase === 'waiting';
  panel.querySelector('.state').textContent = state.phase === 'connected' ? 'Connected' : waiting ? 'Waiting for approval' : 'Installed · Not connected';
  panel.querySelector('.start').hidden = waiting || state.phase === 'connected';
  panel.querySelector('.approval').hidden = !waiting;
  const link = panel.querySelector('.approve');
  link.hidden = !waiting || !state.url;
  if (state.url) link.href = state.url; else link.removeAttribute('href');
  if (name === 'codex') {
    panel.querySelector('.device-code').hidden = !waiting || !state.code;
    panel.querySelector('code').textContent = state.code ?? '';
  } else panel.querySelector('.code-form').hidden = !waiting || !state.url;
  const error = panel.querySelector('.error');
  error.textContent = state.error ?? ''; error.hidden = !state.error;
}
async function refresh() {
  if (reading) return;
  reading = true;
  try {
    const states = await request('status');
    for (const [name, state] of Object.entries(states)) render(name, state);
    pollingMs = Object.values(states).some(state => state.phase === 'waiting') ? 2500 : 15000;
    document.querySelector('#open').hidden = !Object.values(states).some(state => state.phase === 'connected');
    connectionError.hidden = true;
  } catch {
    connectionError.textContent = 'Agentbox could not check your accounts. Retrying…'; connectionError.hidden = false;
  } finally { reading = false; clearTimeout(timer); if (!document.hidden) timer = setTimeout(refresh, pollingMs); }
}
for (const [name, panel] of panels) {
  for (const action of ['start', 'cancel']) panel.querySelector('.' + action).addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try { render(name, await request(`${name}/${action}`, {})); await refresh(); }
    catch (error) { render(name, { phase: 'failed', error: error.message }); }
    finally { button.disabled = false; }
  });
  panel.querySelector('.copy')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    try { await navigator.clipboard.writeText(panel.querySelector('code').textContent); button.textContent = 'Copied'; }
    catch { button.textContent = 'Select and copy the code'; }
  });
  panel.querySelector('form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const input = panel.querySelector('input');
    try { await request(`${name}/code`, { code: input.value }); input.value = ''; await refresh(); }
    catch (error) { panel.querySelector('.error').textContent = error.message; panel.querySelector('.error').hidden = false; }
  });
}
function poll() { clearTimeout(timer); if (!document.hidden) void refresh(); }
document.addEventListener('visibilitychange', poll);
poll();
