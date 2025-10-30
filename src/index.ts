#!/usr/bin/env node

/**
 * x402 Auction MCP Server
 * Provides tools for AI agents to participate in x402 auctions
 * 
 * UNIVERSAL DATA-ONLY ARCHITECTURE:
 * All tools return ONLY structured data, NO prose/messages.
 * Agents compose their own messages in any language/style.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { BID_LIMITS, DEFAULT_BIDS_LIMIT } from './constants.js';
import {
  handleGetAuctionInfo,
  handleCreateBid,
  handleCheckBidById,
  handleGetMyBid,
  handleGetRecentBids,
} from './handlers.js';
import type { StandardMCPResponse, AuctionInfoResponse, RecentBidsResponse } from './types.js';

/**
 * Create and configure the MCP server
 */
const server = new McpServer({
  name: 'x402-auction-mcp',
  version: '1.1.3',
});

/**
 * Register get_auction_info tool
 */
server.registerTool(
  'get_auction_info',
  {
    title: 'Get Auction Info',
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
    inputSchema: {},
  },
  async () => {
    const result = await handleGetAuctionInfo();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

/**
 * Register create_auction_bid tool
 */
server.registerTool(
  'create_auction_bid',
  {
    title: 'Create Auction Bid',
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
2. Collect: amount (${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON}) + user's wallet address
3. Call create_auction_bid
4. If status="payment_required":
   - Present payment.deeplink as a CLICKABLE LINK (not QR code)
   - Explain: "Click this link to open your TON wallet and complete payment TO THE AUCTION"
   - Show: payment.recipient (auction address), exact amount, required comment (bid_id)
   - IMPORTANT: Payment goes to payment.recipient (auction), NOT to the user's wallet
   - Display: time remaining (expires_in_seconds)
5. If urgency="critical": Emphasize time sensitivity (expires_in_seconds < 60)
6. If status="completed"/"allocated": Inform user of current state

ERRORS:
- no_active_auction (404): Auction not running
- invalid_amount (422): Amount outside ${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON} range
- auction_closed (410): Auction ended, no new bids`,
    inputSchema: {
      ton_amount: z.number()
        .min(BID_LIMITS.MIN_TON)
        .max(BID_LIMITS.MAX_TON)
        .describe(`Amount of TON to bid. Range: ${BID_LIMITS.MIN_TON}-${BID_LIMITS.MAX_TON} TON. This is maximum payment - partial refunds possible if oversubscribed or target not reached.`),
      wallet: z.string()
        .regex(/^((UQ|EQ)[A-Za-z0-9_-]{44,48}|(-1|0):[a-fA-F0-9]{64})$/)
        .describe('YOUR wallet address (not the payment destination). User-friendly: "UQBlen9nrjWVN5K-O6yzLeNH5hMrQqAw-6LfW3RnISrMg0nw" or "EQAbc123...". Raw: "0:abc123..." or "-1:abc123...". This identifies your bid and is where you\'ll receive allocated tokens or refunds. Payment is sent to the auction address provided in the response.'),
    },
  },
  async ({ ton_amount, wallet }) => {
    const result = await handleCreateBid(ton_amount, wallet);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

/**
 * Register check_bid_status tool
 */
server.registerTool(
  'check_bid_status',
  {
    title: 'Check Bid Status',
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
      bid_id: z.string()
        .regex(/^bid_[A-Za-z0-9]+$/)
        .describe('Unique bid ID returned when creating a bid. Format: "bid_XXXXXXXXXX" (e.g., "bid_1234567890"). Found in create_auction_bid response.'),
    },
  },
  async ({ bid_id }) => {
    const result = await handleCheckBidById(bid_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

/**
 * Register get_my_bid tool
 */
server.registerTool(
  'get_my_bid',
  {
    title: 'Get My Bid',
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
      wallet: z.string()
        .regex(/^((UQ|EQ)[A-Za-z0-9_-]{44,48}|(-1|0):[a-fA-F0-9]{64})$/)
        .describe('TON wallet address to check for existing bids. User-friendly format: "UQBlen..." or "EQAbc...". Raw format: "0:abc123..." or "-1:abc123...". Example: "UQBlen9nrjWVN5K-O6yzLeNH5hMrQqAw-6LfW3RnISrMg0nw" or "0:89f356bd10b3c8609187c5abcd7bb1d5840c7f8a88e73debff8e64ffd8f12010".'),
    },
  },
  async ({ wallet }) => {
    const result = await handleGetMyBid(wallet);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

/**
 * Register get_recent_bids tool
 */
server.registerTool(
  'get_recent_bids',
  {
    title: 'Get Recent Bids',
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
      limit: z.number()
        .min(1)
        .max(100)
        .optional()
        .default(DEFAULT_BIDS_LIMIT)
        .describe(`Number of recent bids to return. Range: 1-100. Default: ${DEFAULT_BIDS_LIMIT}. Use 10-20 for quick context, 50-100 for detailed analysis.`),
    },
  },
  async ({ limit }) => {
    const result = await handleGetRecentBids(limit);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

/**
 * Graceful shutdown handler
 */
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.error(`Received ${signal}, shutting down gracefully...`);
  process.exit(0);
}

// Handle termination signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
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

