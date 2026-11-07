import base64
import json
import os
from pathlib import Path
import secrets
import signal
import subprocess
import sys
import time
from urllib.parse import urlsplit

PROVIDERS = {
    'opencode': 'OPENCODE_API_KEY',
    'openrouter': 'OPENROUTER_API_KEY',
    'openai': 'OPENAI_API_KEY',
    'anthropic': 'ANTHROPIC_API_KEY',
}


def runtime_config(env):
    config = {'autoupdate': False}
    providers = {
        name: {'options': {'apiKey': '{env:' + key + '}'}}
        for name, key in PROVIDERS.items() if env.get(key, '').strip()
    }
    if providers:
        config['provider'] = providers
    return config


def app_origin(address):
    url = urlsplit(address)
    if url.scheme != 'https' or not url.hostname or url.username or url.password:
        raise ValueError('APP_URL must be the app HTTPS address')
    return 'https://' + url.netloc.rstrip('/')


def main():
    if os.getuid() == 0:
        raise RuntimeError('OpenCode must run as the app user')
    directory = Path(__file__).resolve().parent
    home = Path.home()
    work = home / 'work'
    work.mkdir(exist_ok=True)
    origin = app_origin(os.environ.get('APP_URL', ''))
    repository = os.environ.get('OPENCODE_REPOSITORY', '').strip()
    if repository and not any(work.iterdir()):
        subprocess.run(['git', 'clone', '--', repository, str(work)], check=True,
                       env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'})
    password = secrets.token_urlsafe(32)
    authorization = 'Basic ' + base64.b64encode(('opencode:' + password).encode()).decode()
    env = {
        **os.environ,
        'OPENCODE_SERVER_USERNAME': 'opencode',
        'OPENCODE_SERVER_PASSWORD': password,
        'OPENCODE_CONFIG_CONTENT': json.dumps(runtime_config(os.environ)),
        'OPENCODE_DISABLE_AUTOUPDATE': '1',
        'OPENCODE_DISABLE_LSP_DOWNLOAD': '1',
    }
    adapted = subprocess.run(
        ['caddy', 'adapt', '--config', str(directory / 'Caddyfile'), '--adapter', 'caddyfile'],
        env={**os.environ, 'APP_URL': origin, 'OPENCODE_PROXY_AUTH': authorization},
        capture_output=True, text=True,
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
    code = 1
    try:
        children.append(subprocess.Popen(
            ['/opt/opencode/1.19.5/opencode', 'serve', '--hostname', '127.0.0.1', '--port', '18765'],
            cwd=work, env=env,
        ))
        proxy = subprocess.Popen(['caddy', 'run', '--config', '-'], stdin=subprocess.PIPE, text=True)
        children.append(proxy)
        proxy.stdin.write(json.dumps(config))
        proxy.stdin.close()
        while not stopping:
            if any(child.poll() is not None for child in children):
                break
            time.sleep(0.25)
        code = 0 if stopping else 1
    finally:
        stop()
        deadline = time.monotonic() + 4
        for child in children:
            try:
                child.wait(timeout=max(0.1, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()
    return code


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
