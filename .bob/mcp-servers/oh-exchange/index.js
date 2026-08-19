#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import https from 'node:https';
import fs from 'node:fs';

/**
 * Open Horizon Exchange MCP Server
 *
 * Provides tools for interacting with the Open Horizon Exchange API.
 * Implements authentication, authorization checking, and API operations.
 */

// ---------------------------------------------------------------------------
// Input validation helpers (tasks 2a.7, 2a.10)
// ---------------------------------------------------------------------------

/**
 * Validate semantic version string (MAJOR.MINOR.PATCH or pre-release)
 */
function validateSemver(version) {
  if (typeof version !== 'string') return false;
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9._-]+)?(\+[a-zA-Z0-9._-]+)?$/.test(version);
}

/**
 * Sanitize an organization name — only alphanumerics, hyphens, underscores
 */
function sanitizeOrgName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Organization name must be a non-empty string');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Invalid organization name "${name}": only alphanumerics, hyphens, and underscores are allowed`);
  }
  return name;
}

/**
 * Sanitize a service URL (alphanumerics, hyphens, dots, slashes)
 */
function sanitizeServiceUrl(url) {
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('Service URL must be a non-empty string');
  }
  if (!/^[a-zA-Z0-9._\-/]+$/.test(url)) {
    throw new Error(`Invalid service URL "${url}": contains disallowed characters`);
  }
  return url;
}

/**
 * Validate a service ID in Exchange format: <url>_<version>_<arch>
 * or a bare service name. Prevents path-traversal.
 */
function sanitizeServiceId(serviceId) {
  if (typeof serviceId !== 'string' || serviceId.length === 0) {
    throw new Error('Service ID must be a non-empty string');
  }
  if (serviceId.includes('..') || serviceId.includes('\0')) {
    throw new Error(`Service ID "${serviceId}" contains invalid characters`);
  }
  return serviceId.trim();
}

/**
 * Sanitize a node ID (alphanumerics, hyphens, underscores, dots)
 */
function sanitizeNodeId(nodeId) {
  if (typeof nodeId !== 'string' || nodeId.length === 0) {
    throw new Error('Node ID must be a non-empty string');
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(nodeId)) {
    throw new Error(`Invalid node ID "${nodeId}": only alphanumerics, dots, hyphens, and underscores are allowed`);
  }
  return nodeId;
}

/**
 * Sanitize a policy ID
 */
function sanitizePolicyId(policyId) {
  if (typeof policyId !== 'string' || policyId.length === 0) {
    throw new Error('Policy ID must be a non-empty string');
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(policyId)) {
    throw new Error(`Invalid policy ID "${policyId}": only alphanumerics, dots, hyphens, and underscores are allowed`);
  }
  return policyId;
}

/**
 * Validate a policy definition object has required fields
 */
function validatePolicyDefinition(policy) {
  if (typeof policy !== 'object' || policy === null) {
    throw new Error('Policy definition must be a JSON object');
  }
  // Basic structure check — service or properties/constraints
  if (!policy.service && !policy.properties && !policy.constraints) {
    throw new Error('Policy definition must include at least one of: service, properties, or constraints');
  }
  return policy;
}

/**
 * Validate a service definition object has required Exchange fields
 */
function validateServiceDefinition(svc) {
  if (typeof svc !== 'object' || svc === null) {
    throw new Error('Service definition must be a JSON object');
  }
  const required = ['url', 'version', 'arch'];
  const missing = required.filter(f => !svc[f]);
  if (missing.length > 0) {
    throw new Error(`Service definition missing required fields: ${missing.join(', ')}`);
  }
  if (!validateSemver(svc.version)) {
    throw new Error(`Service version "${svc.version}" is not valid semver (expected MAJOR.MINOR.PATCH)`);
  }
  sanitizeServiceUrl(svc.url);
  return svc;
}

