# nanobot catalog package

## Scope

Package upstream nanobot 0.4.0 as a workspace-private app, without changes to the console or application-specific connection buttons. Model selection and host-restricted provider credentials use existing manifest inputs. The gateway and browser proxy are ordinary Procfile services supervised by the app runtime.

## Access boundary

SuperHQ authenticates workspace access before forwarding to the browser-facing port. Caddy overwrites X-SuperHQ-Workspace-Auth and forwards to 127.0.0.1:18765. nanobot's native trustedProxyAuth accepts only 127.0.0.1/32 direct peers and requires the assertion. Neither nanobot's browser backend nor its health endpoint listens on a network interface. Do not make this package public without replacing that trust boundary with independent application authentication. Catalog url=workspace prevents making its address public through app settings.

## State ownership

The release owns the executable environment and proxy configuration. /home/app/.nanobot owns user data. Bootstrap preserves unrelated user settings and writes only the bindings, selected provider/model, and configured model credential references. Removing a SuperHQ key removes its unresolved environment reference on next start. Config writes use atomic replacement and mode 0600; startup refuses root. Configuration errors fail rather than overwrite an unreadable or invalid existing file.

The manifest does not put incoming authentication secrets into outgoing secret inputs. No pairing credential, auth token or real model key is written to logs by the package.

## Execution lifetime

The package follows the existing sandbox lifecycle. A browser connection keeps the sandbox active; parking stops gateway processes. Persisted automation definitions are not an execution guarantee. No artificial heartbeat, hidden always-on loop, or misleading hold setting is used. Unattended scheduled and chat-channel use needs a platform-supported lifetime policy before it can be promised.

## Verification

Before catalog publication: validate both Linux wheel architectures against the locked hashes, exercise configuration preservation and key removal, build and run on a SuperHQ ARM64 sandbox as app, verify workspace-authenticated HTTP and WebSocket access, verify unauthenticated access fails even with a spoofed assertion header, restart and check persisted state, capture a real WebUI screenshot, and measure open-idle resources for ten minutes. Record results in the pull request.
