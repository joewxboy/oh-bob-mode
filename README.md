# oh-bob-mode

A custom [Bob Shell](https://bob.ibm.com) mode that turns Bob into an **Open Horizon Development Expert** — providing guided workflows for agent installation, service publishing, deployment management, debugging, and Exchange administration.

See [PREREQUISITES.md](PREREQUISITES.md) for the full setup requirements, or run the automated checker:

```bash
bash scripts/check-prereqs.sh
```

## Activating the Mode

1. Open Bob Shell in this workspace
2. Click the mode switcher (bottom of the chat)
3. Select **"Open Horizon Development"**

## Setup (one-time)

**1. Install MCP server dependencies:**

```bash
cd .bob/mcp-servers/oh-exchange
npm install
```

**2. Set your Exchange credentials** (add to `~/.zshrc` or a sourced credentials file):

```bash
export HZN_EXCHANGE_URL="http://your-exchange:3090/v1"
export HZN_ORG_ID="myorg"
export HZN_EXCHANGE_USER_AUTH="admin:yourpassword"
```

Optional variables:

```bash
export HZN_FSS_CSSURL="http://css.example.com:9443"   # model management
export HZN_AGBOT_URL="http://agbot.example.com:3111"  # agreement bot
```

**3. (Optional) Install OpenSpec CLI** for spec-driven change workflows:

```bash
npm install -g openspec
```

## What You Can Ask Bob

Once the mode is active, Bob acts as an Open Horizon expert. Examples:

| Task | What to say |
|------|-------------|
| Install agent on a remote node | *"Install the Horizon agent on edge@192.168.1.50"* |
| Create a new edge service | *"Create a service called temperature-monitor version 1.0.0"* |
| Debug a missing deployment | *"My service isn't deploying to the node"* |
| Create a deployment policy | *"Create a policy that deploys my-service to warehouse nodes"* |
| Manage Exchange users | *"List users in myorg"* or *"Create a user called developer"* |

## MCP Tools

The MCP server connects Bob directly to your Exchange. Tools run automatically when relevant:

| Tool | Permission required |
|------|-------------------|
| `list_nodes`, `get_node` | Any authenticated user |
| `list_services`, `get_service` | Any authenticated user |
| `list_agreements`, `get_agreement` | Any authenticated user |
| `list_policies` | Any authenticated user |
| `get_permissions` | Any authenticated user |
| `publish_service`, `create_policy` | Org admin |
| `reload_credentials` | Any user (use after rotating credentials) |

Read-only tools run without an approval prompt. Write tools require confirmation.

## Skills Reference

Five domain skills are loaded automatically when relevant:

| Skill | Domain |
|-------|--------|
| `oh-agent-install` | SSH-based remote agent installation, registration, lifecycle |
| `oh-service-lifecycle` | Service definition, build, test, publish, versioning |
| `oh-deployment` | Deployment policies, patterns, node policies, agreement monitoring |
| `oh-debugging` | Agent connectivity, agreement failures, container logs, policy validation |
| `oh-hub-admin` | User/org management, Exchange health, node cleanup, credentials |

## Testing

**MCP server syntax:**
```bash
node --check .bob/mcp-servers/oh-exchange/index.js
```

**Server startup (requires env vars set):**
```bash
node .bob/mcp-servers/oh-exchange/index.js
# Expected: "Open Horizon Exchange MCP server running on stdio"
# Ctrl+C to exit
```

**Missing env var detection:**
```bash
node .bob/mcp-servers/oh-exchange/index.js
# Expected: Fatal error: Missing required environment variables: ...
```

**Quick validation checklist:**
```bash
node --check .bob/mcp-servers/oh-exchange/index.js  # syntax
cat .bob/custom_modes.yaml                           # mode definition
cat .bob/mcp.json                                    # MCP config
ls .bob/skills/oh-*/SKILL.md                         # skills present
ls openspec/specs/*/spec.md                          # main specs synced
```

## Repository Structure

```
.bob/
├── custom_modes.yaml              # Mode definition (slug: oh-dev)
├── mcp.json                       # MCP server config and alwaysAllow list
├── oh-config.schema.json          # JSON Schema for oh-config.json profiles
├── README.md                      # Detailed mode reference
├── mcp-servers/
│   └── oh-exchange/
│       ├── index.js               # Exchange API MCP server (ESM, Node >=18)
│       └── package.json
├── skills/
│   ├── oh-agent-install/SKILL.md
│   ├── oh-service-lifecycle/SKILL.md
│   ├── oh-deployment/SKILL.md
│   ├── oh-debugging/SKILL.md
│   ├── oh-hub-admin/SKILL.md
│   └── openspec-*/SKILL.md        # OpenSpec workflow skills
└── commands/
    └── opsx-*.md                  # Slash commands for OpenSpec workflows
openspec/
├── specs/                         # Main spec tree (agent-install, debugging, etc.)
└── changes/archive/               # Archived OpenSpec changes
```

## Security Notes

- **Never commit credentials** to version control
- Store `HZN_EXCHANGE_USER_AUTH` in a file with `chmod 600`
- Use API keys instead of passwords for automation
- Add `.bob/oh-config.json` and `*.env` files to `.gitignore`

## Requirements

See [PREREQUISITES.md](PREREQUISITES.md) for full details and the automated checker.

**Required:**
- Node.js ≥ 18.0.0
- MCP server dependencies installed (`npm install` in `.bob/mcp-servers/oh-exchange/`)
- `HZN_EXCHANGE_URL`, `HZN_ORG_ID`, `HZN_EXCHANGE_USER_AUTH` environment variables set
- Reachable Open Horizon Exchange instance

**Optional:**
- Bob Shell 1.0.4+ (for mode switcher)
- Open Horizon `hzn` CLI (for local agent commands)
- `openspec` CLI (`npm install -g openspec`) for `/opsx-*` slash commands
- SSH key access to edge nodes (for remote agent installation)