// ---------------------------------------------------------------------------
// Rate-limiting guard for auth attempts (task 2b.11)
// ---------------------------------------------------------------------------
const AUTH_RATE = { count: 0, windowStart: Date.now(), limit: 5, windowMs: 60_000 };

function checkAuthRateLimit() {
  const now = Date.now();
  if (now - AUTH_RATE.windowStart > AUTH_RATE.windowMs) {
    AUTH_RATE.count = 0;
    AUTH_RATE.windowStart = now;
  }
  AUTH_RATE.count++;
  if (AUTH_RATE.count > AUTH_RATE.limit) {
    throw new Error('Too many authentication attempts. Please wait before retrying.');
  }
}

// ---------------------------------------------------------------------------
// ExchangeClient
// ---------------------------------------------------------------------------

class ExchangeClient {
  constructor() {
    this.baseUrl = null;
    this.orgId = null;
    this.username = null;
    this.credentials = null;
    this.userPermissions = null;
    this.initialized = false;
    this.httpsAgent = null;
  }

  /**
   * Initialize and validate environment configuration
   */
  async initialize() {
    // Validate required environment variables
    const required = ['HZN_EXCHANGE_URL', 'HZN_ORG_ID', 'HZN_EXCHANGE_USER_AUTH'];
    const missing = required.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    this.baseUrl = process.env.HZN_EXCHANGE_URL.replace(/\/$/, '');
    this.orgId = sanitizeOrgName(process.env.HZN_ORG_ID);
    
    // Parse credentials
    const auth = process.env.HZN_EXCHANGE_USER_AUTH;
    const parts = auth.split(':');
    if (parts.length < 2) {
      throw new Error('HZN_EXCHANGE_USER_AUTH must be in format "username:password" or "username:apikey"');
    }
    
    this.username = parts[0];
    this.credentials = parts.slice(1).join(':'); // Handle passwords with colons

    // Configure custom HTTPS agent when Exchange uses a self-signed cert.
    // Only applies to https: URLs — silently skipped for plain http: transports.
    const certPath = process.env.HZN_MGMT_HUB_CERT_PATH;
    const isHttps = this.baseUrl.startsWith('https:');
    if (certPath && isHttps) {
      if (!fs.existsSync(certPath)) {
        throw new Error(
          `HZN_MGMT_HUB_CERT_PATH is set but file not found: ${certPath}`
        );
      }
      const ca = fs.readFileSync(certPath);
      this.httpsAgent = new https.Agent({ ca });
      console.error(`TLS: using CA cert from HZN_MGMT_HUB_CERT_PATH (${certPath})`);
    } else if (certPath && !isHttps) {
      console.error(`TLS: HZN_MGMT_HUB_CERT_PATH is set but Exchange URL is HTTP — cert not used`);
    }

    // Rate-limit authentication attempts (task 2b.11)
    checkAuthRateLimit();

    // Test authentication and get permissions
    await this.discoverPermissions();
    
    this.initialized = true;
  }

  /**
   * Reload credentials from environment without server restart (task 2b.12).
   * Update env vars then call reload_credentials tool to apply them.
   */
  async reloadCredentials() {
    this.initialized = false;
    this.userPermissions = null;
    await this.initialize();
    console.error('Credentials reloaded from environment');
  }

  /**
   * Discover user permissions by querying user info
   */
  async discoverPermissions() {
    try {
      const response = await this.makeRequest(`/orgs/${this.orgId}/users/${this.username}`, 'GET');
      
      if (response.users && response.users[`${this.orgId}/${this.username}`]) {
        const user = response.users[`${this.orgId}/${this.username}`];
        this.userPermissions = {
          admin: user.admin || false,
          hubAdmin: user.hubAdmin || false,
          username: this.username,
          orgId: this.orgId
        };
      } else {
        throw new Error('Unable to retrieve user information');
      }
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Exchange API
   */
  async makeRequest(path, method = 'GET', body = null) {
    if (!this.initialized && path !== `/orgs/${this.orgId}/users/${this.username}`) {
      await this.initialize();
    }

    const url = `${this.baseUrl}${path}`;
    const auth = Buffer.from(`${this.orgId}/${this.username}:${this.credentials}`).toString('base64');
    
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      ...(this.httpsAgent ? { agent: this.httpsAgent } : {})
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.msg || errorJson.message || errorMsg;
      } catch {
        errorMsg = errorText || errorMsg;
      }
      
      // Mask credentials in error messages
      errorMsg = errorMsg.replace(new RegExp(this.credentials, 'g'), '***');
      
      throw new Error(errorMsg);
    }

    return await response.json();
  }

