## Why

Open Horizon development requires specialized knowledge across multiple domains: agent installation and configuration, service creation and publishing, deployment workflows, debugging distributed edge systems, and management hub administration. Developers need a dedicated Bob mode that provides expert guidance and automation for these complex workflows, reducing errors and accelerating development cycles.

## What Changes

- Create a new Bob mode (`oh-dev`) with expert persona for Open Horizon development
- Implement comprehensive rule sets covering five core workflow areas:
  - Agent installation and configuration (including multi-platform support)
  - Service creation, building, and publishing to the Exchange
  - Service deployment with policies and patterns
  - Debugging tools and troubleshooting workflows
  - Management hub administration and Exchange operations
- Configure MCP servers for Open Horizon CLI tools and Exchange API access
- Define permission groups appropriate for edge development workflows
- Establish file editing restrictions to protect critical configuration files

## Capabilities

### New Capabilities
- `agent-install`: Agent installation, registration, and configuration workflows across platforms (Linux, macOS, containers)
- `service-lifecycle`: Service definition, building, testing, publishing, and versioning in the Exchange
- `deployment-management`: Deployment policy creation, pattern management, and node policy configuration
- `debugging-workflows`: Troubleshooting tools, log analysis, agreement inspection, and common issue resolution
- `hub-administration`: Exchange user/org management, resource queries, and administrative operations

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

**New Files:**
- `.bob/custom_modes.yaml` - Mode definition with `oh-dev` slug and role definition
- `.bob/mcp.json` - MCP server configuration for Open Horizon tools
- `.bob/rules-oh-dev/01-agent-install.md` - Agent installation rules
- `.bob/rules-oh-dev/02-service-lifecycle.md` - Service creation and publishing rules
- `.bob/rules-oh-dev/03-deployment.md` - Deployment and policy rules
- `.bob/rules-oh-dev/04-debugging.md` - Debugging and troubleshooting rules
- `.bob/rules-oh-dev/05-hub-admin.md` - Management hub administration rules

**Affected Systems:**
- Bob Shell mode system (new mode registration)
- Workspace configuration (new `.bob` directory structure)
- Developer workflows (new automation and guidance capabilities)

**Dependencies:**
- Open Horizon CLI (`hzn` command)
- Exchange API access
- Podman/Docker for containerized agents (optional)
