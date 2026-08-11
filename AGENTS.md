# Project instructions

## GitHub publishing on this machine

- The repository is `sunshine7933/Meltdown-room` and the connected GitHub app has push/admin access.
- GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe`, but it may not be on the user's PowerShell `PATH` and its saved token may be unavailable or invalid inside Codex.
- Git is already available inside the Codex runtime. Do not send the user through Git or GitHub CLI installation/login unless connector-based publishing is genuinely unavailable.
- Prefer the connected GitHub app for repository reads, branch creation, file commits, and pull-request creation when local CLI authentication is not usable.
- Before publishing, verify the exact changed files and preserve the approved Entrance and Great Room unless the user explicitly asks to redesign them.

## Current Rant Room work

- The locked Rant Room implementation is on branch `agent/locked-rant-room`.
- Draft pull request: `https://github.com/sunshine7933/Meltdown-room/pull/1`.
- The implementation intentionally changes `index.html` while preserving the existing Entrance and Great Room structure.

