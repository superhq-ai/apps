# Orca

[Orca](https://github.com/stablyai/orca) runs Claude Code, Codex and other coding agents side by side, each in its own worktree, with a terminal and an editor next to them. This app runs it in a sandbox of your workspace and serves its web client on the URL of the app.

## After it deploys

1. Pair your browser once. Open the **Logs** tab of the app, read the logs, and click the `Web client URL` link in the browser you will use Orca from. It opens Orca in a new tab, and Orca saves the pairing in that browser.
2. From then on, **Open** and the plain URL of the app connect in that browser. Repeat step 1 for each other browser.
3. Sign your agents in from Orca, or set an API key in Configuration.

If Orca says it cannot reach your Orca host, the browser holds a pairing Orca no longer knows, for example after its state was reset. Click the newest `Web client URL` in Logs to pair again.

If Orca shows **Connect to Orca**, paste the `Pairing URL` line from Logs, starting at `orca://`, into its box and select **Connect**.

Orca treats a pairing link like a password: each browser that pairs gets its own grant. To take one away, remove it in Orca under **Settings → Remote Orca Servers → Shared Server Access**.

Catalog revision 1.4.254 installs upstream Orca 1.4.250.

## Good to know

- Orca runs as the user `app`, and keeps its state in `/home/app/.config/orca`, so sessions survive updates and parks.
- The URL stays open to your workspace only. Orca is not meant to face the internet.
- The repository you pick is cloned once, into an empty project. To start over with another one, set it in Configuration and empty `/home/app/work` from the terminal of the sandbox.
