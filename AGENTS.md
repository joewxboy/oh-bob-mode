# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

This is a **Bob Shell custom mode** workspace for Open Horizon edge computing. It has no traditional build/test pipeline — all "code" is configuration (YAML, JSON) and markdown-based skill/rule files consumed by Bob Shell (an AI coding assistant).

## Directory Structure

```
LICENSE.md                     # Apache License 2.0
MAINTAINERS.md                 # Active maintainers (Open Horizon table format)
Makefile                       # install / check / test / clean targets
CONTRIBUTING.md                # Contribution guidelines and DCO sign-off
PREREQUISITES.md               # Full prerequisite checklist and automated checker
.bob/
├── custom_modes.yaml          # Mode definition — slug must match rules-<slug>/ dirs
├── mcp.json                   # MCP server configuration (alwaysAllow = no approval prompt)
├── mcp-servers/oh-exchange/   # Custom Node.js MCP server (ESM, Node >=18)
├── skills/                    # Bob skill files (SKILL.md with YAML frontmatter)
├── commands/                  # Slash commands (opsx-*.md)
└── README.md                  # Mode setup and usage documentation
openspec/
├── changes/                   # Active OpenSpec changes (proposal, design, tasks)
└── specs/                     # Main spec tree (synced from changes)
```

## MCP Server (`oh-exchange`)

- **Start**: `cd .bob/mcp-servers/oh-exchange && npm install && node index.js`
- **Stack**: Node.js ESM (`"type": "module"`), `@modelcontextprotocol/sdk` + `node-fetch`
- **Auth**: Reads `HZN_EXCHANGE_URL`, `HZN_ORG_ID`, `HZN_EXCHANGE_USER_AUTH` env vars at startup — throws immediately if missing
- **Auth format**: `HZN_EXCHANGE_USER_AUTH=username:password` or `username:apikey` (colons in password handled by `parts.slice(1).join(':')`)
- **Authorization header**: `Basic base64(orgId/username:credentials)` — org prefix is mandatory
- **Permission model**: Queries `/orgs/{org}/users/{username}` on init, caches `admin` and `hubAdmin` flags; write tools call `checkPermission('admin')` before executing
- **Error masking**: Credentials are scrubbed from all error messages before surfacing
- **`alwaysAllow` list**: Only read-only tools (list_nodes, get_node, list_services, get_service, list_agreements, get_agreement) — write tools require approval

## Bob Mode Configuration

- **Slug**: `oh-dev` — `custom_modes.yaml` slug must match exactly
- **Permission groups**: `read`, `edit`, `command`, `browser`, `mcp` (all five enabled)
- **Mode rules** were designed to live in `.bob/rules-oh-dev/` (numbered `01-…05-`), but the current implementation uses skills under `.bob/skills/` instead
- **Skills use YAML frontmatter**: `name`, `description` (required); `license`, `compatibility`, `metadata` (optional)

## OpenSpec Workflow

Slash commands and skills are equivalent (same logic, different invocation):

| Slash command | Skill |
|---|---|
| `/opsx-propose <name>` | `openspec-propose` |
| `/opsx-apply [<name>]` | `openspec-apply-change` |
| `/opsx-archive` | `openspec-archive-change` |
| `/opsx-sync` | `openspec-sync-specs` |
| `/opsx-explore` | `openspec-explore` |

- OpenSpec CLI (`openspec`) is required for these workflows — `npm install -g openspec`
- Change artifacts live in `openspec/changes/<name>/`: `proposal.md`, `design.md`, `tasks.md`, `.openspec.yaml`
- `openspec status --change "<name>" --json` returns `applyRequires`, `planningHome`, `changeRoot`, `actionContext`
- Task completion: toggle `- [ ]` → `- [x]` in `tasks.md`
- `context` and `rules` from `openspec instructions` are constraints for the agent — never copy them into artifact files

## Makefile

Four targets are provided for workspace maintenance:

| Target | Command | Purpose |
|--------|---------|---------|
| `install` | `make install` | `npm install` in `.bob/mcp-servers/oh-exchange/` |
| `check` | `make check` | Run `scripts/check-prereqs.sh` + MCP server syntax check |
| `test` | `make test` | Start the MCP server on stdio (requires env vars; Ctrl+C to exit) |
| `clean` | `make clean` | Remove `.bob/mcp-servers/oh-exchange/node_modules/` |

## Contributing

- All commits must be signed off: `git commit -s` (DCO — Developer Certificate of Origin)
- See [CONTRIBUTING.md](CONTRIBUTING.md) for the full fork/branch/PR workflow and project conventions
- License: Apache 2.0 — contributions are covered under [LICENSE.md](LICENSE.md)

## Code Style (`index.js`)

- ESM imports with `.js` extension (e.g., `'@modelcontextprotocol/sdk/server/index.js'`)
- Classes for stateful clients (`ExchangeClient`), plain `switch` for tool dispatch
- JSDoc on all class methods
- `async/await` throughout; throw `Error` with descriptive messages
- `console.error` for server logs (stdout is reserved for MCP protocol)
- No linter config present — follow existing patterns

## Environment Variables

```bash
HZN_EXCHANGE_URL=http://exchange.example.com:3090/v1   # required
HZN_ORG_ID=myorg                                        # required
HZN_EXCHANGE_USER_AUTH=username:apikey                  # required
HZN_FSS_CSSURL=...   # optional, CSS model management
HZN_AGBOT_URL=...    # optional, agreement bot
```

Credentials file: `~/.hzn/credentials.env` (chmod 600). Never commit to git.
