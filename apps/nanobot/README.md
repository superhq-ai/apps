# nanobot

[nanobot](https://nanobot.wiki/) is a personal AI agent with a browser workbench, persistent conversations, memory, tools, skills and automations. This package runs nanobot 0.4.0 in a sandbox of your SuperHQ workspace.

## Getting started

1. Choose OpenRouter, OpenAI or Anthropic, and optionally enter a model ID. If you leave it blank, setup uses the default shown beside the field.
2. Add the key for that provider. You can skip it and configure a provider in nanobot before sending your first message.
3. Deploy, then choose **Open**. SuperHQ workspace sign-in protects the address. There is no pairing link or separate browser password.

Workspace members who can open the address can administer this agent, including its settings and tools. This is a shared agent instance, not separate private accounts for each member.

## Models and credentials

Keys entered in SuperHQ setup or **Settings → Configuration** use the sandbox's credential manager. nanobot receives a placeholder; SuperHQ substitutes the real value only on outgoing requests to the named provider host. Changing or removing a key restarts the app.

The provider and model ID in SuperHQ Configuration are applied when the app starts. Set them there if you want a change to survive a restart. nanobot's own model settings can configure other providers too; credentials entered directly in nanobot follow nanobot's storage rules, rather than SuperHQ's host-restricted credential handling.

Model usage is charged by your provider separately from SuperHQ's machine usage.

## State and background work

nanobot runs as the normal `app` user. Its config, sessions, memory, uploaded files, automations and workspace live under `/home/app/.nanobot`, outside the release directory. They survive app restarts, updates and sandbox parking.

Keep a browser tab open while a task, scheduled automation or connected chat app needs to run. When the sandbox parks, its processes stop. Opening the address wakes the app, but missed schedules are not promised to replay and interrupted tasks are not promised to resume. This catalog package does not promise unattended 24/7 execution.

The bundled WebUI works immediately. Some optional chat channels, tools and local model runtimes need additional dependencies or credentials; they are not all preinstalled by this package.

## How access works

The browser-facing Caddy process is behind SuperHQ's workspace access check. It forwards HTTP and WebSocket traffic to nanobot's loopback-only listener and overwrites the authentication assertion header. nanobot uses its native trusted-proxy support and accepts that assertion only from a direct loopback peer. Its health endpoint also stays on loopback. The catalog keeps the app address private to your workspace.

The scripts and complete dependency lock are available before deploying. Python wheels include the WebUI, and every Python dependency is pinned and checked by SHA-256. Nothing is downloaded by the package's start commands.
