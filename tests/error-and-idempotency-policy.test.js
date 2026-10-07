const sdk = require('../dist');
const { VedikaClient } = sdk;

// The API accepts an idempotency key only on certified operations (live OpenAPI
// lists Idempotency-Key / X-Idempotency-Key on them) and on the Vastu family.
// Anywhere else on /v2 a key, or a caller-sent X-Request-Id, is answered 422
// IDEMPOTENCY_NOT_SUPPORTED. These tests pin the client to that contract, and to
// the error rules: 402 typed and never retried, 429 judged by body `code`.

function lower(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) out[k.toLowerCase()] = v;
  return out;
}

function identityHeaders(config) {
  const h = lower(config.headers);
  return ['idempotency-key', 'x-idempotency-key', 'x-request-id'].filter((k) => h[k] !== undefined);
}

// Drive the real axios pipeline (interceptors included) through a custom adapter.
function installAdapter(client, respond) {
  const seen = [];
  client.client.defaults.adapter = async (config) => {
    // Snapshot: the retry path mutates and re-sends the same config object.
    seen.push({ method: config.method, url: config.url, baseURL: config.baseURL, params: config.params, headers: { ...config.headers } });
    const out = await respond(config, seen.length);
    if (out.status && out.status >= 400) {
      const err = new Error(`HTTP ${out.status}`);
      err.config = config;
      err.isAxiosError = true;
      err.response = { status: out.status, data: out.data === undefined ? {} : out.data, headers: out.headers || {}, config };
      throw err;
    }
    if (out.networkError) {
      const err = new Error('socket hang up');
      err.config = config;
      err.isAxiosError = true;
      err.request = {};
      throw err;
    }
    return { data: out.data === undefined ? { ok: true } : out.data, status: 200, statusText: 'OK', headers: {}, config };
  };
  return seen;
}

function newClient(options) {
  const client = new VedikaClient({ apiKey: 'vk_test_x', ...options });
  const sleeps = [];
  client.sleep = (ms) => { sleeps.push(ms); return Promise.resolve(); };
  return { client, sleeps };
}

describe('a key is attached only where the API accepts one', () => {
  test.each([
    ['POST', '/v2/astrology/kundli'],
    ['POST', '/v2/astrology/dasha-periods'],
    ['POST', '/v2/astrology/prediction/daily'],
    ['POST', '/v2/astrology/numerology/complete'],
    ['POST', '/v2/western/synastry'],
    ['GET', '/v2/astrology/panchang'],
    ['GET', '/v2/astrology/muhurta-today'],
    ['POST', '/api/v1/chart'],
    ['POST', '/api/v1/compatibility'],
    ['DELETE', '/api/v1/conversations/abc'],
  ])('%s %s carries no idempotency header and no X-Request-Id', async (method, path) => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ data: { ok: true } }));
    await client.request(method, path, method === 'POST' ? { body: {} } : {});
    expect(identityHeaders(seen[0])).toEqual([]);
  });

  test('named calculator methods send no key', async () => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ data: { success: true, data: { ok: 1 } } }));
    await client.getKundli({ datetime: '1990-06-15T14:30:00+05:30', latitude: 28.6, longitude: 77.2 });
    await client.getPanchang({ date: '2026-10-06' });
    await client.checkCompatibility({ person1: {}, person2: {} });
    await client.getBirthChart({ datetime: '1990-06-15T14:30:00+05:30', latitude: 28.6, longitude: 77.2 });
    for (const config of seen) expect(identityHeaders(config)).toEqual([]);
  });

  test.each([
    ['POST', '/v2/astrology/karana', ['x-idempotency-key']],
    ['POST', '/v2/astrology/tithi', ['x-idempotency-key']],
    ['POST', '/v2/astrology/numerology/address', ['idempotency-key']],
    ['POST', '/v2/reports/prebuilt/generate', ['idempotency-key']],
    ['GET', '/v2/calculators/flames/Asha/Ravi', ['x-idempotency-key']],
    ['GET', '/v2/lifestyle/zodiac-food/aries', ['idempotency-key']],
    ['POST', '/api/v1/astrology/query', ['idempotency-key', 'x-idempotency-key']],
  ])('certified %s %s gets the documented header', async (method, path, expected) => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ data: { ok: true } }));
    await client.request(method, path, method === 'POST' ? { body: {} } : {});
    expect(identityHeaders(seen[0]).sort()).toEqual([...expected].sort());
    const values = new Set(identityHeaders(seen[0]).map((k) => lower(seen[0].headers)[k]));
    expect(values.size).toBe(1);
    expect([...values][0]).toBeTruthy();
  });

  test('askQuestion keeps a stable key across a retried 503', async () => {
    const { client } = newClient({ maxRetries: 2 });
    const seen = installAdapter(client, async (_c, n) => (n < 3 ? { status: 503 } : { data: { answer: 'x' } }));
    await client.askQuestion({ question: 'q', birthDetails: { datetime: '1990-06-15T14:30:00+05:30', latitude: 1, longitude: 2 } });
    expect(seen).toHaveLength(3);
    const keys = seen.map((c) => lower(c.headers)['idempotency-key']);
    expect(keys[0]).toBeTruthy();
    expect(new Set(keys).size).toBe(1);
  });

  test('Vastu operations are still keyed', async () => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ data: { ok: true } }));
    await client.vastu('score/overall', { zone: 'north' });
    expect(lower(seen[0].headers)['idempotency-key']).toBeTruthy();
  });

  test('a caller key is sent as given', async () => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ data: { ok: true } }));
    await client.post('/v2/astrology/karana', {}, { idempotencyKey: 'my-key-1' });
    expect(lower(seen[0].headers)['x-idempotency-key']).toBeUndefined();
    expect(lower(seen[0].headers)['idempotency-key']).toBe('my-key-1');
  });
});

