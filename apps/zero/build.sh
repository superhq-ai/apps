#!/bin/sh
set -eu
VERSION=0.28.1
FOXGUARD=0.14.0
case "$(dpkg --print-architecture)" in
  arm64)
    ARCH=arm64
    SUM=cbfb8d5f5c488f141326d5fc060bd692be939f97499f230272a0c4eb7dfdecca
    FG_ARCH=aarch64
    FG_SUM=7d5c7263d71089eb06113a634aa3394ab8b54782b16e67a349693fedbb598120
    ;;
  amd64)
    ARCH=x64
    SUM=a7502f6d77b16bb7cec43c501b7c34b008efecf7ad364b0e1e1fc5daeec8f947
    FG_ARCH=x86_64
    FG_SUM=ef56a4d5cfc4cc4462e435bf31ca0f90694f47df1384772361a67828427db3d9
    ;;
  *) echo '0 supports Linux ARM64 and AMD64' >&2; exit 1 ;;
esac
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q --no-install-recommends caddy=2.6.2-12+deb13u1 git=1:2.47.3-0+deb13u1 python3=3.13.5-1 ripgrep=14.1.1-1+b4
mkdir -p "/opt/zero/$VERSION" "/opt/zero/foxguard-$FOXGUARD"
curl -fsSLo /tmp/zero-download "https://github.com/0sec-labs/0/releases/download/v$VERSION/0-linux-$ARCH"
echo "$SUM  /tmp/zero-download" | sha256sum -c -
install -m 755 /tmp/zero-download "/opt/zero/$VERSION/0"
rm /tmp/zero-download
curl -fsSLo /tmp/zero-foxguard "https://github.com/0sec-labs/foxguard/releases/download/v$FOXGUARD/foxguard-linux-$FG_ARCH"
echo "$FG_SUM  /tmp/zero-foxguard" | sha256sum -c -
install -m 755 /tmp/zero-foxguard "/opt/zero/foxguard-$FOXGUARD/foxguard"
rm /tmp/zero-foxguard
ln -sf "/opt/zero/$VERSION/0" /usr/local/bin/0
ln -sf "/opt/zero/foxguard-$FOXGUARD/foxguard" /usr/local/bin/foxguard
/usr/local/bin/0 --version
foxguard --version
