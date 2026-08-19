#!/usr/bin/env bash
# check-prereqs.sh — validate all prerequisites for the oh-bob-mode workspace
# Usage: bash scripts/check-prereqs.sh
set -uo pipefail

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BOLD='\033[1m'; RESET='\033[0m'

pass() { echo -e "  ${GREEN}✔${RESET}  $*"; }
fail() { echo -e "  ${RED}✘${RESET}  $*"; FAILED=$((FAILED + 1)); }
warn() { echo -e "  ${YELLOW}~${RESET}  $*"; }
header() { echo -e "\n${BOLD}$*${RESET}"; }

FAILED=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── 1. Node.js ────────────────────────────────────────────────────────────────
header "1. Node.js"

if command -v node &>/dev/null; then
  NODE_VERSION="$(node --version 2>/dev/null | sed 's/v//')"
  NODE_MAJOR="${NODE_VERSION%%.*}"
  if [[ "${NODE_MAJOR}" -ge 18 ]]; then
    pass "node v${NODE_VERSION} (≥ 18 required)"
  else
    fail "node v${NODE_VERSION} is too old — need ≥ 18.0.0"
  fi
else
  fail "node not found — install from https://nodejs.org or via nvm"
fi

# ── 2. MCP server ─────────────────────────────────────────────────────────────
header "2. MCP server"

MCP_DIR="${REPO_ROOT}/.bob/mcp-servers/oh-exchange"
MCP_INDEX="${MCP_DIR}/index.js"
MCP_MODULES="${MCP_DIR}/node_modules"

if [[ -f "${MCP_INDEX}" ]]; then
  pass "index.js present"
else
  fail "index.js missing at ${MCP_INDEX}"
fi

if command -v node &>/dev/null && [[ -f "${MCP_INDEX}" ]]; then
  if node --check "${MCP_INDEX}" 2>/dev/null; then
    pass "index.js syntax OK"
  else
    fail "index.js has syntax errors — run: node --check ${MCP_INDEX}"
  fi
fi

if [[ -d "${MCP_MODULES}/@modelcontextprotocol" && -d "${MCP_MODULES}/node-fetch" ]]; then
  pass "npm dependencies installed"
else
  fail "npm dependencies missing — run: cd ${MCP_DIR} && npm install"
fi

# ── 3. Environment variables ──────────────────────────────────────────────────
header "3. Environment variables (required)"

check_var() {
  local var="$1"
  if [[ -n "${!var:-}" ]]; then
    # Mask the value — show only first 4 chars then ***
    local val="${!var}"
    local masked="${val:0:4}***"
    pass "${var}=${masked}"
  else
    fail "${var} is not set"
  fi
}

check_var HZN_EXCHANGE_URL
check_var HZN_ORG_ID
check_var HZN_EXCHANGE_USER_AUTH

# Validate auth format: must contain a colon.
# Standard Open Horizon: username:password or username:apikey
# IEAM additionally supports: apikey:<api-key-value>  (literal "apikey" as username)
if [[ -n "${HZN_EXCHANGE_USER_AUTH:-}" ]]; then
  if [[ "${HZN_EXCHANGE_USER_AUTH}" == *":"* ]]; then
    AUTH_USER="${HZN_EXCHANGE_USER_AUTH%%:*}"
    if [[ "${AUTH_USER}" == "apikey" ]]; then
      pass "HZN_EXCHANGE_USER_AUTH format OK (IEAM apikey account)"
    else
      pass "HZN_EXCHANGE_USER_AUTH format OK (username:credential)"
    fi
  else
    fail "HZN_EXCHANGE_USER_AUTH must be in format 'username:apikey' or 'apikey:<key>' — no colon found"
  fi
fi

header "3b. Environment variables (optional)"

opt_var() {
  local var="$1"; local desc="$2"
  if [[ -n "${!var:-}" ]]; then
    pass "${var} is set  (${desc})"
  else
    warn "${var} not set  (${desc} — optional)"
  fi
}

opt_var HZN_FSS_CSSURL   "CSS model management"
opt_var HZN_AGBOT_URL    "agreement bot"

# ── 4. Exchange connectivity ──────────────────────────────────────────────────
header "4. Exchange connectivity"

# Build curl TLS args: prefer HZN_MGMT_HUB_CERT_PATH, fall back to -k for
# self-signed certs, use default trust store otherwise.
CURL_TLS_ARGS=()
if [[ -n "${HZN_MGMT_HUB_CERT_PATH:-}" && -f "${HZN_MGMT_HUB_CERT_PATH}" ]]; then
  CURL_TLS_ARGS=(--cacert "${HZN_MGMT_HUB_CERT_PATH}")
  pass "TLS: using CA cert from HZN_MGMT_HUB_CERT_PATH (${HZN_MGMT_HUB_CERT_PATH})"
elif [[ -n "${HZN_MGMT_HUB_CERT_PATH:-}" ]]; then
  warn "HZN_MGMT_HUB_CERT_PATH is set but file not found: ${HZN_MGMT_HUB_CERT_PATH} — falling back to -k"
  CURL_TLS_ARGS=(-k)
else
  warn "HZN_MGMT_HUB_CERT_PATH not set — using system trust store (may fail for self-signed certs)"
fi

