/**
 * Tool handlers for MCP server
 * Each handler follows Single Responsibility Principle
 */

import { getAuctionInfo, createBid, checkBidById, getMyBid, getRecentBids } from './api.js';
import { BID_LIMITS, DEFAULT_BIDS_LIMIT, MAX_BIDS_LIMIT, HTTP_STATUS } from './constants.js';
import type { AuctionInfoResponse, BidRequired402Response, MyBidInfo, RecentBidsResponse } from './types.js';

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
 * Create bid handler - handles 402 Payment Required response
 */
export async function handleCreateBid(tonAmount: number, wallet: string): Promise<any> {
  validateBidAmount(tonAmount);
  validateWallet(wallet);

  const response = await createBid(tonAmount, wallet);

  // Return payment instructions with status
  return {
    status: HTTP_STATUS.PAYMENT_REQUIRED,
    ...response,
    message: 'Payment required - use tonconnect_universal_link to complete',
  };
}

/**
 * Check bid status by ID handler
 */
export async function handleCheckBidById(bidId: string): Promise<any> {
  validateBidId(bidId);

  const { status, data } = await checkBidById(bidId);

  if (status === HTTP_STATUS.PAYMENT_REQUIRED) {
    return {
      status,
      ...data,
      message: 'Bid payment pending - use tonconnect_universal_link to complete',
    };
  }

  if (status === HTTP_STATUS.GONE) {
    return {
      status,
      ...data,
      message: 'Auction has closed',
    };
  }

  // 200 OK - bid exists with status
  return {
    status: HTTP_STATUS.OK,
    ...data,
  };
}

/**
 * Get user's bid handler
 */
export async function handleGetMyBid(wallet: string): Promise<MyBidInfo> {
  validateWallet(wallet);
  return await getMyBid(wallet);
}

/**
 * Get recent bids handler
 */
export async function handleGetRecentBids(limit?: number): Promise<RecentBidsResponse> {
  const validatedLimit = validateLimit(limit);
  return await getRecentBids(validatedLimit);
}

