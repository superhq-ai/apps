#!/bin/sh
set -eu
NODE=24.22.1
case "$(dpkg --print-architecture)" in
  arm64) ARCH=arm64; SUM=dbabf7a1cbf947e6059ffad2c27b80041db97dea1e553b62afdee7f13fca336e ;;
  amd64) ARCH=x64; SUM=6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6 ;;
  *) echo 'Agentbox supports Linux ARM64 and AMD64' >&2; exit 1 ;;
esac
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q --no-install-recommends caddy=2.6.2-12+deb13u1 git=1:2.47.3-0+deb13u1 build-essential=12.12 python3=3.13.5-1
curl -fsSLo /tmp/agentbox-node.tar.xz "https://nodejs.org/dist/v$NODE/node-v$NODE-linux-$ARCH.tar.xz"
echo "$SUM  /tmp/agentbox-node.tar.xz" | sha256sum -c -
mkdir -p "/opt/agentbox/node-$NODE" /opt/agentbox/0.1.19
# node-pty compiles against this pinned Node runtime during installation.
tar -xJf /tmp/agentbox-node.tar.xz --strip-components=1 -C "/opt/agentbox/node-$NODE"
rm /tmp/agentbox-node.tar.xz
export PATH="/opt/agentbox/node-$NODE/bin:$PATH"
export ELECTRON_SKIP_BINARY_DOWNLOAD=1
cp package.json package-lock.json /opt/agentbox/0.1.19/
npm ci --prefix /opt/agentbox/0.1.19 --omit=dev --no-audit --no-fund
# Install stable executable paths that the agent finders and login shells see.
for name in node npm npx; do ln -sf "/opt/agentbox/node-$NODE/bin/$name" "/usr/local/bin/$name"; done
for name in claude codex; do ln -sf "/opt/agentbox/0.1.19/node_modules/.bin/$name" "/usr/local/bin/$name"; done
node --input-type=module -e 'import {createRequire} from "node:module"; const r=createRequire("/opt/agentbox/0.1.19/package.json"); r("node-pty");'
test -f /opt/agentbox/0.1.19/node_modules/agentbox-app/renderer/dist/index.html
claude --version
codex --version
