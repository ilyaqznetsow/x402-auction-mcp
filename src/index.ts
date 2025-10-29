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
import type { StandardMCPResponse, AuctionInfoResponse, RecentBidsResponse } from './types.js';

/**
 * API Error structure
 */
interface ApiError {
  message?: string;
  error?: string;
  code?: number;
  status?: number;
  details?: unknown;
}


/**
 * Tool definitions for the MCP server
 * 
 * UNIVERSAL DATA-ONLY ARCHITECTURE:
 * All tools return ONLY structured data, NO prose/messages.
 * Agents compose their own messages in any language/style.
 * 
 * Response Structure:
 * - status: Current state (enum/code)
 * - action_required: What user must do ("payment", "wait", "none", etc)
 * - urgency: Time sensitivity ("critical", "high", "normal")
 * - next_step: Next action code ("send_payment", "check_wallet", etc)
 * - Pure data fields: All business data (amounts, prices, timestamps)
 * - Metadata objects: auction{}, payment{}, allocation{}, refund{}
 * 
 * NO hardcoded messages = Works in ANY language for ANY agent
 */
const TOOLS: Tool[] = [
  {
    name: 'get_auction_info',
    description: `[REQUIRED FIRST STEP] Retrieve comprehensive auction status including current Dutch auction pricing, fundraising progress, and token economics.
    
    WHEN TO USE:
    - ALWAYS call this FIRST before any auction interaction
    - When user asks about auction (price, status, progress)
    - Before creating a bid (to show user current price)
    - When explaining how the auction works
    
    Returns:
    - auction_id, status (active/closed)
    - current_price_ton (increases as auction progresses)
    - total_raised_ton, target_ton, progress_percent
    - tokens_per_ton (how many tokens per 1 TON at current price)
    - min_ton, max_ton (bid limits per wallet)
    - start_price_ton, ceiling_price_ton (price range)
    
    AGENT WORKFLOW:
    1. Call this to check if auction is active
    2. If status="active", show user current price and progress
    3. If status="closed", inform user auction ended (no new bids)
    4. Use current_price_ton to explain cost before bidding
    
    MECHANISM: Dutch ascending auction - price increases as more TON is raised toward target. Users lock in the price at time of bid (pay-as-bid model).`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_auction_bid',
    description: `Place a bid in the x402 token auction.

PREREQUISITE: Call get_auction_info first to verify auction is active.

WHEN TO USE:
- User wants to participate in the auction
- User provides: wallet address + amount (${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON} TON)
- Auction status is "active" (from get_auction_info)

CONSTRAINTS:
- ONE bid per wallet (duplicate calls return existing bid status)
- Price locked at bid time (pay-as-bid model)
- Payment window: ${BID_LIMITS.PAYMENT_TIMEOUT_SECONDS} seconds
- MUST include bid_id as payment comment/memo

RESPONSE FORMAT (Structured Data):
{
  status: "payment_required" | "completed" | "allocated" | "refunded",
  action_required: "payment" | "wait" | "none",
  urgency: "critical" | "high" | "normal",
  bid: { bid_id, ton_amount, estimated_token, expires_at, locked_price },
  payment: { required, recipient, amount, comment_required, deeplink, expires_in_seconds },
  auction: { auction_id, current_price_ton, progress_percent, mechanism },
  next_step: "send_payment" | "wait_for_allocation" | "check_wallet"
}

WORKFLOW:
1. Verify auction active (get_auction_info)
2. Collect: amount (${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON}) + wallet address
3. Call create_auction_bid
4. If status="payment_required":
   - Present payment.deeplink as a CLICKABLE LINK (not QR code)
   - Explain: "Click this link to open your TON wallet and complete payment"
   - Show: recipient address, exact amount, required comment (bid_id)
   - Display: time remaining (expires_in_seconds)
5. If urgency="critical": Emphasize time sensitivity (expires_in_seconds < 60)
6. If status="completed"/"allocated": Inform user of current state

ERRORS:
- no_active_auction (404): Auction not running
- invalid_amount (422): Amount outside ${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON} range
- auction_closed (410): Auction ended, no new bids`,
    inputSchema: {
      type: 'object',
      properties: {
        ton_amount: {
          type: 'number',
          description: `Amount of TON to bid. Range: ${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON} TON. This is maximum payment - partial refunds possible if oversubscribed or target not reached.`,
          minimum: BID_LIMITS.MIN_TON,
          maximum: BID_LIMITS.MAX_TON,
          examples: [1, 5, 10, 50, 100],
        },
        wallet: {
          type: 'string',
          description: 'TON wallet address in normalized format. Examples: "UQBlen9nrjWVN5K-O6yzLeNH5hMrQqAw-6LfW3RnISrMg0nw" or "EQAbc123...". This address receives tokens if successful, or refunds if applicable.',
          pattern: '^(UQ|EQ)[A-Za-z0-9_-]{48}$',
        },
      },
      required: ['ton_amount', 'wallet'],
    },
  },
  {
    name: 'check_bid_status',
    description: `Check status of a specific bid by its ID.

WHEN TO USE:
- User wants to verify payment status
- User has bid_id and wants to check progress
- Track bid through auction lifecycle

BID STATUSES:
1. payment_pending: Payment not received, window open
   → Present payment.deeplink as CLICKABLE LINK (opens TON wallet)
   → Show recipient, amount, required comment (bid_id), time remaining
   → Emphasize urgency if expires_in < 60s

2. expired: Payment window closed without payment
   → Bid invalid, suggest new bid (price may have changed)

3. completed: Payment confirmed, waiting for auction close
   → Show locked price vs current auction price

4. allocated: Auction succeeded, tokens distributed
   → Show allocated_token amount + refund_ton (if any)

5. refunded: Auction failed to reach target
   → Full refund processed (minus transaction fee)

6. auction_closed: Auction ended before payment
   → Show final_price_ton and closed_at timestamp

RESPONSE STRUCTURE:
{
  status: "payment_pending" | "completed" | "allocated" | "refunded" | "expired" | "auction_closed",
  action_required: "payment" | "wait" | "none" | "create_new_bid",
  urgency?: "critical" | "high" | "normal",
  payment?: { required, recipient, deeplink, expires_in_seconds },
  auction?: { status, prices },
  next_step: "send_payment" | "wait_for_allocation" | "check_wallet" | "create_new_bid"
}

WORKFLOW:
- payment_pending + expires_in < 300s: Present deeplink as clickable link, emphasize urgency
- completed: Reassure user, explain waiting for allocation
- allocated: Celebrate success, show token amount
- refunded: Explain auction failure, confirm refund
- expired: Offer to create new bid if auction still active

IMPORTANT: payment.deeplink is a TonConnect URL - present it as a clickable link, NOT a QR code`,
    inputSchema: {
      type: 'object',
      properties: {
        bid_id: {
          type: 'string',
          description: 'Unique bid ID returned when creating a bid. Format: "bid_XXXXXXXXXX" (e.g., "bid_1234567890"). Found in create_auction_bid response.',
          pattern: '^bid_[A-Za-z0-9]+$',
          examples: ['bid_1234567890', 'bid_abc123def456'],
        },
      },
      required: ['bid_id'],
    },
  },
  {
    name: 'get_my_bid',
    description: `Lookup bid by wallet address. Use to check participation without knowing bid_id.

WHEN TO USE:
- User asks "do I have a bid?" or "what's my bid status?"
- BEFORE creating new bid (verify wallet doesn't already have one)
- User wants to check participation but doesn't have bid_id
- Check token allocation or payment status

CONSTRAINT: One bid per wallet per auction

RESPONSE STRUCTURE:
{
  bid_id, status, ton_amount, bid_price_ton, tx_hash, created_at,
  action_required: "payment" | "wait" | "none" | "create_new_bid",
  urgency?: "critical" | "high" | "normal",
  payment?: { required, recipient, deeplink, expires_in_seconds },
  allocation?: { success, oversubscribed, pricing_model },
  refund?: { processed, transaction_fee_deducted },
  next_step: "send_payment" | "wait_for_allocation" | "check_wallet" | "create_new_bid"
}

STATUS HANDLING:
- pending: Show payment instructions + deeplink (check urgency)
- completed: Confirm payment, explain waiting for allocation
- allocated: Show tokens received + refund_ton (if any)
- refunded: Explain auction failure + refund amount
- expired: Bid expired, suggest new bid if auction active

IF NO BID (404 error):
→ Normal: wallet hasn't participated yet
→ Safe to proceed with create_auction_bid

WORKFLOW:
1. Call before create_auction_bid to check existing bid
2. If 404: Wallet free, proceed with new bid
3. If found: Show status, don't create duplicate
4. For pending: Present payment.deeplink as CLICKABLE LINK with urgency
5. For completed/allocated: Show appropriate status message

IMPORTANT: payment.deeplink opens user's TON wallet - it's a clickable URL, not a QR code`,
    inputSchema: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          description: 'TON wallet address to check for existing bids. Normalized format: "UQBlen..." or "EQAbc...". Example: "UQBlen9nrjWVN5K-O6yzLeNH5hMrQqAw-6LfW3RnISrMg0nw".',
          pattern: '^(UQ|EQ)[A-Za-z0-9_-]{48}$',
          examples: ['UQBlen9nrjWVN5K-O6yzLeNH5hMrQqAw-6LfW3RnISrMg0nw', 'EQAbc123...'],
        },
      },
      required: ['wallet'],
    },
  },
  {
    name: 'get_recent_bids',
    description: `Get list of recent bids to show auction activity and social proof.

WHEN TO USE:
- User asks "is anyone else bidding?" or "what's the activity like?"
- Before showing auction info (demonstrate real participation)
- Show price examples from other bidders
- Validate auction is active and legitimate

RETURNS:
{
  bids: [
    {
      bidder: "UQBl...f4Te",  // Shortened for privacy
      amount: "5.0",           // TON bid amount
      price: "0.50",          // Price locked in (pay-as-bid)
      time: "2025-01-15T12:00:00Z",
      status: "completed" | "allocated" | "pending"
    }
  ],
  current_price: "0.52"  // Current auction price for comparison
}

DATA INTERPRETATION:
- bidder: Privacy-safe shortened address
- amount: TON bid amount
- price: Locked price (pay-as-bid model)
- time: ISO timestamp
- status: Current bid state

WORKFLOW:
1. Call with limit=10-20 for quick overview
2. Show 3-5 recent bids as examples
3. Highlight price variations (different users lock different prices)
4. Use as social proof: "X bids totaling Y TON"
5. Compare bid prices vs current_price to show price movement

PRESENTATION EXAMPLES:
- "15 bids in the last hour"
- "Typical bid range: 5-10 TON"
- "Prices locked: 0.45-0.52 TON per token (current: 0.50)"
- Never show full wallet addresses`,
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: `Number of recent bids to return. Range: 1-100. Default: ${DEFAULT_BIDS_LIMIT}. Use 10-20 for quick context, 50-100 for detailed analysis.`,
          minimum: 1,
          maximum: 100,
          default: DEFAULT_BIDS_LIMIT,
          examples: [10, 20, 50, 100],
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
    version: '1.1.1',
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
function formatResponse(data: StandardMCPResponse | AuctionInfoResponse | RecentBidsResponse) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Structured error response
 */
interface ErrorResponse {
  error: string;
  message: string;
  code?: number;
  details?: unknown;
  retryable?: boolean;
  action_required?: string;
}

/**
 * Format error response with structured error information
 */
function formatError(error: unknown) {
  const apiError = error as ApiError;
  const errorMessage = apiError.message || apiError.error || 'An error occurred';
  const errorCode = apiError.code || apiError.error || 'UNKNOWN_ERROR';
  const httpStatus = apiError.code || apiError.status || 500;

  // Structured error response for better agent parsing
  const errorResponse: ErrorResponse = {
    error: String(errorCode),
    message: errorMessage,
    code: httpStatus,
  };

  // Add details if available
  if (apiError.details) {
    errorResponse.details = apiError.details;
  }

  // Determine if error is retryable
  if (httpStatus >= 500 || httpStatus === 429) {
    errorResponse.retryable = true;
  } else {
    errorResponse.retryable = false;
  }

  // Add action hints for common errors
  if (errorCode === 'no_active_auction' || errorCode === 'no_auction') {
    errorResponse.action_required = 'check_auction_status';
  } else if (errorCode === 'invalid_amount') {
    errorResponse.action_required = 'adjust_amount';
  } else if (errorCode === 'auction_closed') {
    errorResponse.action_required = 'check_auction_status';
  } else if (errorCode === 'bid_not_found') {
    errorResponse.action_required = 'verify_bid_id';
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(errorResponse, null, 2),
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
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result: StandardMCPResponse | AuctionInfoResponse | RecentBidsResponse;

    switch (name) {
      case 'get_auction_info':
        result = await handleGetAuctionInfo();
        break;

      case 'create_auction_bid':
        result = await handleCreateBid(
          args.ton_amount as number, 
          args.wallet as string
        );
        break;

      case 'check_bid_status':
        result = await handleCheckBidById(args.bid_id as string);
        break;

      case 'get_my_bid':
        result = await handleGetMyBid(args.wallet as string);
        break;

      case 'get_recent_bids':
        result = await handleGetRecentBids(args.limit as number | undefined);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return formatResponse(result);
  } catch (error: unknown) {
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

