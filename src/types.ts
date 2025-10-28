/**
 * Type definitions for x402 auction API
 */

// Auction statuses
export enum AuctionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  FAILED = 'failed',
}

// Bid statuses
export enum BidStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  ALLOCATED = 'allocated',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

// Auction Info Response
export interface AuctionInfoResponse {
  auction_id: string;
  status: string;
  start_price_ton: string;
  current_price_ton: string;
  ceiling_price_ton: string;
  tick_size_ton: string;
  min_ton: string;
  max_ton: string;
  target_ton: string;
  total_raised_ton: string;
  progress_percent: string;
  auction_supply_tping: string;
  started_at?: string;
  tokens_per_ton: number;
}

// Recent Bids Response
export interface BidEntry {
  bidder: string;
  amount: string;
  price: string;
  time: string;
  status: string;
}

export interface RecentBidsResponse {
  bids: BidEntry[];
  current_price: string;
}

// Create Bid - Payment Required (402)
export interface BidRequired402Response {
  network: string;
  currency: string;
  auction_id: string;
  bid_id: string;
  ton_amount: string;
  current_price_ton: string;
  estimated_tping: number;
  pay_to: string;
  expires_in: number;
  tonconnect_universal_link: string;
  ton_deeplink?: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  asset: string;
  assetType: string;
  expiresAt: string;
  nonce: string;
  paymentId: string;
}

// Auction Closed (410)
export interface AuctionClosed410Response {
  error: string;
  message: string;
  final_price_ton: string;
  closed_at: string;
}

// Bid Expired (402)
export interface BidExpired402Response {
  error: string;
  message: string;
}

// Invalid Amount (422)
export interface InvalidAmount422Response {
  error: string;
  message: string;
  min_ton: string;
  max_ton: string;
}

// Get My Bid Response
export interface MyBidInfo {
  bid_id: string;
  status: string;
  ton_amount: string;
  bid_price_ton: string;
  allocated_tping?: string;
  refund_ton?: string;
  tx_hash?: string;
  created_at: string;
}

// Existing Bid Status Response (200)
export interface BidCompletedResponse {
  status: string;
  message: string;
  bid_id: string;
  ton_amount: string;
  bid_price_ton?: string;
  estimated_tping?: number;
  current_auction_price?: string;
  tx_hash?: string;
  created_at?: string;
  paymentId: string;
  amount: string;
  payer: string;
  timestamp: number;
  signature: string;
}

export interface BidAllocatedResponse {
  status: string;
  message: string;
  bid_id: string;
  ton_amount: string;
  allocated_tping: string;
  final_price_ton: string;
  refund_ton: string;
  tx_hash: string;
  paymentId: string;
  amount: string;
  payer: string;
  timestamp: number;
  signature: string;
}

export interface BidRefundedResponse {
  status: string;
  message: string;
  bid_id: string;
  ton_amount: string;
  refund_ton: string;
  tx_hash: string;
  paymentId: string;
  amount: string;
  payer: string;
  timestamp: number;
  signature: string;
}

// API error response
export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: number;
}

