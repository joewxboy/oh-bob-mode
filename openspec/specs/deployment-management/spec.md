## Prerequisites

### Required Environment Variables
All deployment management operations require the following environment variables to be set:
- `HZN_EXCHANGE_URL`: Exchange server URL (e.g., http://exchange:3090/v1)
- `HZN_ORG_ID`: Organization ID for policy/pattern operations
- `HZN_EXCHANGE_USER_AUTH`: Credentials in format "username:password" or "username:apikey"

### Authorization Requirements
Deployment management operations require specific permission levels:

**Policy Management Operations** (requires `admin: true` OR policy creator role):
- Create deployment policy
- Update deployment policy
- Remove deployment policy
- Publish deployment policy to Exchange

**Pattern Management Operations** (requires `admin: true` OR pattern publisher role):
- Create deployment pattern
- Publish pattern to Exchange
- Update existing pattern
- Remove pattern from Exchange

**Node Policy Operations** (requires node owner OR `admin: true`):
- Create node policy (node owner)
- Update node policy on registered node (node owner)
- View node policy (node owner or org member)
- Update another user's node policy (admin only)

**Monitoring Operations** (read-only, requires node owner OR org member):
- List agreements on node (node owner)
- View agreement details (node owner)
- List deployment policies in org (org member)
- List patterns in org (org member)

### Credential Validation
Before executing deployment management operations, the mode SHALL:
1. Verify all required environment variables are set
2. Parse `HZN_EXCHANGE_USER_AUTH` to extract username
3. Test authentication with Exchange API call to `/orgs/{org}/users/{username}`
4. Extract user permission level from response (`admin` flag or specific roles)
5. Check if user has required permission level for requested operation
6. Provide clear error message if authorization is insufficient

### Operation Authorization Matrix
| Operation | Required Permission | Fallback Guidance |
|-----------|-------------------|-------------------|
| Create deployment policy | admin or policy creator | Request policy creation permissions from org admin |
| Update deployment policy | admin or policy owner | Contact policy owner or org admin |
| Remove deployment policy | admin or policy owner | Contact policy owner or org admin |
| Create pattern | admin or pattern publisher | Request pattern publishing permissions from org admin |
| Update pattern | admin or pattern owner | Contact pattern owner or org admin |
| Remove pattern | admin or pattern owner | Contact pattern owner or org admin |
| Create node policy | Node owner | N/A |
| Update node policy | Node owner or admin | Contact node owner or org admin |
| List agreements | Node owner or org member | N/A |
| View agreement details | Node owner | Contact node owner |
| Cancel agreement | Node owner or admin | Contact node owner or org admin |
| List policies | None (read-only) | N/A |
| List patterns | None (read-only) | N/A |

### Policy Validation
The mode SHALL validate policy syntax before publishing:
- Constraint expressions use valid property names and operators
- Service references include valid org, URL, version, and arch
- Property values match expected types (string, int, bool, list)
- Version ranges use valid semantic versioning syntax
- Rollback settings reference valid service versions

## ADDED Requirements

### Requirement: Create deployment policies
The mode SHALL guide users through creating deployment policies that define service deployment constraints and properties.

#### Scenario: Create basic deployment policy
- **WHEN** user wants to create deployment policy for a service
- **THEN** mode provides template for deployment.policy.json with service reference, constraints, and properties

#### Scenario: Define deployment constraints
- **WHEN** user needs to specify where service can deploy
- **THEN** mode guides creation of constraints using property expressions (arch, memory, location, etc.)

#### Scenario: Set service rollback policy
- **WHEN** user wants to configure automatic rollback behavior
- **THEN** mode provides rollback configuration options in deployment policy

### Requirement: Manage deployment patterns
The mode SHALL provide commands for creating, publishing, and managing deployment patterns.

#### Scenario: Create deployment pattern
- **WHEN** user wants to define a pattern for multiple services
- **THEN** mode provides template for pattern.json with services list and configuration

#### Scenario: Publish pattern to Exchange
- **WHEN** user wants to make pattern available for node registration
- **THEN** mode provides `hzn exchange pattern publish` command with pattern file

#### Scenario: List available patterns
- **WHEN** user wants to see patterns in organization
- **THEN** mode provides `hzn exchange pattern list` command with org filter

### Requirement: Configure node policies
The mode SHALL assist with creating and updating node policies that define node capabilities and constraints.

#### Scenario: Create node policy
- **WHEN** user wants to define node capabilities
- **THEN** mode provides template for node.policy.json with properties and constraints

#### Scenario: Update node policy
- **WHEN** user needs to modify node policy on registered agent
- **THEN** mode provides `hzn policy update` command to apply new policy

#### Scenario: View current node policy
- **WHEN** user wants to see active node policy
- **THEN** mode provides `hzn policy list` command to display current policy

### Requirement: Monitor service deployments
The mode SHALL provide commands to monitor service deployment status and agreements.

#### Scenario: List active agreements
- **WHEN** user wants to see which services are running on node
- **THEN** mode provides `hzn agreement list` command to show active agreements

#### Scenario: Check deployment status
- **WHEN** user wants to verify service deployed successfully
- **THEN** mode provides commands to check agreement state and service container status

#### Scenario: View agreement details
- **WHEN** user needs detailed information about specific agreement
- **THEN** mode provides `hzn agreement list -r` command for full agreement data

### Requirement: Handle deployment failures
The mode SHALL guide troubleshooting when services fail to deploy or agreements fail to form.

#### Scenario: Diagnose missing agreements
- **WHEN** expected service is not deploying
- **THEN** mode provides commands to check policy compatibility and constraint matching

#### Scenario: Force agreement cancellation
- **WHEN** user needs to cancel stuck agreement
- **THEN** mode provides `hzn agreement cancel` command with agreement ID

#### Scenario: Retry deployment
- **WHEN** user wants to retry failed deployment
- **THEN** mode guides updating policies or constraints and waiting for new agreement formation

### Requirement: Manage service upgrades
The mode SHALL assist with rolling out service updates through policy changes.

#### Scenario: Deploy new service version
- **WHEN** user publishes new service version
- **THEN** mode guides updating deployment policy to reference new version

#### Scenario: Gradual rollout
- **WHEN** user wants to deploy to subset of nodes first
- **THEN** mode guides creating multiple deployment policies with different constraints for phased rollout

#### Scenario: Rollback to previous version
- **WHEN** new service version has issues
- **THEN** mode guides updating deployment policy to reference previous stable version
