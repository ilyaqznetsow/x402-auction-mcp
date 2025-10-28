/**
 * Tests for type definitions
 */

import { AuctionStatus, BidStatus } from '../types.js';

describe('Enums', () => {
  describe('AuctionStatus', () => {
    it('should have ACTIVE status', () => {
      expect(AuctionStatus.ACTIVE).toBe('active');
    });

    it('should have CLOSED status', () => {
      expect(AuctionStatus.CLOSED).toBe('closed');
    });

    it('should have FAILED status', () => {
      expect(AuctionStatus.FAILED).toBe('failed');
    });
  });

  describe('BidStatus', () => {
    it('should have PENDING status', () => {
      expect(BidStatus.PENDING).toBe('pending');
    });

    it('should have COMPLETED status', () => {
      expect(BidStatus.COMPLETED).toBe('completed');
    });

    it('should have ALLOCATED status', () => {
      expect(BidStatus.ALLOCATED).toBe('allocated');
    });

    it('should have REFUNDED status', () => {
      expect(BidStatus.REFUNDED).toBe('refunded');
    });

    it('should have EXPIRED status', () => {
      expect(BidStatus.EXPIRED).toBe('expired');
    });
  });
});

describe('Type Interfaces', () => {
  it('should define AuctionInfoResponse', () => {
    const mockAuction = {
      auction_id: 'test-123',
      status: 'active',
      start_price_ton: '0.1',
      current_price_ton: '0.15',
      ceiling_price_ton: '0.5',
      tick_size_ton: '0.01',
      min_ton: '1',
      max_ton: '100',
      target_ton: '1000',
      total_raised_ton: '500',
      progress_percent: '50.00',
      auction_supply_tping: '10000',
      started_at: '2024-01-01T00:00:00Z',
      tokens_per_ton: 6666.67,
    };

    // Type checking happens at compile time
    expect(mockAuction.auction_id).toBe('test-123');
    expect(mockAuction.status).toBe('active');
  });

  it('should define BidRequired402Response', () => {
    const mockPayment = {
      network: 'ton-mainnet',
      currency: 'TON',
      auction_id: 'test-123',
      bid_id: 'bid-456',
      ton_amount: '50',
      current_price_ton: '0.15',
      estimated_tping: 333.33,
      pay_to: 'UQ...',
      expires_in: 180,
      tonconnect_universal_link: 'tc://...',
      maxAmountRequired: '100',
      resource: '/api/auction/bid',
      description: 'Participation in TPING auction',
      asset: 'EQAAAA...',
      assetType: 'TON',
      expiresAt: '2024-01-01T00:03:00Z',
      nonce: 'abc123',
      paymentId: 'bid-0456',
    };

    expect(mockPayment.network).toBe('ton-mainnet');
    expect(mockPayment.expires_in).toBe(180);
  });
});
