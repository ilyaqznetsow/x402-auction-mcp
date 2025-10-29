/**
 * API client for x402 auction endpoints
 */

import { API_BASE_URL, ENDPOINTS, HTTP_STATUS } from './constants.js';
import type {
  AuctionInfoResponse,
  RecentBidsResponse,
  BidRequired402Response,
  MyBidInfo,
  BidCompletedApiResponse,
  BidAllocatedResponse,
  BidRefundedResponse,
  AuctionClosed410Response,
  ApiErrorResponse,
} from './types.js';

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  status: number;
  data: T;
}

/**
 * Fetch with error handling
 */
async function fetchWithStatus<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  const data = await response.json() as T;

  return {
    status: response.status,
    data,
  };
}

/**
 * Get current auction status and information
 */
export async function getAuctionInfo(): Promise<AuctionInfoResponse> {
  const { status, data } = await fetchWithStatus<AuctionInfoResponse | ApiErrorResponse>(
    `${API_BASE_URL}${ENDPOINTS.AUCTION_INFO}`
  );

  if (status === HTTP_STATUS.NOT_FOUND) {
    const errorData = data as ApiErrorResponse;
    throw { 
      code: status, 
      error: 'no_auction', 
      message: errorData.message || 'No auction found',
      details: data,
    };
  }

  if (status !== HTTP_STATUS.OK) {
    const errorData = data as ApiErrorResponse;
    throw { 
      code: status, 
      error: errorData.error || 'api_error',
      message: errorData.message || 'API request failed',
      details: data,
    };
  }

  return data as AuctionInfoResponse;
}

/**
 * Union type for createBid responses
 */
type CreateBidResponse = BidRequired402Response | BidCompletedApiResponse | BidAllocatedResponse | BidRefundedResponse | ApiErrorResponse;

/**
 * Return type for createBid
 */
interface CreateBidResult {
  status: number;
  data: BidRequired402Response | BidCompletedApiResponse | BidAllocatedResponse | BidRefundedResponse;
}

/**
 * Create a bid for the auction
 * Returns 402 Payment Required with payment instructions OR
 * Returns 200 OK if bid already exists with status completed/allocated/refunded
 */
export async function createBid(tonAmount: number, wallet: string): Promise<CreateBidResult> {
  const url = `${API_BASE_URL}${ENDPOINTS.AUCTION_BID}?ton_amount=${tonAmount}&wallet=${encodeURIComponent(wallet)}`;

  const { status, data } = await fetchWithStatus<CreateBidResponse>(url);

  // 402 is expected for new bids - return with status
  if (status === HTTP_STATUS.PAYMENT_REQUIRED) {
    return { status, data: data as BidRequired402Response };
  }

  // 200 OK means bid already exists with completed/allocated/refunded status
  if (status === HTTP_STATUS.OK) {
    return { status, data: data as BidCompletedApiResponse | BidAllocatedResponse | BidRefundedResponse };
  }

  // Any other status is an error
  const errorData = data as ApiErrorResponse;
  throw { 
    code: status,
    error: errorData.error || 'api_error',
    message: errorData.message || 'Failed to create bid',
    details: data,
  };
}

/**
 * Union type for checkBidById responses
 */
type CheckBidResponse = BidRequired402Response | BidCompletedApiResponse | BidAllocatedResponse | BidRefundedResponse | AuctionClosed410Response | ApiErrorResponse;

/**
 * Return type for checkBidById
 */
interface CheckBidResult {
  status: number;
  data: BidRequired402Response | BidCompletedApiResponse | BidAllocatedResponse | BidRefundedResponse | AuctionClosed410Response;
}

/**
 * Check bid status by bid ID
 * Returns bid status, payment info, or payment instructions if still pending
 */
export async function checkBidById(bidId: string): Promise<CheckBidResult> {
  const url = `${API_BASE_URL}${ENDPOINTS.AUCTION_BID}?bid_id=${encodeURIComponent(bidId)}`;

  const { status, data } = await fetchWithStatus<CheckBidResponse>(url);

  // All status codes are valid for bid lookup
  if (status === HTTP_STATUS.NOT_FOUND) {
    const errorData = data as ApiErrorResponse;
    throw { 
      code: status, 
      error: 'bid_not_found', 
      message: errorData.message || 'Bid ID not found',
      details: data,
    };
  }

  if (status !== HTTP_STATUS.OK && status !== HTTP_STATUS.PAYMENT_REQUIRED && status !== HTTP_STATUS.GONE) {
    const errorData = data as ApiErrorResponse;
    throw { 
      code: status,
      error: errorData.error || 'api_error',
      message: errorData.message || 'API request failed',
      details: data,
    };
  }

  return { status, data: data as BidRequired402Response | BidCompletedApiResponse | BidAllocatedResponse | BidRefundedResponse | AuctionClosed410Response };
}

/**
 * Get bid status for a specific wallet
 */
export async function getMyBid(wallet: string): Promise<MyBidInfo> {
  const { status, data } = await fetchWithStatus<MyBidInfo | ApiErrorResponse>(
    `${API_BASE_URL}${ENDPOINTS.AUCTION_MY_BID}?wallet=${encodeURIComponent(wallet)}`
  );

  if (status !== HTTP_STATUS.OK) {
    const errorData = data as ApiErrorResponse;
    throw { 
      code: status,
      error: errorData.error || 'api_error',
      message: errorData.message || 'API request failed',
      details: data,
    };
  }

  return data as MyBidInfo;
}

/**
 * Get list of recent bids
 */
export async function getRecentBids(limit = 20): Promise<RecentBidsResponse> {
  const { status, data } = await fetchWithStatus<RecentBidsResponse | ApiErrorResponse>(
    `${API_BASE_URL}${ENDPOINTS.AUCTION_BIDS}?limit=${limit}`
  );

  if (status !== HTTP_STATUS.OK) {
    const errorData = data as ApiErrorResponse;
    throw { 
      code: status,
      error: errorData.error || 'api_error',
      message: errorData.message || 'API request failed',
      details: data,
    };
  }

  return data as RecentBidsResponse;
}