  /**
   * Check if user has required permission for operation
   */
  checkPermission(requiredLevel) {
    if (!this.userPermissions) {
      throw new Error('User permissions not initialized');
    }

    switch (requiredLevel) {
      case 'hubAdmin':
        if (!this.userPermissions.hubAdmin) {
          throw new Error('This operation requires hub administrator privileges');
        }
        break;
      case 'admin':
        if (!this.userPermissions.admin && !this.userPermissions.hubAdmin) {
          throw new Error('This operation requires organization administrator privileges');
        }
        break;
      case 'user':
        // All authenticated users have this level
        break;
      default:
        throw new Error(`Unknown permission level: ${requiredLevel}`);
    }
  }

  /**
   * List nodes in organization
   */
  async listNodes() {
    const response = await this.makeRequest(`/orgs/${this.orgId}/nodes`, 'GET');
    return response;
  }

  /**
   * Get specific node details
   */
  async getNode(nodeId) {
    const safeId = sanitizeNodeId(nodeId);
    const response = await this.makeRequest(`/orgs/${this.orgId}/nodes/${safeId}`, 'GET');
    return response;
  }

  /**
   * List services in organization
   */
  async listServices() {
    const response = await this.makeRequest(`/orgs/${this.orgId}/services`, 'GET');
    return response;
  }

  /**
   * Get specific service details
   */
  async getService(serviceId) {
    const safeId = sanitizeServiceId(serviceId);
    const response = await this.makeRequest(`/orgs/${this.orgId}/services/${safeId}`, 'GET');
    return response;
  }

  /**
   * List agreements for a node
   */
  async listAgreements(nodeId) {
    const safeId = sanitizeNodeId(nodeId);
    const response = await this.makeRequest(`/orgs/${this.orgId}/nodes/${safeId}/agreements`, 'GET');
    return response;
  }

  /**
   * Get specific agreement details
   */
  async getAgreement(nodeId, agreementId) {
    const safeNodeId = sanitizeNodeId(nodeId);
    if (typeof agreementId !== 'string' || agreementId.length === 0) {
      throw new Error('Agreement ID must be a non-empty string');
    }
    const response = await this.makeRequest(`/orgs/${this.orgId}/nodes/${safeNodeId}/agreements/${encodeURIComponent(agreementId)}`, 'GET');
    return response;
  }

  /**
   * Create or update a service in the Exchange
   */
  async publishService(serviceId, serviceDefinition) {
    this.checkPermission('admin');
    const safeId = sanitizeServiceId(serviceId);
    validateServiceDefinition(serviceDefinition);
    const response = await this.makeRequest(`/orgs/${this.orgId}/services/${safeId}`, 'PUT', serviceDefinition);
    return response;
  }

  /**
   * Create or update a deployment policy
   */
  async createPolicy(policyId, policyDefinition) {
    this.checkPermission('admin');
    const safeId = sanitizePolicyId(policyId);
    validatePolicyDefinition(policyDefinition);
    const response = await this.makeRequest(`/orgs/${this.orgId}/business/policies/${safeId}`, 'PUT', policyDefinition);
    return response;
  }

  /**
   * List deployment policies
   */
  async listPolicies() {
    const response = await this.makeRequest(`/orgs/${this.orgId}/business/policies`, 'GET');
    return response;
  }

