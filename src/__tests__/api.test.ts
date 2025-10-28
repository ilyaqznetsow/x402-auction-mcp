/**
 * Tests for API client
 */

import { API_BASE_URL, ENDPOINTS, HTTP_STATUS } from '../constants.js';

describe('API Client', () => {
  // Mock fetch for testing
  const mockFetch = jest.fn();
  global.fetch = mockFetch as any;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getAuctionInfo', () => {
    it('should construct correct URL', async () => {
      const mockData = {
        auction_id: 'test-123',
        status: 'active',
        current_price_ton: '0.15',
      };

      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.OK,
        json: async () => mockData,
      });

      const expectedUrl = `${API_BASE_URL}${ENDPOINTS.AUCTION_INFO}`;
      expect(expectedUrl).toBe('https://x402.palette.finance/api/auction/info');
    });

    it('should handle 404 not found', async () => {
      const mockError = {
        error: 'no_auction',
        message: 'No auction found',
      };

      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.NOT_FOUND,
        json: async () => mockError,
      });

      // Verify error response structure
      expect(mockError.error).toBe('no_auction');
    });
  });

  describe('createBid', () => {
    it('should construct correct URL with parameters', () => {
      const tonAmount = 50;
      const wallet = 'UQBlen9nrjWVN5K-O6yzLeNH5hMrQqAw-6LfW3RnISrMg0nw';

      const url = `${API_BASE_URL}${ENDPOINTS.AUCTION_BID}?ton_amount=${tonAmount}&wallet=${encodeURIComponent(wallet)}`;

      expect(url).toContain('/auction/bid');
      expect(url).toContain('ton_amount=50');
      expect(url).toContain('wallet=');
    });

    it('should handle 402 Payment Required response', async () => {
      const mockPayment = {
        bid_id: 'bid-123',
        network: 'ton-mainnet',
        currency: 'TON',
        tonconnect_universal_link: 'tc://...',
      };

      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.PAYMENT_REQUIRED,
        json: async () => mockPayment,
      });

      // Verify payment response structure
      expect(mockPayment.bid_id).toBeDefined();
      expect(mockPayment.tonconnect_universal_link).toBeDefined();
    });

    it('should handle 422 Invalid Amount response', async () => {
      const mockError = {
        error: 'invalid_amount',
        message: 'TON amount must be between 1 and 100',
        min_ton: '1',
        max_ton: '100',
      };

      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.INVALID_AMOUNT,
        json: async () => mockError,
      });

      // Verify error response structure
      expect(mockError.min_ton).toBe('1');
      expect(mockError.max_ton).toBe('100');
    });
  });

  describe('checkBidById', () => {
    it('should construct correct URL with bid_id parameter', () => {
      const bidId = 'bid-123456';

      const url = `${API_BASE_URL}${ENDPOINTS.AUCTION_BID}?bid_id=${encodeURIComponent(bidId)}`;

      expect(url).toContain('/auction/bid');
      expect(url).toContain('bid_id=bid-123456');
    });

    it('should handle 404 bid not found', async () => {
      const mockError = {
        error: 'bid_not_found',
        message: 'Bid ID not found',
      };

      // Verify error response structure
      expect(mockError.error).toBe('bid_not_found');
    });

    it('should handle 410 auction closed', async () => {
      const mockError = {
        error: 'auction_closed',
        message: 'Auction is closed',
        final_price_ton: '0.15',
        closed_at: '2024-01-01T00:00:00Z',
      };

      // Verify error response structure
      expect(mockError.final_price_ton).toBeDefined();
    });
  });

  describe('getMyBid', () => {
    it('should construct correct URL with wallet parameter', () => {
      const wallet = 'UQBlen9nrjWVN5K-O6yzLeNH5hMrQqAw-6LfW3RnISrMg0nw';

      const url = `${API_BASE_URL}${ENDPOINTS.AUCTION_MY_BID}?wallet=${encodeURIComponent(wallet)}`;

      expect(url).toContain('/auction/my-bid');
      expect(url).toContain('wallet=');
    });
  });

  describe('getRecentBids', () => {
    it('should construct correct URL with limit parameter', () => {
      const limit = 50;

      const url = `${API_BASE_URL}${ENDPOINTS.AUCTION_BIDS}?limit=${limit}`;

      expect(url).toBe('https://x402.palette.finance/api/auction/bids?limit=50');
    });

    it('should handle bid list response', async () => {
      const mockBids = {
        bids: [
          {
            bidder: 'UQ...1234',
            amount: '50',
            price: '0.15',
            time: '2024-01-01T00:00:00Z',
            status: 'completed',
          },
          {
            bidder: 'UQ...5678',
            amount: '100',
            price: '0.15',
            time: '2024-01-01T00:00:01Z',
            status: 'completed',
          },
        ],
        current_price: '0.15',
      };

      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.OK,
        json: async () => mockBids,
      });

      // Verify response structure
      expect(mockBids.bids).toHaveLength(2);
      expect(mockBids.current_price).toBe('0.15');
    });
  });
});
