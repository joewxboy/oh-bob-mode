## Context

Bob Shell supports custom modes through a `.bob` directory structure that defines mode behavior, tool access via MCP servers, and behavioral rules in markdown files. This design implements an Open Horizon development mode (`oh-dev`) following the established Bob mode patterns documented in the IBM bob-demo repository.

**Current State:**
- No Open Horizon-specific Bob mode exists
- Developers manually reference documentation and CLI help
- Common workflows (agent setup, service publishing, debugging) require repetitive command sequences

**Constraints:**
- Must follow Bob mode directory structure: `.bob/custom_modes.yaml`, `.bob/mcp.json`, `.bob/rules-<slug>/`
- Rule files must be markdown format with clear sections (Skill, Purpose, Core Rules, Notes)
- MCP servers must use stdio type for local CLI tool execution
- Mode slug must match rules directory name pattern

**Stakeholders:**
- Open Horizon developers (primary users)
- Bob Shell maintainers (mode system compatibility)

## Goals / Non-Goals

**Goals:**
- Provide expert guidance for five core Open Horizon workflows
- Automate repetitive CLI command sequences
- Reduce errors in agent configuration and service deployment
- Enable quick troubleshooting with structured debugging workflows
- Support multi-platform agent installation (Linux, macOS, containers)

**Non-Goals:**
- Not creating new Open Horizon CLI tools (using existing `hzn` command)
- Not modifying Bob Shell core mode system
- Not implementing custom MCP servers (using standard stdio execution)
- Not covering advanced Exchange API development (focus on operational workflows)

## Decisions

### 1. Mode Slug: `oh-dev`
**Decision:** Use `oh-dev` as the mode slug (short for "Open Horizon Development")

**Rationale:**
- Short and memorable
- Clearly indicates Open Horizon focus
- Follows kebab-case convention
- Avoids conflicts with potential future modes (oh-ops, oh-admin)

**Alternatives Considered:**
- `open-horizon`: Too verbose for frequent switching
- `horizon`: Too generic, could conflict with other tools
- `edge-dev`: Doesn't clearly indicate Open Horizon

### 2. Rule File Organization: Five Domain-Specific Files
**Decision:** Split rules into five numbered markdown files by workflow domain

**Structure:**
```
.bob/rules-oh-dev/
├── 01-agent-install.md      # Agent installation and registration
├── 02-service-lifecycle.md  # Service creation, build, publish
├── 03-deployment.md         # Policies, patterns, node configuration
├── 04-debugging.md          # Troubleshooting and log analysis
├── 05-hub-admin.md          # Exchange administration
```

**Rationale:**
- Clear separation of concerns matches developer mental models
- Numbered files ensure consistent loading order
- Each file focuses on a cohesive workflow area
- Easier to maintain and extend individual domains

**Alternatives Considered:**
- Single monolithic rules file: Too large, hard to navigate
- More granular files (10+ files): Over-fragmentation, harder to find rules
- Grouping by tool instead of workflow: Doesn't match how developers think about tasks

### 3. MCP Server Configuration: Direct REST API Implementation
**Decision:** Implement custom MCP server that makes direct REST API calls to the Open Horizon Exchange, deriving API patterns and business logic from CLI source code analysis

**Configuration:**
```json
{
  "mcpServers": {
    "open-horizon-exchange": {
      "type": "stdio",
      "command": "node",
      "args": [".bob/mcp-servers/oh-exchange/index.js"],
      "alwaysAllow": [
        "list_nodes",
        "get_node",
        "list_services",
        "get_service",
        "list_agreements",
        "get_agreement"
      ]
    }
  }
}
```

**Rationale:**
- Direct API access provides better error handling and response parsing
- Eliminates CLI subprocess overhead and output parsing complexity
- Enables fine-grained control over API request construction
- Allows implementation of business rules discovered from CLI source analysis
- Supports better input validation and sanitization based on CLI patterns
- More maintainable than parsing CLI text output

**Implementation Approach:**
1. **Analyze CLI Source Code**: Inspect `hzn` CLI implementation to understand:
   - REST API endpoint patterns and HTTP methods
   - Request body structures and required fields
   - Authentication header formats
   - Response parsing and error handling logic
   - Input validation rules and sanitization
   - Business logic for multi-step operations

