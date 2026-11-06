#!/bin/sh
# Installs Orca from its release, checked against the SHA-256 GitHub
# publishes for each file, and what it needs from Debian trixie.
set -e
VERSION=1.4.250
ARCH="$(dpkg --print-architecture)"
case "$ARCH" in
  arm64) SUM=811fbf45373a54dc255dc6efbb20ba66b2bf37ff23ff55679a4b0fded2442559 ;;
  amd64) SUM=ca2322046c2a42cec59c0a57382b2b782f784ed64861deac0154b38e1577810e ;;
  *) echo "no Orca build for $ARCH" >&2; exit 1 ;;
esac
curl -fsSLo /tmp/orca.deb "https://github.com/stablyai/orca/releases/download/v$VERSION/orca-ide_${VERSION}_$ARCH.deb"
echo "$SUM  /tmp/orca.deb" | sha256sum -c -
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q /tmp/orca.deb xvfb=2:21.1.16-1.3+deb13u3 git=1:2.47.3-0+deb13u1
rm -f /tmp/orca.deb
