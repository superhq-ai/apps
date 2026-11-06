# Orca

[Orca](https://github.com/stablyai/orca) runs Claude Code, Codex and other coding agents side by side, each in its own worktree, with a terminal and an editor next to them. This app runs it in a sandbox of your workspace and serves its web client on the URL of the app.

## After it deploys

1. Open the app page in SuperHQ and select **Connect to Orca**. SuperHQ securely opens the browser pairing link for your workspace.
2. Sign your agents in from Orca, or optionally set an API key in Configuration. An API key is not required to deploy.
3. For diagnostics, open the app's **Logs** tab and select **Read logs**. Select **Follow** for live updates and **Pause** to stop. Runtime logs may contain private app output; pairing links are hidden.

Connecting or reading logs may wake the sandbox. Following logs keeps it awake while the tab is visible. If Orca is stopped, start it from its app page first.

Catalog revision 1.4.251 still installs upstream Orca 1.4.250. This revision corrects the setup instructions; it does not change the runtime or its pinned downloads.

## Good to know

- Orca keeps its state in `/root/.config/orca`, so sessions survive updates and parks.
- The URL stays open to your workspace only. Orca is not meant to face the internet.
- The repository you pick is cloned once, into an empty project. To start over with another one, set it in Configuration and empty `/root/work` from the terminal of the sandbox.