2. **Derive API Patterns**: Extract from CLI source:
   - Exchange API base URL construction
   - Organization-scoped endpoint paths
   - Query parameter patterns
   - Pagination handling
   - Retry logic and timeout values

3. **Implement Business Rules**: Replicate CLI behavior:
   - Credential validation before API calls
   - Required field checks
   - Semantic versioning validation
   - Policy constraint syntax validation
   - Multi-step operation sequencing (e.g., publish service → verify → update policy)

4. **Input Sanitization**: Apply CLI-derived rules:
   - Organization name format validation
   - Service URL format checks
   - Version string validation (semver)
   - JSON schema validation for policies
   - Character escaping for API parameters

**Alternatives Considered:**
- **CLI wrapper approach**: Simpler initially but brittle due to output parsing, less control over errors
- **Hybrid approach** (CLI for some, API for others): Inconsistent, harder to maintain
- **No MCP server**: Would require manual API calls, defeats automation purpose

**Trade-offs:**
- **Benefit**: Better error handling, no output parsing, faster execution, more reliable
- **Cost**: More initial development effort, need to maintain API compatibility
- **Benefit**: Can implement optimizations not available in CLI (batching, caching)
- **Cost**: Must keep in sync with Exchange API changes (mitigated by CLI source analysis)

### 4. Permission Groups: Standard + MCP
**Decision:** Use standard Bob permission groups with MCP enabled

**Groups:** `read`, `edit`, `command`, `browser`, `mcp`

**Rationale:**
- Follows Bob mode conventions
- `mcp` group required for CLI tool access
- `command` group needed for shell operations (docker, podman)
- `edit` group restricted to protect critical config files

**File Editing Restrictions:**
- Allow: Service definitions, policies, documentation
- Restrict: `.bob/` directory, system configs, Exchange credentials

### 5. Role Definition: Expert Persona
**Decision:** Define role as "Open Horizon Development Expert" with specific domain knowledge

**Persona Attributes:**
- Expert in distributed edge computing
- Deep knowledge of Open Horizon architecture
- Familiar with Exchange API and agent lifecycle
- Understands policy-based deployment patterns
- Experienced with multi-platform edge environments

**Rationale:**
- Sets appropriate expertise level for guidance
- Establishes context for decision-making
- Helps Bob provide confident, accurate responses
- Aligns with developer expectations for specialized mode

### 6. Credential Management and Authorization
**Decision:** Implement comprehensive credential validation and authorization checking before executing operations

**Required Environment Variables:**
```bash
HZN_EXCHANGE_URL          # Exchange server URL (e.g., http://exchange:3090/v1)
HZN_FSS_CSSURL            # CSS server URL for model management
HZN_AGBOT_URL             # Agreement bot URL
HZN_ORG_ID                # Organization ID for scoped operations
HZN_EXCHANGE_USER_AUTH    # Credentials in format "username:password" or "username:apikey"
```

**Credential Validation Strategy:**
1. **Startup Validation**: MCP server validates all required environment variables on initialization
2. **Credential Format Check**: Parse `HZN_EXCHANGE_USER_AUTH` to extract username and verify format
3. **Authentication Test**: Make test API call to `/orgs/{org}/users/{username}` to verify credentials work
4. **Permission Discovery**: Query user object to determine authorization level (admin, hubAdmin, regular user)
5. **Cache Permissions**: Store discovered permissions for operation authorization checks

**Authorization Levels and Capabilities:**
```
Hub Admin (hubAdmin: true):
  - All organization operations
  - Cross-organization queries
  - User management across all orgs
  - Node lifecycle in any org

Org Admin (admin: true, hubAdmin: false):
  - Organization user management
  - Service publishing/removal
  - Policy management
  - Node registration/removal in own org
  - Pattern management

Regular User (admin: false):
  - Read own user info
  - List services in org
  - List nodes in org (may be restricted)
  - Register own nodes
  - Create/update own node policies

Anonymous/Unauthenticated:
  - Public service listings (if enabled)
  - Public pattern listings (if enabled)
```

