/**
 * API configuration constants
 */

export const API_BASE_URL = 'https://x402.palette.finance/api';

export const ENDPOINTS = {
  AUCTION_INFO: '/auction/info',
  AUCTION_BID: '/auction/bid',
  AUCTION_MY_BID: '/auction/my-bid',
  AUCTION_BIDS: '/auction/bids',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  PAYMENT_REQUIRED: 402,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  INVALID_AMOUNT: 422,
  INTERNAL_ERROR: 500,
} as const;

export const BID_LIMITS = {
  MIN_TON: 1,
  MAX_TON: 100,
  PAYMENT_TIMEOUT_SECONDS: 180,
} as const;

export const DEFAULT_BIDS_LIMIT = 20;
export const MAX_BIDS_LIMIT = 100;

// Error codes
export const ERROR_CODES = {
  NO_AUCTION: 'no_auction',
  NO_ACTIVE_AUCTION: 'no_active_auction',
  AUCTION_CLOSED: 'auction_closed',
  BID_EXPIRED: 'bid_expired',
  INVALID_AMOUNT: 'invalid_amount',
  MISSING_WALLET: 'missing_wallet',
  BID_NOT_FOUND: 'bid_not_found',
  INTERNAL_ERROR: 'internal_error',
} as const;

