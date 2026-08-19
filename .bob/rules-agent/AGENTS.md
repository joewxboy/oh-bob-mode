# AGENTS.md (Agent / Code Mode)

This file provides guidance to agents when working with code in this repository.

## MCP Server Coding Rules

- All JS in `.bob/mcp-servers/oh-exchange/` is ESM — always use `import`, never `require`
- `console.error` for any log output; `console.log` would corrupt the MCP stdio protocol
- The `ExchangeClient` class is a singleton (`const exchangeClient = new ExchangeClient()`) — never instantiate a second one
- `initialize()` is called lazily on first tool request, but also triggered explicitly when accessing the user endpoint; the guard `path !== /orgs/${orgId}/users/${username}` prevents infinite recursion
- Credentials are masked in errors via `errorMsg.replace(new RegExp(this.credentials, 'g'), '***')` — maintain this pattern in any new error paths
- Write tools must call `this.checkPermission('admin')` before making any mutating API call

## Skill File Rules

- Skill YAML frontmatter fields: `name` (slug, required), `description` (triggering text, required), `license`, `compatibility`, `metadata` (all optional)
- Skill body is pure markdown — no frontmatter blocks inside the body
- Keep SKILL.md under 500 lines; add `references/` subdirectory and link from SKILL.md if exceeding
- Place skills in `.bob/skills/<skill-name>/SKILL.md`

## OpenSpec Change Artifacts

- When implementing tasks from `tasks.md`, immediately toggle `- [ ]` → `- [x]` after each task — don't batch
- Never write `context` or `rules` sections from `openspec instructions` output into artifact files — they are agent constraints only
- `openspec status --change "<name>" --json` must be re-run after each artifact is written to get updated `applyRequires` state

## Mode Config

- `custom_modes.yaml` slug must match exactly how skills reference the mode (e.g., `oh-dev`)
- `mcp.json` `alwaysAllow` list only contains read-only tools — adding a write tool here bypasses approval prompts for all users
