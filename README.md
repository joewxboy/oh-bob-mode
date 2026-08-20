# oh-bob-mode

![License](https://img.shields.io/github/license/joewxboy/oh-bob-mode)
![Contributors](https://img.shields.io/github/contributors/joewxboy/oh-bob-mode)

A custom [Bob Shell](https://bob.ibm.com) mode that turns Bob into an **Open Horizon Development Expert** — providing guided workflows for agent installation, service publishing, deployment management, debugging, and Exchange administration.

## Prerequisites

See [PREREQUISITES.md](PREREQUISITES.md) for the full setup requirements, or run the automated checker:

```bash
bash scripts/check-prereqs.sh
```

## Activating the Mode

1. Open Bob Shell in this workspace
2. Click the mode switcher (bottom of the chat)
3. Select **"Open Horizon Development"**

## Setup (one-time)

Choose **global installation** (recommended — available in every workspace) or **workspace installation** (mode lives only in this cloned repo).

### Global installation (recommended)

Install once and the mode, skills, MCP server, and slash commands are available in every workspace you open in Bob Shell.

**1. Copy the MCP server to your home directory and install its dependencies:**

```bash
mkdir -p ~/.bob/mcp-servers
cp -r .bob/mcp-servers/oh-exchange ~/.bob/mcp-servers/oh-exchange
cd ~/.bob/mcp-servers/oh-exchange && npm install
```

**2. Add the MCP server entry to `~/.bob/mcp.json`** (create the file if it does not exist):

```json
{
  "mcpServers": {
    "open-horizon-exchange": {
      "type": "stdio",
      "command": "node",
      "args": ["/YOUR/HOME/.bob/mcp-servers/oh-exchange/index.js"],
      "alwaysAllow": [
        "list_nodes", "get_node",
        "list_services", "get_service",
        "list_agreements", "get_agreement"
      ]
    }
  }
}
```

> Replace `/YOUR/HOME` with your actual home directory path (e.g. `/Users/yourname`). Use an absolute path — a relative path will not resolve correctly from arbitrary workspaces.
>
> If `~/.bob/mcp.json` already contains other MCP server entries, add `open-horizon-exchange` as an additional key inside the existing top-level object.

**3. Append the `oh-dev` mode to `~/.bob/settings/custom_modes.yaml`** (create the file if it does not exist):

```yaml
customModes:
  - slug: oh-dev
    name: "Open Horizon Development"
    roleDefinition: |
      You are an Open Horizon Development Expert with deep expertise in:
      - Distributed edge computing architecture and patterns
      - Open Horizon Exchange API and agent lifecycle management
      - Policy-based service deployment and agreement formation
      - Multi-platform edge environments (Linux, macOS, containers)
      - Service creation, publishing, versioning, and dependency management
      - Debugging distributed edge systems and troubleshooting workflows
      - Exchange administration, user management, and security best practices

      You provide confident, accurate guidance for Open Horizon development workflows,
      helping developers efficiently build, deploy, and manage edge services.
    whenToUse: |
      Use this mode when working with Open Horizon edge computing platform:
      - Installing and configuring Horizon agents on edge nodes
      - Creating, building, testing, and publishing edge services
      - Managing deployment policies, patterns, and node configurations
      - Debugging service deployments, agreements, and agent connectivity
      - Administering the Exchange hub (users, organizations, resources)
      - Troubleshooting distributed edge system issues
      - Setting up multi-environment workflows (local, staging, production)
    groups:
      - read
      - edit
      - command
      - browser
      - mcp
```

> If `~/.bob/settings/custom_modes.yaml` already exists, add the `- slug: oh-dev` block as an additional entry under the existing `customModes:` list.

**4. Copy the skills to `~/.bob/skills/`:**

```bash
cp -r \
  .bob/skills/oh-agent-install \
  .bob/skills/oh-debugging \
  .bob/skills/oh-deployment \
  .bob/skills/oh-hub-admin \
  .bob/skills/oh-service-lifecycle \
  .bob/skills/openspec-apply-change \
  .bob/skills/openspec-archive-change \
  .bob/skills/openspec-explore \
  .bob/skills/openspec-propose \
  .bob/skills/openspec-sync-specs \
  ~/.bob/skills/
```

**5. Copy the slash commands to `~/.bob/commands/`:**

```bash
mkdir -p ~/.bob/commands
cp .bob/commands/opsx-*.md ~/.bob/commands/
```

**6. Restart Bob Shell** to reload the global configuration. The **"Open Horizon Development"** mode will then appear in the mode switcher in every workspace.

---

### Workspace installation

Use this approach if you want the mode to apply only when Bob is opened inside this cloned repository.

**1. Install MCP server dependencies:**

```bash
make install
```

Or manually:

```bash
cd .bob/mcp-servers/oh-exchange
npm install
```

The workspace-local `.bob/custom_modes.yaml` and `.bob/mcp.json` are already committed to this repo and will be picked up automatically by Bob Shell when this directory is the open workspace.

---

### Credentials (both installation methods)

**Set your Exchange credentials** (add to `~/.zshrc` or `~/.bashrc`, or use a sourced credentials file):

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

See [PREREQUISITES.md](PREREQUISITES.md) for the full credentials guide, including the recommended [`oh-cred`](https://github.com/joewxboy/oh-cred) vault-backed broker for multi-hub setups.

**(Optional) Install OpenSpec CLI** for spec-driven change workflows:

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

**Run all prerequisite and syntax checks** (workspace install):
```bash
make check
```

**Start the MCP server** (requires env vars set; Ctrl+C to exit):
```bash
make test
```

**Quick validation — workspace install:**
```bash
node --check .bob/mcp-servers/oh-exchange/index.js  # syntax
cat .bob/custom_modes.yaml                           # mode definition
cat .bob/mcp.json                                    # MCP config
ls .bob/skills/oh-*/SKILL.md                         # skills present
```

**Quick validation — global install:**
```bash
node --check ~/.bob/mcp-servers/oh-exchange/index.js     # syntax
grep "oh-dev" ~/.bob/settings/custom_modes.yaml          # mode present
grep "open-horizon-exchange" ~/.bob/mcp.json             # MCP entry present
ls ~/.bob/skills/oh-*/SKILL.md                           # skills present
ls ~/.bob/commands/opsx-*.md                             # slash commands present
```

## Repository Structure

```
LICENSE.md                         # Apache License 2.0
MAINTAINERS.md                     # Active maintainers list
Makefile                           # install / check / test / clean targets
CONTRIBUTING.md                    # Contribution guidelines and DCO
PREREQUISITES.md                   # Full setup requirements
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
