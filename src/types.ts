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
  auction_supply_token: string;
  started_at?: string;
  tokens_per_ton: number;
  token_name: string;
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
  estimated_token: number;
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
  allocated_token?: string;
  refund_ton?: string;
  tx_hash?: string;
  created_at: string;
}

// Existing Bid Status Response (200) - API response format
export interface BidCompletedApiResponse {
  status: string;
  message: string;
  bid_id: string;
  ton_amount: string;
  bid_price_ton?: string;
  estimated_token?: number;
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
  allocated_token: string;
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

// Nested types for StandardMCPResponse
export interface BidInfo {
  bid_id: string;
  ton_amount: string;
  bid_price_ton?: string;
  estimated_token?: number;
  current_auction_price?: string;
  tx_hash?: string;
  created_at?: string;
  expires_at?: string;
  expires_in_seconds?: number;
  locked_price?: string;
  allocated_token?: string;
  final_price_ton?: string;
  refund_ton?: string;
}

export interface PaymentInfo {
  required?: boolean;
  confirmed?: boolean;
  recipient?: string;
  amount?: string;
  comment_required?: string;
  deeplink?: string;
  deeplink_instructions?: string;
  paymentId?: string;
  expires_in_seconds?: number;
  network?: string;
  payer?: string;
  timestamp?: number | string;
  signature?: string;
}

export interface AuctionInfo {
  auction_id?: string;
  status?: string;
  current_price_ton?: string;
  total_raised_ton?: string;
  progress_percent?: string;
  tokens_per_ton?: number;
  mechanism?: string;
  target_ton?: string;
  final_price_ton?: string;
  closed_at?: string;
  reason?: string;
}

export interface AllocationInfo {
  success?: boolean;
  oversubscribed?: boolean;
  full_allocation?: boolean;
  pricing_model?: string;
}

export interface RefundInfo {
  processed?: boolean;
  transaction_fee_deducted?: boolean;
  refund_amount?: string;
}

export interface PriceComparisonInfo {
  locked_price: string;
  current_price: string;
  favorable: boolean;
}

// Standardized MCP Response Types for Agent Compatibility
export interface StandardMCPResponse {
  status: string;
  action_required: 'payment' | 'wait' | 'none' | 'create_new_bid' | 'check_wallet' | 'unknown';
  urgency?: 'critical' | 'high' | 'normal';
  next_step?: string;
  bid?: BidInfo;
  payment?: PaymentInfo;
  auction?: AuctionInfo;
  allocation?: AllocationInfo;
  refund?: RefundInfo;
  price_comparison?: PriceComparisonInfo;
  wallet?: string;
  timestamp?: string;
}

// Enhanced response types for better type safety
export interface PaymentRequiredResponse extends StandardMCPResponse {
  status: 'payment_required';
  action_required: 'payment';
  urgency: 'critical' | 'high' | 'normal';
  bid: Required<Pick<BidInfo, 'bid_id' | 'ton_amount' | 'estimated_token' | 'expires_at' | 'expires_in_seconds' | 'locked_price'>>;
  payment: Required<Pick<PaymentInfo, 'required' | 'recipient' | 'amount' | 'comment_required' | 'deeplink'>> & Pick<PaymentInfo, 'paymentId' | 'expires_in_seconds'>;
  auction: Required<Pick<AuctionInfo, 'auction_id' | 'current_price_ton' | 'total_raised_ton' | 'progress_percent' | 'tokens_per_ton' | 'mechanism'>>;
  next_step: 'send_payment';
}

export interface BidCompletedMCPResponse extends StandardMCPResponse {
  status: 'completed';
  action_required: 'wait';
  bid: Required<Pick<BidInfo, 'bid_id' | 'ton_amount' | 'bid_price_ton'>> & Pick<BidInfo, 'estimated_token' | 'current_auction_price' | 'tx_hash' | 'created_at'>;
  payment: Required<Pick<PaymentInfo, 'confirmed'>> & Pick<PaymentInfo, 'paymentId' | 'amount' | 'payer' | 'timestamp' | 'signature'>;
  price_comparison?: PriceComparisonInfo;
  auction?: Pick<AuctionInfo, 'status'>;
  next_step: 'wait_for_allocation';
}

export interface BidAllocatedMCPResponse extends StandardMCPResponse {
  status: 'allocated';
  action_required: 'none';
  bid: Required<Pick<BidInfo, 'bid_id' | 'ton_amount' | 'allocated_token' | 'final_price_ton'>> & Pick<BidInfo, 'refund_ton' | 'tx_hash'>;
  payment: Required<Pick<PaymentInfo, 'confirmed'>> & Pick<PaymentInfo, 'paymentId' | 'amount' | 'payer' | 'timestamp' | 'signature'>;
  allocation: Required<Pick<AllocationInfo, 'success' | 'oversubscribed' | 'full_allocation' | 'pricing_model'>>;
  auction: Required<Pick<AuctionInfo, 'status'>>;
  next_step: 'check_wallet';
}

export interface BidRefundedMCPResponse extends StandardMCPResponse {
  status: 'refunded';
  action_required: 'none';
  bid: Required<Pick<BidInfo, 'bid_id' | 'ton_amount' | 'refund_ton'>> & Pick<BidInfo, 'tx_hash'>;
  payment: Required<Pick<PaymentInfo, 'confirmed'>> & Pick<PaymentInfo, 'paymentId' | 'amount' | 'payer' | 'timestamp' | 'signature'>;
  auction: Required<Pick<AuctionInfo, 'status' | 'reason'>>;
  refund: Required<Pick<RefundInfo, 'processed' | 'transaction_fee_deducted'>>;
  next_step: 'check_wallet';
}

