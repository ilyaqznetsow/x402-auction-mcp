/**
 * Type definitions for x402 auction API
 */

export interface AuctionInfo {
  status: string;
  current_price: number;
  total_raised: number;
  available_supply: number;
  [key: string]: any;
}

export interface BidResponse {
  bid_id: string;
  payment_address: string;
  amount: number;
  expires_at: string;
  message: string;
  [key: string]: any;
}

export interface MyBidInfo {
  wallet: string;
  [key: string]: any;
}

export interface BidEntry {
  bidder: string;
  amount: number;
  price: number;
  timestamp: string;
}

export interface BidsListResponse {
  bids: BidEntry[];
  total: number;
}

