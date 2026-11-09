# Adding an app

An app is a directory under `apps/`, named by its slug: lowercase letters, digits and dashes, 2 to 32 characters. Copy `apps/orca` and change it.

```
apps/<slug>/
  app.json            what it is and what it asks for
  Procfile            what runs: a web process, and others if it needs them
  build.sh            optional: installs it, once per version
  start.sh            optional: whatever the Procfile calls
  icon.svg            square, SVG or PNG, at most 64 KiB
  screenshots/1.webp  up to 4, PNG or WebP, 16:10, at least 1280 wide, at most 512 KiB each
  README.md           shown on its page in the catalog
```

At most 32 files, and text files at most 256 KiB in all.

`app.json` is data. [schema/app.schema.json](schema/app.schema.json) says every key, and the console checks the same rules and a few more: the files exist and are within their sizes, the icon and screenshots are the images they say, the version is higher than the one before, every input is in one step, and the Procfile parses and has `web`. Run the check before you open a pull request:

```
npm ci
npm run check
```

## How it runs

New apps get a sandbox of 4 CPUs and 8 GB, with a 20 GB disk and Debian trixie. Existing sandboxes retain their creation-time CPU count. Fetch and build run as root. Procfile processes and the app terminal run as the normal `app` user, without sudo.

- `sh build.sh` runs as root when a version is deployed, in a new release directory holding your files.
- The Procfile then runs as `app`, with `web` serving on `$PORT`. Its URL is in `$APP_URL`, and `$HOME` is `/home/app`.
- The inputs of `app.json` are in the env of both. A secret is a placeholder in the env; the network puts the real value in requests to its `hosts` only.
- A sandbox parks when nothing uses it, and wakes on the next request. Keep state you care about outside the release directory, such as in `/home/app`.

## Scripts install the app, they do not contain it

- Pin every download to a version, and check it against its SHA-256 in the script, for each architecture the app supports (arm64 and amd64). Take the sum from the release when it publishes one.
- Pin packages from the Debian archive by version: `apt-get install -y name=version`.
- Never pipe a download into a shell.
- Nothing runs at start that was not installed at build.

## Measuring footprint

`footprint` is what the app holds open and idle, and the catalog shows its cost from it. Measure it on a sandbox of your own, deployed from your branch:

1. Deploy it, open its URL, and leave one tab open and idle for 10 minutes.
2. In the terminal of its sandbox:

   ```
   free -m | awk '/^Mem:/ { print "memory_mb", $3 }'
   vmstat 60 5 | tail -n 4 | awk -v cpus="$(getconf _NPROCESSORS_ONLN)" '{ idle += $15 } END { printf "cpu_percent %.2f\n", (100 - idle / 4) * cpus }'
   df -m / | awk 'NR == 2 { print "disk_mb", $3 }'
   ```

   `cpu_percent` is of one CPU, so the line above multiplies the average busy share by the sandbox's actual CPU count. Round each up. Use the observed count for older sandboxes too; do not assume the current default.
3. Put them in `app.json`, and say in the pull request how you measured.

## Review

A pull request is merged when:

- every download is pinned and checked;
- the upstream project is real, public, and licensed for this use;
- nothing runs at start that was not installed at build;
- a change to `build.sh`, the Procfile or a script they call is read as code; a pull request touching one is labelled `runs code`;
- every secret goes only to the hosts its app needs it for;
- the app runs: show it deployed on SuperHQ, and CI has passed;
- a new version changes `version` and says what changed in `changes`.

The maintainers of an app in [CODEOWNERS](.github/CODEOWNERS) review changes to it, and a SuperHQ maintainer approves every merge. Once merged to `main`, the catalog syncs within a minute. A merge never deploys anything: people update their apps from the console when they choose.
