const { VedikaClient } = require('../dist');

// b2c#31 / sdk-pkg#19: `maxRetries` was declared in VedikaClientOptions but the
// constructor never used it — every call was single-shot regardless of the
// option. These tests pin the actual retry behavior now that it's wired up.
//
// Mutating requests and billed Vastu GETs both need an `Idempotency-Key` the
// server dedupes a retried charge on (vedika-v2/src/factory.rs
// `v2_idempotency_header`). The key must stay IDENTICAL across attempts —
// that's the property that prevents a double charge — so these tests assert
// on it directly, not just on the retry count.

// Drive the REAL axios pipeline (request interceptor attaches the key,
// response error interceptor decides whether to retry) via a custom adapter,
// rather than mocking `client` methods — axios binds `post`/`get`/`request`
// internally, so spying on the instance method does not intercept the
// internal `this.request(config)` re-dispatch the retry path uses.
function installAdapter(client, respond) {
  client.client.defaults.adapter = async (config) => {
    const outcome = await respond(config);
    if (outcome.reject) {
      const err = new Error(outcome.message || `HTTP ${outcome.status}`);
      err.config = config;
      err.response = outcome.status ? { status: outcome.status, data: {}, headers: {}, config } : undefined;
      err.isAxiosError = true;
      throw err;
    }
    return { data: outcome.data, status: 200, statusText: 'OK', headers: {}, config };
  };
}

describe('maxRetries is wired to actual retry behavior', () => {
  test('a paid Vastu POST retries on 503 and reuses the SAME Idempotency-Key', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x', maxRetries: 2 });
    client.sleep = () => Promise.resolve(); // skip real backoff delay

    let attempt = 0;
    let capturedKey;
    installAdapter(client, async (config) => {
      attempt += 1;
      const key = config.headers['Idempotency-Key'];
      if (capturedKey === undefined) capturedKey = key;
      expect(key).toBe(capturedKey); // identical on every retried attempt
      if (attempt < 3) return { reject: true, status: 503 };
      return { data: { ok: true } };
    });

    const result = await client.vastu('score/overall', { zone: 'north' });

    expect(attempt).toBe(3); // 1 initial + 2 retries
    expect(result).toEqual({ ok: true });
    expect(capturedKey).toBeTruthy();
  });

  test('maxRetries: 0 disables retry — the first failure is thrown immediately', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x', maxRetries: 0 });
    client.sleep = () => Promise.resolve();

    let attempt = 0;
    installAdapter(client, async () => {
      attempt += 1;
      return { reject: true, status: 503 };
    });

    await expect(client.vastu('score/overall', { zone: 'north' })).rejects.toBeTruthy();
    expect(attempt).toBe(1);
  });

  test('a non-retryable 402 (insufficient credits) is never retried', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x', maxRetries: 3 });
    client.sleep = () => Promise.resolve();

    let attempt = 0;
    installAdapter(client, async () => {
      attempt += 1;
      return { reject: true, status: 402 };
    });

    await expect(client.vastu('score/overall', { zone: 'north' })).rejects.toBeTruthy();
    expect(attempt).toBe(1);
  });

  test('a paid Vastu GET retries on 503 with the same idempotency key', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x', maxRetries: 1 });
    client.sleep = () => Promise.resolve();

    let attempt = 0;
    const keys = [];
    installAdapter(client, async (config) => {
      attempt += 1;
      keys.push(config.headers['Idempotency-Key']);
      if (attempt < 2) return { reject: true, status: 503 };
      return { data: { ok: true } };
    });

    const result = await client.vastuReference('reference/directions/8');
    expect(attempt).toBe(2);
    expect(result).toEqual({ ok: true });
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
  });
});

describe('Idempotency-Key attachment (safe-retry precondition)', () => {
  test('mutating and paid Vastu GET requests carry an Idempotency-Key', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    client.client.defaults.adapter = async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    // POST — must carry the header.
    const postResp = await client.client.post('/v2/astrology/vastu/score/overall', { a: 1 });
    expect(postResp.config.headers['Idempotency-Key']).toBeTruthy();

    // Reference GETs charge, so a lost response needs the same protection.
    const getResp = await client.client.get('/v2/astrology/vastu/reference/directions/8');
    expect(getResp.config.headers['Idempotency-Key']).toBeTruthy();
  });

  test('a caller-supplied Idempotency-Key is respected, not overwritten', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    client.client.defaults.adapter = async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    const resp = await client.client.post(
      '/v2/astrology/vastu/score/overall',
      { a: 1 },
      { headers: { 'Idempotency-Key': 'caller-chosen-key' } }
    );
    expect(resp.config.headers['Idempotency-Key']).toBe('caller-chosen-key');
  });
});

