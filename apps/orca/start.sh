#!/bin/sh
# Serves the Orca web client on the URL of the app, as the app user. The
# first start clones ORCA_REPOSITORY into an empty project; later starts
# keep what is there. Orca prints its browser pairing link once it is
# ready; it goes to /run/superhq/open, where Open in SuperHQ reads it.
set -e
work="$HOME/work"
mkdir -p "$work"
if [ -n "$ORCA_REPOSITORY" ] && [ -z "$(ls -A "$work")" ]; then
  git clone "$ORCA_REPOSITORY" "$work"
fi
rm -f /run/superhq/open
orca-ide serve --json --port "$PORT" --project-root "$work" --pairing-address "wss://${APP_URL#https://}" |
  while IFS= read -r line; do
    printf '%s\n' "$line"
    link=$(printf '%s' "$line" | jq -rR 'fromjson? | select(.type? == "orca_server_ready") | .pairing.webClientUrl // empty')
    if [ -n "$link" ]; then
      printf '%s' "$link" > /run/superhq/open.new
      mv /run/superhq/open.new /run/superhq/open
    fi
  done
