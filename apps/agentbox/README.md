# Agentbox

[Agentbox](https://github.com/savannahfeder/agentbox) puts coding agents in an inbox. Each task gets a git worktree, with its conversation, changes and terminal in one browser interface.

## Getting started

1. Optionally enter a public Git repository to clone. You can also add repositories after deployment.
2. Deploy and choose **Open**. SuperHQ workspace sign-in protects the address.
3. Sign in to your coding-agent account using the app terminal as described below, reopen Agentbox, then choose a project folder on the server. The optional clone is at `/home/app/work`.

Claude Code and Codex are preinstalled. They use their own account sign-in. Agentbox deliberately removes model API keys from agent processes, so this package has no model-key input. Provider subscriptions and usage are separate from SuperHQ hosting. The first screen may still say Install; sign in through the sandbox terminal and reopen Agentbox.

## Signing in on a remote machine

Agentbox's built-in setup launches the tools' ordinary browser login, which can send the callback to localhost on your own computer. For this cloud installation, open the app's **Overview**, follow its **Sandbox** link and choose **Terminal** in SuperHQ:

- Codex: run `codex login --device-auth`, open the official link it prints and approve the device code. Device sign-in must be enabled for your ChatGPT account or workspace. See [OpenAI's authentication guide](https://learn.chatgpt.com/docs/auth#login-on-headless-devices).
- Claude Code: run `claude auth login --claudeai` and follow the CLI's browser instructions in that terminal. If it asks for a code, paste it into the CLI, not into SuperHQ configuration.

Reopen Agentbox after sign-in. No provider account has been signed in on your behalf. Private Git repositories also need their own Git authentication in the app sandbox; the setup clone accepts public repositories.

## Accounts and files

Workspace members who can open the app can use its agents, accounts, terminals and files. Use a separate workspace for people who should not share these.

Agentbox configuration is under `/home/app/.agentbox`; its native store is under `/home/app/.local/share/agentbox`. Repositories and worktrees under `/home/app`, plus the coding tools' account files, persist across app restarts. Keep project files outside the release directory.

Keep a browser tab open while agents work. When the sandbox parks, its processes stop. Saved conversations and files remain, but a running agent is not guaranteed to resume its work.
