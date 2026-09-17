const http = require('http');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { VedikaClient } = require('../dist');

// The 11 GET-only reference tables + the GET+POST dual, from the Rust router
// (VASTU_GET_REFERENCE_ROUTES + VASTU_DUAL_ROUTE in vedika-v2/src/vastu.rs).
const GET_OPS = [
  'reference/directions/8',
  'reference/directions/16',
  'reference/directions/32',
  'reference/mandala/9-zone',
  'reference/mandala/45-devatas',
  'reference/mandala/64-pada',
  'reference/defects/catalog',
  'reference/remedies/catalog',
  'reference/colors-by-zone',
  'reference/materials-by-zone',
  'reference/gate-obstructions',
  'direction/declination',
];
const POST_OPS = ['score/overall', 'placement/borewell', 'entrance/pada', 'plan/analyze'];

describe('Vastu transport verb parity', () => {
  test('typed inventory exposes every mounted logical operation exactly once', () => {
    const operations = VedikaClient.VASTU_OPERATIONS;
    expect(operations).toHaveLength(93);
    expect(new Set(operations).size).toBe(93);
    expect(operations).toEqual(expect.arrayContaining([
      'reference/gate-obstructions',
      'entrance/obstruction-check',
      'direction/sun-path',
      'ar/true-north-calibrate',
      'assessments',
    ]));
  });

  test('every operation exposes its generated method, request, response, auth, and error contract', () => {
    const contracts = VedikaClient.VASTU_OPERATION_CONTRACTS;
    expect(Object.keys(contracts)).toHaveLength(93);
    for (const [operation, contract] of Object.entries(contracts)) {
      expect(contract.method).toMatch(/^(GET|POST|GET_OR_POST)$/);
      expect(contract.requestSchema === null || contract.requestSchema.startsWith('Vastu')).toBe(true);
      expect(contract.requestSchema).not.toBe('VastuOperationRequest');
      expect(contract.responseSchema).toMatch(/^Vastu.+Response$/);
      expect(contract.responseSchema).not.toBe('VastuOperationResponse');
      expect(contract.auth).toBe('apiKey');
      expect(contract.errors).toEqual(expect.arrayContaining([400, 401]));
      expect(new Set(contract.errors).size).toBe(contract.errors.length);
      expect(operation).not.toMatch(/^\/v2\//);
    }
  });

  test('reference/* and direction/declination dispatch GET, others POST', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const get = jest.spyOn(client.client, 'get').mockResolvedValue({ data: { ok: true } });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: { ok: true } });

    for (const op of GET_OPS) await client.vastu(op, { lat: 1, lon: 2 });
    for (const op of POST_OPS) await client.vastu(op, { zone: 'north' });

    GET_OPS.forEach((op, i) => {
      expect(get.mock.calls[i][0]).toBe(`/v2/astrology/vastu/${op}`);
      expect(get.mock.calls[i][1]).toEqual({ params: { lat: 1, lon: 2 } });
    });
    POST_OPS.forEach((op, i) => {
      expect(post.mock.calls[i][0]).toBe(`/v2/astrology/vastu/${op}`);
      expect(post.mock.calls[i][1]).toEqual({ zone: 'north' });
    });
  });

  test('a leading slash on the generic op is normalized', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: { ok: true } });
    await client.vastu('/score/overall', { zone: 'north' });
    expect(post.mock.calls[0][0]).toBe('/v2/astrology/vastu/score/overall');
  });
});

describe('Credential-routing origin policy', () => {
  test('official HTTPS and loopback HTTP accepted; remote HTTP always rejected', () => {
    expect(() => new VedikaClient({ apiKey: 'k', baseUrl: 'https://api.vedika.io' })).not.toThrow();
    expect(() => new VedikaClient({ apiKey: 'k', baseUrl: 'http://127.0.0.1:8080' })).not.toThrow();
    expect(() => new VedikaClient({ apiKey: 'k', baseUrl: 'http://localhost:8080' })).not.toThrow();
    expect(() => new VedikaClient({ apiKey: 'k', baseUrl: 'http://api.vedika.io' })).toThrow(/https/);
    // Spoof hosts that merely START with "127." are NOT loopback and must be rejected.
    expect(() => new VedikaClient({ apiKey: 'k', baseUrl: 'http://127.attacker.invalid' })).toThrow(/custom origins/);
    expect(() => new VedikaClient({ apiKey: 'k', baseUrl: 'http://127.example.com' })).toThrow(/custom origins/);
    // `allowInsecureHttp` was a 3.0.6-only opt-in that never reached npm. It is inert:
    // remote cleartext is not a supported way to send a live key. See
    // tests/credential-routing.test.js for the full origin policy.
    expect(
      () => new VedikaClient({ apiKey: 'k', baseUrl: 'http://api.vedika.io', allowInsecureHttp: true }),
    ).toThrow();
    expect(() => new VedikaClient({ apiKey: 'k', baseUrl: 'ftp://api.vedika.io' })).toThrow();
  });
});

