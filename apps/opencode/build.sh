#!/bin/sh
set -eu
VERSION=1.19.5
NODE=24.22.1
case "$(dpkg --print-architecture)" in
  arm64) ARCH=arm64; ASSET=arm64; SUM=fae5be262d693b7c5e562856cc473e59e741772936db0c0600ac0d5ed5bd088b; NODE_SUM=dbabf7a1cbf947e6059ffad2c27b80041db97dea1e553b62afdee7f13fca336e ;;
  amd64) ARCH=x64; ASSET=x64-baseline; SUM=17c200fd4b2289954cc01552559f9b6d03ec157b2ddfb5eb54144f491656333d; NODE_SUM=6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6 ;;
  *) echo 'OpenCode supports Linux ARM64 and AMD64' >&2; exit 1 ;;
esac
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q --no-install-recommends caddy=2.6.2-12+deb13u1 git=1:2.47.3-0+deb13u1 python3=3.13.5-1 ripgrep=14.1.1-1+b4
# Check actual Caddy parsing: a Basic value must set one complete header.
PORT=8080 APP_URL=https://build.example OPENCODE_PROXY_AUTH='Basic build-check' python3 - <<'CHECK'
import json, subprocess
config = json.loads(subprocess.check_output(['caddy', 'adapt', '--config', 'Caddyfile', '--adapter', 'caddyfile'], stderr=subprocess.DEVNULL))
def nodes(value):
    if isinstance(value, dict):
        yield value
        for child in value.values(): yield from nodes(child)
    elif isinstance(value, list):
        for child in value: yield from nodes(child)
headers = [n.get('headers', {}).get('request', {}) for n in nodes(config) if n.get('handler') == 'reverse_proxy']
assert any(h.get('set', {}).get('Authorization') == ['Basic build-check'] for h in headers), 'The proxy must overwrite Authorization with one complete Basic value'
CHECK
mkdir -p "/opt/opencode/$VERSION" "/opt/opencode/node-$NODE"
curl -fsSLo /tmp/opencode.tar.gz "https://github.com/anomalyco/opencode/releases/download/v$VERSION/opencode-linux-$ASSET.tar.gz"
echo "$SUM  /tmp/opencode.tar.gz" | sha256sum -c -
tar -xzf /tmp/opencode.tar.gz -C "/opt/opencode/$VERSION"
rm /tmp/opencode.tar.gz
curl -fsSLo /tmp/opencode-node.tar.xz "https://nodejs.org/dist/v$NODE/node-v$NODE-linux-$ARCH.tar.xz"
echo "$NODE_SUM  /tmp/opencode-node.tar.xz" | sha256sum -c -
tar -xJf /tmp/opencode-node.tar.xz --strip-components=1 -C "/opt/opencode/node-$NODE"
rm /tmp/opencode-node.tar.xz
for name in node npm npx; do ln -sf "/opt/opencode/node-$NODE/bin/$name" "/usr/local/bin/$name"; done
ln -sf "/opt/opencode/$VERSION/opencode" /usr/local/bin/opencode
mkdir -p "/opt/opencode/$VERSION/plugin-seed"
cp package.json package-lock.json "/opt/opencode/$VERSION/plugin-seed/"
npm ci --prefix "/opt/opencode/$VERSION/plugin-seed" --ignore-scripts --no-audit --no-fund
# Seed the native SDK as app, so initial startup needs no package installation.
runuser -u app -- env HOME=/home/app sh -c '
  mkdir -p "$HOME/.config/opencode"
  if [ ! -e "$HOME/.config/opencode/package.json" ]; then
    cp -R /opt/opencode/1.19.5/plugin-seed/. "$HOME/.config/opencode/"
  fi
'
opencode --version
node --version
rg --version | head -1
