# Open Horizon Development Mode for Bob Shell

This directory contains the configuration and rules for the `oh-dev` Bob Shell mode, which provides expert guidance for Open Horizon edge computing development workflows, as well as an integrated OpenSpec workflow for spec-driven development.

## Overview

The `oh-dev` mode transforms Bob Shell into an Open Horizon Development Expert with deep knowledge of:
- Agent installation and configuration across multiple platforms
- Service creation, building, testing, and publishing
- Policy-based and pattern-based deployment management
- Debugging distributed edge systems
- Exchange hub administration

The mode also includes **OpenSpec** skills for managing spec-driven change proposals, implementation tasks, and spec synchronization.

## Directory Structure

```
.bob/
├── README.md                         # This file
├── custom_modes.yaml                 # Mode definition and configuration
├── mcp.json                          # MCP server configuration
├── mcp-servers/
│   └── oh-exchange/
│       ├── index.js                  # Exchange API MCP server implementation
│       └── package.json              # Node.js dependencies
├── commands/
│   ├── opsx-apply.md                 # /opsx-apply slash command
│   ├── opsx-archive.md               # /opsx-archive slash command
│   ├── opsx-explore.md               # /opsx-explore slash command
│   ├── opsx-propose.md               # /opsx-propose slash command
│   └── opsx-sync.md                  # /opsx-sync slash command
└── skills/
    ├── oh-agent-install/
    │   └── SKILL.md                  # Agent installation and configuration
    ├── oh-debugging/
    │   └── SKILL.md                  # Debugging and troubleshooting
    ├── oh-deployment/
    │   └── SKILL.md                  # Deployment policy and pattern management
    ├── oh-hub-admin/
    │   └── SKILL.md                  # Exchange hub administration
    ├── oh-service-lifecycle/
    │   └── SKILL.md                  # Service creation and publishing
    ├── openspec-apply-change/
    │   └── SKILL.md                  # Implement tasks from an OpenSpec change
    ├── openspec-archive-change/
    │   └── SKILL.md                  # Archive a completed OpenSpec change
    ├── openspec-explore/
    │   └── SKILL.md                  # Explore mode for thinking and investigation
    ├── openspec-propose/
    │   └── SKILL.md                  # Propose a new change with all artifacts
    └── openspec-sync-specs/
        └── SKILL.md                  # Sync delta specs to main specs
```

## Skills Reference

### Open Horizon Skills

| Skill | Description |
|-------|-------------|
| `oh-agent-install` | Install and configure Horizon agents on remote Linux hosts via SSH, register nodes with policies |
| `oh-service-lifecycle` | Create, build, test, publish, and deprecate edge services with semantic versioning |
| `oh-deployment` | Create deployment policies and patterns, manage node policies, monitor agreement formation |
| `oh-debugging` | Diagnose agent connectivity, analyze agreement failures, inspect service containers and logs |
| `oh-hub-admin` | Manage Exchange users, organizations, credentials, node lifecycle, and resource auditing |

### OpenSpec Skills

| Skill | Description |
|-------|-------------|
| `openspec-propose` | Propose a new change — generates proposal, design, and tasks in one step |
| `openspec-apply-change` | Implement tasks from an active change, tracking progress through checkboxes |
| `openspec-archive-change` | Finalize and archive a completed change, with optional spec sync |
| `openspec-sync-specs` | Sync delta specs from a change into the main `openspec/specs/` tree |
| `openspec-explore` | Enter thinking-partner mode for exploring ideas, problems, and requirements |

### OpenSpec Slash Commands

| Command | Description |
|---------|-------------|
| `/opsx-propose` | Create a new change proposal with all artifacts |
| `/opsx-apply` | Implement tasks for an active change |
| `/opsx-archive` | Archive a completed change |
| `/opsx-sync` | Sync delta specs to main specs |
| `/opsx-explore` | Enter explore mode |

> **Note:** Slash commands (`/opsx-*`) and skills (`openspec-*`) cover the same operations. Commands are convenient for keyboard-driven invocation; skills are activated by Bob when the intent is detected conversationally.

## Required Environment Variables

Before using the `oh-dev` mode, set these environment variables:

### Essential Variables
```bash
export HZN_EXCHANGE_URL="http://exchange.example.com:3090/v1"
export HZN_ORG_ID="myorg"
export HZN_EXCHANGE_USER_AUTH="username:password"
# or
export HZN_EXCHANGE_USER_AUTH="username:apikey"
```