  /**
   * Get user permissions info
   */
  getPermissions() {
    return this.userPermissions;
  }
}

// Create Exchange client instance
const exchangeClient = new ExchangeClient();

// Create MCP server
const server = new Server(
  {
    name: 'open-horizon-exchange',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_nodes',
        description: 'List all nodes registered in the organization. Returns node IDs, status, and basic metadata.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_node',
        description: 'Get detailed information about a specific node including configuration, policy, and status.',
        inputSchema: {
          type: 'object',
          properties: {
            nodeId: {
              type: 'string',
              description: 'The node ID to retrieve',
            },
          },
          required: ['nodeId'],
        },
      },
      {
        name: 'list_services',
        description: 'List all services published in the organization. Returns service URLs, versions, and architectures.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_service',
        description: 'Get detailed information about a specific service including deployment configuration and dependencies.',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: {
              type: 'string',
              description: 'The service ID (URL_version_arch format)',
            },
          },
          required: ['serviceId'],
        },
      },
      {
        name: 'list_agreements',
        description: 'List all agreements for a specific node. Shows active service deployments and their status.',
        inputSchema: {
          type: 'object',
          properties: {
            nodeId: {
              type: 'string',
              description: 'The node ID to list agreements for',
            },
          },
          required: ['nodeId'],
        },
      },
      {
        name: 'get_agreement',
        description: 'Get detailed information about a specific agreement including terms and current state.',
        inputSchema: {
          type: 'object',
          properties: {
            nodeId: {
              type: 'string',
              description: 'The node ID',
            },
            agreementId: {
              type: 'string',
              description: 'The agreement ID',
            },
          },
          required: ['nodeId', 'agreementId'],
        },
      },
      {
        name: 'publish_service',
        description: 'Publish or update a service in the Exchange. Requires admin permissions.',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: {
              type: 'string',
              description: 'The service ID (URL_version_arch format)',
            },
            serviceDefinition: {
              type: 'object',
              description: 'The complete service definition JSON',
            },
          },
          required: ['serviceId', 'serviceDefinition'],
        },
      },
      {
        name: 'create_policy',
        description: 'Create or update a deployment policy. Requires admin permissions.',
        inputSchema: {
          type: 'object',
          properties: {
            policyId: {
              type: 'string',
              description: 'The policy ID',
            },
            policyDefinition: {
              type: 'object',
              description: 'The complete policy definition JSON',
            },
          },
          required: ['policyId', 'policyDefinition'],
        },
      },
      {
        name: 'list_policies',
        description: 'List all deployment policies in the organization.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_permissions',
        description: 'Get current user permissions and authorization level.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'reload_credentials',
        description: 'Reload credentials from environment variables without restarting the server. Use after rotating credentials (updating HZN_EXCHANGE_USER_AUTH in the environment).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Initialize client if not already done
    if (!exchangeClient.initialized) {
      await exchangeClient.initialize();
    }

    switch (name) {
      case 'list_nodes': {
        const result = await exchangeClient.listNodes();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_node': {
        const result = await exchangeClient.getNode(args.nodeId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list_services': {
        const result = await exchangeClient.listServices();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_service': {
        const result = await exchangeClient.getService(args.serviceId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list_agreements': {
        const result = await exchangeClient.listAgreements(args.nodeId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_agreement': {
        const result = await exchangeClient.getAgreement(args.nodeId, args.agreementId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'publish_service': {
        const result = await exchangeClient.publishService(args.serviceId, args.serviceDefinition);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_policy': {
        const result = await exchangeClient.createPolicy(args.policyId, args.policyDefinition);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list_policies': {
        const result = await exchangeClient.listPolicies();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_permissions': {
        const result = exchangeClient.getPermissions();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'reload_credentials': {
        await exchangeClient.reloadCredentials();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Credentials reloaded from environment variables',
                permissions: exchangeClient.getPermissions(),
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Open Horizon Exchange MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
