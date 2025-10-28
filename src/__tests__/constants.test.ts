/**
 * Tests for constants
 */

import {
  API_BASE_URL,
  ENDPOINTS,
  HTTP_STATUS,
  BID_LIMITS,
  DEFAULT_BIDS_LIMIT,
  MAX_BIDS_LIMIT,
  ERROR_CODES,
} from '../constants.js';

describe('Constants', () => {
  describe('API Configuration', () => {
    it('should have correct base URL', () => {
      expect(API_BASE_URL).toBe('https://x402.palette.finance/api');
    });

    it('should have all required endpoints', () => {
      expect(ENDPOINTS.AUCTION_INFO).toBe('/auction/info');
      expect(ENDPOINTS.AUCTION_BID).toBe('/auction/bid');
      expect(ENDPOINTS.AUCTION_MY_BID).toBe('/auction/my-bid');
      expect(ENDPOINTS.AUCTION_BIDS).toBe('/auction/bids');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should define all required status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.PAYMENT_REQUIRED).toBe(402);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
      expect(HTTP_STATUS.GONE).toBe(410);
      expect(HTTP_STATUS.INVALID_AMOUNT).toBe(422);
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });
  });

  describe('Bid Limits', () => {
    it('should have valid MIN_TON', () => {
      expect(BID_LIMITS.MIN_TON).toBeGreaterThan(0);
      expect(BID_LIMITS.MIN_TON).toBeLessThanOrEqual(BID_LIMITS.MAX_TON);
    });

    it('should have valid MAX_TON', () => {
      expect(BID_LIMITS.MAX_TON).toBeGreaterThan(BID_LIMITS.MIN_TON);
    });

    it('should have valid payment timeout', () => {
      expect(BID_LIMITS.PAYMENT_TIMEOUT_SECONDS).toBeGreaterThan(0);
      expect(BID_LIMITS.PAYMENT_TIMEOUT_SECONDS).toBe(180);
    });

    it('should have realistic bid range', () => {
      expect(BID_LIMITS.MIN_TON).toBe(1);
      expect(BID_LIMITS.MAX_TON).toBe(100);
    });
  });

  describe('Limits', () => {
    it('should have valid default limit', () => {
      expect(DEFAULT_BIDS_LIMIT).toBeGreaterThan(0);
      expect(DEFAULT_BIDS_LIMIT).toBeLessThanOrEqual(MAX_BIDS_LIMIT);
    });

    it('should have valid maximum limit', () => {
      expect(MAX_BIDS_LIMIT).toBe(100);
      expect(MAX_BIDS_LIMIT).toBeGreaterThanOrEqual(DEFAULT_BIDS_LIMIT);
    });
  });

  describe('Error Codes', () => {
    it('should define all required error codes', () => {
      expect(ERROR_CODES.NO_AUCTION).toBe('no_auction');
      expect(ERROR_CODES.NO_ACTIVE_AUCTION).toBe('no_active_auction');
      expect(ERROR_CODES.AUCTION_CLOSED).toBe('auction_closed');
      expect(ERROR_CODES.BID_EXPIRED).toBe('bid_expired');
      expect(ERROR_CODES.INVALID_AMOUNT).toBe('invalid_amount');
      expect(ERROR_CODES.MISSING_WALLET).toBe('missing_wallet');
      expect(ERROR_CODES.BID_NOT_FOUND).toBe('bid_not_found');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('internal_error');
    });

    it('should use lowercase error codes', () => {
      Object.values(ERROR_CODES).forEach((code: string) => {
        expect(code).toBe(code.toLowerCase());
      });
    });
  });
});
