## Prerequisites

### Required Environment Variables
All service lifecycle operations require the following environment variables to be set:
- `HZN_EXCHANGE_URL`: Exchange server URL (e.g., http://exchange:3090/v1)
- `HZN_ORG_ID`: Organization ID for service publishing
- `HZN_EXCHANGE_USER_AUTH`: Credentials in format "username:password" or "username:apikey"

### Authorization Requirements
Service lifecycle operations require specific permission levels:

**Service Publishing Operations** (requires `admin: true` OR service publisher role):
- Publish new service to Exchange
- Update existing service version
- Remove service from Exchange
- Sign service definitions

**Service Development Operations** (no special permissions):
- Create service definition files locally
- Build service containers locally
- Test services locally with `hzn dev service`
- View service definitions in Exchange (read-only)

**Service Dependency Operations** (read-only):
- List available services in organization
- Query service metadata and versions
- Check service availability for dependencies

### Credential Validation
Before executing service publishing operations, the mode SHALL:
1. Verify all required environment variables are set
2. Parse `HZN_EXCHANGE_USER_AUTH` to extract username
3. Test authentication with Exchange API call to `/orgs/{org}/users/{username}`
4. Extract user permission level from response (`admin` flag or service publisher role)
5. Check if user has required permission level for service publishing
6. Provide clear error message if authorization is insufficient

### Operation Authorization Matrix
| Operation | Required Permission | Fallback Guidance |
|-----------|-------------------|-------------------|
| Create service definition | None (local operation) | N/A |
| Build service container | None (local operation) | N/A |
| Test service locally | None (local operation) | N/A |
| Publish service | admin or service publisher | Request service publishing permissions from org admin |
| Update service | admin or service owner | Contact service owner or org admin |
| Remove service | admin or service owner | Contact service owner or org admin |
| List services | None (read-only) | N/A |
| View service details | None (read-only) | N/A |

### Service Signing Requirements
Service publishing requires cryptographic signing:
- User must have RSA key pair generated (`hzn key create`)
- Public key must be registered in Exchange
- Private key must be accessible for signing during publish
- Mode SHALL verify signing key availability before attempting publish

## ADDED Requirements

### Requirement: Create service definition
The mode SHALL guide users through creating service definition files with proper metadata, deployment configuration, and user inputs.

#### Scenario: Create new service definition
- **WHEN** user wants to create a new service
- **THEN** mode provides template for service.definition.json with required fields (org, url, version, arch, deployment)

#### Scenario: Define service inputs
- **WHEN** user needs to specify service configuration variables
- **THEN** mode guides creation of userInput section with variable names, types, and default values

#### Scenario: Specify deployment configuration
- **WHEN** user defines how service should run
- **THEN** mode provides deployment section structure for docker/kubernetes with image references and resource requirements

### Requirement: Build and test service locally
The mode SHALL provide commands for building service containers and testing them before publishing.

#### Scenario: Build service container
- **WHEN** user wants to build service image
- **THEN** mode provides docker/podman build commands with appropriate tags and build context

#### Scenario: Test service locally
- **WHEN** user wants to verify service works before publishing
- **THEN** mode provides `hzn dev service start` command to run service with test inputs

#### Scenario: Stop test service
- **WHEN** user finishes local testing
- **THEN** mode provides `hzn dev service stop` command to clean up test containers

### Requirement: Publish service to Exchange
The mode SHALL guide users through publishing services to the Exchange with proper versioning and signing.

#### Scenario: Publish service definition
- **WHEN** user wants to publish service to Exchange
- **THEN** mode provides `hzn exchange service publish` command with service definition file and signing key

#### Scenario: Verify service publication
- **WHEN** user completes service publish
- **THEN** mode provides `hzn exchange service list` command to confirm service appears in Exchange

#### Scenario: Update existing service
- **WHEN** user wants to publish new version of existing service
- **THEN** mode guides semantic versioning and provides publish command with incremented version

### Requirement: Manage service dependencies
The mode SHALL assist with defining and managing service dependencies and required services.

#### Scenario: Add service dependency
- **WHEN** user's service requires another service
- **THEN** mode guides adding requiredServices section with service URL, version range, and org

#### Scenario: Verify dependency availability
- **WHEN** user defines service dependencies
- **THEN** mode provides commands to check if required services exist in Exchange

### Requirement: Handle service versioning
The mode SHALL enforce semantic versioning and guide version management for services.

#### Scenario: Increment patch version
- **WHEN** user makes backward-compatible bug fixes
- **THEN** mode suggests incrementing patch version (x.y.Z)

#### Scenario: Increment minor version
- **WHEN** user adds backward-compatible functionality
- **THEN** mode suggests incrementing minor version (x.Y.z)

#### Scenario: Increment major version
- **WHEN** user makes breaking changes
- **THEN** mode suggests incrementing major version (X.y.z) and warns about compatibility impact

### Requirement: Remove or deprecate services
The mode SHALL provide commands for removing services from Exchange with proper cleanup.

#### Scenario: Remove service version
- **WHEN** user wants to remove specific service version
- **THEN** mode provides `hzn exchange service remove` command with service identifier

#### Scenario: Check service usage before removal
- **WHEN** user wants to remove service
- **THEN** mode provides commands to check if service is referenced by patterns or policies
