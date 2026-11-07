#!/bin/sh
# Serves the Orca web client on the URL of the app, as the app user. The
# first start clones ORCA_REPOSITORY into an empty project; later starts
# keep what is there. Orca prints its browser pairing link to the log.
set -e
work="$HOME/work"
mkdir -p "$work"
if [ -n "$ORCA_REPOSITORY" ] && [ -z "$(ls -A "$work")" ]; then
  git clone "$ORCA_REPOSITORY" "$work"
fi
exec orca-ide serve --port "$PORT" --project-root "$work" --pairing-address "wss://${APP_URL#https://}"
