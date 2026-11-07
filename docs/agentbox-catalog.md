# Agentbox catalog package

## Runtime and access

Package the published agentbox-app 0.1.19 browser runtime with its bundled renderer. Node 24.22.1, Claude Code 2.1.319 and Codex 0.167.0 are installed at build time. npm's complete lockfile records dependency versions and integrity; Node downloads are checked against official SHA-256 sums. No Electron binary is downloaded. Build tools support the native PTY terminal.

The runtime refuses root. Agentbox listens only on 127.0.0.1:18765. Caddy serves PORT behind SuperHQ workspace authentication and injects Agentbox's per-run access key into upstream requests. The native renderer receives only the public marker `workspace`, which satisfies its browser bridge without disclosing the backend key. The key is not a catalog input or outgoing credential. It is neither printed by the wrapper nor persisted by Caddy. The proxy rejects foreign browser Origins, including SSE and API requests. The native backend still rejects requests without its actual key.

The manifest requires workspace access. Do not expose this proxy publicly: workspace authentication is the external access boundary. All authorized workspace members share Agentbox's authority over agent accounts, terminals and files. No app-specific console button or authentication exception is required.

## State and lifetime

/home/app/.agentbox holds native configuration; /home/app/.local/share/agentbox holds the native store. /home/app/work is an optional first-run repository clone; it is not overwritten on restart. CLI account files remain in the app user's home. Release updates replace code, not home data. SIGTERM stops both backend and proxy; an unexpected child exit fails the service.

The existing sandbox lifecycle applies. Keeping the browser open keeps the sandbox active. Parking stops running work. No artificial keepalive or guaranteed unattended execution is introduced.

## Verification required before publication

Build on a SuperHQ ARM64 sandbox, check PTY and both installed CLIs, test browser HTTP and SSE, verify unauthenticated and foreign-Origin rejection, test restart persistence and process shutdown, exercise remote sign-in without approving a user's account, capture actual UI, and measure resources using CONTRIBUTING.md. Account authorization and paid agent execution require the account owner; do not invent a successful end-to-end coding run.

Run npm run check, node --test scripts/test-agentbox.mjs, and the console checkApp validator. Keep the total catalog text below 256 KiB. Preserve the upstream GPL license. Updates must change all versioned install paths together and regenerate the lockfile.

## Remote account sign-in

The published browser setup starts `codex login` or `claude auth login --claudeai`. Their ordinary OAuth flow can use a localhost callback on the remote server, which is not the user's own computer. Do not claim that approving the browser link alone completes remote setup. README directs the owner to the app terminal, using Codex's official device flow when enabled, or Claude Code's interactive CLI instructions. No credential files from the developer's machine are copied into a customer sandbox, and no API-key workaround bypasses Agentbox's subscription policy.

## Verification on 2026-11-07

The full ARM64 build passed in a fresh Debian trixie SuperHQ sandbox. Both pinned CLIs run and the native node-pty module executes a real shell as app in a project directory. The wrapper refuses root. A project and a separate state file survived restart, SIGTERM stopped both children, and Caddy did not create an autosave file containing its access key.

The browser UI renders at 1440x900 and 390x844, with no mobile horizontal overflow. The screenshot shows a real public Git repository added to the verification instance; no fictional agent conversation or completed task was created. The published first-run screen can say Install even when readiness reports both CLIs found. Account sign-in remains required.

The managed Developer workspace deployment completed successfully at commit d9d4a11451684e50702c8806c56e8715e6df3bae, with web, backend and proxy running as app. Its authenticated HTTPS event stream delivered both the initial retry directive and a subsequent heartbeat. Unauthenticated external page/API requests return 401. The loopback backend without its key returns 403; the proxy accepts its app Origin and rejects a foreign Origin with 403, including APP_URL values ending in a slash.

Codex device login reached the official approval URL and code prompt, then was cancelled. No account was approved, no developer credential file was copied, and no paid model call was made. Claude Code's interactive account approval remains an owner check. AMD64 dependencies and Node sums are pinned, but a full AMD64 runtime test has not been performed.

The first workspace copy uses the ordinary connected-repository app flow, pinned to the tested commit. Catalog publication is separate and awaits required maintainer review. Once the catalog release is merged, future workspace updates can follow a reviewed commit without replacing /home/app. The temporary verification sandbox was deleted; the managed Agentbox app remains.
