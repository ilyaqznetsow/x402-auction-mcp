# Test Suite Guide

## Overview

The x402 Auction MCP project includes a comprehensive test suite with **4 test files** covering **71 test cases** across all major modules.

## Test Files

### 1. `src/__tests__/types.test.ts`
Tests for type definitions and enums.

**Coverage:**
- `AuctionStatus` enum (ACTIVE, CLOSED, FAILED)
- `BidStatus` enum (PENDING, COMPLETED, ALLOCATED, REFUNDED, EXPIRED)
- Type interface structure validation
- Response type definitions

### 2. `src/__tests__/constants.test.ts`
Tests for all configuration constants.

**Coverage:**
- API base URL and endpoints
- HTTP status codes (200, 402, 404, 409, 410, 422, 500)
- Bid limits validation (MIN_TON=1, MAX_TON=100)
- Default and maximum limits
- Error codes (all 8 defined error codes)

### 3. `src/__tests__/handlers.test.ts`
Tests for handler validation and business logic.

**Coverage:**
- Bid amount validation (type, min/max bounds)
- Wallet address validation (empty, null, type checks)
- Bid ID validation
- Limit validation (defaults, capping, edge cases)
- Response formatting (status codes, data spreading)

### 4. `src/__tests__/api.test.ts`
Tests for API client with mocked fetch.

**Coverage:**
- URL construction for all endpoints
- HTTP status code handling (402, 404, 410, 422)
- Response structure validation
- Error response handling
- Parameter encoding and URL params

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Watch Mode (Auto-run on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Statistics

| Category | Count |
|----------|-------|
| Test Suites | 4 |
| Test Cases | 71 |
| Enums Tested | 2 |
| Validations | 18 |
| HTTP Status Codes | 7 |
| Error Codes | 8 |

## Coverage Areas

✅ **Type Safety**
- All enums and interfaces
- Response type structures
- Error response formats

✅ **Validation**
- Input validation (amounts, wallets, IDs)
- Edge cases (min/max, empty values)
- Type checking

✅ **API Integration**
- Endpoint URLs
- Query parameters
- Status code handling
- Error responses

✅ **Constants**
- All configuration values
- API endpoints
- HTTP status codes
- Error codes

## Adding New Tests

When adding new features:

1. **Create test file** in `src/__tests__/` with `.test.ts` suffix
2. **Follow Jest conventions**:
   ```typescript
   describe('Feature Name', () => {
     it('should do something', () => {
       expect(result).toBe(expected);
     });
   });
   ```
3. **Run tests** to verify:
   ```bash
   npm test
   ```

## CI/CD Integration

Tests are ready for CI/CD pipelines. Example GitHub Actions:

```yaml
- name: Run Tests
  run: npm test

- name: Check Coverage
  run: npm run test:coverage
```

## Coverage Thresholds

Current Jest config requires minimum:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

Adjust in `jest.config.js` as needed.

## Troubleshooting

### Tests not running
- Ensure dependencies installed: `npm install`
- Check Jest is configured: `jest.config.js` exists

### Import errors
- Verify ts-jest preset in jest.config.js
- Check tsconfig.json module settings

### Timeout errors
- Increase Jest timeout in test: `jest.setTimeout(10000)`

## Next Steps

- Add integration tests with real API calls
- Add E2E tests for complete workflows
- Set up coverage reporting in CI/CD
- Add snapshot tests for responses