### Optional Variables
```bash
export HZN_FSS_CSSURL="http://css.example.com:9443"  # For model management
export HZN_AGBOT_URL="http://agbot.example.com:3111" # For agreement bot
export HZN_DEVICE_ID="my-edge-node"                  # Default node ID
export HZN_DEVICE_TOKEN="my-node-token"              # Default node token
```

### Setting Up Credentials

**Option 1: Environment File (Recommended)**
```bash
# Create credentials file
cat > ~/.hzn/credentials.env <<EOF
export HZN_EXCHANGE_URL="http://exchange.example.com:3090/v1"
export HZN_ORG_ID="myorg"
export HZN_EXCHANGE_USER_AUTH="admin:password"
EOF

# Secure the file
chmod 600 ~/.hzn/credentials.env

# Source in your shell
source ~/.hzn/credentials.env
```

**Option 2: Shell Profile**
```bash
# Add to ~/.bashrc or ~/.zshrc
export HZN_EXCHANGE_URL="http://exchange.example.com:3090/v1"
export HZN_ORG_ID="myorg"
export HZN_EXCHANGE_USER_AUTH="admin:password"
```

## Installation

### 1. Install MCP Server Dependencies

```bash
cd .bob/mcp-servers/oh-exchange
npm install
```

### 2. Install OpenSpec CLI (Optional)

The OpenSpec skills require the `openspec` CLI to be installed:

```bash
npm install -g openspec
# or
npx openspec --version
```

### 3. Verify Installation

```bash
# Test MCP server
node .bob/mcp-servers/oh-exchange/index.js
# Should start without errors (Ctrl+C to exit)

# Test OpenSpec CLI (if installed)
openspec --version

# Verify Bob can load the mode
# (Restart Bob Shell if already running)
```

## Mode Activation

### In Bob Shell

1. Open Bob Shell in this workspace
2. Click the mode switcher (bottom right)
3. Select "Open Horizon Development"
4. The mode is now active

### Verify Mode is Active

The mode indicator should show: `🛠️ Open Horizon Development`

## Usage Examples

### Example 1: Install and Register Agent

```
User: Install the Horizon agent on this Ubuntu node and register it with the warehouse pattern

Bob will:
1. Provide SSH-based remote installation steps
2. Copy agent-install.cfg and mycreds.env to the remote host
3. Download and run agent-install.sh with sudo -E
4. Register the node using node.policy.json
5. Verify registration with hzn node list
```

### Example 2: Create and Publish Service

```
User: Create a new edge service called temperature-monitor version 1.0.0

Bob will:
1. Generate service.definition.json template
2. Guide through deployment configuration
3. Show docker build commands
4. Provide hzn dev service start for local testing
5. Show hzn exchange service publish command
```

### Example 3: Debug Deployment Issue

```
User: My service isn't deploying to the edge node

Bob will:
1. Check node registration: hzn node list
2. Verify Exchange connectivity: hzn exchange status
3. Compare node policy vs deployment policy constraints
4. Check eventlog for errors: hzn eventlog list
5. Inspect service container status
6. Provide specific fix based on findings
```

### Example 4: Create Deployment Policy

```
User: Create a deployment policy for my-service that only deploys to warehouse nodes with at least 2GB memory

Bob will:
1. Generate deployment.policy.json template
2. Add constraints: location == "warehouse" AND memory >= 2048
3. Configure service reference and version
4. Show hzn exchange deployment addpolicy command
5. Verify policy publication
```

### Example 5: Propose a New Change (OpenSpec)

```
User: /opsx-propose add-telemetry-endpoint

Bob will:
1. Create the change directory via openspec new change
2. Generate proposal.md describing the what and why
3. Generate design.md with the how
4. Generate tasks.md with implementation steps
5. Report ready to implement with /opsx-apply
```

### Example 6: Manage Exchange Users

```
User: Create a new user called developer with admin privileges

Bob will:
1. Show hzn exchange user create command
2. Generate API key for the user
3. Verify user creation
4. Provide credentials for the new user
```

## Common Workflows

### Agent Installation Workflow
1. Install agent package (platform-specific)
2. Configure Exchange URL and credentials
3. Register with pattern or policy
4. Verify registration and connectivity
5. Monitor agreement formation

### Service Development Workflow
1. Create service definition
2. Build container image
3. Test locally with hzn dev service
4. Publish to Exchange with signing
5. Create deployment policy
6. Monitor deployment to nodes

### Debugging Workflow
1. Check agent status and connectivity
2. Verify node registration
3. Compare policies for constraint matches
4. Check eventlog for errors
5. Inspect service containers
6. Review agent logs