describe('paid Vastu GET request identity', () => {
  test('covers both mounts and every billed GET, with unique keys for separate calls', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const keys = [];
    installAdapter(client, async (config) => {
      keys.push(config.headers['Idempotency-Key']);
      return { data: { ok: true } };
    });
    const operations = Object.entries(VedikaClient.VASTU_OPERATION_CONTRACTS)
      .filter(([, contract]) => contract.method === 'GET' || contract.method === 'GET_OR_POST');
    expect(operations).toHaveLength(12);
    for (const prefix of ['/v2/vastu/', '/v2/astrology/vastu/']) {
      for (const [operation] of operations) {
        await client.client.get(`${prefix}${operation}`, { params: { lat: 18.5, lon: 73.8 } });
        await client.client.get(`${prefix}${operation}`, { params: { lat: 18.5, lon: 73.8 } });
      }
    }
    expect(keys.every(Boolean)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test.each(['Idempotency-Key', 'x-IDEMPOTENCY-key', 'X-Request-ID'])(
    'preserves caller %s across a paid GET retry', async (header) => {
      const client = new VedikaClient({ apiKey: 'vk_test_x', maxRetries: 1 });
      client.sleep = () => Promise.resolve();
      let attempts = 0;
      installAdapter(client, async (config) => {
        const identities = Object.entries(config.headers).filter(([key]) =>
          ['idempotency-key', 'x-idempotency-key', 'x-request-id'].includes(key.toLowerCase()));
        expect(identities).toHaveLength(1);
        expect(identities[0][1]).toBe('caller-get-key');
        attempts += 1;
        return attempts === 1 ? { reject: true, status: 503 } : { data: { ok: true } };
      });
      await client.client.get('/v2/vastu/direction/declination', { headers: { [header]: 'caller-get-key' } });
      expect(attempts).toBe(2);
    });

  test('does not add keys to unrelated or unknown GET routes', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    installAdapter(client, async (config) => {
      expect(config.headers['Idempotency-Key']).toBeUndefined();
      return { data: { ok: true } };
    });
    for (const path of ['/health', '/sandbox/vastu/reference/directions/8', '/v2/vastu/reference/unknown', '/v2/vastu/audit/floor-plan']) {
      await client.client.get(path);
    }
  });
});

// sdk-pkg#28: billing/meta are siblings of `data` in the raw envelope, not
// nested inside it, so the response interceptor's unwrap drops them from the
// normal return value — they're recoverable only via the non-enumerable
// `__envelope` the interceptor attaches. This was true at runtime before this
// change; what was missing was a TYPE for it (types.ts VastuOperationResult /
// VastuEnvelope) so a TS caller could discover it at all.
describe('__envelope carries billing/meta hidden by the response unwrap', () => {
  test('legacy optional envelope types coexist with required operation contracts', () => {
    const ts = require('typescript');
    const path = require('path');
    const file = path.resolve(__dirname, 'envelope-compatibility.ts');
    const source = `
      import { VastuBilling, VastuMeta, VastuResponse, VastuResponseBilling, VastuResponseMeta } from '../src/types';
      const legacyBilling: VastuBilling = {};
      const legacyMeta: VastuMeta = {};
      const legacySource: VastuMeta = { source: 'fixture' };
      declare const response: VastuResponse<{}>;
      const charged: number = response.billing.charged;
      const engine: string = response.meta.engine;
      // @ts-expect-error Concrete billing requires its charged fields.
      const missingBilling: VastuResponseBilling = {};
      // @ts-expect-error Concrete metadata requires engine and version.
      const missingMeta: VastuResponseMeta = {};
    `;
    const options = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, ...args) => name === file
      ? ts.createSourceFile(file, source, ts.ScriptTarget.ES2020, true)
      : getSourceFile(name, ...args);
    const program = ts.createProgram([file], options, host);
    expect(ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
  });

  test('billing survives on __envelope, not on the top-level result', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    client.client.defaults.adapter = async (config) => ({
      data: {
        success: true,
        data: { score: 47, grade: 'D' },
        billing: { charged: 0.03, currency: 'USD' },
        meta: { engine: 'vedika-intelligence' },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    const result = await client.vastu('score/overall', { zone: 'north' });

    expect(result.score).toBe(47);
    expect(result.billing).toBeUndefined(); // NOT on the payload directly
    expect(result.__envelope.billing).toEqual({ charged: 0.03, currency: 'USD' });
    expect(result.__envelope.meta).toEqual({ engine: 'vedika-intelligence' });
    // Non-enumerable: doesn't leak into JSON.stringify.
    expect(JSON.stringify(result)).not.toContain('billing');
  });
});
