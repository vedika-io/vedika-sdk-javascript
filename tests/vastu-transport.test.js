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
const POST_OPS = ['plan/import-dxf', 'plan/export-dxf', 'plan/export-ifc', 'plan/convert-units', 'plan/import-ifc', 'plan/import-image', 'plan/import-pdf', 'score/overall', 'placement/borewell', 'entrance/pada', 'plan/analyze'];

describe('Vastu transport verb parity', () => {
  test('typed inventory exposes every mounted logical operation exactly once', () => {
    const operations = VedikaClient.VASTU_OPERATIONS;
    expect(operations).toHaveLength(147);
    expect(new Set(operations).size).toBe(147);
    expect(operations).toEqual(expect.arrayContaining([
      'reference/gate-obstructions',
      'entrance/obstruction-check',
      'direction/sun-path',
      'ar/true-north-calibrate',
      'assessments',
      'plan/import-image',
      'plan/import-pdf',
      'ar/capture-merge',
      'plot/from-survey',
    ]));
  });

  test('every operation exposes its generated method, request, response, auth, and error contract', () => {
    const contracts = VedikaClient.VASTU_OPERATION_CONTRACTS;
    expect(Object.keys(contracts)).toHaveLength(147);
    for (const [operation, contract] of Object.entries(contracts)) {
      expect(contract.method).toMatch(/^(GET|POST|GET_OR_POST)$/);
      expect(contract.requestSchema === null || contract.requestSchema.startsWith('Vastu')).toBe(true);
      expect(contract.requestSchema).not.toBe('VastuOperationRequest');
      expect(contract.responseSchema).toMatch(/^Vastu.+Response$/);
      expect(contract.responseSchema).not.toBe('VastuOperationResponse');
      expect(contract.auth).toBe('apiKey');
      expect(contract.errors).toContain(401);
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
  test('a cross-origin redirect is refused and the other origin sees nothing', async () => {
    let collected = 0;
    const collector = http.createServer((req, res) => {
      collected += 1;
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
      await expect(client.vastu('score/overall', { zone: 'north' })).rejects.toThrow(/redirect/i);
    } finally {
      collector.close();
      redirector.close();
    }

    expect(collected).toBe(0);
  });
});

describe('portfolio contracts and attribution', () => {
  test('all seven typed operations POST their exact request', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_synthetic' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: { success: true, data: {} } });
    const cases = [
      ['vastuPortfolioSearch', 'portfolio/search', {city: 'Pune', tags: ['rental']}],
      ['vastuPortfolioCompare', 'portfolio/compare', {propertyIds: ['p1', 'p2']}],
      ['vastuPortfolioAnalytics', 'portfolio/analytics', {tag: 'rental'}],
      ['vastuPortfolioUsage', 'portfolio/usage', {tenantRef: 't1'}],
      ['vastuPortfolioUsageExport', 'portfolio/usage/export', {propertyId: 'p1'}],
      ['vastuPortfolioBudgetsSet', 'portfolio/budgets/set', {tenantRef: 't1', capUsd: '1.21'}],
      ['vastuPortfolioBudgetsGet', 'portfolio/budgets/get', {tenantRef: 't1'}],
    ];
    for (const [method, path, request] of cases) {
      await client[method](request);
      expect(post.mock.calls.at(-1).slice(0, 2)).toEqual([`/v2/astrology/vastu/${path}`, request]);
    }
  });
  test('GET attribution uses headers and preserves the caller idempotency key', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_synthetic' });
    const get = jest.spyOn(client.client, 'get').mockResolvedValue({data: {success:true}});
    await client.vastu('reference/directions/8', {}, {propertyId:'p1', tenantRef:'t1', idempotencyKey:'stable'});
    expect(get.mock.calls[0][1].headers).toEqual(expect.objectContaining({'x-vastu-property-id':'p1', 'x-vastu-tenant-ref':'t1', 'Idempotency-Key':'stable'}));
  });
});

describe('Property collaboration SDK methods', () => {
  test('all nine helpers POST the supplied owner and actor-independent payload to their exact route', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_x' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({data: {success: true, data: {}}});
    const suffixes = ['CollaborationGet','CollaborationInvite','CollaborationRevoke','CollaborationMembers','CollaborationComment','CollaborationReview','CollaborationUpdate','ActivityList','ActivityExport'];
    const routes = ['collaboration/get','collaboration/invite','collaboration/revoke','collaboration/members','collaboration/comment','collaboration/review','collaboration/update','activity/list','activity/export'];
    const payload = {propertyId: 'property-fixture', ownerId: 'owner-fixture'};
    for (let i = 0; i < suffixes.length; i++) {
      await client['vastuProperties' + suffixes[i]](payload);
      expect(post.mock.calls[i][0]).toBe('/v2/astrology/vastu/properties/' + routes[i]);
      expect(post.mock.calls[i][1]).toEqual(payload);
    }
  });
});


test('collaboration invite preserves 202 pending data and consent/cancellation fields', async () => {
  const client = new VedikaClient({ apiKey: 'vk_test_x' });
  const value = {success: true, data: {invitationId: '00000000-0000-4000-8000-000000000001', status: 'pending'}, billing: {chargedCents: 0}};
  const post = jest.spyOn(client.client, 'post').mockResolvedValue({status: 202, data: value});
  const invite = {propertyId: 'property-fixture', email: 'synthetic@example.invalid', role: 'viewer'};
  expect(await client.vastuPropertiesCollaborationInvite(invite)).toEqual(value);
  const acceptance = {...invite, ownerId: 'synthetic-owner', accept: true};
  await client.vastuPropertiesCollaborationInvite(acceptance);
  expect(post.mock.calls[1][1]).toEqual(acceptance);
  const cancel = {propertyId: 'property-fixture', invitationId: value.data.invitationId};
  await client.vastuPropertiesCollaborationRevoke(cancel);
  expect(post.mock.calls[2][1]).toEqual(cancel);
});
