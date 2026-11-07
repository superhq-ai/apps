"""Apply catalog-owned bindings, retain user state, then run the native gateway."""
import json
import os
from pathlib import Path
import tempfile
from urllib.parse import urlsplit


def configure(home: Path, environ: dict[str, str]) -> Path:
    directory = home / ".nanobot"
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    path = directory / "config.json"
    config = json.loads(path.read_text()) if path.exists() else {}
    app_url = urlsplit(environ["APP_URL"])
    if app_url.scheme != "https" or not app_url.hostname or app_url.username or app_url.query or app_url.fragment:
        raise ValueError("APP_URL must be the app's HTTPS address")
    provider = environ.get("NANOBOT_PROVIDER", "openrouter")
    models = {
        "openrouter": "openai/gpt-5-mini",
        "openai": "gpt-5-mini",
        "anthropic": "claude-sonnet-4-5",
    }
    if provider not in models:
        raise ValueError("Choose OpenRouter, OpenAI or Anthropic in Configuration")
    defaults = config.setdefault("agents", {}).setdefault("defaults", {})
    defaults.update(provider=provider, model=environ.get("NANOBOT_MODEL") or models[provider])
    defaults.setdefault("workspace", str(directory / "workspace"))
    for name in models:
        key = name.upper() + "_API_KEY"
        settings = config.setdefault("providers", {}).setdefault(name, {})
        if environ.get(key):
            settings["apiKey"] = "${" + key + "}"
        elif settings.get("apiKey") == "${" + key + "}":
            # Removing a catalog credential must not leave an unresolved reference.
            settings["apiKey"] = ""
    config.setdefault("gateway", {}).update(host="127.0.0.1", port=18790)
    config.setdefault("channels", {}).setdefault("websocket", {}).update(
        enabled=True, host="127.0.0.1", port=18765,
        publicWsUrl="wss://" + app_url.netloc + "/",
        websocketRequiresToken=True,
        token="", tokenIssueSecret="", tokenIssuePath="",
        trustedProxyAuth={
            "trustedPeerCidrs": ["127.0.0.1/32"],
            "assertionHeader": "X-SuperHQ-Workspace-Auth",
        },
    )
    tools = config.setdefault("tools", {})
    tools.setdefault("restrictToWorkspace", True)
    tools.setdefault("webuiAllowRemotePackageInstall", False)
    # Write atomically with private permissions. Existing sessions, skills, channel
    # setup and unrelated model settings remain in the same persistent directory.
    fd, temporary = tempfile.mkstemp(dir=directory, prefix=".config-")
    try:
        with os.fdopen(fd, "w") as handle:
            json.dump(config, handle, indent=2)
            handle.write("\n")
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)
    return path


if __name__ == "__main__":
    os.umask(0o077)
    if os.getuid() == 0:
        raise SystemExit("nanobot must run as the app user")
    path = configure(Path.home(), dict(os.environ))
    os.execv("/opt/nanobot/0.4.0/bin/nanobot", ["nanobot", "gateway", "--config", str(path)])
