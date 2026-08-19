# Prerequisites

Everything you need before activating the **Open Horizon Development** mode in Bob Shell.

Run the automated check at any time:

```bash
bash scripts/check-prereqs.sh
```

---

## Required

### Node.js ≥ 18.0.0

The MCP server (`oh-exchange`) is an ESM Node.js module and requires Node 18+.

```bash
node --version   # must be v18.0.0 or higher
```

Install via [nvm](https://github.com/nvm-sh/nvm) (recommended) or from [nodejs.org](https://nodejs.org/).

### MCP server dependencies installed

```bash
cd .bob/mcp-servers/oh-exchange
npm install
```

Dependencies (`@modelcontextprotocol/sdk`, `node-fetch`) are recorded in
[`.bob/mcp-servers/oh-exchange/package.json`](.bob/mcp-servers/oh-exchange/package.json).
Re-run `npm install` after pulling changes that update that file.

### Exchange environment variables

The MCP server reads three required variables at startup and fails immediately if any
are missing:

| Variable | Description | Example |
|----------|-------------|---------|
| `HZN_EXCHANGE_URL` | Base URL of your Exchange instance | `http://exchange.example.com:3090/v1` |
| `HZN_ORG_ID` | Your organization name | `myorg` |
| `HZN_EXCHANGE_USER_AUTH` | Credentials — see format note below | `admin:abc123` or `apikey:abc123` |

**Credential format:**
- **Open Horizon:** `username:password` or `username:apikey-value`
- **IEAM:** also supports `apikey:<api-key-value>` where `apikey` is a literal username
  prefix for API key accounts (as opposed to named user accounts)

**Credential setup — choose one approach:**

#### Option A: oh-cred (recommended for multi-hub and team use)

[`oh-cred`](https://github.com/joewxboy/oh-cred) is a vault-backed credential broker
that injects `HZN_*` variables into a child process without ever printing or writing
them. Credentials cannot end up in terminal scrollback, agent transcripts, log files,
or `ps` output.

**Prerequisites:** OpenBao (or HashiCorp Vault) running locally, `bao` CLI in PATH, and
the `oh-cred` script installed. See
[oh-cred INSTALL.md](https://github.com/joewxboy/oh-cred/blob/main/docs/INSTALL.md)
for vault setup.

Once configured, wrap any command — including your Bob session:

```bash
# Run a single hzn command with credentials injected
oh-cred run <hub> <org> <user> -- hzn exchange node list

# Start a Bob session so the MCP server inherits credentials
oh-cred run <hub> <org> <user> -- bob
```

`oh-cred` sets `HZN_ORG_ID`, `HZN_EXCHANGE_USER_AUTH`, `HZN_EXCHANGE_URL`, and
`HZN_FSS_CSSURL` automatically from the vault entry for that hub/org/user.

Verify all stored credentials are live at any time (no secrets printed):

```bash
oh-cred verify-all
```

#### Option B: Environment variables (simple, single-hub)

Fine for personal single-hub setups. Does not provide audit, rotation tracking, or
multi-hub isolation.

```bash
mkdir -p ~/.hzn
cat > ~/.hzn/credentials.env <<'EOF'
export HZN_EXCHANGE_URL="http://your-exchange:3090/v1"
export HZN_ORG_ID="myorg"
export HZN_EXCHANGE_USER_AUTH="admin:your-api-key"
EOF
chmod 600 ~/.hzn/credentials.env

# Add to ~/.zshrc or ~/.bashrc:
source ~/.hzn/credentials.env
```

> **Security:** Never commit `credentials.env` or any file containing these values.
> The repo `.gitignore` already covers `*.env` and `oh-config.json`.

Optional variables (enable additional MCP features):

| Variable | Description |
|----------|-------------|
| `HZN_FSS_CSSURL` | CSS model management service URL |
| `HZN_AGBOT_URL` | Agreement bot URL |
| `HZN_MGMT_HUB_CERT_PATH` | Path to CA cert for self-signed Exchange TLS |

### Reachable Exchange instance

The MCP server authenticates against the Exchange at startup. The URL set in
`HZN_EXCHANGE_URL` must be reachable from your machine. If your Exchange uses a
self-signed certificate, set `HZN_MGMT_HUB_CERT_PATH` to the CA cert path — the MCP
server and `check-prereqs.sh` both use it automatically:

```bash
export HZN_MGMT_HUB_CERT_PATH="/tmp/agent-install.crt"
```

---

## Optional (but recommended)

### `hzn` CLI

Required for local agent commands (`hzn dev service start`, `hzn eventlog list`, etc.).
Not needed for MCP tool operations, but most skill guidance references `hzn` commands.

```bash
hzn version   # verify installation
```

Install: follow the [Open Horizon agent install guide](https://open-horizon.github.io/quick-start).

### oh-cred (credential broker)

See [Option A](#option-a-oh-cred-recommended-for-multi-hub-and-team-use) above.
Requires OpenBao/Vault to be set up first — see
[oh-cred INSTALL.md](https://github.com/joewxboy/oh-cred/blob/main/docs/INSTALL.md).

### OpenSpec CLI

Required for the `/opsx-*` slash commands and OpenSpec skills.

```bash
npm install -g openspec
openspec --version
```

### SSH key access to edge nodes

Required only when using the `oh-agent-install` skill to deploy agents remotely.
The target node must accept key-based auth (no password prompt) for a user with
passwordless `sudo`:

```bash
ssh -o BatchMode=yes user@edge-node 'echo ok'  # must print "ok" without a password
```

---

## Quick Validation

After completing setup, run the automated checker:

```bash
bash scripts/check-prereqs.sh
```

Or verify manually:

```bash
node --version                                       # ≥ v18
node --check .bob/mcp-servers/oh-exchange/index.js  # syntax OK
ls .bob/mcp-servers/oh-exchange/node_modules/.bin   # dependencies installed
echo $HZN_EXCHANGE_URL $HZN_ORG_ID $HZN_EXCHANGE_USER_AUTH  # all non-empty
curl -sf "${HZN_EXCHANGE_URL}/version"              # Exchange reachable
hzn version                                         # hzn CLI (optional)
openspec --version                                  # OpenSpec CLI (optional)
```
