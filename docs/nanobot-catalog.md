# nanobot catalog package

## Scope

Package upstream nanobot 0.4.0 as a workspace-private app, without changes to the console or application-specific connection buttons. Model selection and host-restricted provider credentials use existing manifest inputs. The gateway and browser proxy are ordinary Procfile services supervised by the app runtime.

## Access boundary

SuperHQ authenticates workspace access before forwarding to the browser-facing port. Caddy rejects a browser Origin different from APP_URL, overwrites X-SuperHQ-Workspace-Auth and forwards to 127.0.0.1:18765. nanobot's native trustedProxyAuth accepts only 127.0.0.1/32 direct peers and requires the assertion. Neither nanobot's browser backend nor its health endpoint listens on a network interface. Do not make this package public without replacing that trust boundary with independent application authentication. Catalog url=workspace prevents making its address public through app settings.

## State ownership

The release owns the executable environment and proxy configuration. /home/app/.nanobot owns user data. Bootstrap preserves unrelated user settings and writes only the bindings, selected provider/model, and configured model credential references. Removing a SuperHQ key removes its unresolved environment reference on next start. Config writes use atomic replacement and mode 0600; startup refuses root. Configuration errors fail rather than overwrite an unreadable or invalid existing file.

The manifest does not put incoming authentication secrets into outgoing secret inputs. No pairing credential, auth token or real model key is written to logs by the package.

## Execution lifetime

The package follows the existing sandbox lifecycle. A browser connection keeps the sandbox active; parking stops gateway processes. Persisted automation definitions are not an execution guarantee. No artificial heartbeat, hidden always-on loop, or misleading hold setting is used. Unattended scheduled and chat-channel use needs a platform-supported lifetime policy before it can be promised.

## Verification

Before catalog publication: validate both Linux wheel architectures against the locked hashes, exercise configuration preservation and key removal, build and run on a SuperHQ ARM64 sandbox as app, verify workspace-authenticated HTTP and WebSocket access, verify unauthenticated access fails even with a spoofed assertion header, restart and check persisted state, capture a real WebUI screenshot, and measure open-idle resources for ten minutes. Record results in the pull request.

## Updating the package

Read the upstream release and wheel metadata first. The upstream version is pinned by the nanobot-ai requirement, the versioned venv path in build.sh and the Procfile, and the gateway executable path. Change these together and regenerate the complete dependency lock with SHA-256 hashes for Python 3.13 and Linux ARM64/AMD64 support. Do not use an unpinned pip install at startup. The wheel must include web/dist/index.html; build.sh checks it.

Use `python3 scripts/test-nanobot.py` and `npm run check` locally. The console's `checkApp` additionally validates the complete directory, icon, screenshots and the combined 256 KiB text limit. Recheck this limit after regenerating the dependency lock.

## Verification completed on 2026-11-07

- Linux AMD64: hash-required binary dependency resolution passed. ARM64: full pinned build and pip dependency check passed on a fresh Debian trixie SuperHQ sandbox.
- The existing console setup renders provider selection, optional model ID and the three correctly scoped secret inputs; no app-specific UI changes.
- Desktop and 390px mobile WebUI render without horizontal overflow. The browser's native WebSocket shows Connected, and authenticated settings requests return JSON with HTTP 200.
- Unauthenticated requests, including a forged workspace assertion, return HTTP 401 at the SuperHQ boundary. Direct loopback backend settings without authentication return 401. A different browser Origin receives 403 at Caddy; the app Origin receives 200.
- Gateway restart retains a workspace file and unrelated channel settings; config permissions stay 0600. Native validation and environment-reference resolution pass for OpenRouter, OpenAI and Anthropic.
- The installed HTTP client validates TLS to OpenRouter (200), OpenAI (401 without a key) and Anthropic (401 without a key). No paid model request was made; a real-key chat remains a follow-up check.
- Final catalog publication and its first managed deployment must follow the required code-owner review and merge. The isolated sandbox exercise verifies the package runtime, not the complete catalog deployment workflow.
