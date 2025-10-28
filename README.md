# x420 Auction MCP Server

A **simple**, **clean** MCP server that enables AI agents to participate in x420 auctions.

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

```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "node",
      "args": ["/Users/base/Documents/GitHub/x402agent/build/index.js"]
    }
  }
}
```

Make sure to update the path to match your actual installation location.

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

This MCP server interfaces with the following x420 auction API endpoints:

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
x420agent/
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

Base URL: `https://x420.palette.finance/api/auction`

For more information about the x420 auction, visit [Palette Finance](https://x420.palette.finance).

## Deployment

This is an MCP server designed to run locally with Claude Desktop via stdio protocol.

### Local Setup

1. **Configure Claude Desktop** (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "node",
      "args": ["/Users/base/Documents/GitHub/x420agent/build/index.js"]
    }
  }
}
```

2. **Restart Claude Desktop**

3. **Start using the tools** - Ask Claude about auction status!

### Publishing to GitHub

To share your work:

```bash
git remote add origin https://github.com/yourusername/x402-auction-mcp.git
git push -u origin main
```

