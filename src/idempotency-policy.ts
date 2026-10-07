/**
 * Which operations accept a client idempotency key.
 *
 * The API does NOT accept a key everywhere. On /v2 a key (or a caller-sent
 * X-Request-Id, which the server treats as one) sent to an endpoint that is not
 * certified for idempotency is refused with 422 IDEMPOTENCY_NOT_SUPPORTED. So the
 * client attaches a key on its own only for the operations listed here and for
 * the Vastu family (handled in client.ts). Everything else gets a key only when
 * the caller passes one.
 *
 * Source: the live OpenAPI document (https://api.vedika.io/openapi.json), every
 * operation whose parameters list `Idempotency-Key` or `X-Idempotency-Key`,
 * Vastu operations excluded. Each entry is `[METHOD, path, header names]`; `{x}`
 * matches one path segment.
 */
const CERTIFIED: ReadonlyArray<readonly [string, string, readonly string[]]> = [
  ['POST', '/api/v1/astrology/query', ['X-Idempotency-Key']],
  ['POST', '/api/voice/binary', ['Idempotency-Key']],
  ['POST', '/api/voice/stream', ['Idempotency-Key']],
  ['POST', '/v2/astrology/karana', ['X-Idempotency-Key']],
  ['POST', '/v2/astrology/nakshatra', ['X-Idempotency-Key']],
  ['POST', '/v2/astrology/numerology/address', ['Idempotency-Key']],
  ['POST', '/v2/astrology/numerology/balance', ['Idempotency-Key']],
  ['POST', '/v2/astrology/numerology/birthday', ['Idempotency-Key']],
  ['POST', '/v2/astrology/numerology/business-name', ['Idempotency-Key']],
  ['POST', '/v2/astrology/numerology/chaldean/life-path', ['Idempotency-Key']],
  ['POST', '/v2/astrology/numerology/pinnacle', ['X-Idempotency-Key']],
  ['POST', '/v2/astrology/numerology/soul-urge', ['X-Idempotency-Key']],
  ['POST', '/v2/astrology/numerology/vedic/sankhya', ['X-Idempotency-Key']],
  ['POST', '/v2/astrology/tithi', ['X-Idempotency-Key']],
  ['POST', '/v2/astrology/yoga', ['X-Idempotency-Key']],
  ['GET', '/v2/calculators/flames/{name1}/{name2}', ['X-Idempotency-Key']],
  ['GET', '/v2/calculators/love-score/{name1}/{name2}', ['X-Idempotency-Key']],
  ['GET', '/v2/lifestyle/love-compatibility/{sign1}/{sign2}', ['Idempotency-Key']],
  ['GET', '/v2/lifestyle/lucky-color-today/{sign}', ['Idempotency-Key']],
  ['GET', '/v2/lifestyle/spirit-animal/{sign}', ['Idempotency-Key']],
  ['GET', '/v2/lifestyle/zodiac-fitness/{sign}', ['Idempotency-Key']],
  ['GET', '/v2/lifestyle/zodiac-food/{sign}', ['Idempotency-Key']],
  ['GET', '/v2/lifestyle/zodiac-gift/{sign}', ['Idempotency-Key']],
  ['GET', '/v2/lifestyle/zodiac-travel/{sign}', ['Idempotency-Key']],
  ['POST', '/v2/reports/prebuilt/generate', ['Idempotency-Key']],
];

interface CertifiedRule { method: string; pattern: RegExp; headers: readonly string[]; }

const RULES: CertifiedRule[] = CERTIFIED.map(([method, path, headers]) => ({
  method,
  pattern: new RegExp('^' + path.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[^}/]+\}/g, '[^/]+') + '/?$'),
  headers,
}));

/**
 * The idempotency header names the operation accepts, or `undefined` when it is
 * not certified (send no key). `pathname` is the request path without query.
 */
export function certifiedIdempotencyHeaders(method: string | undefined, pathname: string): readonly string[] | undefined {
  const m = (method || 'get').toUpperCase();
  for (const rule of RULES) {
    if (rule.method === m && rule.pattern.test(pathname)) {
      // /api/v1/astrology/query is documented as X-Idempotency-Key, but the v1 handler
      // derives its charge identity from `idempotency-key` (then x-request-id), so send both.
      return pathname === '/api/v1/astrology/query' ? ['X-Idempotency-Key', 'Idempotency-Key'] : rule.headers;
    }
  }
  return undefined;
}
