## Prerequisites

### Required Environment Variables
Debugging operations require the following environment variables to be set:
- `HZN_EXCHANGE_URL`: Exchange server URL (e.g., http://exchange:3090/v1)
- `HZN_ORG_ID`: Organization ID for node/service queries
- `HZN_EXCHANGE_USER_AUTH`: Credentials in format "username:password" or "username:apikey"

**Note:** Some debugging operations (viewing local agent logs, inspecting containers) do not require Exchange credentials and can be performed with only local system access.

### Authorization Requirements
Debugging operations have varying permission requirements:

**Local Debugging Operations** (no Exchange permissions required):
- View agent logs (requires OS-level log access)
- List running service containers
- View container logs
- Check container resource usage
- Inspect agent configuration files

**Node-Scoped Debugging Operations** (requires node owner OR org member):
- View node status and configuration
- List agreements on node (node owner)
- View agreement details (node owner)
- Check node policy (node owner or org member)
- View eventlog for node (node owner)

**Organization-Scoped Debugging Operations** (requires org member):
- List services in organization (read-only)
- View service definitions (read-only)
- List deployment policies (read-only)
- List patterns (read-only)
- Query node list in organization (may be restricted)

**Administrative Debugging Operations** (requires `admin: true`):
- View agreements for any node in organization
- Access eventlog for any node
- Force cancel agreements on any node
- View detailed node information for any node

### Credential Validation
Before executing Exchange-based debugging operations, the mode SHALL:
1. Verify required environment variables are set (HZN_EXCHANGE_URL, HZN_ORG_ID, HZN_EXCHANGE_USER_AUTH)
2. Parse `HZN_EXCHANGE_USER_AUTH` to extract username
3. Test authentication with Exchange API call to `/orgs/{org}/users/{username}`
4. Verify user exists and credentials are valid
5. Provide clear error message if authentication fails

**Note:** The mode SHALL NOT require credential validation for local debugging operations (logs, containers, config files).

### Operation Authorization Matrix
| Operation | Required Permission | Fallback Guidance |
|-----------|-------------------|-------------------|
| View agent logs | None (local operation) | Requires OS-level permissions to access logs |
| List containers | None (local operation) | Requires docker/podman access |
| View container logs | None (local operation) | Requires docker/podman access |
| Test Exchange connectivity | Valid Exchange user | Create user account or obtain credentials |
| View node status | Node owner or org member | Contact node owner |
| List agreements | Node owner | Contact node owner |
| View agreement details | Node owner | Contact node owner |
| View eventlog | Node owner | Contact node owner |
| Cancel agreement | Node owner or admin | Contact node owner or org admin |
| List services | None (read-only) | N/A |
| View service details | None (read-only) | N/A |
| List policies | None (read-only) | N/A |
| Validate policy syntax | None (local operation) | N/A |

### Debugging Context Requirements
The mode SHALL gather context before suggesting debugging steps:
- Node ID and registration status
- Current agreements and their states
- Recent eventlog entries
- Service container status
- Agent version and configuration
- Exchange connectivity status

This context helps determine which debugging operations are relevant and authorized.

## ADDED Requirements

### Requirement: Diagnose agent connectivity issues
The mode SHALL provide commands to verify agent connectivity to Exchange and CSS services.

#### Scenario: Test Exchange connectivity
- **WHEN** user suspects Exchange connection issues
- **THEN** mode provides `hzn exchange status` command to verify Exchange reachability and authentication

#### Scenario: Test CSS connectivity
- **WHEN** user suspects CSS connection issues
- **THEN** mode provides commands to test CSS endpoint and verify MMS functionality

#### Scenario: Verify agent configuration
- **WHEN** user needs to check agent settings
- **THEN** mode provides `hzn node list` command to display Exchange URL, org, and node ID

### Requirement: Analyze agreement formation failures
The mode SHALL guide users through diagnosing why services are not deploying.

#### Scenario: Check policy compatibility
- **WHEN** service is not deploying to node
- **THEN** mode provides commands to compare node policy, deployment policy, and service policy for constraint mismatches

#### Scenario: Verify service availability
- **WHEN** agreement is not forming
- **THEN** mode provides `hzn exchange service list` command to verify service exists in Exchange

#### Scenario: Check node properties
- **WHEN** constraints are not matching
- **THEN** mode provides commands to view node properties and compare against deployment constraints

### Requirement: Inspect service container status
The mode SHALL provide commands to check running service containers and their health.

#### Scenario: List running containers
- **WHEN** user wants to see which service containers are active
- **THEN** mode provides docker/podman ps commands filtered for Horizon services

#### Scenario: View container logs
- **WHEN** user needs to troubleshoot service behavior
- **THEN** mode provides docker/podman logs commands for specific service containers

#### Scenario: Check container resource usage
- **WHEN** user suspects resource constraints
- **THEN** mode provides docker/podman stats commands to monitor CPU, memory, and network usage

### Requirement: Access agent logs
The mode SHALL guide users to agent log locations and provide log analysis commands.

#### Scenario: View agent system logs
- **WHEN** user needs to see agent daemon logs
- **THEN** mode provides platform-specific commands (journalctl for systemd, podman logs for containers)

#### Scenario: Filter logs by time range
- **WHEN** user wants to see logs from specific period
- **THEN** mode provides log commands with time filtering options

#### Scenario: Search logs for errors
- **WHEN** user wants to find error messages
- **THEN** mode provides grep/filter commands to extract error and warning lines

### Requirement: Debug agreement lifecycle
The mode SHALL provide commands to trace agreement formation, execution, and termination.

#### Scenario: View agreement history
- **WHEN** user wants to see past agreements
- **THEN** mode provides `hzn eventlog list` command to show agreement lifecycle events

#### Scenario: Check agreement termination reason
- **WHEN** agreement was cancelled unexpectedly
- **THEN** mode provides commands to view eventlog for termination reason and error details

#### Scenario: Monitor agreement formation
- **WHEN** user wants to watch agreement formation in real-time
- **THEN** mode provides commands to tail eventlog and watch for new agreements

### Requirement: Troubleshoot service update issues
The mode SHALL guide diagnosis of problems during service version upgrades.

#### Scenario: Check service version mismatch
- **WHEN** service is not updating to new version
- **THEN** mode provides commands to compare deployed version against Exchange version

#### Scenario: Verify image availability
- **WHEN** service container fails to start
- **THEN** mode provides commands to check if service image exists in registry and is accessible

#### Scenario: Diagnose rollback triggers
- **WHEN** service automatically rolled back
- **THEN** mode provides commands to check agreement termination reason and service health checks

### Requirement: Validate policy syntax
The mode SHALL provide commands to validate policy JSON files before publishing.

#### Scenario: Validate deployment policy
- **WHEN** user creates deployment policy
- **THEN** mode provides commands to validate JSON syntax and required fields

#### Scenario: Test constraint expressions
- **WHEN** user writes complex constraint expressions
- **THEN** mode guides testing constraint logic against sample node properties

#### Scenario: Verify policy references
- **WHEN** policy references services or patterns
- **THEN** mode provides commands to verify referenced resources exist in Exchange
