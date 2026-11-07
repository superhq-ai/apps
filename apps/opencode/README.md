# OpenCode

[OpenCode](https://opencode.ai) is a coding agent with a browser interface. Work on projects, review changes and use the terminal from your own computer in the cloud.

## Getting started

1. Optionally add an OpenCode, OpenRouter, OpenAI or Anthropic API key. Keys entered in SuperHQ use the sandbox credential manager and are sent only to the named provider host.
2. Optionally enter a public Git repository to clone.
3. Deploy and choose **Open**. Choose a project folder and select a model in OpenCode. The optional clone is at `/home/app/work`.

You can also connect providers through OpenCode's own interface. Credentials entered there are managed by OpenCode and saved in its app sandbox. Provider usage is billed separately from hosting. Private Git repositories need their own Git authentication in the sandbox. For subscription sign-in, choose a headless or device option when the provider offers one. A localhost callback points to the cloud sandbox.

The address is private to the SuperHQ workspace. Members who can open it can use its projects, terminal and connected accounts.

## Files and tools

Projects under `/home/app/work`, OpenCode's configuration under `/home/app/.config/opencode`, and its sessions and credentials under `/home/app/.local/share/opencode` persist across restarts. Keep project files outside the release directory.

Git, Node.js, npm, Python and ripgrep are preinstalled. Automatic OpenCode updates and language-server downloads are disabled; update through the catalog, and install any extra project tools you need in the sandbox. User-configured plugins and project dependencies remain your choice.

Keep a browser tab open while agents work. Parking stops processes; saved files and sessions remain, but an in-progress task is not guaranteed to resume.
