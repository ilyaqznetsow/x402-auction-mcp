/**
 * API configuration constants
 */

export const API_BASE_URL = 'https://x402.palette.finance/api/auction';

export const ENDPOINTS = {
  INFO: '/info',
  BID: '/bid',
  MY_BID: '/my-bid',
  BIDS: '/bids',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  PAYMENT_REQUIRED: 402,
  CONFLICT: 409,
  GONE: 410,
  INVALID_AMOUNT: 422,
} as const;

export const BID_LIMITS = {
  MIN_TON: 1,
  MAX_TON: 100,
  PAYMENT_TIMEOUT_SECONDS: 180,
} as const;

export const DEFAULT_BIDS_LIMIT = 20;

