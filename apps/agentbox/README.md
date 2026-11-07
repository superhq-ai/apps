# Agentbox

[Agentbox](https://github.com/savannahfeder/agentbox) puts coding agents in an inbox. Each task gets a git worktree, with its conversation, changes and terminal in one browser interface.

## Getting started

1. Optionally enter a public Git repository to clone. You can also add repositories after deployment.
2. Deploy and choose **Open**. SuperHQ workspace sign-in protects the address.
3. Connect your coding-agent account, then choose a project folder on the server. The optional clone is at `/home/app/work`.

Claude Code and Codex are preinstalled. They use their own account sign-in. Agentbox deliberately removes model API keys from agent processes, so this package has no model-key input. Provider subscriptions and usage are separate from SuperHQ hosting.

## Accounts and files

Workspace members who can open the app can use its agents, accounts, terminals and files. Use a separate workspace for people who should not share these.

Agentbox state is under `/home/app/.agentbox`. Repositories and worktrees under `/home/app`, plus the coding tools' account files, persist across app restarts. Keep project files outside the release directory.

Keep a browser tab open while agents work. When the sandbox parks, its processes stop. Saved conversations and files remain, but a running agent is not guaranteed to resume its work.