**Operation Authorization Checks:**
- Before each write operation, verify user has required permission level
- Provide clear error messages when authorization fails
- Suggest alternative approaches when user lacks permissions
- Never attempt operations that will fail due to insufficient permissions

**Rule File Integration:**
- Each rule file includes "Prerequisites" section listing required permissions
- Rules check authorization before suggesting operations
- Rules provide fallback guidance for users with limited permissions
- Rules explain what permissions are needed for blocked operations

**Error Handling:**
- Detect 401 (Unauthorized) and 403 (Forbidden) responses
- Parse Exchange error messages for permission details
- Provide actionable guidance (e.g., "Contact your org admin to grant service publishing permissions")
- Log authorization failures for troubleshooting

**Security Considerations:**
- Never log or display credentials in plain text
- Mask passwords/API keys in error messages
- Validate credential format before making API calls
- Implement rate limiting to prevent credential brute-forcing
- Support credential rotation without mode restart

**Rationale:**
- Prevents frustrating authorization errors during workflows
- Provides clear feedback about permission requirements
- Enables mode to adapt guidance based on user's role
- Improves security by validating credentials upfront
- Reduces Exchange server load from failed authorization attempts

**Alternatives Considered:**
- **No validation**: Would lead to confusing errors mid-workflow
- **Validation on first use**: Delays error discovery, poor UX
- **Assume admin permissions**: Dangerous, would suggest unauthorized operations
- **Manual permission declaration**: Error-prone, users may not know their permissions

### 7. Configuration File Management
**Decision:** Support multiple configuration sources with clear precedence and profile management for different environments and remote nodes

**Configuration Sources (in precedence order):**
1. **Environment variables** (highest priority)
2. **Workspace configuration file**: `.bob/oh-config.json`
3. **User configuration file**: `~/.hzn/bob-config.json`
4. **Agent configuration file**: `/etc/default/horizon` (read-only reference)

**Workspace Configuration Format** (`.bob/oh-config.json`):
```json
{
  "profiles": {
    "local": {
      "HZN_EXCHANGE_URL": "http://localhost:3090/v1",
      "HZN_ORG_ID": "myorg",
      "HZN_EXCHANGE_USER_AUTH": "admin:password"
    },
    "staging": {
      "HZN_EXCHANGE_URL": "http://staging-exchange:3090/v1",
      "HZN_ORG_ID": "staging-org",
      "HZN_EXCHANGE_USER_AUTH": "user:apikey"
    },
    "production": {
      "HZN_EXCHANGE_URL": "https://exchange.example.com/v1",
      "HZN_ORG_ID": "prod-org",
      "HZN_EXCHANGE_USER_AUTH": "prod-user:apikey"
    }
  },
  "activeProfile": "local",
  "remoteNodes": {
    "edge-node-1": {
      "host": "192.168.1.100",
      "sshUser": "admin",
      "sshKeyPath": "~/.ssh/edge-node-key",
      "agentType": "native",
      "configPath": "/etc/default/horizon"
    },
    "edge-node-2": {
      "host": "edge2.example.com",
      "sshUser": "ubuntu",
      "sshKeyPath": "~/.ssh/id_rsa",
      "agentType": "container",
      "containerName": "horizon1",
      "configPath": "/tmp/horizon.env"
    }
  }
}
```

**Configuration Management Features:**
1. **Profile Switching**: Mode provides commands to switch between profiles (local, staging, production)
2. **Credential Security**: 
   - Config files stored with restricted permissions (600)
   - Support credential references: `"HZN_EXCHANGE_USER_AUTH": "env:MY_SECRET_VAR"`
   - Support external credential managers: `"HZN_EXCHANGE_USER_AUTH": "keychain:horizon-creds"`
3. **Profile Validation**: Validate profile configuration before switching
4. **Profile Inheritance**: Profiles can inherit from base profile with overrides

**Remote Node Debugging Support:**
1. **SSH Connection Management**:
   - Mode validates SSH connectivity before remote operations
   - Supports SSH key-based authentication
   - Caches SSH connections for performance
   - Provides clear error messages for connection failures

