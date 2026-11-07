# SuperHQ apps

The catalog of apps you deploy into a sandbox of your SuperHQ workspace in a few clicks. Browse it at [app.superhq.ai/catalog](https://app.superhq.ai/catalog).

Each directory under [apps](apps) is one app: an `app.json` saying what it is and what it asks for at setup, and the scripts that install and run it. Read them before you deploy: build scripts run as root, and app processes run as the normal `app` user in your sandbox.

To add an app or a new version, read [CONTRIBUTING.md](CONTRIBUTING.md).