describe('Credential-routing redirect hardening (Node transport)', () => {
  test('the API key is not forwarded across a cross-origin redirect', async () => {
    const seen = {};
    const collector = http.createServer((req, res) => {
      seen.authorization = req.headers['authorization'];
      seen.xApiKey = req.headers['x-api-key'];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { ok: true } }));
    });
    const redirector = http.createServer((req, res) => {
      res.writeHead(302, { Location: `http://127.0.0.1:${collector.address().port}/collect` });
      res.end();
    });

    await new Promise((r) => collector.listen(0, '127.0.0.1', r));
    await new Promise((r) => redirector.listen(0, '127.0.0.1', r));

    try {
      const client = new VedikaClient({
        apiKey: 'vk_test_secret',
        baseUrl: `http://127.0.0.1:${redirector.address().port}`,
      });
      await client.vastu('score/overall', { zone: 'north' });
    } finally {
      collector.close();
      redirector.close();
    }

    expect(seen.authorization).toBeUndefined();
    expect(seen.xApiKey).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AR operations
//
// These two live under /v2/vastu/ar/ on the server and were unreachable from
// this SDK before: the generic vastu() escape hatch only ever builds
// /v2/astrology/vastu/<op>, and there was no named helper. Both prefixes are
// served (verified live 2026-08-16, HTTP 200 on each), so the named helpers use
// the same /v2/astrology/vastu/ prefix as every sibling.
// ---------------------------------------------------------------------------

describe('Vastu AR operations', () => {
  test('vastuArScanQuality POSTs the sensor readings verbatim', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({
      data: { score: 88, grade: 'B', acceptForAudit: true },
    });

    // Exactly the field names the live handler reads
    // (ported::vastu::ar_scan_quality). A misspelling here is silently ignored
    // by the server and costs a neutral 50 on that dimension, so the test
    // pins them.
    const readings = {
      pointCloudDensity: 850,
      polygonClosure: true,
      roomsTagged: true,
      compassConfidence: 0.9,
      gpsConfidence: 0.85,
      scanDurationSec: 240,
      scannedAreaM2: 60,
    };
    const out = await client.vastuArScanQuality(readings);

    expect(post.mock.calls[0][0]).toBe('/v2/astrology/vastu/ar/scan-quality');
    expect(post.mock.calls[0][1]).toEqual(readings);
    expect(out.acceptForAudit).toBe(true);
  });

  test('vastuArScanQuality forwards a partial scan without inventing defaults', async () => {
    // An absent reading is NOT a bad reading — the grader scores it a neutral
    // 50. The SDK must not fill in zeros, which would grade the scan as failing.
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: {} });
    await client.vastuArScanQuality({ pointCloudDensity: 100 });
    expect(post.mock.calls[0][1]).toEqual({ pointCloudDensity: 100 });
  });

  test('vastuArTrueNorthCalibrate POSTs the sun sighting', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({
      data: { reliable: true, offsetDeg: 2.05, solarElevationDeg: 19.21 },
    });

    const sighting = {
      lat: 28.61,
      lon: 77.21,
      datetime: '2025-12-21T03:30:00Z',
      deviceHeadingAtSunDeg: 130,
    };
    const out = await client.vastuArTrueNorthCalibrate(sighting);

    expect(post.mock.calls[0][0]).toBe('/v2/astrology/vastu/ar/true-north-calibrate');
    expect(post.mock.calls[0][1]).toEqual(sighting);
    expect(out.reliable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Listing assessment (b2c#6 / NoBroker pilot)
//
// /v2/astrology/vastu/assessments is a real, mounted, documented endpoint
// (web/vedika-public/openapi.json) but had no dedicated named helper — only
// the generic vastu() escape hatch could reach it. This pins the named helper.
// ---------------------------------------------------------------------------

describe('Vastu listing assessment', () => {
  test('vastuListingAssessment POSTs to /v2/astrology/vastu/assessments', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({
      data: {
        score: 78,
        confidence: 0.95,
        badgeEligibility: { inputSource: 'plan-derived', badge: 'plan-derived', eligible: true },
      },
    });

    const body = { inputSource: 'plan-derived', rooms: [{ roomType: 'kitchen', zone: 'southeast' }] };
    const out = await client.vastuListingAssessment(body);

    expect(post.mock.calls[0][0]).toBe('/v2/astrology/vastu/assessments');
    expect(post.mock.calls[0][1]).toEqual(body);
    expect(out.badgeEligibility.eligible).toBe(true);
  });
});

describe('Vastu assessments contract', () => {
  test('the public type accepts the runtime scanQuality:null fixture', () => {
    const result = spawnSync(
      process.execPath,
      [
        require.resolve('typescript/bin/tsc'),
        '--strict', '--noEmit', '--skipLibCheck', '--target', 'ES2020',
        '--module', 'commonjs', '--moduleResolution', 'node',
        path.join(__dirname, 'type-fixtures/vastu-assessment-null.ts'),
      ],
      { encoding: 'utf8' },
    );
    expect(`${result.stdout}${result.stderr}`).toBe('');
    expect(result.status).toBe(0);
  });

  test('posts the canonical assessment shape without inventing rooms or entrance', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({
      data: { status: 'insufficient_data', confidence: 0.2, badgeEligibility: {
        inputSource: 'plan-derived', badge: null, eligible: false, variant: null,
        reason: 'insufficient evidence',
      } },
    });
    const request = {
      inputSource: 'plan-derived',
      rooms: [{ roomType: 'kitchen', zone: 'SE' }],
      plotPolygon: [[0, 0], [10, 0], [10, 10]],
      doorXY: [5, 0],
      bearingDeg: 0,
      pointCloudDensity: 0.8,
    };
    await client.vastu('assessments', request);
    expect(post).toHaveBeenCalledWith('/v2/astrology/vastu/assessments', request);
  });
});
