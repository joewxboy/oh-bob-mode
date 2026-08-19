## 1. Setup Bob Mode Structure

- [x] 1.1 Create `.bob` directory in workspace root
- [x] 1.2 Create `.bob/rules-oh-dev` directory for rule files
- [x] 1.3 Verify directory structure matches Bob mode requirements

## 2. Mode Configuration Files

- [x] 2.1 Create `custom_modes.yaml` with oh-dev mode definition
- [x] 2.2 Define role as "Open Horizon Development Expert" with expertise attributes
- [x] 2.3 Set whenToUse description for Open Horizon development workflows
- [x] 2.4 Configure permission groups (read, edit, command, browser, mcp)
- [x] 2.5 Create `mcp.json` with Open Horizon Exchange MCP server configuration
- [x] 2.6 Configure stdio type MCP server pointing to custom Node.js implementation
- [x] 2.7 Add alwaysAllow list for read-only operations (list_nodes, get_node, list_services, list_agreements)

## 2a. MCP Server Implementation

- [x] 2a.1 Create `.bob/mcp-servers/oh-exchange` directory structure
- [x] 2a.2 Analyze `hzn` CLI source code to extract Exchange API patterns
- [x] 2a.3 Document REST API endpoints, methods, and authentication from CLI analysis
- [x] 2a.4 Implement Exchange API client with authentication handling
- [x] 2a.5 Implement read-only tools (list_nodes, get_node, list_services, get_service, list_agreements, get_agreement)
- [x] 2a.6 Implement write tools (create_service, update_service, publish_service, create_policy, update_policy)
- [x] 2a.7 Extract and implement input validation rules from CLI source
- [x] 2a.8 Extract and implement business logic for multi-step operations from CLI source
- [x] 2a.9 Implement error handling and response parsing based on CLI patterns
- [x] 2a.10 Add input sanitization for organization names, service URLs, version strings, and policy JSON
- [x] 2a.11 Create package.json with required dependencies (node-fetch, etc.)
- [x] 2a.12 Test MCP server tools independently before integration

## 2b. Credential Management and Authorization

- [x] 2b.1 Implement environment variable validation on MCP server startup
- [x] 2b.2 Validate required variables: HZN_EXCHANGE_URL, HZN_FSS_CSSURL, HZN_AGBOT_URL, HZN_ORG_ID, HZN_EXCHANGE_USER_AUTH
- [x] 2b.3 Parse HZN_EXCHANGE_USER_AUTH to extract username and credential format (password vs apikey)
- [x] 2b.4 Implement authentication test API call to /orgs/{org}/users/{username}
- [x] 2b.5 Extract user permission level from API response (admin, hubAdmin flags)
- [x] 2b.6 Cache discovered permissions for operation authorization checks
- [x] 2b.7 Implement authorization check function for each tool operation
- [x] 2b.8 Map operations to required permission levels (hubAdmin, admin, regular user)
- [x] 2b.9 Implement 401/403 error detection and user-friendly error messages
- [x] 2b.10 Add credential masking in all log output and error messages
- [x] 2b.11 Implement rate limiting for authentication attempts
- [x] 2b.12 Add support for credential rotation without server restart
- [x] 2b.13 Create authorization matrix documentation (operation → required permission)

## 2c. Configuration File Management

- [x] 2c.1 Define configuration file schema for `.bob/oh-config.json`
- [x] 2c.2 Implement configuration loader with precedence: env vars > workspace config > user config
- [x] 2c.3 Implement profile management (create, list, switch, delete profiles)
- [x] 2c.4 Add profile validation before switching (check required fields, test connectivity)
- [x] 2c.5 Implement profile inheritance (base profile with overrides)
- [x] 2c.6 Add credential reference support (env:VAR_NAME, keychain:KEY_NAME)
- [x] 2c.7 Implement secure credential storage with file permissions (600)
- [x] 2c.8 Add configuration hot-reload when profile switches
- [x] 2c.9 Create default .gitignore entries for config files
- [x] 2c.10 Implement remote node configuration schema (host, sshUser, sshKeyPath, agentType, containerName)
- [x] 2c.11 Add SSH connectivity validation for remote nodes
- [x] 2c.12 Implement SSH connection caching for performance
- [x] 2c.13 Add remote agent type detection (native systemd vs container)
- [x] 2c.14 Implement remote command execution helpers (native vs container patterns)
- [x] 2c.15 Add audit logging for profile switches and credential access
- [x] 2c.16 Create configuration management tools (list_profiles, switch_profile, validate_profile)
- [x] 2c.17 Document configuration file format and security practices

