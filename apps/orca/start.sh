#!/bin/sh
# Serves the Orca web client on the URL of the app. The first start clones
# ORCA_REPOSITORY into an empty project; later starts keep what is there.
set -e
export HOME=/root
mkdir -p /root/work
if [ -n "$ORCA_REPOSITORY" ] && [ -z "$(ls -A /root/work)" ]; then
  git clone "$ORCA_REPOSITORY" /root/work
fi
exec orca-ide serve --port "$PORT" --project-root /root/work --pairing-address "wss://${APP_URL#https://}"
