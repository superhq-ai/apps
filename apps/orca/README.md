# Orca

[Orca](https://github.com/stablyai/orca) runs Claude Code, Codex and other coding agents side by side, each in its own worktree, with a terminal and an editor next to them. This app runs it in a sandbox of your workspace and serves its web client on the URL of the app.

## After it deploys

1. Open the **Logs** of the app and copy the browser link from the `web` log.
2. Open it. The link pairs your browser with Orca, so keep it to yourself.
3. Sign your agents in from Orca, or set an API key in Configuration.

## Good to know

- Orca keeps its state in `/root/.config/orca`, so sessions survive updates and parks.
- The URL stays open to your workspace only. Orca is not meant to face the internet.
- The repository you pick is cloned once, into an empty project. To start over with another one, set it in Configuration and empty `/root/work` from the terminal of the sandbox.
