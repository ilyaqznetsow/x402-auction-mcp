/**
 * Tool handlers for MCP server
 * Each handler follows Single Responsibility Principle
 */

import { getAuctionInfo, createBid, checkBidById, getMyBid, getRecentBids } from './api.js';
import { BID_LIMITS, DEFAULT_BIDS_LIMIT, MAX_BIDS_LIMIT, HTTP_STATUS } from './constants.js';
import type { 
  AuctionInfoResponse, 
  BidRequired402Response, 
  MyBidInfo, 
  RecentBidsResponse,
  StandardMCPResponse,
  BidCompletedMCPResponse,
  BidAllocatedMCPResponse,
  BidRefundedMCPResponse,
  BidCompletedApiResponse,
  BidAllocatedResponse,
  BidRefundedResponse,
  AuctionClosed410Response,
} from './types.js';

/**
 * Validate bid amount
 */
function validateBidAmount(amount: number): void {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Bid amount must be a valid number');
  }
  if (amount < BID_LIMITS.MIN_TON || amount > BID_LIMITS.MAX_TON) {
    throw new Error(`Bid amount must be between ${BID_LIMITS.MIN_TON} and ${BID_LIMITS.MAX_TON} TON`);
  }
}

/**
 * Validate wallet address
 */
function validateWallet(wallet: string): void {
  if (!wallet || typeof wallet !== 'string' || wallet.trim().length === 0) {
    throw new Error('Valid wallet address is required');
  }
}

/**
 * Validate bid ID
 */
function validateBidId(bidId: string): void {
  if (!bidId || typeof bidId !== 'string' || bidId.trim().length === 0) {
    throw new Error('Valid bid ID is required');
  }
}

/**
 * Validate bid limit
 */
function validateLimit(limit?: number): number {
  if (limit === undefined) return DEFAULT_BIDS_LIMIT;
  if (typeof limit !== 'number' || isNaN(limit) || limit < 1) {
    return DEFAULT_BIDS_LIMIT;
  }
  return Math.min(limit, MAX_BIDS_LIMIT);
}


/**
 * Get auction info handler
 */
export async function handleGetAuctionInfo(): Promise<AuctionInfoResponse> {
  return await getAuctionInfo();
}

/**
 * Create bid handler - handles 402 Payment Required response or 200 OK for existing bids
 */
