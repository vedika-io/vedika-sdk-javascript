/**
 * Vedika API Exceptions
 * Custom exception classes for the Vedika Astrology API.
 */

/**
 * Base exception for all Vedika API errors
 *
 * This is the parent class for all Vedika SDK exceptions.
 * Catch this to handle any SDK-related error.
 *
 * @example
 * ```typescript
 * try {
 *   const response = await client.askQuestion(...);
 * } catch (error) {
 *   if (error instanceof VedikaAPIError) {
 *     console.error('API error:', error.message);
 *   }
 * }
 * ```
 */
export class VedikaAPIError extends Error {
  public statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'VedikaAPIError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, VedikaAPIError.prototype);
  }
}

/**
 * Authentication failed - invalid API key
 *
 * Raised when:
 * - API key is missing
 * - API key is invalid
 * - API key is expired
 *
 * Solution:
 * - Get a valid API key from https://vedika.io/dashboard.html
 * - Check that your key starts with vk_test_ or vk_live_
 * - Ensure you haven't accidentally exposed your key
 *
 * @example
 * ```typescript
 * try {
 *   const client = new VedikaClient({ apiKey: 'invalid_key' });
 * } catch (error) {
 *   if (error instanceof AuthenticationError) {
 *     console.error('Please provide a valid API key');
 *   }
 * }
 * ```
 */
export class AuthenticationError extends VedikaAPIError {
  constructor(message: string = 'Invalid API key') {
    super(message, 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Rate limit exceeded
 *
 * Raised when:
 * - Too many requests in a short time period
 * - Account rate limit reached
 *
 * Solution:
 * - Wait a moment before retrying
 * - Implement exponential backoff
 * - Upgrade your plan for higher limits
 *
 * Rate limits:
 * - Free tier: 10 requests/minute
 * - Starter: 60 requests/minute
 * - Professional: 300 requests/minute
 * - Enterprise: Custom limits
 *
 * @example
 * ```typescript
 * try {
 *   const response = await client.askQuestion(...);
 * } catch (error) {
 *   if (error instanceof RateLimitError) {
 *     await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
 *     // Retry request
 *   }
 * }
 * ```
 */
export class RateLimitError extends VedikaAPIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Insufficient credits in account
 *
 * Raised when:
 * - Account has run out of credits
 * - Query would exceed available credits
 *
 * Solution:
 * - Add more credits at https://vedika.io/dashboard.html
 * - Check your credit balance before making requests
 * - Enable auto-recharge to prevent interruptions
 *
 * Credit costs:
 * - Simple queries: ~500 tokens ($0.19)
 * - Standard queries: ~800 tokens ($0.35)
 * - Complex queries: ~1,500 tokens ($0.65)
 *
 * @example
 * ```typescript
 * try {
 *   const response = await client.askQuestion(...);
 * } catch (error) {
 *   if (error instanceof InsufficientCreditsError) {
 *     console.error('Please add credits at https://vedika.io/dashboard.html');
 *   }
 * }
 * ```
 */
export class InsufficientCreditsError extends VedikaAPIError {
  constructor(message: string = 'Insufficient credits') {
    super(message, 402);
    this.name = 'InsufficientCreditsError';
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype);
  }
}

/**
 * Request validation failed - invalid input
 *
 * Raised when:
 * - Birth details are invalid or missing
 * - Date/time format is incorrect
 * - Latitude/longitude out of range
 * - Required fields are missing
 *
 * Solution:
 * - Check that datetime is in ISO 8601 format
 * - Verify latitude is between -90 and 90
 * - Verify longitude is between -180 and 180
 * - Ensure timezone is a valid IANA timezone
 *
 * Valid input examples:
 * - datetime: "1990-06-15T14:30:00+05:30"
 * - latitude: 28.6139 (Delhi)
 * - longitude: 77.2090 (Delhi)
 * - timezone: "Asia/Kolkata"
 *
 * @example
 * ```typescript
 * try {
 *   await client.askQuestion({
 *     question: 'Career prospects?',
 *     birthDetails: {
 *       datetime: 'invalid-date', // Wrong format!
 *       latitude: 28.6139,
 *       longitude: 77.2090
 *     }
 *   });
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Invalid input:', error.message);
 *   }
 * }
 * ```
 */
export class ValidationError extends VedikaAPIError {
  constructor(message: string = 'Validation error') {
    super(message, 422);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Request timeout - server took too long to respond
 *
 * Raised when:
 * - Request exceeds configured timeout
 * - Complex query takes longer than expected
 * - Server is experiencing high load
 *
 * Solution:
 * - Increase timeout for complex queries
 * - Retry the request
 * - Contact support if issue persists
 *
 * Typical response times:
 * - Simple queries: 2-5 seconds
 * - Standard queries: 5-15 seconds
 * - Complex queries: 20-40 seconds
 *
 * @example
 * ```typescript
 * // Increase timeout for complex queries
 * const client = new VedikaClient({
 *   apiKey: 'vk_test_...',
 *   timeout: 120000 // 2 minutes
 * });
 * ```
 */
export class TimeoutError extends VedikaAPIError {
  constructor(message: string = 'Request timed out') {
    super(message, 408);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Internal server error
 *
 * Raised when:
 * - Server encountered an unexpected error
 * - Service is temporarily unavailable
 * - Database or ephemeris error
 *
 * Solution:
 * - Retry the request (automatic with SDK)
 * - Wait a few moments if service is down
 * - Contact support@vedika.io if issue persists
 *
 * The SDK automatically retries failed requests up to 3 times
 * with exponential backoff.
 */
export class ServerError extends VedikaAPIError {
  constructor(message: string = 'Internal server error', statusCode: number = 500) {
    super(message, statusCode);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Network connectivity error
 *
 * Raised when:
 * - Cannot connect to Vedika API server
 * - Network timeout
 * - DNS resolution failure
 *
 * Solution:
 * - Check your internet connection
 * - Verify firewall settings allow HTTPS
 * - Check if vedika.io is accessible
 * - Try again in a few moments
 */
export class NetworkError extends VedikaAPIError {
  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
