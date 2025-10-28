#!/usr/bin/env node

/**
 * x402 Auction MCP Server
 * Provides tools for AI agents to participate in x402 auctions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { BID_LIMITS, DEFAULT_BIDS_LIMIT, HTTP_STATUS } from './constants.js';
import {
  handleGetAuctionInfo,
  handleCreateBid,
  handleCheckBidById,
  handleGetMyBid,
  handleGetRecentBids,
} from './handlers.js';

/**
 * Tool definitions for the MCP server
 */
const TOOLS: Tool[] = [
  {
    name: 'get_auction_info',
    description: 'Get current auction status including price, progress, and token allocation info',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_auction_bid',
    description: `Create a bid in the x402 auction. Returns payment instructions (HTTP 402 Payment Required). 
    One bid per wallet. Bid amount: ${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON} TON. 
    Payment expires in ${BID_LIMITS.PAYMENT_TIMEOUT_SECONDS}s. Pay manually or use ton_deeplink.`,
    inputSchema: {
      type: 'object',
      properties: {
        ton_amount: {
          type: 'number',
          description: `Amount of TON to bid (${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON})`,
          minimum: BID_LIMITS.MIN_TON,
          maximum: BID_LIMITS.MAX_TON,
        },
        wallet: {
          type: 'string',
          description: 'TON wallet address (normalized format, e.g., UQBlen...)',
        },
      },
      required: ['ton_amount', 'wallet'],
    },
  },
  {
    name: 'check_bid_status',
    description: 'Check status of a bid by ID. Shows if payment is pending, completed, allocated, or refunded.',
    inputSchema: {
      type: 'object',
      properties: {
        bid_id: {
          type: 'string',
          description: 'The bid ID returned when creating a bid',
        },
      },
      required: ['bid_id'],
    },
  },
  {
    name: 'get_my_bid',
    description: 'Check your bid status including payment status and token allocation',
    inputSchema: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          description: 'TON wallet address to check',
        },
      },
      required: ['wallet'],
    },
  },
  {
    name: 'get_recent_bids',
    description: 'Get list of recent bids with bidder address, amount, price, and status',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: `Number of bids to return (1-100, default: ${DEFAULT_BIDS_LIMIT})`,
          minimum: 1,
          maximum: 100,
        },
      },
      required: [],
    },
  },
];

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'x402-auction-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Format successful response
 */
function formatResponse(data: any) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format error response
 */
function formatError(error: any) {
  const errorMessage = error.message || error.error || 'An error occurred';
  const errorCode = error.code || error.error || 'UNKNOWN_ERROR';

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: errorCode,
            message: errorMessage,
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}

/**
 * Handle tool list requests
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

/**
 * Handle tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'get_auction_info':
        result = await handleGetAuctionInfo();
        break;

      case 'create_auction_bid':
        result = await handleCreateBid(args.ton_amount, args.wallet);
        break;

      case 'check_bid_status':
        result = await handleCheckBidById(args.bid_id);
        break;

      case 'get_my_bid':
        result = await handleGetMyBid(args.wallet);
        break;

      case 'get_recent_bids':
        result = await handleGetRecentBids(args.limit);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return formatResponse(result);
  } catch (error: any) {
    return formatError(error);
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('x402 Auction MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

