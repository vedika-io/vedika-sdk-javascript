const http = require('node:http');
const { spawnSync } = require('node:child_process');
const sdk = require('../dist');

const apiKey = 'local-fixture-only';
let servers;

beforeEach(() => { servers = []; });
afterEach(async () => {
  await Promise.all(servers.map(server => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  })));
});

async function serve(handler) {
  const server = http.createServer(handler);
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

function json(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function client(baseUrl, options = {}) {
  return new sdk.VedikaClient({ apiKey, baseUrl, timeout: 1000, maxRetries: 0, ...options });
}

test('loads the locked Axios version and the same SDK exports from CJS and ESM', () => {
  expect(require('axios/package.json').version)
    .toBe(require('../package-lock.json').packages['node_modules/axios'].version);
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { createRequire } from 'node:module';
    import { strict as assert } from 'node:assert';
    import * as esm from './dist/index.js';
    const require = createRequire(import.meta.url);
    const cjs = require('./dist');
    for (const [name, value] of Object.entries(cjs)) assert.equal(esm[name], value);
    assert.equal(esm.VERSION, require('./package.json').version);
    console.log('CJS/ESM exports match');
  `], { cwd: require('node:path').resolve(__dirname, '..'), encoding: 'utf8', timeout: 10000 });
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
  expect(result.stdout.trim()).toBe('CJS/ESM exports match');
});

test('sends auth and JSON once, unwraps V2, and keeps billing metadata non-enumerable', async () => {
  const requests = [];
  const envelope = { success: true, data: { value: 7 }, billing: { credits: 1 } };
  const base = await serve((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      requests.push({ method: req.method, url: req.url, headers: req.headers, body });
      json(res, envelope);
    });
  });
  const result = await client(base).vastu('score/overall', { zone: 'north' });
  expect(result).toEqual({ value: 7 });
  expect(result.__envelope).toEqual(envelope);
  expect(JSON.stringify(result)).toBe('{"value":7}');
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ method: 'POST', url: '/v2/astrology/vastu/score/overall' });
  expect(JSON.parse(requests[0].body)).toEqual({ zone: 'north' });
  expect(requests[0].headers.authorization).toBe(`Bearer ${apiKey}`);
  expect(requests[0].headers['x-api-key']).toBe(apiKey);
  expect(requests[0].headers['idempotency-key']).toBeTruthy();
});

test('refuses redirects: same-origin and cross-origin get no second request', async () => {
  const seen = [];
  const destination = await serve((req, res) => {
    seen.push(req.headers);
    json(res, { success: true, data: { ok: true } });
  });
  let originHits = 0;
  const base = await serve((req, res) => {
    originHits += 1;
    res.writeHead(302, { Location: req.url === '/v2/astrology/panchang' ? '/same' : `${destination}/other` });
    res.end();
  });
  await expect(client(base).getPanchang()).rejects.toThrow(/redirect/i);
  expect(originHits).toBe(1);
  expect(seen).toHaveLength(0);
});

test.each([
  [401, undefined, 'AuthenticationError'],
  [402, 'SUBSCRIPTION_EXPIRED', 'SubscriptionExpiredError'],
  [402, 'INSUFFICIENT_BALANCE', 'InsufficientCreditsError'],
  [408, undefined, 'TimeoutError'],
  [422, undefined, 'ValidationError'],
  [429, undefined, 'RateLimitError'],
  [500, undefined, 'ServerError'],
  [502, undefined, 'ServerError'],
  [503, undefined, 'ServerError'],
  [504, undefined, 'ServerError'],
  [403, undefined, 'VedikaAPIError'],
])('maps HTTP %s/%s to %s without retrying a POST', async (status, code, name) => {
  let calls = 0;
  const base = await serve((_req, res) => {
    calls++;
    json(res, { message: 'fixture refusal', code }, status);
  });
  const error = await client(base).vastu('score/overall', {}).catch(value => value);
  expect(error).toBeInstanceOf(sdk[name]);
  expect(error.statusCode).toBe(status);
  expect(error.message).toContain('fixture refusal');
  expect(calls).toBe(1);
});

test('maps transport timeouts without retrying', async () => {
  let calls = 0;
  const base = await serve(() => { calls++; });
  await expect(client(base, { timeout: 50 }).vastu('score/overall', {}))
    .rejects.toBeInstanceOf(sdk.TimeoutError);
  expect(calls).toBe(1);
});

test('maps a closed socket to NetworkError without retrying', async () => {
  let calls = 0;
  const base = await serve(req => { calls++; req.socket.destroy(); });
  await expect(client(base).vastu('score/overall', {})).rejects.toBeInstanceOf(sdk.NetworkError);
  expect(calls).toBe(1);
});

test('retains V1 response bodies and the stream response type', async () => {
  const body = { success: true, response: 'fixture answer', metadata: { fixture: true } };
  const base = await serve((req, res) => {
    if (req.url.endsWith('/stream')) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.end('data: first\ndata: second\n');
    } else json(res, body);
  });
  const instance = client(base);
  const query = { question: 'fixture', birthDetails: {} };
  await expect(instance.askQuestion(query)).resolves.toEqual(body);
  const chunks = [];
  for await (const chunk of instance.askQuestionStream(query)) chunks.push(chunk);
  expect(chunks).toEqual(['first', 'second']);
});

test('askVastuReport sends the report as vastuContext and reuses it by conversation', async () => {
  const bodies = [];
  const answer = {
    success: true,
    response: 'Fix the toilet first [D1].',
    conversationId: 'conv_1',
    vastuContext: { reportKind: 'audit', itemIds: ['D1'], citedItems: ['D1'], verified: false },
  };
  const base = await serve((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { bodies.push({ url: req.url, body: JSON.parse(body) }); json(res, answer); });
  });
  const instance = client(base);
  const report = { method: 'audit', defects: [{ room: 'toilet', zone: 'NE' }] };
  await expect(instance.askVastuReport({ question: 'What first?', report })).resolves.toEqual(answer);
  await instance.askVastuReport({ question: 'And then?', conversationId: 'conv_1', speed: 'fast' });
  expect(bodies[0]).toEqual({
    url: '/api/v1/astrology/query',
    body: { question: 'What first?', language: 'en', vastuContext: { report } },
  });
  expect(bodies[1].body).toEqual({ question: 'And then?', language: 'en', conversationId: 'conv_1', speed: 'fast' });
  expect(bodies[0].body).not.toHaveProperty('birthDetails');
  await expect(instance.askVastuReport({ question: 'No context' })).rejects.toBeInstanceOf(sdk.ValidationError);
  expect(bodies).toHaveLength(2);
});

test.each(['binary', 'json'])('retains multipart upload and %s voice response', async kind => {
  let received;
  const bytes = Buffer.from([0, 255, 73, 68, 51]);
  const metadata = { fixture: true };
  const base = await serve((req, res) => {
    const parts = [];
    req.on('data', chunk => parts.push(chunk));
    req.on('end', () => {
      received = { headers: req.headers, body: Buffer.concat(parts).toString() };
      if (kind === 'json') json(res, { answer: 'fixture fallback' });
      else {
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'X-Vedika-Voice-Meta': Buffer.from(JSON.stringify(metadata)).toString('base64'),
        });
        res.end(bytes);
      }
    });
  });
  const result = await client(base).askVoice({ audio: Buffer.from('fixture audio'), language: 'en' });
  expect(received.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/);
  expect(received.body).toContain('fixture audio');
  expect(received.body).toContain('name="language"');
  expect(result.kind).toBe(kind);
  if (kind === 'binary') {
    expect(Buffer.from(result.audio)).toEqual(bytes);
    expect(result.meta).toEqual(metadata);
  } else expect(result.json).toEqual({ answer: 'fixture fallback' });
});
