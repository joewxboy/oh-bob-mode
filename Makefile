# Makefile for oh-bob-mode
# Bob Shell custom mode workspace for Open Horizon edge computing

MCP_DIR := .bob/mcp-servers/oh-exchange

default: check

## install — install MCP server dependencies
install:
	@echo "Installing MCP server dependencies..."
	@cd $(MCP_DIR) && npm install
	@echo "✅ Done. Start Bob Shell and activate the 'Open Horizon Development' mode."

## check — validate prerequisites and MCP server syntax
check:
	@echo "Checking prerequisites..."
	@bash scripts/check-prereqs.sh
	@echo ""
	@echo "Checking MCP server syntax..."
	@node --check $(MCP_DIR)/index.js && echo "✅ MCP server syntax OK"

## test — start the MCP server (requires HZN_* env vars set; Ctrl+C to exit)
test:
	@echo "Starting MCP server (Ctrl+C to exit)..."
	@node $(MCP_DIR)/index.js

## clean — remove MCP server node_modules
clean:
	@echo "Removing node_modules..."
	@rm -rf $(MCP_DIR)/node_modules
	@echo "✅ Cleaned. Run 'make install' to reinstall."

.PHONY: default install check test clean