### Administration Workflow
1. Create users and assign permissions
2. Publish services and policies
3. Monitor node heartbeats
4. Audit resource usage
5. Clean up stale nodes
6. Rotate credentials

### OpenSpec Change Workflow
1. `/opsx-explore` — think through the problem and requirements
2. `/opsx-propose <name>` — generate proposal, design, and tasks
3. `/opsx-apply` — implement tasks in order
4. `/opsx-sync` — sync delta specs to main specs (if applicable)
5. `/opsx-archive` — finalize and archive the change

## Troubleshooting

### Mode Not Appearing in Switcher

**Cause**: Bob hasn't loaded the custom mode configuration

**Solution**:
1. Verify `custom_modes.yaml` exists in `.bob/` directory
2. Restart Bob Shell
3. Check Bob logs for mode loading errors

### MCP Server Connection Failed

**Cause**: MCP server dependencies not installed or server crashed

**Solution**:
```bash
# Install dependencies
cd .bob/mcp-servers/oh-exchange
npm install

# Test server manually
node index.js
# Should start without errors

# Check for Node.js version (requires >= 18.0.0)
node --version
```

### Environment Variables Not Set

**Cause**: Required variables missing when MCP server starts

**Solution**:
```bash
# Verify variables are set
echo $HZN_EXCHANGE_URL
echo $HZN_ORG_ID
echo $HZN_EXCHANGE_USER_AUTH

# If empty, source credentials file
source ~/.hzn/credentials.env

# Restart Bob Shell to reload environment
```

### Authentication Errors

**Cause**: Invalid credentials or wrong organization

**Solution**:
```bash
# Test credentials manually
hzn exchange user list

# Verify organization exists
hzn exchange org list

# Check credential format (must include org prefix for API calls)
# Format: ${HZN_ORG_ID}/${HZN_EXCHANGE_USER_AUTH}
```

### OpenSpec CLI Not Found

**Cause**: `openspec` CLI is not installed

**Solution**:
```bash
# Install globally
npm install -g openspec

# Or run via npx
npx openspec list
```

## Security Considerations

### Credential Storage
- **Never commit credentials to version control**
- Store credentials in files with `chmod 600` permissions
- Use API keys instead of passwords for automation
- Rotate credentials regularly (every 90 days)

### File Permissions
```bash
# Secure credential files
chmod 600 ~/.hzn/credentials.env

# Secure Bob configuration
chmod 700 .bob/
chmod 600 .bob/custom_modes.yaml
chmod 600 .bob/mcp.json
```

### .gitignore Entries
Add these to your `.gitignore`:
```
.bob/oh-config.json
.bob/**/*credentials*
.bob/**/*secret*
.bob/**/*.env
```

## Advanced Configuration

### Multiple Environment Profiles

Create separate credential files for different environments:

```bash
# Development
~/.hzn/dev-credentials.env

# Staging
~/.hzn/staging-credentials.env

# Production
~/.hzn/prod-credentials.env

# Switch environments
source ~/.hzn/staging-credentials.env
```

### Custom MCP Server Configuration

Edit `.bob/mcp.json` to customize:
- Add more tools to `alwaysAllow` list
- Adjust server startup parameters
- Configure additional MCP servers

### Extending Skills

Add custom Open Horizon guidance by creating new skills in `.bob/skills/`:

```bash
# Create a new skill directory
mkdir -p .bob/skills/oh-custom-workflows

# Create the skill file
cat > .bob/skills/oh-custom-workflows/SKILL.md <<EOF
---
name: oh-custom-workflows
description: Custom Open Horizon workflow guidance for this project.
---

# Custom Workflows

## Purpose
What this skill covers.

## Core Rules
Your specific rules and commands.
EOF
```

## Support and Documentation

### Official Documentation
- Open Horizon Documentation: https://open-horizon.github.io/
- Exchange API Reference: https://github.com/open-horizon/exchange-api
- Agent Documentation: https://github.com/open-horizon/anax

### Getting Help
1. Check skills in `.bob/skills/` for specific guidance
2. Use Bob's ask mode to query documentation
3. Review Open Horizon community resources
4. Check Exchange API documentation for advanced operations

## Version Information

- **Mode Version**: 1.1.0
- **Bob Shell Compatibility**: 1.0.4+
- **Open Horizon Compatibility**: 2.30+
- **Node.js Requirement**: 18.0.0+

## License

This mode configuration follows the same license as the Open Horizon project.
