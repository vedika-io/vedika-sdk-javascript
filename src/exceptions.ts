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
  /** Machine-readable `code` from the JSON error body, e.g. `INSUFFICIENT_BALANCE`. */
  public code?: string;
  /** The parsed JSON error body, when the server sent one. */
  public body?: Record<string, any>;

  constructor(message: string, statusCode?: number, details?: VedikaErrorDetails) {
    super(message);
    this.name = 'VedikaAPIError';
    this.statusCode = statusCode;
    if (details?.code !== undefined) this.code = details.code;
    if (details?.body !== undefined) this.body = details.body;
    Object.setPrototypeOf(this, VedikaAPIError.prototype);
  }
}

/** Extra context the SDK attaches to an API error. */
export interface VedikaErrorDetails {
  code?: string;
  body?: Record<string, any>;
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
 * - Check that your key starts with vk_live_ (or vk_ent_ for enterprise keys)
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
  constructor(message: string = 'Invalid API key', details?: VedikaErrorDetails) {
    super(message, 401, details);
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
 * - Starter: 30 requests/minute
 * - Professional: 60 requests/minute
 * - Business: 120 requests/minute
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
  /** Seconds the server asked the caller to wait (body `retryAfter`), when present. */
  public retryAfter?: number;
  /** The limits the server reported for the refused window, when present. */
  public limits?: Record<string, any>;

  constructor(message: string = 'Rate limit exceeded', details?: RateLimitDetails) {
    super(message, 429, details);
    this.name = 'RateLimitError';
    if (details?.retryAfter !== undefined) this.retryAfter = details.retryAfter;
    if (details?.limits !== undefined) this.limits = details.limits;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/** Context for a 429. */
export interface RateLimitDetails extends VedikaErrorDetails {
  retryAfter?: number;
  limits?: Record<string, any>;
}

/**
 * The plan's daily call allowance is used up (`DAILY_LIMIT_EXCEEDED`).
 *
 * The SDK never retries this: the allowance does not come back until the next
 * day, so a retry only repeats the refusal. Upgrade the plan or wait.
 */
export class DailyLimitExceededError extends RateLimitError {
  /** Where to raise the plan limit, when the server says. */
  public upgradeUrl?: string;
  /** Daily usage the server reported, when present. */
  public usage?: Record<string, any>;

  constructor(message: string = 'Daily call limit exceeded', details?: RateLimitDetails & { upgradeUrl?: string; usage?: Record<string, any> }) {
    super(message, details);
    this.name = 'DailyLimitExceededError';
    if (details?.upgradeUrl !== undefined) this.upgradeUrl = details.upgradeUrl;
    if (details?.usage !== undefined) this.usage = details.usage;
    Object.setPrototypeOf(this, DailyLimitExceededError.prototype);
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
 * - Upgrade your plan at https://vedika.io/pricing
 * - Check your wallet balance before making requests
 *
 * Plans:
 * - Starter: $12/month
 * - Professional: $60/month
 * - Business: $120/month
 * - Enterprise: $240/month
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
  /** USD the call needed (`wallet.required`). */
  public required?: number;
  /** USD in the wallet (`wallet.available`). */
  public available?: number;
  /** USD short (`wallet.deficit`). */
  public deficit?: number;
  /** Where to add funds, when the server says. */
  public purchaseUrl?: string;

  constructor(message: string = 'Insufficient credits', details?: InsufficientCreditsDetails) {
    super(message, 402, details);
    this.name = 'InsufficientCreditsError';
    if (details?.required !== undefined) this.required = details.required;
    if (details?.available !== undefined) this.available = details.available;
    if (details?.deficit !== undefined) this.deficit = details.deficit;
    if (details?.purchaseUrl !== undefined) this.purchaseUrl = details.purchaseUrl;
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype);
  }
}

/** Context for a 402. */
export interface InsufficientCreditsDetails extends VedikaErrorDetails {
  required?: number;
  available?: number;
  deficit?: number;
  purchaseUrl?: string;
}

/**
 * Subscription expired — wallet balance may still exist but the billing
 * period has ended.
 *
 * Both `SUBSCRIPTION_EXPIRED` and plain `INSUFFICIENT_BALANCE` return HTTP 402
 * on the Vedika API. The SDK branches on the server's
 * `code` field so callers can distinguish:
 *
 *   - `SubscriptionExpiredError` → direct user to renew the subscription
 *   - `InsufficientCreditsError` → direct user to top up their wallet
 *
 * Raised when `response.data.code === 'SUBSCRIPTION_EXPIRED'` on a 402.
 *
 * @example
 * ```typescript
 * try {
 *   const response = await client.askQuestion(...);
 * } catch (error) {
 *   if (error instanceof SubscriptionExpiredError) {
 *     console.error('Please renew at https://vedika.io/dashboard');
 *   } else if (error instanceof InsufficientCreditsError) {
 *     console.error('Please add credits at https://vedika.io/dashboard');
 *   }
 * }
 * ```
 */
export class SubscriptionExpiredError extends VedikaAPIError {
  constructor(message: string = 'Subscription expired', details?: VedikaErrorDetails) {
    super(message, 402, details);
    this.name = 'SubscriptionExpiredError';
    Object.setPrototypeOf(this, SubscriptionExpiredError.prototype);
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
  constructor(message: string = 'Validation error', details?: VedikaErrorDetails) {
    super(message, 422, details);
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
 *   apiKey: 'vk_live_...',
 *   timeout: 120000 // 2 minutes
 * });
 * ```
 */
export class TimeoutError extends VedikaAPIError {
  constructor(message: string = 'Request timed out', details?: VedikaErrorDetails) {
    super(message, 408, details);
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
 * - Retry only when the operation is safe to repeat
 * - Wait a few moments if service is down
 * - Contact support@vedika.io if issue persists
 *
 * The SDK retries 502/503/504 only for requests that are safe to repeat: GETs,
 * and POSTs that carry an Idempotency-Key the server dedupes on. It never
 * retries a billable POST that has no key, because that could charge twice.
 */
export class ServerError extends VedikaAPIError {
  constructor(message: string = 'Internal server error', statusCode: number = 500, details?: VedikaErrorDetails) {
    super(message, statusCode, details);
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
