# 0

[0](https://github.com/0sec-labs/0) is an open-source AI security workspace. Review source code, investigate findings, prepare security workflows and work on fixes through its native browser interface. Its CLI and MCP server are also installed in the sandbox.

## Getting started

1. Optionally add an OpenRouter, OpenAI or Anthropic API key during setup. These keys use SuperHQ's credential manager and are sent only to their named provider hosts.
2. Deploy and choose **Open**. Connect a provider and select a model in 0 if you skipped the setup keys.
3. Put a repository in `/home/app/work` using the sandbox terminal, then select it in 0. Assess only repositories and systems you own or are authorized to test.

Keys entered directly in 0 follow its own storage and provider settings. Provider usage is billed separately from hosting. Subscription sign-in that redirects to localhost may need a tunnel or a supported device flow: localhost refers to the cloud sandbox, not your laptop.

The URL is private to your SuperHQ workspace. Members who can open it share access to the app's projects, tools and connected providers. All processes run as the sandbox's `app` user.

## State and execution

Keep repositories in `/home/app/work`. The home directory, including 0's `.0` state, survives restarts and catalog updates. The release directory is replaced during updates.

The package includes 0 0.28.1, FoxGuard 0.14.0 for source analysis, Git, Python and ripgrep. Automatic 0 updates and telemetry are disabled. Model credentials are optional for browsing the interface; AI workflows need a configured provider.

Docker, SmolVM, Ghidra/Java and browser automation runtimes are not preinstalled. Features that need those tools require separate provisioning; an unavailable tool is not evidence that a target has no vulnerabilities. The optional 0verse MCP auto-connection is disabled in this package. Local execution takes place inside the SuperHQ sandbox.

Keep a browser tab open while a task runs. Parking stops processes; saved files, findings and sessions remain, but an interrupted job is not guaranteed to resume. Scheduled jobs cannot wake a parked sandbox themselves.

## Screenshots

The gallery shows the packaged web interface. Capture provenance and verification are recorded in `docs/zero-catalog.md` in the catalog repository.
