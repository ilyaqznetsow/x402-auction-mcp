/**
 * API client for x402 auction endpoints
 */

import { API_BASE_URL, ENDPOINTS, HTTP_STATUS } from './constants.js';
import type {
  AuctionInfoResponse,
  RecentBidsResponse,
  BidRequired402Response,
  MyBidInfo,
  BidCompletedResponse,
  BidAllocatedResponse,
  BidRefundedResponse,
  ApiErrorResponse,
} from './types.js';

/**
 * Fetch with error handling
 */
async function fetchWithStatus<T>(url: string): Promise<{ status: number; data: T }> {
  const response = await fetch(url);
  const data = await response.json();

  return {
    status: response.status,
    data,
  };
}

/**
 * Get current auction status and information
 */
export async function getAuctionInfo(): Promise<AuctionInfoResponse> {
  const { status, data } = await fetchWithStatus<AuctionInfoResponse>(
    `${API_BASE_URL}${ENDPOINTS.AUCTION_INFO}`
  );

  if (status === HTTP_STATUS.NOT_FOUND) {
    throw { code: status, error: 'no_auction', message: 'No auction found', ...data };
  }

  if (status !== HTTP_STATUS.OK) {
    throw { code: status, ...data };
  }

  return data;
}

/**
 * Create a bid for the auction
 * Returns 402 Payment Required with payment instructions
 */
export async function createBid(tonAmount: number, wallet: string): Promise<BidRequired402Response> {
  const url = `${API_BASE_URL}${ENDPOINTS.AUCTION_BID}?ton_amount=${tonAmount}&wallet=${encodeURIComponent(wallet)}`;

  const { status, data } = await fetchWithStatus<BidRequired402Response>(url);

  // 402 is expected - return it as-is
  if (status === HTTP_STATUS.PAYMENT_REQUIRED) {
    return data as BidRequired402Response;
  }

  // Any other status is an error
  if (status !== HTTP_STATUS.OK) {
    throw { code: status, ...data };
  }

  return data;
}

/**
 * Check bid status by bid ID
 * Returns bid status, payment info, or payment instructions if still pending
 */
export async function checkBidById(bidId: string): Promise<any> {
  const url = `${API_BASE_URL}${ENDPOINTS.AUCTION_BID}?bid_id=${encodeURIComponent(bidId)}`;

  const { status, data } = await fetchWithStatus<any>(url);

  // All status codes are valid for bid lookup
  if (status === HTTP_STATUS.NOT_FOUND) {
    throw { code: status, error: 'bid_not_found', message: 'Bid ID not found', ...data };
  }

  if (status !== HTTP_STATUS.OK && status !== HTTP_STATUS.PAYMENT_REQUIRED && status !== HTTP_STATUS.GONE) {
    throw { code: status, ...data };
  }

  return { status, data };
}

/**
 * Get bid status for a specific wallet
 */
export async function getMyBid(wallet: string): Promise<MyBidInfo> {
  const { status, data } = await fetchWithStatus<MyBidInfo>(
    `${API_BASE_URL}${ENDPOINTS.AUCTION_MY_BID}?wallet=${encodeURIComponent(wallet)}`
  );

  if (status !== HTTP_STATUS.OK) {
    throw { code: status, ...data };
  }

  return data;
}

/**
 * Get list of recent bids
 */
export async function getRecentBids(limit = 20): Promise<RecentBidsResponse> {
  const { status, data } = await fetchWithStatus<RecentBidsResponse>(
    `${API_BASE_URL}${ENDPOINTS.AUCTION_BIDS}?limit=${limit}`
  );

  if (status !== HTTP_STATUS.OK) {
    throw { code: status, ...data };
  }

  return data;
}

