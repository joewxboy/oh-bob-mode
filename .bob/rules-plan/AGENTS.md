# AGENTS.md (Plan Mode)

This file provides guidance to agents when working with code in this repository.

## Architectural Constraints

- The `oh-dev` Bob mode slug is fixed — changing it breaks mode activation in Bob Shell
- MCP server communicates via stdio — it cannot be refactored to HTTP without updating `mcp.json` transport type
- `ExchangeClient.initialize()` performs a live API call at startup — if `HZN_*` env vars are wrong, the entire MCP server fails to start (no graceful degradation)
- The OpenSpec change is **fully complete and archived** — all tasks in sections 1–9 are checked

## Design Decisions (from `design.md`)

- Direct REST API (not CLI subprocess) was chosen for the MCP server to avoid brittle output parsing — see Decision #3 in `openspec/changes/archive/2026-08-14-oh-bob-mode/design.md` for full rationale
- Rule files were planned as 5 numbered markdown files in `.bob/rules-oh-dev/` but were implemented as skills in `.bob/skills/` instead — any new domain rules should go into new skill files
- `alwaysAllow` was intentionally kept read-only (list/get operations only) — write operations require explicit approval; this was a security decision
- A `rules-oh-dev/` directory does not currently exist; skills cover on-demand guidance but a rules file would cover always-on mode-level constraints

## OpenSpec Schema

- This project uses the `spec-driven` OpenSpec schema (see `openspec/changes/archive/2026-08-14-oh-bob-mode/.openspec.yaml`)
- `openspec/specs/` contains the five synced domain specs (agent-install, debugging-workflows, deployment-management, hub-administration, service-lifecycle)
- All changes are archived to `openspec/changes/archive/` — no active changes

## Extension Points

- Add new Open Horizon domain coverage by creating new skill files in `.bob/skills/<name>/SKILL.md`
- Add new Exchange API tools by extending the `switch` block in `.bob/mcp-servers/oh-exchange/index.js` and registering the tool in `ListToolsRequestSchema` handler
- Add always-on mode constraints by creating `.bob/rules-oh-dev/AGENTS.md`
