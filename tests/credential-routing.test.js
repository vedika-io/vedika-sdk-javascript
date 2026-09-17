/**
 * Credential routing — the API key must only ever reach a Vedika origin.
 *
 * The defect these tests pin: `new VedikaClient({ apiKey, baseUrl })` binds the
 * Bearer key (and the legacy X-API-Key) to whatever origin the caller supplies.
 * Before this change an HTTPS attacker origin was accepted, so a bad config or a
 * compromised env var shipped a live `vk_live_*` key off-domain on the first call.
 *
 * Every negative assertion here is paired with a positive control, so a green run
 * can never come from a guard that rejects everything or a harness that observes
 * nothing.
 */

const http = require('http');
const { VedikaClient, AuthenticationError } = require('../dist');

const KEY = 'vk_live_test_key_do_not_use';

/** Start a throwaway loopback server that records the headers it is sent. */
function startRecorder() {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({ url: req.url, headers: req.headers });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { ok: true } }));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, seen, port: server.address().port });
    });
  });
}

describe('credential routing: baseUrl origin policy', () => {
  // ── CONTROL ──────────────────────────────────────────────────────────────
  // Proves the harness can observe a credential on the wire at all. Without
  // this, every "the key did not leak" assertion below would be unfalsifiable.
  test('CONTROL: the configured key really does travel as a wire header', async () => {
    const { server, seen, port } = await startRecorder();
    try {
      const client = new VedikaClient({ apiKey: KEY, baseUrl: `http://127.0.0.1:${port}` });
      await client.getHoroscope('aries');
      expect(seen).toHaveLength(1);
      expect(seen[0].headers.authorization).toBe(`Bearer ${KEY}`);
      expect(seen[0].headers['x-api-key']).toBe(KEY);
    } finally {
      server.close();
    }
  });

  // ── THE DEFECT ───────────────────────────────────────────────────────────
  test('an attacker HTTPS origin is rejected, not merely warned about', () => {
    expect(() => new VedikaClient({ apiKey: KEY, baseUrl: 'https://attacker.invalid' }))
      .toThrow(AuthenticationError);
  });

  test('the key is never bound to a non-Vedika origin', () => {
    // Even if construction were allowed, the credential must not end up as an
    // axios default on a foreign origin. Asserted on the instance so the failure
    // mode is visible without a network round trip.
    let client = null;
    try {
      client = new VedikaClient({ apiKey: KEY, baseUrl: 'https://attacker.invalid' });
    } catch (err) {
      expect(err).toBeInstanceOf(AuthenticationError);
      return;
    }
    const axiosDefaults = client.client.defaults;
    throw new Error(
      `client was constructed against ${axiosDefaults.baseURL} carrying ` +
      `Authorization=${axiosDefaults.headers.Authorization ? 'Bearer <key>' : 'none'}`
    );
  });

  test('a lookalike suffix host is rejected', () => {
    for (const bad of [
      'https://api.vedika.io.attacker.com',   // ours is only the prefix
      'https://vedika.io.evil.example',
      'https://notvedika.io',                 // ends with "vedika.io" — a bare
      'https://evilvedika.io',                // suffix test accepts both of these
      'https://vedika.io.attacker.com',
    ]) {
      expect(() => new VedikaClient({ apiKey: KEY, baseUrl: bad })).toThrow(AuthenticationError);
    }
  });

  test('embedded credentials in the baseUrl are rejected', () => {
    expect(() => new VedikaClient({ apiKey: KEY, baseUrl: 'https://api.vedika.io@attacker.invalid' }))
      .toThrow(AuthenticationError);
  });

  test('a non-loopback cleartext origin is rejected', () => {
    expect(() => new VedikaClient({ apiKey: KEY, baseUrl: 'http://api.vedika.io' }))
      .toThrow(AuthenticationError);
  });

  test('there is no opt-in that re-enables remote cleartext', () => {
    // `allowInsecureHttp` was a 3.0.6-only escape hatch. It never shipped to npm
    // (absent from the published 3.0.5 artifact); it is now inert. An option that
    // sends a live key over remote cleartext HTTP is not a supported mode.
    expect(() => new VedikaClient({
      apiKey: KEY,
      baseUrl: 'http://api.vedika.io',
      allowInsecureHttp: true,
    })).toThrow(AuthenticationError);
  });

  test('a non-HTTP scheme is rejected', () => {
    for (const bad of ['ftp://api.vedika.io', 'file:///etc/passwd', 'javascript:alert(1)']) {
      expect(() => new VedikaClient({ apiKey: KEY, baseUrl: bad })).toThrow(AuthenticationError);
    }
  });

  // ── POSITIVE CONTROLS ────────────────────────────────────────────────────
  // A guard that throws on everything would pass every test above.
  test('the official API origin is accepted', () => {
    for (const good of [
      'https://api.vedika.io',
      'https://api.vedika.io/',
      'https://api.vedika.io:443',
    ]) {
      expect(() => new VedikaClient({ apiKey: KEY, baseUrl: good })).not.toThrow();
    }
  });

  test('other Vedika and HTTPS loopback origins are refused', () => {
    for (const baseUrl of ['https://vedika.io', 'https://cdn.vedika.io',
      'https://staging.api.vedika.io', 'https://api.vedika.io.', 'https://localhost:8443']) {
      expect(() => new VedikaClient({ apiKey: KEY, baseUrl })).toThrow(AuthenticationError);
    }
  });

  test('loopback stays usable for local development', () => {
    for (const good of [
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://[::1]:3000',
    ]) {
      expect(() => new VedikaClient({ apiKey: KEY, baseUrl: good })).not.toThrow();
    }
  });

  test('the default baseUrl still works with no options', () => {
    const client = new VedikaClient({ apiKey: KEY });
    expect(client.client.defaults.baseURL).toBe('https://api.vedika.io');
  });
});

