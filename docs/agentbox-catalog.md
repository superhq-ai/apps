# Agentbox catalog package

## Runtime and access

Package the published agentbox-app 0.1.19 browser runtime with its bundled renderer. Node 24.22.1, Claude Code 2.1.319 and Codex 0.167.0 are installed at build time. npm's complete lockfile records dependency versions and integrity; Node downloads are checked against official SHA-256 sums. No Electron binary is downloaded. Build tools support the native PTY terminal.

The runtime refuses root. Agentbox listens only on 127.0.0.1:18765. Caddy serves PORT behind SuperHQ workspace authentication and injects Agentbox's per-run access key into upstream requests. The native renderer receives only the public marker `workspace`, which satisfies its browser bridge without disclosing the backend key. The key is not a catalog input or outgoing credential. It is neither printed by the wrapper nor persisted by Caddy. The proxy rejects foreign browser Origins, including SSE and API requests. The native backend still rejects requests without its actual key.

The manifest requires workspace access. Do not expose this proxy publicly: workspace authentication is the external access boundary. All authorized workspace members share Agentbox's authority over agent accounts, terminals and files. No app-specific console button or authentication exception is required.

## State and lifetime

/home/app/.agentbox holds application state. /home/app/work is an optional first-run repository clone; it is not overwritten on restart. CLI account files remain in the app user's home. Release updates replace code, not home data. SIGTERM stops both backend and proxy; an unexpected child exit fails the service.

The existing sandbox lifecycle applies. Keeping the browser open keeps the sandbox active. Parking stops running work. No artificial keepalive or guaranteed unattended execution is introduced.

## Verification required before publication

Build on a SuperHQ ARM64 sandbox, check PTY and both installed CLIs, test browser HTTP and SSE, verify unauthenticated and foreign-Origin rejection, test restart persistence and process shutdown, exercise remote sign-in without approving a user's account, capture actual UI, and measure resources using CONTRIBUTING.md. Account authorization and paid agent execution require the account owner; do not invent a successful end-to-end coding run.

Run npm run check, node --test scripts/test-agentbox.mjs, and the console checkApp validator. Keep the total catalog text below 256 KiB. Preserve the upstream GPL license. Updates must change all versioned install paths together and regenerate the lockfile.
