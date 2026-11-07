#!/bin/sh
# PyPI artifacts and every transitive dependency are pinned and SHA-256 checked
# by requirements.txt. Wheels bundle the WebUI; no frontend build runs at boot.
set -eu
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q --no-install-recommends python3-venv=3.13.5-1 caddy=2.6.2-12+deb13u1 libmagic1t64=1:5.46-5 git=1:2.47.3-0+deb13u1
python3 -m venv /opt/nanobot/0.4.0
/opt/nanobot/0.4.0/bin/pip install --no-cache-dir --require-hashes --only-binary=:all: -r requirements.txt
/opt/nanobot/0.4.0/bin/python -c 'import nanobot, pathlib; assert (pathlib.Path(nanobot.__file__).parent / "web/dist/index.html").is_file(), "nanobot wheel is missing its WebUI"'
# Native channel setup can install its declared optional dependencies as app.
chown -R app:app /opt/nanobot/0.4.0
