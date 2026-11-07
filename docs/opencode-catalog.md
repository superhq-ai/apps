# OpenCode catalog package

## Scope

Host upstream OpenCode 1.19.5 with its embedded browser interface and bundled provider SDKs. No console-specific connection button, provider OAuth implementation or patched upstream UI is added. The package uses the native model picker, project chooser, sessions and terminal.

The stable Linux release binaries are SHA-256 checked against GitHub's release asset digests. AMD64 uses the baseline build so it does not require AVX2. Node 24.22.1 is separately pinned and checked against official sums. Debian packages are version-pinned. The native plugin SDK seed has a complete npm integrity lock and is installed at build time with lifecycle scripts disabled. A new app receives the seed as app; existing user configuration is preserved. User-configured plugins and project dependencies remain under the user's control.

## Access and credentials

The manifest requires workspace-private access. OpenCode binds to 127.0.0.1:18765 with its own random per-run HTTP Basic password. Caddy serves PORT behind SuperHQ workspace authentication, rejects foreign browser Origins, and overwrites the incoming Authorization header with the local backend credential. The password is neither a catalog secret nor a user-facing pairing code. Caddy receives its generated JSON over stdin with admin/config/persist=false; no config containing that password is saved.

OpenCode, OpenRouter, OpenAI and Anthropic setup keys use existing host-restricted sandbox secrets. Inline OpenCode configuration contains environment references, not copies of key values. Removing a setup key removes its runtime override on restart. No native auth.json or user config file is overwritten by the wrapper. Keys entered in OpenCode itself follow upstream storage under the app's home and are distinct from SuperHQ-managed setup keys.

All members able to open the app share authority over its files, terminal, projects and connected providers. The workspace access boundary must remain in place.

## State and execution

The app runs as app and refuses root. /home/app/work is the optional repository clone and default working folder. OpenCode's native XDG configuration, data and cache locations remain under /home/app. Runtime code lives under /opt/opencode with versioned paths, outside the user's project folder. Restart or deployment does not replace the home directory.

Automatic OpenCode updates and language-server binary downloads are disabled. Git, Node/npm, Python and ripgrep are installed during build. Extra user-requested tools, plugins and project dependencies are not part of the catalog's default runtime.

A browser connection follows SuperHQ's existing sandbox lifecycle. Parking stops processes. Saved sessions and files persist, but an in-flight agent task is not guaranteed to resume. No hidden keepalive or promise of unattended execution is introduced.

## Required verification

Validate the manifest and complete app directory, run configuration tests, build on SuperHQ ARM64, inspect initial UI and model/provider selection, run a real model task when an appropriate provider is available, verify native SSE and PTY connections, reject unauthenticated and foreign-Origin access, check persistence and shutdown, capture actual UI, and measure the complete open-idle sandbox using CONTRIBUTING.md. Distinguish a free-provider test from a paid-key provider test, and do not claim an account or billing path was verified without testing it.

Catalog publication requires maintainer review. A workspace copy may be deployed through the ordinary connected-repository flow at the exact tested commit while the catalog PR is reviewed.

## Deployment verification, 2026-11-07

The Developer workspace copy was deployed from commit `1525ff87e092e4ab064f5f0aff11bcc3dc43bff3` through the connected GitHub app flow. ARM64 build, pinned OpenCode/Node versions and the preinstalled SDK seed passed. Runtime processes and terminal commands run as `app`. The public endpoint returns 401 without workspace authentication, the unauthenticated local backend returns 401, the authenticated browser proxy API returns 200, and a foreign browser Origin returns 403. The build guard also exercised the real Caddy adapter: Authorization must be set to the complete Basic value, rather than parsed as a replacement operation.

The native project chooser opened `/home/app/work`. A free OpenCode MiMo-V2.6-Flash session wrote `hello.py`, ran Python and returned `Hello from SuperHQ`; its first attempt was interrupted and the continued session completed. A ticketed native terminal WebSocket independently ran the file and returned the same output. The model picker opened, and the session UI had no document overflow at 390 px. The saved session, its file and the provider SDK seed survived the console's stop/start flow. The captured catalog image is the actual session, including its interrupted first attempt. Paid provider requests and provider subscription OAuth were not exercised.

This package is compatible with the proposed RFC 0027 base-build boundary: `build.sh` reads no setup inputs and creates no app authentication keys. The private backend password is generated only by `start.py`, after each install starts. OpenCode is currently deployed from connected source, so it does not exercise the forthcoming catalog base-install path.

The complete deployed sandbox was measured with a browser connected after 10 minutes idle, followed by four one-minute CPU samples (`vmstat 60 5`): memory 440 MB, CPU 0.50% of one CPU, disk 1,062 MB. The manifest rounds CPU up to 1%. File persistence was checked again by executing `hello.py` after the stop/start.
