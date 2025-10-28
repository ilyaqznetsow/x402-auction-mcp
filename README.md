# x402 Auction MCP Server

A **simple**, **clean** MCP server that enables AI agents to participate in x402 auctions.

**🎯 Built with KISS & SOLID principles | 343 lines of code | 4 API endpoints**

## Why This Project?

✅ **KISS** - Simple, readable code without unnecessary complexity  
✅ **SOLID** - Clean architecture with single responsibility  
✅ **Type-Safe** - Full TypeScript with proper types  
✅ **Well-Documented** - Clear examples and architecture docs  
✅ **Production-Ready** - Proper error handling and validation  

## Features

- **Get Auction Info**: Check current auction status, price, total raised, and available supply
- **Create Bids**: Place bids in the auction (1-100 TON per wallet)
- **Check Bid Status**: Monitor your bid's payment status and estimated token allocation
- **View Recent Bids**: See the latest completed bids with details

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### Running the Server

```bash
npm start
```

Or for development with auto-rebuild:

```bash
npm run dev
```

### Configuring with Claude Desktop

Add this to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Option 1: Using npm package (Recommended if published)

```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "x402-auction-mcp"
    }
  }
}
```

#### Option 2: Local development

```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "node",
      "args": ["/path/to/x402-auction-mcp/build/index.js"]
    }
  }
}
```

Make sure to update the path to match your actual installation location.

#### Option 3: Using npm link (for development)

```bash
# In the x402-auction-mcp directory
npm link

# Then in Claude Desktop config:
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "x402-auction-mcp"
    }
  }
}
```

## Available Tools

### 1. `get_auction_info`

Get current auction status and parameters.

**Parameters**: None

**Example Response**:
```json
{
  "status": "active",
  "current_price": 0.5,
  "total_raised": 1500.0,
  "available_supply": 100000
}
```

### 2. `create_auction_bid`

Create a bid in the auction. Returns payment instructions (HTTP 402).

**Parameters**:
- `ton_amount` (number, required): Amount to bid (1-100 TON)
- `wallet` (string, required): Your TON wallet address

**Important Notes**:
- One bid per wallet
- Payment expires in 180 seconds
- No refunds after payment

**Example Response**:
```json
{
  "bid_id": "abc123",
  "payment_address": "EQD...",
  "amount": 5,
  "expires_at": "2025-10-28T12:03:00Z",
  "message": "Send 5 TON to address with bid_id as comment"
}
```

### 3. `get_my_bid`

Check the status of your bid.

**Parameters**:
- `wallet` (string, required): Your TON wallet address

**Example Response**:
```json
{
  "bid_id": "abc123",
  "wallet": "UQBlen...",
  "ton_amount": 5,
  "payment_status": "confirmed",
  "estimated_tokens": 10000,
  "price": 0.5,
  "timestamp": "2025-10-28T12:00:00Z"
}
```

### 4. `get_recent_bids`

Get list of recent completed bids.

**Parameters**:
- `limit` (number, optional): Number of bids to return (default: 20, max: 100)

**Example Response**:
```json
{
  "bids": [
    {
      "bidder": "UQBlen...",
      "amount": 5,
      "price": 0.5,
      "timestamp": "2025-10-28T12:00:00Z"
    }
  ],
  "total": 150
}
```

## API Endpoints

This MCP server interfaces with the following x402 auction API endpoints:

- `GET /api/auction/info` - Auction status
- `GET /api/auction/bid` - Create bid (returns 402)
- `GET /api/auction/my-bid` - Check bid status
- `GET /api/auction/bids` - Recent bids list

## Response Codes

- `200 OK` - Success
- `402 Payment Required` - Bid created, payment needed
- `409 Conflict` - Bid already exists for this wallet
- `410 Gone` - Auction closed
- `422 Invalid Amount` - Invalid bid amount

## Development

The project structure:

```
x402agent/
├── src/
│   ├── index.ts       # MCP server (routing)
│   ├── handlers.ts    # Business logic & validation
│   ├── api.ts         # HTTP client
│   ├── types.ts       # TypeScript types
│   └── constants.ts   # Configuration
├── build/             # Compiled JavaScript
├── docs/              # Documentation
└── package.json
```

**SOLID Architecture** - Each file has a single, clear responsibility.

## Error Handling

The server includes comprehensive error handling for:
- Invalid bid amounts
- Invalid wallet addresses
- API errors (conflict, gone, invalid amount)
- Network errors
- Payment timeouts

Errors are returned in a structured format with error codes and messages.

## License

MIT

## API Reference

Base URL: `https://x402.palette.finance/api/auction`

For more information about the x402 auction, visit [Palette Finance](https://x402.palette.finance).

## Installation

### For End Users

**Option 1: Install from npm (when published)**
```bash
npm install -g x402-auction-mcp
```

**Option 2: Install from GitHub**
```bash
git clone https://github.com/ilyaqznetsow/x402-auction-mcp.git
cd x402-auction-mcp
npm install
npm run build
```

---

## Usage in Different Environments

### 1. Claude Desktop

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**If installed globally via npm:**
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "x402-auction-mcp"
    }
  }
}
```

**If installed locally:**
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "node",
      "args": ["/absolute/path/to/x402-auction-mcp/build/index.js"]
    }
  }
}
```

Then restart Claude Desktop.

---

### 2. Cursor IDE

Cursor supports MCP servers! Configure in Cursor's settings:

**Settings → MCP Servers** or create/edit the config file:
- macOS: `~/Library/Application Support/Cursor/mcp_config.json`
- Windows: `%APPDATA%\Cursor\mcp_config.json`
- Linux: `~/.config/Cursor/mcp_config.json`

```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "npx",
      "args": ["x402-auction-mcp"]
    }
  }
}
```

Or with local installation:
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "node",
      "args": ["/absolute/path/to/x402-auction-mcp/build/index.js"]
    }
  }
}
```

Restart Cursor, then use the MCP tools in your AI chat!

---

### 3. Cline (VS Code Extension)

Cline supports MCP servers via settings:

1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "Cline MCP"
3. Add MCP server configuration:

```json
{
  "cline.mcpServers": {
    "x402-auction": {
      "command": "x402-auction-mcp"
    }
  }
}
```

Or edit `.vscode/settings.json` in your workspace.

---

### 4. Programmatic Usage (Node.js)

You can also use the MCP server programmatically in your own applications:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Connect to the MCP server
const transport = new StdioClientTransport({
  command: 'x402-auction-mcp'
});

const client = new Client({
  name: 'my-app',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log(tools);

// Call a tool
const result = await client.callTool({
  name: 'get_auction_info',
  arguments: {}
});

console.log(result);
```

---

### 5. Any MCP-Compatible Client

The server uses the standard MCP stdio protocol, so it works with any client that supports MCP:

**Basic usage:**
```bash
# Start the server (it reads from stdin, writes to stdout)
x402-auction-mcp

# Or with node directly:
node /path/to/build/index.js
```

**Communication format:** JSON-RPC 2.0 over stdio

Example request:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_auction_info",
    "arguments": {}
  }
}
```

---

## For Developers: Publishing Your Fork

See [PUBLISHING.md](PUBLISHING.md) for detailed instructions on:
- Publishing to npm
- Publishing to GitHub
- Versioning and updates
- Marketing your MCP server

