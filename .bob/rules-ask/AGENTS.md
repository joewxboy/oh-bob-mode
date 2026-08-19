# AGENTS.md (Ask Mode)

This file provides guidance to agents when working with code in this repository.

## Project Context (Non-Obvious)

- This repo **is** a Bob Shell mode, not a project that uses Bob — `custom_modes.yaml` and `.bob/` are the product itself
- The archived change at `openspec/changes/archive/2026-08-14-oh-bob-mode/` contains the original design — read `design.md` and `proposal.md` for architectural rationale
- Skills in `.bob/skills/` replaced the originally designed rule files in `.bob/rules-oh-dev/` — the design.md references `01-agent-install.md` etc. but those don't exist; skills are the authoritative implementation
- Slash commands in `.bob/commands/` and skills in `.bob/skills/` duplicate the same logic — commands use `/opsx-*` prefix, skills use `openspec-*` prefix; they are interchangeable
- The OpenSpec change is **fully complete and archived** — there are no active in-progress tasks

## Documentation Layout

- Full setup/usage docs: `.bob/README.md` (the primary reference for mode users)
- Architecture decisions: `openspec/changes/archive/2026-08-14-oh-bob-mode/design.md`
- Implementation history: `openspec/changes/archive/2026-08-14-oh-bob-mode/tasks.md` (all tasks checked)
- MCP server API reference: Exchange API is at `HZN_EXCHANGE_URL/v1/orgs/{org}/...`

## Exchange API Patterns

- All endpoints are org-scoped: `/orgs/{orgId}/nodes`, `/orgs/{orgId}/services`, etc.
- Service IDs in the Exchange use format: `URL_version_arch` (e.g., `my-service_1.0.0_amd64`)
- Deployment policies live at `/orgs/{orgId}/business/policies/{policyId}`
- User lookup endpoint used for auth validation: `/orgs/{orgId}/users/{username}`