describe('retry safety without a key', () => {
  test('an unkeyed billed POST is not retried on 503', async () => {
    const { client, sleeps } = newClient({ maxRetries: 3 });
    const seen = installAdapter(client, async () => ({ status: 503 }));
    await expect(client.getKundli({ latitude: 1, longitude: 2 })).rejects.toMatchObject({ name: 'ServerError', statusCode: 503 });
    expect(seen).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  test('an unkeyed billed POST is not retried after a dropped connection', async () => {
    const { client } = newClient({ maxRetries: 3 });
    const seen = installAdapter(client, async () => ({ networkError: true }));
    await expect(client.getKundli({ latitude: 1, longitude: 2 })).rejects.toMatchObject({ name: 'NetworkError' });
    expect(seen).toHaveLength(1);
  });

  test('a GET is retried on 503', async () => {
    const { client } = newClient({ maxRetries: 2 });
    const seen = installAdapter(client, async (_c, n) => (n < 2 ? { status: 503 } : { data: { ok: true } }));
    await expect(client.getPanchang({ date: '2026-10-06' })).resolves.toEqual({ ok: true });
    expect(seen).toHaveLength(2);
  });
});

describe('402 insufficient balance', () => {
  const body = {
    success: false,
    error: 'Insufficient balance',
    message: 'Top up to continue',
    code: 'INSUFFICIENT_BALANCE_PRECHECK',
    wallet: { required: 0.05, available: 0.01, deficit: 0.04 },
    purchaseUrl: 'https://vedika.io/dashboard',
  };

  test('is typed with required, available, deficit and never retried', async () => {
    const { client, sleeps } = newClient({ maxRetries: 3 });
    const seen = installAdapter(client, async () => ({ status: 402, data: body }));
    const error = await client.askQuestion({ question: 'q', birthDetails: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(sdk.InsufficientCreditsError);
    expect(error).toBeInstanceOf(sdk.VedikaAPIError);
    expect(error).toMatchObject({
      statusCode: 402,
      code: 'INSUFFICIENT_BALANCE_PRECHECK',
      required: 0.05,
      available: 0.01,
      deficit: 0.04,
      purchaseUrl: 'https://vedika.io/dashboard',
      message: 'Top up to continue',
    });
    expect(seen).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  test('SUBSCRIPTION_EXPIRED stays its own class', async () => {
    const { client } = newClient();
    installAdapter(client, async () => ({ status: 402, data: { code: 'SUBSCRIPTION_EXPIRED', message: 'expired' } }));
    await expect(client.getPanchang()).rejects.toBeInstanceOf(sdk.SubscriptionExpiredError);
  });

  test('a voice 402 delivered as an arraybuffer is decoded', async () => {
    const { client } = newClient();
    const bytes = new TextEncoder().encode(JSON.stringify(body));
    installAdapter(client, async () => ({ status: 402, data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }));
    const error = await client.askVoice({ audio: new Blob([new Uint8Array([1, 2, 3])]) }).catch((e) => e);
    expect(error).toBeInstanceOf(sdk.InsufficientCreditsError);
    expect(error.deficit).toBe(0.04);
  });
});

describe('401', () => {
  test('is typed with its code and not retried', async () => {
    const { client } = newClient({ maxRetries: 3 });
    const seen = installAdapter(client, async () => ({ status: 401, data: { code: 'INVALID_API_KEY', message: 'bad key' } }));
    await expect(client.getPanchang()).rejects.toMatchObject({ name: 'AuthenticationError', code: 'INVALID_API_KEY', message: 'bad key' });
    expect(seen).toHaveLength(1);
  });
});

describe('429 is read from the body code, not the headers', () => {
  test('DAILY_LIMIT_EXCEEDED is never retried, whatever the headers say', async () => {
    const { client, sleeps } = newClient({ maxRetries: 3 });
    const seen = installAdapter(client, async () => ({
      status: 429,
      headers: { 'x-ratelimit-remaining': '57', 'retry-after': '1' },
      data: { code: 'DAILY_LIMIT_EXCEEDED', message: 'daily', retryAfter: 3600, usage: { used: 100, limit: 100 }, upgradeUrl: 'https://vedika.io/pricing' },
    }));
    const error = await client.getPanchang({ date: '2026-10-06' }).catch((e) => e);
    expect(error).toBeInstanceOf(sdk.DailyLimitExceededError);
    expect(error).toBeInstanceOf(sdk.RateLimitError);
    expect(error).toMatchObject({ code: 'DAILY_LIMIT_EXCEEDED', retryAfter: 3600, upgradeUrl: 'https://vedika.io/pricing', usage: { used: 100, limit: 100 } });
    expect(seen).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  test('RATE_LIMIT_EXCEEDED waits for body retryAfter, then succeeds', async () => {
    const { client, sleeps } = newClient({ maxRetries: 2 });
    const seen = installAdapter(client, async (_c, n) => (n === 1
      ? { status: 429, headers: { 'x-ratelimit-remaining': '0' }, data: { code: 'RATE_LIMIT_EXCEEDED', retryAfter: 2, limits: { perMinute: 30 } } }
      : { data: { ok: true } }));
    await expect(client.getPanchang()).resolves.toEqual({ ok: true });
    expect(seen).toHaveLength(2);
    expect(sleeps).toEqual([2000]);
  });

  test('a retryAfter beyond the cap is surfaced, not slept on', async () => {
    const { client, sleeps } = newClient({ maxRetries: 2 });
    const seen = installAdapter(client, async () => ({ status: 429, data: { code: 'RATE_LIMIT_EXCEEDED', retryAfter: 600 } }));
    const error = await client.getPanchang().catch((e) => e);
    expect(error).toBeInstanceOf(sdk.RateLimitError);
    expect(error).not.toBeInstanceOf(sdk.DailyLimitExceededError);
    expect(error.retryAfter).toBe(600);
    expect(seen).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  test('an unkeyed billed POST retries only on RATE_LIMIT_EXCEEDED', async () => {
    const limited = newClient({ maxRetries: 1 });
    const seenLimited = installAdapter(limited.client, async (_c, n) => (n === 1 ? { status: 429, data: { code: 'RATE_LIMIT_EXCEEDED', retryAfter: 1 } } : { data: { ok: true } }));
    await expect(limited.client.getKundli({ latitude: 1, longitude: 2 })).resolves.toEqual({ ok: true });
    expect(seenLimited).toHaveLength(2);

    const unknown = newClient({ maxRetries: 3 });
    const seenUnknown = installAdapter(unknown.client, async () => ({ status: 429, data: { code: 'SOMETHING_NEW' } }));
    await expect(unknown.client.getKundli({ latitude: 1, longitude: 2 })).rejects.toBeInstanceOf(sdk.RateLimitError);
    expect(seenUnknown).toHaveLength(1);
  });

  test('PLAN_LIMIT_EXCEEDED is never retried', async () => {
    const { client } = newClient({ maxRetries: 3 });
    const seen = installAdapter(client, async () => ({ status: 429, data: { code: 'PLAN_LIMIT_EXCEEDED' } }));
    await expect(client.getPanchang()).rejects.toBeInstanceOf(sdk.RateLimitError);
    expect(seen).toHaveLength(1);
  });
});

describe('422 IDEMPOTENCY_NOT_SUPPORTED', () => {
  const refusal = {
    success: false,
    error: 'Idempotency key is not supported for this endpoint.',
    message: 'Remove the idempotency header and retry; no charge was attempted.',
    code: 'IDEMPOTENCY_NOT_SUPPORTED',
  };

  test('resends once without the key, and does not key that route again', async () => {
    const { client } = newClient({ maxRetries: 0 });
    const seen = installAdapter(client, async (config) => (identityHeaders(config).length ? { status: 422, data: refusal } : { data: { ok: true } }));

    await expect(client.post('/v2/astrology/kundli', { latitude: 1 }, { idempotencyKey: 'caller-key' })).resolves.toEqual({ ok: true });
    expect(seen).toHaveLength(2);
    expect(identityHeaders(seen[0])).toEqual(['idempotency-key']);
    expect(identityHeaders(seen[1])).toEqual([]);

    // Remembered: the same route is sent without a key from the start.
    await client.post('/v2/astrology/kundli', { latitude: 1 }, { idempotencyKey: 'another-key' });
    expect(seen).toHaveLength(4);
    expect(identityHeaders(seen[2])).toEqual(['idempotency-key']);
    expect(identityHeaders(seen[3])).toEqual([]);
  });

  test('a certified route that answers 422 stops being auto-keyed', async () => {
    const { client } = newClient();
    const seen = installAdapter(client, async (config) => (identityHeaders(config).length ? { status: 422, data: refusal } : { data: { ok: true } }));
    await client.request('POST', '/v2/astrology/karana', { body: {} });
    expect(seen).toHaveLength(2);
    await client.request('POST', '/v2/astrology/karana', { body: {} });
    expect(seen).toHaveLength(3);
    expect(identityHeaders(seen[2])).toEqual([]);
  });

  test('a second 422 is surfaced as ValidationError with its code', async () => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ status: 422, data: refusal }));
    const error = await client.post('/v2/astrology/kundli', {}, { idempotencyKey: 'k' }).catch((e) => e);
    expect(error).toBeInstanceOf(sdk.ValidationError);
    expect(error.code).toBe('IDEMPOTENCY_NOT_SUPPORTED');
    expect(seen).toHaveLength(2);
  });

  test('other 422s are not retried', async () => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ status: 422, data: { code: 'IDEMPOTENCY_KEY_REUSED', message: 'reused' } }));
    const error = await client.post('/v2/astrology/kundli', {}, { idempotencyKey: 'k' }).catch((e) => e);
    expect(error).toMatchObject({ name: 'ValidationError', code: 'IDEMPOTENCY_KEY_REUSED' });
    expect(seen).toHaveLength(1);
  });
});

describe('request(): the escape hatch cannot leave the API origin', () => {
  test.each([
    'https://evil.example/v2/astrology/kundli',
    '//evil.example/v2/astrology/kundli',
    'v2/astrology/kundli',
    '/v2/astrology/kundli\r\nX-Injected: 1',
    '/\\evil.example',
    '',
  ])('refuses %j before sending', async (path) => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ data: { ok: true } }));
    await expect(client.request('GET', path)).rejects.toBeInstanceOf(sdk.ValidationError);
    expect(seen).toHaveLength(0);
  });

  test('refuses an unknown method and a blank key', async () => {
    const { client } = newClient();
    installAdapter(client, async () => ({ data: {} }));
    await expect(client.request('TRACE', '/v2/x')).rejects.toBeInstanceOf(sdk.ValidationError);
    await expect(client.request('POST', '/v2/x', { idempotencyKey: '  ' })).rejects.toBeInstanceOf(sdk.ValidationError);
  });

  test('sends query and body to the API origin with Bearer auth and unwraps the envelope', async () => {
    const { client } = newClient();
    const seen = installAdapter(client, async () => ({ data: { success: true, data: { value: 7 }, billing: { charged: 0.01 } } }));
    const result = await client.request('POST', '/v2/astrology/kundli', { body: { latitude: 1 }, query: { lang: 'hi' } });
    expect(result.value).toBe(7);
    expect(result.__envelope.billing).toEqual({ charged: 0.01 });
    expect(seen[0].url).toBe('/v2/astrology/kundli');
    expect(seen[0].baseURL).toBe('https://api.vedika.io');
    expect(seen[0].params).toEqual({ lang: 'hi' });
    expect(lower(seen[0].headers).authorization).toBe('Bearer vk_test_x');
  });
});
