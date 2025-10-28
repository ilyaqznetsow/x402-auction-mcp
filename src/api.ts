/**
 * API client for x402 auction endpoints
 */

import { API_BASE_URL, ENDPOINTS } from './constants.js';
import type { AuctionInfo, BidResponse, MyBidInfo, BidsListResponse } from './types.js';

/**
 * Makes HTTP GET request to the API
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw { code: response.status, ...data };
  }
  
  return data;
}

/**
 * Get current auction status and information
 */
export async function getAuctionInfo(): Promise<AuctionInfo> {
  return fetchJson(`${API_BASE_URL}${ENDPOINTS.INFO}`);
}

/**
 * Create a bid for the auction
 * Returns 402 Payment Required with payment instructions
 */
export async function createBid(tonAmount: number, wallet: string): Promise<BidResponse> {
  const url = `${API_BASE_URL}${ENDPOINTS.BID}?ton_amount=${tonAmount}&wallet=${encodeURIComponent(wallet)}`;
  
  try {
    return await fetchJson<BidResponse>(url);
  } catch (error: any) {
    if (error.code === 402) return error;
    throw error;
  }
}

/**
 * Check bid status for a specific wallet
 */
export async function getMyBid(wallet: string): Promise<MyBidInfo> {
  return fetchJson(`${API_BASE_URL}${ENDPOINTS.MY_BID}?wallet=${encodeURIComponent(wallet)}`);
}

/**
 * Get list of recent bids
 */
export async function getRecentBids(limit = 20): Promise<BidsListResponse> {
  return fetchJson(`${API_BASE_URL}${ENDPOINTS.BIDS}?limit=${limit}`);
}

