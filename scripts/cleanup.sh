#!/bin/bash

# Cleanup script for x402 Auction MCP Server
# Kills any running instances to prevent EADDRINUSE or duplicate process issues

echo "🔍 Checking for running x402-auction-mcp processes..."

# Find processes
PROCESSES=$(pgrep -f "x402-auction-mcp|build/index.js" || true)

if [ -z "$PROCESSES" ]; then
  echo "✅ No running processes found"
  exit 0
fi

echo "Found running processes:"
ps aux | grep -E "x402-auction-mcp|build/index.js" | grep -v grep

echo ""
echo "🛑 Killing processes..."
pkill -f "x402-auction-mcp|build/index.js"

sleep 1

# Verify
REMAINING=$(pgrep -f "x402-auction-mcp|build/index.js" || true)
if [ -z "$REMAINING" ]; then
  echo "✅ All processes cleaned up successfully"
else
  echo "⚠️  Some processes still running, using force kill..."
  pkill -9 -f "x402-auction-mcp|build/index.js"
  echo "✅ Force kill completed"
fi