export async function handleCreateBid(tonAmount: number, wallet: string): Promise<StandardMCPResponse> {
  validateBidAmount(tonAmount);
  validateWallet(wallet);

  // Get current auction info for context
  const auctionInfo = await getAuctionInfo();

  // Create the bid (or get existing bid)
  const response = await createBid(tonAmount, wallet);

  // If bid already exists (200 OK)
  if (response.status === HTTP_STATUS.OK) {
    const data = response.data;
    
    // Type guard to narrow down the union type
    if (!('status' in data)) {
      throw new Error('Invalid response: missing status field');
    }
    
    // Handle different existing bid statuses
    if (data.status === 'completed') {
      const completedData = data as BidCompletedApiResponse;
      const currentPrice = auctionInfo.current_price_ton;
      const bidPrice = completedData.bid_price_ton || '0';
      
      return {
        status: 'completed',
        action_required: 'wait',
        bid: {
          bid_id: completedData.bid_id,
          ton_amount: completedData.ton_amount,
          bid_price_ton: completedData.bid_price_ton,
          estimated_token: completedData.estimated_token,
          current_auction_price: completedData.current_auction_price,
          tx_hash: completedData.tx_hash,
          created_at: completedData.created_at,
        },
        payment: {
          confirmed: true,
          paymentId: completedData.paymentId,
          amount: completedData.amount,
          payer: completedData.payer,
          timestamp: completedData.timestamp,
          signature: completedData.signature,
        },
        price_comparison: {
          locked_price: bidPrice,
          current_price: currentPrice,
          favorable: parseFloat(currentPrice) > parseFloat(bidPrice),
        },
        auction: {
          status: 'active',
        },
        next_step: 'wait_for_allocation',
      };
    }
    
    if (data.status === 'allocated') {
      const allocatedData = data as BidAllocatedResponse;
      const hasRefund = Boolean(allocatedData.refund_ton && parseFloat(allocatedData.refund_ton) > 0);
      
      return {
        status: 'allocated',
        action_required: 'none',
        bid: {
          bid_id: allocatedData.bid_id,
          ton_amount: allocatedData.ton_amount,
          allocated_token: allocatedData.allocated_token,
          final_price_ton: allocatedData.final_price_ton,
          refund_ton: allocatedData.refund_ton,
          tx_hash: allocatedData.tx_hash,
        },
        payment: {
          confirmed: true,
          paymentId: allocatedData.paymentId,
          amount: allocatedData.amount,
          payer: allocatedData.payer,
          timestamp: allocatedData.timestamp,
          signature: allocatedData.signature,
        },
        allocation: {
          success: true,
          oversubscribed: hasRefund,
          full_allocation: !hasRefund,
          pricing_model: 'pay-as-bid',
        },
        auction: {
          status: 'closed_successful',
        },
        next_step: 'check_wallet',
      };
    }
    
    if (data.status === 'refunded') {
      const refundedData = data as BidRefundedResponse;
      return {
        status: 'refunded',
        action_required: 'none',
        bid: {
          bid_id: refundedData.bid_id,
          ton_amount: refundedData.ton_amount,
          refund_ton: refundedData.refund_ton,
          tx_hash: refundedData.tx_hash,
        },
        payment: {
          confirmed: true,
          paymentId: refundedData.paymentId,
          amount: refundedData.amount,
          payer: refundedData.payer,
          timestamp: refundedData.timestamp,
          signature: refundedData.signature,
        },
        auction: {
          status: 'closed_failed',
          reason: 'target_not_reached',
        },
        refund: {
          processed: true,
          transaction_fee_deducted: true,
        },
        next_step: 'check_wallet',
      };
    }
  }

  // New bid - 402 Payment Required
  const bidData = response.data as BidRequired402Response;
  
  const expirySeconds = bidData.expires_in;
  const urgency = expirySeconds < 60 ? 'critical' : expirySeconds < 300 ? 'high' : 'normal';
  
  // Return complete bid information with auction context and payment instructions
  return {
    status: 'payment_required',
    action_required: 'payment',
    urgency: urgency,
    bid: {
      bid_id: bidData.bid_id,
      ton_amount: bidData.ton_amount,
      estimated_token: bidData.estimated_token,
      expires_at: bidData.expiresAt,
      expires_in_seconds: bidData.expires_in,
      locked_price: bidData.current_price_ton,
      created_at: new Date().toISOString(),
    },
    auction: {
      auction_id: auctionInfo.auction_id,
      current_price_ton: auctionInfo.current_price_ton,
      total_raised_ton: auctionInfo.total_raised_ton,
      progress_percent: auctionInfo.progress_percent,
      tokens_per_ton: auctionInfo.tokens_per_ton,
      mechanism: 'pay-as-bid',
      status: auctionInfo.status,
      target_ton: auctionInfo.target_ton,
    },
    payment: {
      required: true,
      recipient: bidData.pay_to,
      amount: bidData.ton_amount,
      comment_required: bidData.bid_id,
      deeplink: bidData.tonconnect_universal_link,
      deeplink_instructions: 'Click this link to open your TON wallet app and complete the payment. This is a direct wallet link, not a QR code.',
      paymentId: bidData.paymentId,
      expires_in_seconds: bidData.expires_in,
      network: bidData.network || 'TON',
    },
    next_step: 'send_payment',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check bid status by ID handler
 */
export async function handleCheckBidById(bidId: string): Promise<StandardMCPResponse> {
  validateBidId(bidId);

  const { status, data } = await checkBidById(bidId);

  if (status === HTTP_STATUS.PAYMENT_REQUIRED) {
    const paymentData = data as BidRequired402Response;
    const urgency = paymentData.expires_in < 60 ? 'critical' : paymentData.expires_in < 300 ? 'high' : 'normal';

    return {
      status: 'payment_pending',
      action_required: 'payment',
      urgency: urgency,
      bid: {
        bid_id: paymentData.bid_id,
        ton_amount: paymentData.ton_amount,
        estimated_token: paymentData.estimated_token,
        expires_at: paymentData.expiresAt,
        expires_in_seconds: paymentData.expires_in,
        locked_price: paymentData.current_price_ton,
      },
      payment: {
        required: true,
        recipient: paymentData.pay_to,
        amount: paymentData.ton_amount,
        comment_required: paymentData.bid_id,
        deeplink: paymentData.tonconnect_universal_link,
        deeplink_instructions: 'Click this link to open your TON wallet app and complete the payment. This is a direct wallet link, not a QR code.',
        expires_in_seconds: paymentData.expires_in,
      },
      next_step: 'send_payment',
    };
  }

  if (status === HTTP_STATUS.GONE) {
    const closedData = data as AuctionClosed410Response;
    return {
      status: 'auction_closed',
      action_required: 'none',
      auction: {
        status: 'closed',
        final_price_ton: closedData.final_price_ton,
        closed_at: closedData.closed_at,
      },
      next_step: 'check_my_bid',
    };
  }

  // 200 OK - bid exists with status
  // Type guard to check for status field
  if (!('status' in data)) {
    throw new Error('Invalid response: missing status field');
  }
  
  return {
    status: data.status || 'unknown',
    action_required: data.status === 'pending' ? 'payment' : 'none',
  };
}

/**
 * Get user's bid handler
 */
export async function handleGetMyBid(wallet: string): Promise<StandardMCPResponse> {
  validateWallet(wallet);
  
  try {
    const bid = await getMyBid(wallet);

    // Handle pending payment status
    if (bid.status === 'pending') {
      const { status, data } = await checkBidById(bid.bid_id);
      
      if (status === HTTP_STATUS.PAYMENT_REQUIRED && 'pay_to' in data && data.pay_to) {
      const urgency = data.expires_in < 60 ? 'critical' : data.expires_in < 300 ? 'high' : 'normal';

      return {
        ...bid,
        action_required: 'payment',
        urgency: urgency,
        wallet: wallet,
        payment: {
          required: true,
          recipient: data.pay_to,
          amount: bid.ton_amount,
          comment_required: bid.bid_id,
          deeplink: data.tonconnect_universal_link,
          deeplink_instructions: 'Click this link to open your TON wallet app and complete the payment. This is a direct wallet link, not a QR code.',
          expires_in_seconds: data.expires_in,
        },
        next_step: 'send_payment',
      };
      }
    }

    // Handle completed status
    if (bid.status === 'completed') {
      return {
      ...bid,
      wallet: wallet,
      action_required: 'wait',
      payment: {
        confirmed: true,
      },
      next_step: 'wait_for_allocation',
      timestamp: new Date().toISOString(),
      };
    }

    // Handle allocated status
    if (bid.status === 'allocated') {
      const hasRefund = Boolean(bid.refund_ton && parseFloat(bid.refund_ton) > 0);
      
      return {
      ...bid,
      wallet: wallet,
      action_required: 'none',
      allocation: {
        success: true,
        oversubscribed: hasRefund,
        full_allocation: !hasRefund,
        pricing_model: 'pay-as-bid',
      },
      next_step: 'check_wallet',
      timestamp: new Date().toISOString(),
    };
    }

    // Handle refunded status
    if (bid.status === 'refunded') {
      return {
      ...bid,
      wallet: wallet,
      action_required: 'none',
      auction: {
        status: 'failed',
        reason: 'target_not_reached',
      },
      refund: {
        processed: true,
        transaction_fee_deducted: true,
        refund_amount: bid.refund_ton,
      },
      next_step: 'check_wallet',
      timestamp: new Date().toISOString(),
      };
    }

    // Handle expired status
    if (bid.status === 'expired') {
      return {
      ...bid,
      wallet: wallet,
      action_required: 'create_new_bid',
      next_step: 'create_new_bid',
      };
    }

    // Return as-is for any other status
    return {
      ...bid,
      wallet: wallet,
      action_required: 'unknown',
    };
  } catch (error: unknown) {
    // 404 is expected when wallet has no bid - rethrow for proper handling
    const apiError = error as { code?: number };
    if (apiError.code === HTTP_STATUS.NOT_FOUND) {
      throw error;
    }
    throw error;
  }
}

/**
 * Get recent bids handler
 */
export async function handleGetRecentBids(limit?: number): Promise<RecentBidsResponse> {
  const validatedLimit = validateLimit(limit);
  return await getRecentBids(validatedLimit);
}