2. **Remote Agent Inspection**:
   - Execute `hzn` commands on remote nodes via SSH
   - Retrieve remote agent logs (journalctl, podman logs)
   - List remote service containers
   - View remote agent configuration files
   - Check remote node registration status

3. **Remote Node Configuration**:
   - `agentType`: "native" (systemd service) or "container" (podman/docker)
   - `configPath`: Location of agent config file on remote node
   - `containerName`: Container name if agentType is "container"

4. **Remote Operation Patterns**:
   ```bash
   # Native agent
   ssh user@host "hzn node list"
   ssh user@host "journalctl -u horizon -n 100"
   
   # Container agent
   ssh user@host "podman exec horizon1 hzn node list"
   ssh user@host "podman logs horizon1 --tail 100"
   ```

**MCP Server Configuration Loading:**
1. On startup, MCP server loads configuration in precedence order
2. Merges environment variables with active profile
3. Validates all required variables are present
4. Caches configuration for operation execution
5. Supports hot-reload when profile switches

**Rule File Integration:**
- Rules reference configuration profiles when suggesting commands
- Rules provide guidance for setting up profiles
- Rules explain how to switch between environments
- Rules guide remote node configuration for debugging

**Security Considerations:**
- Config files excluded from version control (add to .gitignore)
- Credentials never logged or displayed in plain text
- SSH keys protected with proper file permissions
- Support for credential rotation without mode restart
- Audit log for profile switches and credential access

**Rationale:**
- Developers work with multiple environments (local, staging, production)
- Edge deployments require debugging remote nodes via SSH
- Configuration profiles reduce errors from manual environment switching
- Centralized config management improves workflow efficiency
- Security best practices prevent credential leakage

**Alternatives Considered:**
- **Environment variables only**: Cumbersome for multiple environments, no remote node support
- **Single global config**: Doesn't support per-workspace configurations
- **No remote node support**: Forces manual SSH commands, defeats automation purpose
- **Hardcoded SSH commands**: Inflexible, doesn't adapt to different node configurations

**Trade-offs:**
- **Benefit**: Seamless environment switching, remote debugging support
- **Cost**: More complex configuration management, additional validation logic
- **Benefit**: Secure credential handling, audit trail
- **Cost**: Need to document configuration file format and security practices

## Risks / Trade-offs

**Risk:** Rule files become outdated as Open Horizon evolves
→ **Mitigation:** Version rules with Open Horizon releases, include update process in documentation

**Risk:** MCP server `alwaysAllow` list too permissive
→ **Mitigation:** Start conservative (read-only operations), expand based on user feedback

**Risk:** Mode slug conflicts with future Bob modes
→ **Mitigation:** Use specific `oh-` prefix, document naming convention

**Trade-off:** Five rule files vs. single file
→ **Benefit:** Better organization, easier maintenance
→ **Cost:** Slightly more complex directory structure

**Trade-off:** Direct CLI execution vs. wrapper scripts
→ **Benefit:** Simpler, no additional dependencies
→ **Cost:** Less control over command formatting, error handling

## Migration Plan

**Deployment Steps:**
1. Create `.bob` directory structure in workspace
2. Add `custom_modes.yaml` with `oh-dev` mode definition
3. Add `mcp.json` with Open Horizon CLI configuration
4. Create `rules-oh-dev/` directory with five rule files
5. Test mode activation and tool access
6. Validate rule loading and behavior

**Rollback Strategy:**
- Remove `.bob` directory to disable mode
- No system-level changes required
- Mode is workspace-scoped, no global impact

**Validation:**
- Verify mode appears in Bob mode switcher
- Test MCP server connectivity with `hzn version`
- Confirm rule files load without errors
- Execute sample workflows from each domain

## Open Questions

1. **Should we include example service templates in the mode?**
   - Leaning toward: Yes, as separate documentation files referenced by rules
   - Need to decide: Location (`.bob/examples/` or separate repo)

2. **How to handle Exchange URL configuration?**
   - Option A: Environment variables (HZN_EXCHANGE_URL)
   - Option B: Workspace settings file
   - Recommendation: Environment variables (standard Open Horizon practice)

3. **Should debugging rules include automated log collection?**
   - Consideration: Privacy and security of log data
   - Recommendation: Provide commands, let user execute manually
