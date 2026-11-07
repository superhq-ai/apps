# Orca

[Orca](https://github.com/stablyai/orca) runs Claude Code, Codex and other coding agents side by side, each in its own worktree, with a terminal and an editor next to them. This app runs it in a sandbox of your workspace and serves its web client on the URL of the app.

## After it deploys

1. Select **Open** on the app page. Orca pairs each browser with a link it makes when it starts; Open waits for that link and opens Orca with it.
2. Sign your agents in from Orca, or set an API key in Configuration.

Orca treats a pairing link like a password: each browser that pairs gets its own grant. To take one away, remove it in Orca under **Settings → Remote Orca Servers → Shared Server Access**.

Catalog revision 1.4.252 installs upstream Orca 1.4.250.

## Good to know

- Orca runs as the user `app`, and keeps its state in `/home/app/.config/orca`, so sessions survive updates and parks.
- The URL stays open to your workspace only. Orca is not meant to face the internet.
- The repository you pick is cloned once, into an empty project. To start over with another one, set it in Configuration and empty `/home/app/work` from the terminal of the sandbox.
