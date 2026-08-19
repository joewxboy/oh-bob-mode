# AGENTS.md (Open Horizon Development Mode)

Always-on constraints for the `oh-dev` Bob Shell mode. These apply to every response
while this mode is active — they are not skill guidance, they are hard rules.

## MCP Tool Priority

- **Always prefer MCP tools over raw commands** when an Exchange operation is available as
  a tool (list_nodes, get_node, list_services, get_service, list_agreements, get_agreement,
  list_policies, get_permissions). Only fall back to `hzn` CLI or `curl` if the tool
  cannot cover the operation.
- Read-only MCP tools run without approval — never ask the user to confirm them.
- Write tools (`publish_service`, `create_policy`) require explicit user confirmation before
  executing — never auto-trigger them based on inferred intent.

## Credential Broker (oh-cred)

`oh-cred` is the sanctioned credential path for this workspace when Vault is available.
It injects `HZN_*` variables into a child process without printing them.

**Sanctioned invocation pattern:**
```
oh-cred run <hub> <org> <user> -- <command>
```

**Rules that must never be broken:**
- Never add a `--show` flag, and never suggest using `bao kv get` to extract a secret
- Do not search for credentials in `*.env` files, `/etc/environment`, `docker inspect`,
  or shell configs — if `oh-cred` cannot supply what is needed, say so and stop
- `oh-cred verify-all` is safe to run as a health check — it never prints secrets
- If `oh-cred` is not in PATH, fall back to the env-var credential path and note that
  oh-cred is the recommended path once Vault is available

## Credential and Security Rules

- **Never suggest committing credentials.** Files matching `*.env`, `*credentials*`,
  `*secret*`, and `oh-config.json` must stay out of version control. The repo `.gitignore`
  already covers these patterns — remind users to keep it in place.
- Credential format for Exchange API calls is `orgId/username:apikey` (org prefix is
  mandatory for the Authorization header). When showing examples, use this format.
- **IEAM also accepts `apikey:<key>` format** where `apikey` is a literal username prefix
  for API key accounts (distinct from named user accounts).
- API keys are preferred over passwords for all automation and non-interactive workflows.
- Credentials file at `~/.hzn/credentials.env` must be `chmod 600` — note this whenever
  helping a user create or move that file.
- If the Exchange uses a self-signed certificate, `HZN_MGMT_HUB_CERT_PATH` must be set
  to the CA cert path — the MCP server now reads it automatically.

## Exchange API Conventions

- All Exchange endpoints are org-scoped: `/orgs/{orgId}/...` — never construct a bare path.
- Service IDs in the Exchange use the format `url_version_arch`
  (e.g., `github.com/myorg/my-service_1.0.0_amd64`).
- Deployment policies live at `/orgs/{orgId}/business/policies/{policyId}`.
- When the user asks about Exchange connectivity, start with `hzn exchange status` or the
  `get_permissions` MCP tool before suggesting deeper diagnostics.

## Skill Activation

- The five domain skills are loaded on-demand by Bob — do not recite their full content
  unprompted. Activate the appropriate skill when the user's request falls into its domain:
  - `oh-agent-install` — agent installation, SSH setup, node registration
  - `oh-service-lifecycle` — service definition, build, test, publish, versioning
  - `oh-deployment` — deployment policies, patterns, node policies, agreements
  - `oh-debugging` — connectivity failures, agreement errors, container/log inspection
  - `oh-hub-admin` — users, organizations, resource auditing, credential rotation

## MCP Server Coding Rules (when editing `index.js`)

- All JS in `.bob/mcp-servers/oh-exchange/` is ESM — always `import`, never `require`.
- `console.error` for all log output — `console.log` corrupts the MCP stdio protocol.
- `ExchangeClient` is a singleton — never instantiate a second one.
- Write tools must call `this.checkPermission('admin')` before any mutating API call.
- Mask credentials in all error paths:
  `errorMsg.replace(new RegExp(this.credentials, 'g'), '***')`

## Skill and Rules File Authoring (when editing `.bob/skills/` or `.bob/rules-*/`)

- Skill frontmatter requires `name` (slug) and `description` (trigger text).
- Skill body is pure markdown — no nested frontmatter blocks.
- Keep SKILL.md under 500 lines; add a `references/` subdirectory for overflow content.
- `alwaysAllow` in `mcp.json` must only contain read-only tools — never add a write tool there.
