## Prerequisites

### Required Environment Variables
Agent registration operations require the following environment variables to be set:
- `HZN_EXCHANGE_URL`: Exchange server URL (e.g., http://exchange:3090/v1)
- `HZN_FSS_CSSURL`: CSS server URL for model management (optional for some deployments)
- `HZN_ORG_ID`: Organization ID for node registration
- `HZN_EXCHANGE_USER_AUTH`: Credentials in format "username:password" or "username:apikey"

**Note:** Agent installation itself does not require Exchange credentials. Credentials are only needed for registration operations.

### Authorization Requirements
Agent lifecycle operations have different permission requirements:

**Agent Installation Operations** (no Exchange permissions required):
- Download and install agent packages
- Start/stop agent service
- Configure agent environment files
- View agent logs

**Node Registration Operations** (requires valid Exchange user):
- Register node with pattern or policy
- Update node policy
- View node status and agreements
- Unregister node (node owner or org admin)

**Node Management Operations** (requires `admin: true` OR node owner):
- Force unregister another user's node (admin only)
- Update node policy for another user's node (admin only)
- Remove node from Exchange (admin or node owner)

### Credential Validation
Before executing node registration operations, the mode SHALL:
1. Verify required environment variables are set (HZN_EXCHANGE_URL, HZN_ORG_ID, HZN_EXCHANGE_USER_AUTH)
2. Parse `HZN_EXCHANGE_USER_AUTH` to extract username
3. Test authentication with Exchange API call to `/orgs/{org}/users/{username}`
4. Verify user exists and credentials are valid
5. Provide clear error message if authentication fails

**Note:** The mode SHALL NOT require credential validation for local agent installation operations (install, start, stop, logs).

### Operation Authorization Matrix
| Operation | Required Permission | Fallback Guidance |
|-----------|-------------------|-------------------|
| Install agent | None (local operation) | N/A |
| Start/stop agent | None (local operation) | Requires OS-level permissions (sudo/admin) |
| Configure agent | None (local operation) | N/A |
| Register node | Valid Exchange user | Create user account or obtain credentials |
| Update node policy | Node owner or admin | Contact node owner or org admin |
| Unregister node | Node owner or admin | Contact node owner or org admin |
| View node status | Node owner or org member | N/A |
| View agent logs | None (local operation) | Requires OS-level permissions to access logs |

### Agent Configuration Files
The mode SHALL validate and guide configuration of:
- `/etc/default/horizon` (Linux) or equivalent config file
- Environment variables: HZN_EXCHANGE_URL, HZN_FSS_CSSURL, HZN_AGBOT_URL
- Node ID and token (generated during registration)
- Certificate paths for secure communication

## ADDED Requirements

### Requirement: Support multi-platform agent installation
The mode SHALL provide guidance for installing Open Horizon agents on Linux, macOS, and containerized environments.

#### Scenario: Linux agent installation
- **WHEN** user requests agent installation on Linux
- **THEN** mode provides commands for package-based installation (apt/yum) or script-based installation

#### Scenario: macOS agent installation
- **WHEN** user requests agent installation on macOS
- **THEN** mode provides commands for Homebrew installation or container-based agent setup

#### Scenario: Container agent installation
- **WHEN** user requests containerized agent setup
- **THEN** mode provides podman/docker commands to run agent in container with proper volume mounts

### Requirement: Guide agent registration workflow
The mode SHALL guide users through the complete agent registration process including organization, pattern/policy selection, and credential configuration.

#### Scenario: Register with pattern
- **WHEN** user wants to register agent with a deployment pattern
- **THEN** mode provides `hzn register` command with pattern specification and required input variables

#### Scenario: Register with policy
- **WHEN** user wants to register agent with node policy
- **THEN** mode provides `hzn register` command with policy flag and guides node policy creation

#### Scenario: Unregister agent
- **WHEN** user needs to unregister an agent
- **THEN** mode provides `hzn unregister` command with appropriate flags for cleanup

### Requirement: Configure agent environment
The mode SHALL assist with agent configuration including Exchange URL, CSS URL, and authentication credentials.

#### Scenario: Set Exchange URL
- **WHEN** user needs to configure Exchange server
- **THEN** mode provides guidance on setting HZN_EXCHANGE_URL environment variable or config file

#### Scenario: Configure authentication
- **WHEN** user needs to set agent credentials
- **THEN** mode provides guidance on HZN_EXCHANGE_USER_AUTH format and secure credential storage

#### Scenario: Verify agent configuration
- **WHEN** user wants to verify agent setup
- **THEN** mode provides `hzn node list` and `hzn version` commands to validate configuration

### Requirement: Handle agent lifecycle operations
The mode SHALL provide commands for starting, stopping, and monitoring agent status.

#### Scenario: Check agent status
- **WHEN** user wants to check if agent is running
- **THEN** mode provides platform-specific commands (systemctl status, podman ps, etc.)

#### Scenario: Restart agent
- **WHEN** user needs to restart the agent
- **THEN** mode provides platform-specific restart commands with proper service management

#### Scenario: View agent logs
- **WHEN** user needs to troubleshoot agent issues
- **THEN** mode provides commands to access agent logs (journalctl, podman logs, etc.)

### Requirement: Support agent upgrades
The mode SHALL guide users through agent version upgrades while preserving configuration.

#### Scenario: Upgrade agent version
- **WHEN** user wants to upgrade to newer agent version
- **THEN** mode provides upgrade commands appropriate for installation method (package manager, container pull)

#### Scenario: Verify upgrade success
- **WHEN** user completes agent upgrade
- **THEN** mode provides `hzn version` command to confirm new version and `hzn node list` to verify functionality
