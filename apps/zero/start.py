import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
from urllib.parse import urlsplit


def app_origin(address):
    url = urlsplit(address)
    if (url.scheme != 'https' or not url.hostname or url.username or url.password
            or url.path not in ('', '/') or url.query or url.fragment):
        raise ValueError('APP_URL must be the app HTTPS origin')
    return 'https://' + url.netloc


def main():
    if os.getuid() == 0:
        raise RuntimeError('0 must run as the app user')
    directory = Path(__file__).resolve().parent
    work = Path.home() / 'work'
    work.mkdir(exist_ok=True)
    origin = app_origin(os.environ.get('APP_URL', ''))
    port = int(os.environ.get('PORT', '8080'))
    if not 1024 <= port <= 65535 or port == 48123:
        raise ValueError('PORT must be an unprivileged port other than 48123')
    env = {
        **os.environ,
        'APP_URL': origin,
        'PORT': str(port),
        'ZERO_NO_UPDATE_CHECK': '1',
        'ZERO_NO_TELEMETRY': '1',
        # Optional binary analysis needs a separately provisioned toolchain.
        'ZERO_0VERSE_MCP': '0',
    }
    adapted = subprocess.run(
        ['caddy', 'adapt', '--config', str(directory / 'Caddyfile'), '--adapter', 'caddyfile'],
        env=env, capture_output=True, text=True,
    )
    if adapted.returncode:
        raise RuntimeError('The browser proxy configuration could not be loaded')
    config = json.loads(adapted.stdout)
    config['admin'] = {'disabled': True, 'config': {'persist': False}}
    children = []
    stopping = False

    def stop(*_):
        nonlocal stopping
        stopping = True
        for child in children:
            if child.poll() is None:
                child.terminate()

    for name in (signal.SIGTERM, signal.SIGINT):
        signal.signal(name, stop)
    try:
        children.append(subprocess.Popen(
            ['/opt/zero/0.28.1/0', 'web', '--host', '127.0.0.1',
             '--port', '48123', '--no-open'], cwd=work, env=env,
        ))
        proxy = subprocess.Popen(['caddy', 'run', '--config', '-'], stdin=subprocess.PIPE, text=True, env=env)
        children.append(proxy)
        proxy.stdin.write(json.dumps(config))
        proxy.stdin.close()
        while not stopping and all(child.poll() is None for child in children):
            time.sleep(0.25)
        return 0 if stopping else 1
    finally:
        stop()
        deadline = time.monotonic() + 4
        for child in children:
            try:
                child.wait(timeout=max(0.1, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
