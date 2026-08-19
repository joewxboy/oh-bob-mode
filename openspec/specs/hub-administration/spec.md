## Prerequisites

### Required Environment Variables
All hub administration operations require the following environment variables to be set:
- `HZN_EXCHANGE_URL`: Exchange server URL (e.g., http://exchange:3090/v1)
- `HZN_ORG_ID`: Organization ID for scoped operations
- `HZN_EXCHANGE_USER_AUTH`: Credentials in format "username:password" or "username:apikey"

### Authorization Requirements
Hub administration operations require specific permission levels:

**Hub Admin Operations** (requires `hubAdmin: true`):
- Create/update/delete organizations
- List all organizations
- Cross-organization user management
- Cross-organization resource queries

**Organization Admin Operations** (requires `admin: true` in target org):
- Create/update/delete users in own organization
- Manage services in own organization
- Manage policies in own organization
- Force node unregistration in own organization
- Generate API keys for users

**Regular User Operations** (no special permissions):
- List services in organization (read-only)
- List nodes in organization (may be restricted)
- View own user information
- Update own password

### Credential Validation
Before executing any hub administration operation, the mode SHALL:
1. Verify all required environment variables are set
2. Parse `HZN_EXCHANGE_USER_AUTH` to extract username
3. Test authentication with Exchange API call to `/orgs/{org}/users/{username}`
4. Extract user permission level from response (`admin` and `hubAdmin` flags)
5. Check if user has required permission level for requested operation
6. Provide clear error message if authorization is insufficient

### Operation Authorization Matrix
| Operation | Required Permission | Fallback Guidance |
|-----------|-------------------|-------------------|
| Create organization | hubAdmin | Contact hub administrator |
| List all organizations | hubAdmin | Use `hzn exchange org list` to see accessible orgs |
| Create user | admin (in target org) | Contact organization administrator |
| List users | admin or self | Regular users can only view own info |
| Update user | admin or self | Users can update own password only |
| Remove user | admin (in target org) | Contact organization administrator |
| Create service | admin or service publisher | Request service publishing permissions |
| Remove service | admin or service owner | Contact service owner or org admin |
| Create policy | admin or policy creator | Request policy creation permissions |
| Remove node | admin or node owner | Contact node owner or org admin |
| Generate API key | admin or self | Users can generate own API keys |

## ADDED Requirements

### Requirement: Manage Exchange users
The mode SHALL provide commands for creating, listing, and managing Exchange user accounts.

#### Scenario: Create new user
- **WHEN** administrator wants to add user to organization
- **THEN** mode provides `hzn exchange user create` command with username, password, and admin flag

#### Scenario: List organization users
- **WHEN** administrator wants to see all users in org
- **THEN** mode provides `hzn exchange user list` command or Exchange API curl command for complete user list

#### Scenario: Update user permissions
- **WHEN** administrator needs to change user admin status
- **THEN** mode provides `hzn exchange user update` command to modify admin flag

#### Scenario: Remove user
- **WHEN** administrator wants to delete user account
- **THEN** mode provides `hzn exchange user remove` command with username

### Requirement: Manage Exchange organizations
The mode SHALL provide commands for creating and managing Exchange organizations.

#### Scenario: Create new organization
- **WHEN** hub administrator wants to create organization
- **THEN** mode provides `hzn exchange org create` command with org name and description

#### Scenario: List all organizations
- **WHEN** hub administrator wants to see all orgs
- **THEN** mode provides Exchange API curl command with root credentials to list all organizations

#### Scenario: Update organization settings
- **WHEN** administrator needs to modify org properties
- **THEN** mode provides `hzn exchange org update` command with new settings

### Requirement: Query Exchange resources
The mode SHALL provide commands to list and inspect nodes, services, patterns, and policies.

#### Scenario: List all nodes in organization
- **WHEN** administrator wants to see registered nodes
- **THEN** mode provides `hzn exchange node list` command or Exchange API endpoint for node listing

#### Scenario: View node details
- **WHEN** administrator needs detailed node information
- **THEN** mode provides commands to query specific node including status, agreements, and policy

#### Scenario: List services in organization
- **WHEN** administrator wants to see published services
- **THEN** mode provides `hzn exchange service list` command with org filter

#### Scenario: List deployment policies
- **WHEN** administrator wants to see active deployment policies
- **THEN** mode provides `hzn exchange deployment listpolicy` command

### Requirement: Monitor Exchange health
The mode SHALL provide commands to check Exchange service status and connectivity.

#### Scenario: Check Exchange status
- **WHEN** administrator wants to verify Exchange is operational
- **THEN** mode provides `hzn exchange status` command to test connectivity and authentication

#### Scenario: Verify Exchange version
- **WHEN** administrator needs to check Exchange version
- **THEN** mode provides `hzn exchange version` command to display Exchange server version

#### Scenario: Test API connectivity
- **WHEN** administrator wants to verify API access
- **THEN** mode provides curl commands to test Exchange REST API endpoints

### Requirement: Manage node lifecycle
The mode SHALL provide commands for administrators to manage node registration and cleanup.

#### Scenario: View node registration status
- **WHEN** administrator wants to check if node is properly registered
- **THEN** mode provides commands to query node status and heartbeat

#### Scenario: Force node unregistration
- **WHEN** administrator needs to remove stale node
- **THEN** mode provides `hzn exchange node remove` command to delete node from Exchange

#### Scenario: Update node configuration
- **WHEN** administrator needs to modify node properties
- **THEN** mode provides commands to update node policy or pattern assignment

### Requirement: Audit Exchange activity
The mode SHALL provide commands to review Exchange operations and changes.

#### Scenario: View recent node registrations
- **WHEN** administrator wants to see new nodes
- **THEN** mode provides commands to list nodes sorted by registration time

#### Scenario: Check service publication history
- **WHEN** administrator wants to see service updates
- **THEN** mode provides commands to list services with version history

#### Scenario: Review policy changes
- **WHEN** administrator needs to audit policy modifications
- **THEN** mode provides commands to view deployment policy update timestamps

### Requirement: Manage Exchange credentials
The mode SHALL guide secure handling of Exchange authentication credentials.

#### Scenario: Generate API key
- **WHEN** user needs API key for automation
- **THEN** mode provides commands to create API key for user account

#### Scenario: Rotate credentials
- **WHEN** administrator needs to update user password
- **THEN** mode provides `hzn exchange user update` command with new password

#### Scenario: Configure credential storage
- **WHEN** user needs to store credentials securely
- **THEN** mode guides setting HZN_EXCHANGE_USER_AUTH environment variable or using credential files