describe('credential routing: per-request origin choke point', () => {
  // baseUrl is checked once at construction. axios ignores `baseURL` whenever a
  // request URL is absolute or protocol-relative, and a per-request `baseURL`
  // overrides the instance default outright — so the constructor check alone is
  // not the invariant. No public method reaches this today (every path is built
  // behind a literal `/v2/...` prefix), which is exactly why it needs a test:
  // the next method that forwards a caller-supplied path must not reopen it.
  test('an absolute off-origin request URL is rejected', async () => {
    const client = new VedikaClient({ apiKey: KEY, timeout: 500 });
    await expect(client.client.get('https://attacker.invalid/v2/steal'))
      .rejects.toThrow(AuthenticationError);
  });

  test('a protocol-relative request URL is rejected', async () => {
    const client = new VedikaClient({ apiKey: KEY });
    await expect(client.client.get('//attacker.invalid/v2/steal'))
      .rejects.toThrow(AuthenticationError);
  });

  test('a per-request baseURL override is rejected', async () => {
    const client = new VedikaClient({ apiKey: KEY, timeout: 500 });
    await expect(client.client.get('/v2/astrology/horoscope/aries', {
      baseURL: 'https://attacker.invalid',
    })).rejects.toThrow(AuthenticationError);
  });

  test('CONTROL: an on-origin relative request is not rejected by the choke point', async () => {
    const { server, seen, port } = await startRecorder();
    try {
      const client = new VedikaClient({ apiKey: KEY, baseUrl: `http://127.0.0.1:${port}` });
      await client.client.get('/v2/astrology/horoscope/aries');
      expect(seen).toHaveLength(1);
      expect(seen[0].headers.authorization).toBe(`Bearer ${KEY}`);
    } finally {
      server.close();
    }
  });

  test('CONTROL: an absolute SAME-origin request URL is allowed through', async () => {
    const { server, seen, port } = await startRecorder();
    try {
      const client = new VedikaClient({ apiKey: KEY, baseUrl: `http://127.0.0.1:${port}` });
      await client.client.get(`http://127.0.0.1:${port}/v2/astrology/horoscope/aries`);
      expect(seen).toHaveLength(1);
    } finally {
      server.close();
    }
  });
});

describe('credential routing: cross-origin redirect credential strip (Node transport)', () => {
  test('CONTROL: auth headers survive a SAME-origin redirect', async () => {
    const seen = [];
    const server = http.createServer((req, res) => {
      seen.push({ url: req.url, headers: req.headers });
      if (req.url.includes('/redirect')) {
        res.writeHead(302, { Location: '/v2/astrology/horoscope/aries' });
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { ok: true } }));
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    try {
      const client = new VedikaClient({ apiKey: KEY, baseUrl: `http://127.0.0.1:${port}` });
      await client.client.get('/redirect');
      expect(seen).toHaveLength(2);
      expect(seen[1].headers.authorization).toBe(`Bearer ${KEY}`);
      expect(seen[1].headers['x-api-key']).toBe(KEY);
    } finally {
      server.close();
    }
  });

  test('auth headers are stripped on a CROSS-origin redirect', async () => {
    const attackerSeen = [];
    const attacker = http.createServer((req, res) => {
      attackerSeen.push({ url: req.url, headers: req.headers });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { ok: true } }));
    });
    await new Promise((r) => attacker.listen(0, '127.0.0.1', r));
    const attackerPort = attacker.address().port;

    const origin = http.createServer((req, res) => {
      res.writeHead(302, { Location: `http://127.0.0.1:${attackerPort}/collect` });
      res.end();
    });
    await new Promise((r) => origin.listen(0, '127.0.0.1', r));
    const originPort = origin.address().port;

    try {
      const client = new VedikaClient({ apiKey: KEY, baseUrl: `http://127.0.0.1:${originPort}` });
      await client.client.get('/v2/astrology/horoscope/aries').catch(() => {});
      expect(attackerSeen).toHaveLength(1);
      expect(attackerSeen[0].headers.authorization).toBeUndefined();
      expect(attackerSeen[0].headers['x-api-key']).toBeUndefined();
    } finally {
      attacker.close();
      origin.close();
    }
  });
});