## 3. Agent Installation Rules (01-agent-install.md)

- [x] 3.1 Create rule file with Skill and Purpose sections
- [x] 3.2 Add rules for multi-platform agent installation (Linux, macOS, containers)
- [x] 3.3 Add rules for agent registration workflow (pattern and policy-based)
- [x] 3.4 Add rules for agent environment configuration (Exchange URL, credentials)
- [x] 3.5 Add rules for agent lifecycle operations (start, stop, status, logs)
- [x] 3.6 Add rules for agent upgrades and version verification
- [x] 3.7 Include Notes section with common pitfalls and best practices

## 4. Service Lifecycle Rules (02-service-lifecycle.md)

- [x] 4.1 Create rule file with Skill and Purpose sections
- [x] 4.2 Add rules for service definition creation (service.definition.json template)
- [x] 4.3 Add rules for local service build and testing (hzn dev service commands)
- [x] 4.4 Add rules for service publishing to Exchange with signing
- [x] 4.5 Add rules for service dependency management
- [x] 4.6 Add rules for semantic versioning (patch, minor, major)
- [x] 4.7 Add rules for service removal and deprecation
- [x] 4.8 Include Notes section with versioning guidelines

## 5. Deployment Management Rules (03-deployment.md)

- [x] 5.1 Create rule file with Skill and Purpose sections
- [x] 5.2 Add rules for deployment policy creation and constraints
- [x] 5.3 Add rules for deployment pattern management
- [x] 5.4 Add rules for node policy configuration and updates
- [x] 5.5 Add rules for monitoring service deployments and agreements
- [x] 5.6 Add rules for handling deployment failures and diagnostics
- [x] 5.7 Add rules for service upgrades and rollback strategies
- [x] 5.8 Include Notes section with policy best practices

## 6. Debugging Workflows Rules (04-debugging.md)

- [x] 6.1 Create rule file with Skill and Purpose sections
- [x] 6.2 Add rules for diagnosing agent connectivity issues
- [x] 6.3 Add rules for analyzing agreement formation failures
- [x] 6.4 Add rules for inspecting service container status and logs
- [x] 6.5 Add rules for accessing and filtering agent logs
- [x] 6.6 Add rules for debugging agreement lifecycle events
- [x] 6.7 Add rules for troubleshooting service update issues
- [x] 6.8 Add rules for validating policy syntax and references
- [x] 6.9 Include Notes section with common debugging scenarios

## 7. Hub Administration Rules (05-hub-admin.md)

- [x] 7.1 Create rule file with Skill and Purpose sections
- [x] 7.2 Add rules for Exchange user management (create, list, update, remove)
- [x] 7.3 Add rules for Exchange organization management
- [x] 7.4 Add rules for querying Exchange resources (nodes, services, policies)
- [x] 7.5 Add rules for monitoring Exchange health and connectivity
- [x] 7.6 Add rules for node lifecycle management (registration, cleanup)
- [x] 7.7 Add rules for auditing Exchange activity
- [x] 7.8 Add rules for managing Exchange credentials and API keys
- [x] 7.9 Include Notes section with security best practices

## 8. Testing and Validation

- [x] 8.1 Test mode activation in Bob Shell
- [x] 8.2 Verify mode appears in mode switcher with correct name and description
- [x] 8.3 Test MCP server connectivity with `hzn version` command
- [x] 8.4 Verify alwaysAllow tools execute without approval prompts
- [x] 8.5 Test rule file loading without errors
- [x] 8.6 Validate agent installation workflow guidance
- [x] 8.7 Validate service lifecycle workflow guidance
- [x] 8.8 Validate deployment management workflow guidance
- [x] 8.9 Validate debugging workflow guidance
- [x] 8.10 Validate hub administration workflow guidance

## 9. Documentation

- [x] 9.1 Create README.md in `.bob` directory explaining mode structure
- [x] 9.2 Document required environment variables (HZN_EXCHANGE_URL, HZN_EXCHANGE_USER_AUTH)
- [x] 9.3 Document mode activation and usage instructions
- [x] 9.4 Add examples for common workflows in each domain
- [x] 9.5 Document troubleshooting steps for mode setup issues
