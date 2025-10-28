/**
 * Tool handlers for MCP server
 * Each handler follows Single Responsibility Principle
 */

import { getAuctionInfo, createBid, getMyBid, getRecentBids } from './api.js';
import { BID_LIMITS, DEFAULT_BIDS_LIMIT } from './constants.js';

function validateBidAmount(amount: number): void {
  if (amount < BID_LIMITS.MIN_TON || amount > BID_LIMITS.MAX_TON) {
    throw new Error(`Bid amount must be between ${BID_LIMITS.MIN_TON} and ${BID_LIMITS.MAX_TON} TON`);
  }
}

function validateWallet(wallet: string): void {
  if (!wallet || typeof wallet !== 'string') {
    throw new Error('Valid wallet address is required');
  }
}

export async function handleGetAuctionInfo() {
  return await getAuctionInfo();
}

export async function handleCreateBid(tonAmount: number, wallet: string) {
  validateBidAmount(tonAmount);
  validateWallet(wallet);
  return await createBid(tonAmount, wallet);
}

export async function handleGetMyBid(wallet: string) {
  validateWallet(wallet);
  return await getMyBid(wallet);
}

export async function handleGetRecentBids(limit = DEFAULT_BIDS_LIMIT) {
  return await getRecentBids(limit);
}

