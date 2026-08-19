# Plan: oh-cred Integration for Credential Hygiene

## Overview

Integrate [`oh-cred`](https://github.com/joewxboy/oh-cred) as the sanctioned credential
broker for the `oh-bob-mode` workspace. `oh-cred` is a thin Bash CLI over
OpenBao/HashiCorp Vault that injects `HZN_*` credentials into child processes without
ever printing, writing, or passing them as arguments.

This plan also closes two pre-existing gaps uncovered during the prerequisite work:
- No `.gitignore` at the repo root (critical — credential files could be committed)
- MCP server does not honour `HZN_MGMT_HUB_CERT_PATH` for its own TLS calls

**Confirmed scope (from user):**
- OpenBao/Vault and `oh-cred` are not yet installed — oh-cred is the target end state,
  not the current state. Documentation and rules should frame it as the recommended path
  once Vault is running, with env vars as the current working fallback.
- **Task 2 (MCP server TLS) is blocking and should be implemented first.**

**Full scope:**
- Fix MCP server TLS to honour `HZN_MGMT_HUB_CERT_PATH` ← do first
- Add `.gitignore` to protect credential files
- Document oh-cred as the recommended credential path (once Vault available)
- Add oh-cred detection and usage guidance to `check-prereqs.sh`
- Update `PREREQUISITES.md` and `AGENTS.md` rules to reference oh-cred
- Add oh-cred AGENTS.md guidance so Bob knows how to use it

**Non-goals:**
- Installing or configuring OpenBao/Vault (that is oh-cred's INSTALL.md scope)
- Modifying oh-cred itself
- Removing the existing env-var credential path (it remains the current working path)

---

## Sub-Task 1: Fix MCP Server TLS (`HZN_MGMT_HUB_CERT_PATH`) ← START HERE

**Intent:** The MCP server (`index.js`) makes all Exchange API calls via `node-fetch`
but never reads `HZN_MGMT_HUB_CERT_PATH`. On deployments with a self-signed Exchange
cert (like the current IEAM setup), every MCP tool call fails with a TLS error even
though the `hzn` CLI and `check-prereqs.sh` both handle the cert correctly.

**Expected Outcomes:**
- `ExchangeClient.initialize()` reads `HZN_MGMT_HUB_CERT_PATH` when set, creates a
  custom `https.Agent` with that CA cert, and stores it on the client instance
- `makeRequest()` passes `agent: this.httpsAgent` in fetch options for every call
- If `HZN_MGMT_HUB_CERT_PATH` is set but the file doesn't exist, the server throws
  a clear error at startup (fast fail, not a cryptic TLS error mid-request)
- Server logs `TLS: using CA cert from HZN_MGMT_HUB_CERT_PATH (path)` via `console.error`

**Todo List:**
1. Import `https` from `node:https` and `fs` from `node:fs` at the top of `index.js`
2. Add `this.httpsAgent = null` to the `ExchangeClient` constructor
3. In `initialize()`, after parsing `HZN_ORG_ID`, add a block that:
   - Reads `process.env.HZN_MGMT_HUB_CERT_PATH`
   - If set: verifies the file exists (throw with clear message if not), reads it,
     creates `new https.Agent({ ca: fs.readFileSync(certPath) })`, assigns to
     `this.httpsAgent`, logs to `console.error`
4. In `makeRequest()`, spread `...(this.httpsAgent ? { agent: this.httpsAgent } : {})`
   into the fetch `options` object
5. Verify with `node --check` that syntax is valid

**Relevant Context:**
- `index.js` imports at lines 1–9
- `ExchangeClient` constructor at line 150
- `initialize()` at line 163 — cert block goes after line 183 (`this.credentials = ...`)
  and before the rate-limit check at line 186
- `makeRequest()` at line 231 — `options` object at lines 239–245
- `node-fetch` v3 `request.js` line 137 confirms `agent` is a first-class option:
  `this.agent = init.agent || input.agent`

**Status:** [x] done

---

## Sub-Task 2: Add `.gitignore`

**Intent:** Prevent credential files from being accidentally committed. This is the
highest-risk gap — there is currently no protection at the filesystem level.

**Expected Outcomes:**
- `.gitignore` at repo root covering `oh-config.json`, `*.env`, cert files, and OS noise
- `check-prereqs.sh` adds a check that `.gitignore` exists

**Todo List:**
1. Create `.gitignore` at repo root with entries for:
   - `.bob/oh-config.json`
   - `*.env` and `*.creds`
   - `*.crt` and `*.pem` (local cert copies)
   - `.DS_Store`, `node_modules/` (OS / build noise already present)
2. Add a section to `check-prereqs.sh` (section 7) that verifies `.gitignore` exists
   and covers the critical patterns

**Relevant Context:**
- `AGENTS.md` (rules-oh-dev) line 20 states credentials must not be committed — but
  without a `.gitignore` this is unenforced
- `oh-config.schema.json` references `.bob/oh-config.json` as the profile store

**Status:** [x] done

---

## Sub-Task 3: Document oh-cred in PREREQUISITES.md

**Intent:** Make oh-cred the clearly documented, recommended credential path for users
who want zero-sprawl credential hygiene. The existing env-var path stays documented as
a valid simpler alternative.

**Expected Outcomes:**
- `PREREQUISITES.md` has a dedicated "Credential Broker (recommended)" section
  describing what oh-cred is, when to use it vs plain env vars, and how to invoke it
- The existing env-var credential setup is relabelled "Simple setup (single hub)"
- `oh-cred run <hub> <org> <user> -- <command>` pattern shown for wrapping both
  `hzn` commands and the Bob session itself

**Todo List:**
1. Add an `oh-cred` section to `PREREQUISITES.md` covering:
   - What it is (vault-backed broker; no print mode; inject-only)
   - Prerequisites: OpenBao/Vault running, `bao` CLI installed, `oh-cred` script in PATH
   - Basic `oh-cred run` invocation for Exchange operations
   - How to wrap a Bob session: `oh-cred run hub org user -- bob` (so MCP server
     inherits credentials from the child environment)
   - Link to `docs/INSTALL.md` and `docs/USAGE.md` in the oh-cred repo for vault setup
2. Reframe the plain env-var section as "Alternative: environment variables (simple)"
   with a note that it is fine for single-hub personal setups but does not give
   audit, rotation, or multi-hub isolation

**Relevant Context:**
- oh-cred `cmd_run()` sets: `HZN_ORG_ID`, `HZN_EXCHANGE_USER_AUTH`, `HZN_EXCHANGE_URL`,
  `HZN_FSS_CSSURL` — these map exactly to what the MCP server requires
- oh-cred path schema: `oh/hubs/<hub>/users/<org>/<user>`
- `PREREQUISITES.md` — existing credential setup sections at lines ~28–55

**Status:** [x] done

---

## Sub-Task 4: Update `check-prereqs.sh` for oh-cred

**Intent:** The checker should detect whether `oh-cred` is available and, if so,
validate the vault connection and list hubs. This surfaces whether the broker is
functional without exposing any secrets.

**Expected Outcomes:**
- Section 5 (optional tools) gains an `oh-cred` check:
  - If `oh-cred` is in PATH: runs `oh-cred list` (no secrets) and shows hub inventory
  - If not in PATH: warns with install pointer
- If `oh-cred` is available but vault is sealed or unreachable: shows a clear failure
  message (separate from "tool not installed")
- Existing env-var credential checks in section 3 remain unchanged — they cover the
  non-oh-cred path

**Todo List:**
1. In section 5 of `check-prereqs.sh`, add an `oh-cred` block after `openspec`:
   - `command -v oh-cred` check
   - Run `oh-cred list` in a subshell, capture output and exit code
   - Pass: show hub count / list summary
   - Fail with non-zero exit: distinguish "vault sealed" from "no hubs configured"
     vs "bao not installed"
2. Add a note in the output that if both oh-cred and env vars are present, oh-cred
   takes precedence in the recommended workflow

**Relevant Context:**
- `oh-cred list` never prints secrets — safe to run in a checker
- oh-cred exits non-zero on `AppRole login failed` (vault sealed) or `bao not installed`
- `check-prereqs.sh` section 5 pattern at lines ~131–148

**Status:** [x] done

---

## Sub-Task 5: Update AGENTS.md rules for oh-cred

**Intent:** The `oh-dev` mode rules must tell Bob how to use oh-cred when it is
available, and what not to do (no `--show`, no `bao kv get` workarounds, no searching
`*.env` files). This matches the guidance oh-cred's own USAGE.md recommends placing
in `AGENTS.md`.

**Expected Outcomes:**
- `rules-oh-dev/AGENTS.md` has a new "Credential Broker (oh-cred)" section containing
  the sanctioned invocation pattern and explicit prohibitions
- Bob will prefer `oh-cred run` over raw env-var exposure when oh-cred is in PATH
- Bob will stop and report rather than improvise an alternate credential path

**Todo List:**
1. Add a "Credential Broker" section to `.bob/rules-oh-dev/AGENTS.md`:
   - Sanctioned pattern: `oh-cred run <hub> <org> <user> -- <cmd>`
   - Never use `--show`, never call `bao kv get` to extract a secret
   - Do not search `*.env`, `/etc/environment`, `docker inspect`, shell configs
   - If oh-cred cannot supply what is needed: say so and stop — do not improvise
   - `oh-cred verify-all` is safe to run as a health check (no secrets printed)
2. Update the existing "Credential and Security Rules" section to reference oh-cred
   as the preferred path over plain env-var files

**Relevant Context:**
- oh-cred `docs/USAGE.md` "Granting an AI agent access" section provides the exact
  wording recommended for AGENTS.md
- `.bob/rules-oh-dev/AGENTS.md` "Credential and Security Rules" section

**Status:** [x] done

---

## Sub-Task 6: Update `openspec/config.yaml` context

**Intent:** The OpenSpec project context should reflect oh-cred as part of the
credential story so future AI-generated proposals and designs don't ignore it.

**Expected Outcomes:**
- `openspec/config.yaml` `context:` section mentions oh-cred as the recommended
  credential broker and references `HZN_MGMT_HUB_CERT_PATH` for TLS

**Todo List:**
1. In `openspec/config.yaml`, extend the "Key conventions" section to note:
   - oh-cred is the recommended credential broker (vault-backed, inject-only)
   - Plain env vars are the fallback for single-hub setups
   - `HZN_MGMT_HUB_CERT_PATH` must be set for self-signed Exchange TLS

**Relevant Context:**
- `openspec/config.yaml` — current context block

**Status:** [x] done