if [[ -n "${HZN_EXCHANGE_URL:-}" && -n "${HZN_ORG_ID:-}" && -n "${HZN_EXCHANGE_USER_AUTH:-}" ]]; then
  # Use /admin/status with credentials — works on both Open Horizon and IEAM.
  # Auth header requires org-scoped Basic auth: orgId/username:credential
  STATUS_URL="${HZN_EXCHANGE_URL%/}/admin/status"
  BASIC_AUTH="${HZN_ORG_ID}/${HZN_EXCHANGE_USER_AUTH}"
  HTTP_STATUS="$(curl -s --max-time 5 "${CURL_TLS_ARGS[@]}" \
    -u "${BASIC_AUTH}" \
    -o /tmp/.oh-check-body -w "%{http_code}" \
    "${STATUS_URL}" 2>/dev/null || echo "000")"
  if [[ "${HTTP_STATUS}" == "200" ]]; then
    # Extract the msg field if present, otherwise show raw (truncated)
    MSG="$(python3 -c "import sys,json; d=json.load(open('/tmp/.oh-check-body')); print(d.get('msg',''))" 2>/dev/null || true)"
    [[ -z "${MSG}" ]] && MSG="$(cat /tmp/.oh-check-body 2>/dev/null | head -c 80 || true)"
    pass "Exchange reachable and authenticated  (${MSG})"
  elif [[ "${HTTP_STATUS}" == "401" || "${HTTP_STATUS}" == "403" ]]; then
    fail "Exchange reachable but authentication failed (HTTP ${HTTP_STATUS}) — check HZN_EXCHANGE_USER_AUTH and HZN_ORG_ID"
  elif [[ "${HTTP_STATUS}" == "000" ]]; then
    fail "Exchange not reachable at ${STATUS_URL} — connection failed (check URL and network)"
  else
    fail "Exchange returned unexpected HTTP ${HTTP_STATUS} at ${STATUS_URL}"
  fi
  rm -f /tmp/.oh-check-body
elif [[ -n "${HZN_EXCHANGE_URL:-}" ]]; then
  warn "Skipping authenticated connectivity check — HZN_ORG_ID or HZN_EXCHANGE_USER_AUTH not set"
else
  warn "Skipping connectivity check — HZN_EXCHANGE_URL is not set"
fi

# ── 5. Optional tools ─────────────────────────────────────────────────────────
header "5. Optional tools"

if command -v hzn &>/dev/null; then
  HZN_VER="$(hzn version 2>/dev/null || true)"
  HZN_VER="$(echo "${HZN_VER}" | head -1)"
  pass "hzn CLI found  (${HZN_VER})"
else
  warn "hzn not found — required for local agent commands (not needed for MCP tools)"
fi

if command -v openspec &>/dev/null; then
  OS_VER="$(openspec --version 2>/dev/null || true)"
  OS_VER="$(echo "${OS_VER}" | head -1)"
  pass "openspec CLI found  (${OS_VER})"
else
  warn "openspec not found — required for /opsx-* slash commands  (npm install -g openspec)"
fi

if command -v oh-cred &>/dev/null; then
  OH_CRED_LIST="$(oh-cred list 2>&1 || true)"
  OH_CRED_RC=$?
  if echo "${OH_CRED_LIST}" | grep -q "bao not installed"; then
    fail "oh-cred found but 'bao' CLI is not installed — install OpenBao first"
  elif echo "${OH_CRED_LIST}" | grep -q "AppRole login failed\|vault sealed"; then
    fail "oh-cred found but vault is sealed or AppRole login failed — run: bao status"
  elif [[ "${OH_CRED_RC}" -ne 0 ]]; then
    fail "oh-cred found but 'oh-cred list' failed — check vault connectivity"
  else
    HUB_COUNT="$(echo "${OH_CRED_LIST}" | grep -c '^[^ ]' 2>/dev/null || echo 0)"
    pass "oh-cred found and vault reachable  (${HUB_COUNT} hub(s) configured)"
    if [[ -n "${OH_CRED_LIST}" ]]; then
      echo "${OH_CRED_LIST}" | sed 's/^/       /'
    fi
  fi
else
  warn "oh-cred not found — recommended for multi-hub credential hygiene"
  warn "  See: https://github.com/joewxboy/oh-cred"
  if command -v oh-cred &>/dev/null || [[ -n "${HZN_EXCHANGE_USER_AUTH:-}" ]]; then
    :  # env-var path is active — no further warning needed
  fi
fi

# ── 6. Credentials file permissions ──────────────────────────────────────────
header "6. Credential file security"

CREDS_FILE="${HOME}/.hzn/credentials.env"
if [[ -f "${CREDS_FILE}" ]]; then
  PERMS="$(stat -f '%OLp' "${CREDS_FILE}" 2>/dev/null || stat -c '%a' "${CREDS_FILE}" 2>/dev/null)"
  if [[ "${PERMS}" == "600" ]]; then
    pass "~/.hzn/credentials.env permissions are 600"
  else
    fail "~/.hzn/credentials.env permissions are ${PERMS} — run: chmod 600 ${CREDS_FILE}"
  fi
else
  warn "~/.hzn/credentials.env not found — see PREREQUISITES.md for setup"
fi

# ── 7. .gitignore coverage ────────────────────────────────────────────────────
header "7. .gitignore coverage"

GITIGNORE="${REPO_ROOT}/.gitignore"
if [[ ! -f "${GITIGNORE}" ]]; then
  fail ".gitignore not found — credential files could be accidentally committed"
else
  pass ".gitignore present"
  # Check that critical patterns are covered
  for pattern in "*.env" "*.creds" "oh-config.json" "*.crt" "*.pem" "node_modules"; do
    if grep -q "${pattern}" "${GITIGNORE}" 2>/dev/null; then
      pass "  .gitignore covers: ${pattern}"
    else
      fail "  .gitignore missing pattern: ${pattern}"
    fi
  done
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [[ "${FAILED}" -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}All checks passed.${RESET} You're ready to use the oh-dev mode."
else
  echo -e "${RED}${BOLD}${FAILED} check(s) failed.${RESET} See details above and consult PREREQUISITES.md."
  exit 1
fi
