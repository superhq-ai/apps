# 0 catalog package

## Package and access

The package runs upstream 0 0.28.1 with its embedded web interface and FoxGuard 0.14.0. Both Linux ARM64 and AMD64 release binaries are pinned and verified against GitHub release asset SHA-256 digests. Debian dependencies are version-pinned. Upstream licenses and notices are included. No upstream UI or model output is synthesized.

The native server listens on loopback at port 48123. Caddy exposes PORT behind SuperHQ workspace authentication, validates the public browser Origin, and rewrites Host/Origin for the upstream loopback server. Native X-0-Control-Token authentication remains required for control APIs. Cross-site API requests and foreign Origins are rejected; ordinary top-level navigation from the console remains possible. Caddy's administration endpoint and configuration persistence are disabled.

All runtime processes run as app. Workspace members share authority over repositories, tools, saved state and provider connections. Optional setup keys use SuperHQ's host-restricted credential manager. Keys entered directly in 0 use upstream storage. The wrapper does not replace user configuration or provider credentials.

The default working directory is /home/app/work. Native state stays under /home/app and survives deployments and stop/start. Automatic updates, telemetry and optional 0verse auto-connection are disabled. Docker, Ghidra, SmolVM and browser toolchains are not provisioned. No public MCP endpoint is exposed. Parking interrupts running jobs; scheduled jobs cannot independently wake the sandbox.

## Verification on 2026-11-09

The Developer workspace app was deployed through the connected GitHub repository flow from commit `58d041d9b0716e7e6a84ce265d458f88aec02d19`. The hosted ARM64 build completed and reported 0 0.28.1 and FoxGuard 0.14.0. The terminal and app run as uid 1000 (app). The public app endpoint returns HTTP 401 without workspace authentication, and the authenticated native UI loads.

A Whitebox pentest workflow was saved from the upstream template without a target or execution. The workflow and a file in /home/app survived the console's stop/start flow. No model provider was connected: paid model requests, subscription OAuth, autonomous assessments and optional external toolchains were not exercised.

Local Debian trixie builds succeeded on ARM64 and on AMD64 under Docker emulation. Against both running packages, the integration suite verifies valid-token API access, missing/invalid-token rejection, foreign-Origin rejection, cross-site API rejection and successful top-level navigation with security headers. Both containers exited cleanly with status 0 on SIGTERM. A FoxGuard scan of a deliberately vulnerable local fixture reported the expected command-injection rule without executing the fixture. The native Connections page and OpenRouter key form also load; no credentials were submitted.

Run the checks with:

```sh
npm ci
npm run check
python3 scripts/test-zero.py
ZERO_TEST_URL=http://127.0.0.1:18080 ZERO_TEST_ORIGIN=https://localhost:18443 python3 scripts/test-zero.py
```

Without ZERO_TEST_URL, only the origin-validation unit tests run; the three runtime tests are explicitly skipped. The runtime URL must point to the packaged Caddy listener and ZERO_TEST_ORIGIN must match its APP_URL.

## Screenshot provenance

All four images were captured from the actual packaged ARM64 Debian runtime at 1440 × 900, then encoded as WebP. Each is below 512 KiB and has the required 16:10 aspect ratio:

1. Native new-chat screen.
2. Automation template library.
3. Saved, unexecuted Whitebox pentest template in the workflow editor.
4. Built-in skills library.

The workflow is a template, not evidence of a completed assessment. No findings, conversations or provider responses were invented. The production catalog component was checked using a browser-local API fixture: all four images load, the full-size dialog opens, and the gallery scrolls at a 390-pixel mobile viewport without document overflow. The fixture does not publish a catalog entry.

## Footprint

The complete hosted sandbox was measured from 03:09:17 to 03:23:17 UTC, after ten minutes with one native app tab open and idle, followed by four one-minute CPU intervals, using the commands in CONTRIBUTING.md. Results: memory 257 MB, CPU 2.50% of one CPU, disk 677 MB. The manifest rounds CPU up to 3%; memory and disk retain the measured integer values. The measurement terminal was disconnected after collecting the results.

Catalog publication follows the repository's maintainer review and merge process. The connected-repository workspace deployment is available independently of catalog publication.
