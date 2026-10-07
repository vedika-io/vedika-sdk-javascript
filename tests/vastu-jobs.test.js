const http = require('http');
const { VedikaClient } = require('../dist');

const JOB = 'vjob_0123456789abcdef0123456789abcdef';
const UPLOAD = 'vup_0123456789abcdef0123456789abcdef';
const jobBody = { operation: 'assessments', items: [{ id: 'p1', input: { inputSource: 'plan-derived', rooms: [{ roomType: 'kitchen', zone: 'SE' }] } }] };
const statusData = { jobId: JOB, status: 'running', operation: 'assessments', itemCount: 1, counts: { succeeded: 0, failed: 0, pending: 1, cancelled: 0 }, billing: { currency: 'USD', pricePerItem: 0.1, maxCharge: 0.1, charged: 0, basis: 'per item' }, cancelRequested: false, createdAt: 1, updatedAt: 1, expiresAt: 9, resultsUrl: `https://api.vedika.io/v2/vastu/jobs/${JOB}/results` };

/** A local server that records every request and answers from `answer(req, index)`. */
async function serve(answer) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      requests.push({ method: req.method, url: req.url, headers: req.headers, raw });
      const [status, body] = answer(req, requests.length - 1);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const client = () => {
    const c = new VedikaClient({ apiKey: 'vk_test', baseUrl: `http://127.0.0.1:${server.address().port}`, maxRetries: 1 });
    c.sleep = () => Promise.resolve();
    return c;
  };
  return { requests, client, close: () => new Promise(resolve => server.close(resolve)) };
}

describe('Vastu job inventory', () => {
  test('all 147 logical paths are declared, with the right verb for each job path', () => {
    const contracts = VedikaClient.VASTU_OPERATION_CONTRACTS;
    expect(VedikaClient.VASTU_OPERATIONS).toHaveLength(147);
    expect(new Set(VedikaClient.VASTU_OPERATIONS).size).toBe(147);
    expect(Object.keys(contracts)).toHaveLength(147);
    expect(contracts.jobs.method).toBe('POST');
    expect(contracts['jobs/{id}'].method).toBe('GET');
    expect(contracts['jobs/{id}/results'].method).toBe('GET');
    expect(contracts['jobs/{id}/cancel'].method).toBe('POST');
  });

  test('the generic escape hatch sends GET for status and results and POST for cancel', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test' });
    const get = jest.spyOn(client.client, 'get').mockResolvedValue({ data: {} });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: {} });
    await client.vastu(`jobs/${JOB}`, {});
    await client.vastu(`jobs/${JOB}/results`, { cursor: 'c1' });
    await client.vastu(`jobs/${JOB}/cancel`, {});
    await client.vastu('jobs', jobBody, { idempotencyKey: 'k1' });
    expect(get.mock.calls.map(c => c[0])).toEqual([`/v2/astrology/vastu/jobs/${JOB}`, `/v2/astrology/vastu/jobs/${JOB}/results`]);
    expect(get.mock.calls[1][1]).toEqual({ params: { cursor: 'c1' } });
    expect(post.mock.calls.map(c => c[0])).toEqual([`/v2/astrology/vastu/jobs/${JOB}/cancel`, '/v2/astrology/vastu/jobs']);
    await expect(client.vastu('jobs', jobBody)).rejects.toThrow(/Idempotency-Key/);
    await expect(client.vastu('jobs/../../x', {})).rejects.toThrow(/jobId/);
  });

  test('vastuOperation refuses templated job paths', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test' });
    await expect(client.vastuOperation('jobs/{id}', undefined)).rejects.toThrow(/vastuJobStatus/);
  });
});

describe('typed job methods', () => {
  test('submit needs a retained key and reuses it across a retry and a new client', async () => {
    const env = { success: true, data: { jobId: JOB, status: 'queued', itemCount: 1, maxCharge: 0.1, replayed: false } };
    const s = await serve((req, i) => (i === 0 ? [503, { error: 'retry' }] : [202, env]));
    try {
      await expect(s.client().vastuJobSubmit(jobBody, {})).rejects.toThrow(/Idempotency-Key/);
      await expect(s.client().vastuJobSubmit(jobBody)).rejects.toThrow();
      expect(s.requests).toHaveLength(0);
      expect(await s.client().vastuJobSubmit(jobBody, { idempotencyKey: 'saved-job-7' })).toEqual(env);
      await s.client().vastuJobSubmit(jobBody, { idempotencyKey: 'saved-job-7' });
    } finally { await s.close(); }
    expect(s.requests).toHaveLength(3);
    for (const r of s.requests) {
      expect(r.method).toBe('POST');
      expect(r.url).toBe('/v2/astrology/vastu/jobs');
      expect(r.headers['idempotency-key']).toBe('saved-job-7');
      expect(JSON.parse(r.raw.toString())).toEqual(jobBody);
    }
  });

  test('status, results and cancel use the right verbs and paths', async () => {
    const s = await serve(req => {
      if (req.method === 'GET' && req.url.endsWith(JOB)) return [200, { success: true, data: statusData }];
      if (req.method === 'GET') return [200, { success: true, data: { jobId: JOB, jobStatus: 'running', results: [], nextCursor: null } }];
      return [200, { success: true, data: { ...statusData, status: 'cancelled', cancelRequested: true } }];
    });
    try {
      const c = s.client();
      expect((await c.vastuJobStatus(JOB)).data.jobId).toBe(JOB);
      await c.vastuJobResults(JOB, { cursor: 'abc' });
      expect((await c.vastuJobCancel(JOB)).data.cancelRequested).toBe(true);
    } finally { await s.close(); }
    expect(s.requests.map(r => `${r.method} ${r.url}`)).toEqual([
      `GET /v2/astrology/vastu/jobs/${JOB}`,
      `GET /v2/astrology/vastu/jobs/${JOB}/results?cursor=abc`,
      `POST /v2/astrology/vastu/jobs/${JOB}/cancel`,
    ]);
  });

  test('job ids and cursors are checked before any request', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test' });
    const get = jest.spyOn(client.client, 'get');
    const post = jest.spyOn(client.client, 'post');
    for (const bad of ['', 'vjob_x', '../keys', `${JOB}/../x`, undefined]) {
      await expect(client.vastuJobStatus(bad)).rejects.toThrow(/jobId/);
      await expect(client.vastuJobCancel(bad)).rejects.toThrow(/jobId/);
    }
    await expect(client.vastuJobResults(JOB, { cursor: 'x'.repeat(33) })).rejects.toThrow(/cursor/);
    expect(get).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  test('vastuJobResultItems follows nextCursor to the end', async () => {
    const item = (index) => ({ id: `p${index}`, index, status: 200, response: { success: true } });
    const s = await serve(req => {
      const cursor = new URL(req.url, 'http://x').searchParams.get('cursor');
      if (!cursor) return [200, { success: true, data: { jobId: JOB, jobStatus: 'running', results: [item(0), item(1)], nextCursor: 'c2' } }];
      return [200, { success: true, data: { jobId: JOB, jobStatus: 'completed', results: [item(2)], nextCursor: null } }];
    });
    const seen = [];
    try { for await (const it of s.client().vastuJobResultItems(JOB)) seen.push(it.index); } finally { await s.close(); }
    expect(seen).toEqual([0, 1, 2]);
    expect(s.requests.map(r => r.url)).toEqual([`/v2/astrology/vastu/jobs/${JOB}/results`, `/v2/astrology/vastu/jobs/${JOB}/results?cursor=c2`]);
  });
});

describe('chat upload and reportRef', () => {
  const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from([0, 255, 13, 10, 7]), Buffer.from('\n%%EOF')]);

  test('uploadVastuReport sends one multipart file under a retained key, and a retry repeats it', async () => {
    const ok = { success: true, uploadId: UPLOAD, pages: 1, charsExtracted: 10, expiresAt: 'x', digestSha256: 'a', fileSha256: 'b' };
    const s = await serve((req, i) => (i === 0 ? [503, { error: 'retry' }] : [200, ok]));
    try {
      expect(await s.client().uploadVastuReport({ data: pdf, filename: 'plan.pdf' }, { idempotencyKey: 'upload-1' })).toEqual(ok);
    } finally { await s.close(); }
    expect(s.requests).toHaveLength(2);
    for (const r of s.requests) {
      expect(r.method).toBe('POST');
      expect(r.url).toBe('/api/v1/vastu/chat/uploads');
      expect(r.headers['idempotency-key']).toBe('upload-1');
      const boundary = /boundary=(.+)$/.exec(r.headers['content-type'])[1];
      expect(r.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/);
      const text = r.raw.toString('latin1');
      expect(text.startsWith(`--${boundary}\r\n`)).toBe(true);
      expect(text).toContain('Content-Disposition: form-data; name="file"; filename="plan.pdf"');
      expect(text).toContain('Content-Type: application/pdf\r\n\r\n');
      expect(text.endsWith(`\r\n--${boundary}--\r\n`)).toBe(true);
      const start = text.indexOf('\r\n\r\n') + 4;
      expect(r.raw.subarray(start, start + pdf.length).equals(pdf)).toBe(true);
    }
  });

  test('uploadVastuReport refuses a missing key and empty bytes before sending', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test' });
    const post = jest.spyOn(client.client, 'post');
    await expect(client.uploadVastuReport({ data: pdf }, {})).rejects.toThrow(/Idempotency-Key/);
    await expect(client.uploadVastuReport({ data: pdf }, { idempotencyKey: 'has space' })).rejects.toThrow(/Idempotency-Key/);
    await expect(client.uploadVastuReport({ data: new Uint8Array(0) }, { idempotencyKey: 'k' })).rejects.toThrow(/bytes/);
    expect(post).not.toHaveBeenCalled();
  });

  test('askVastuReport accepts an upload reference alone and sends it as vastuContext.reportRef', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: { answer: 'ok' } });
    await client.askVastuReport({ question: 'What first?', reportRef: { type: 'upload', id: UPLOAD } });
    expect(post.mock.calls[0][1].vastuContext).toEqual({ reportRef: { type: 'upload', id: UPLOAD } });
    expect(post.mock.calls[0][1].vastuContext.report).toBeUndefined();
  });

  test('askVastuReport refuses report plus reportRef and a malformed reference', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test' });
    const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: {} });
    await expect(client.askVastuReport({ question: 'q', report: {}, reportRef: { type: 'upload', id: UPLOAD } })).rejects.toThrow(/exactly one/);
    await expect(client.askVastuReport({ question: 'q', reportRef: { type: 'scan', id: UPLOAD } })).rejects.toThrow(/reportRef/);
    await expect(client.askVastuReport({ question: 'q', reportRef: { type: 'upload', id: 'x' } })).rejects.toThrow(/reportRef/);
    expect(post).not.toHaveBeenCalled();
  });
});

describe('legacy named helpers keep a caller-retained key', () => {
  test.each([
    ['vastuListingAssessment', c => c.vastuListingAssessment({ inputSource: 'plan-derived' }, { idempotencyKey: 'lost-1' }), '/v2/astrology/vastu/assessments'],
    ['vastuScore', c => c.vastuScore('overall', { rooms: [] }, { idempotencyKey: 'lost-1' }), '/v2/astrology/vastu/score/overall'],
    ['vastuAudit', c => c.vastuAudit('floor-plan', { rooms: [] }, { idempotencyKey: 'lost-1' }), '/v2/astrology/vastu/audit/floor-plan'],
    ['vastuRoom', c => c.vastuRoom('kitchen', { zone: 'SE' }, { idempotencyKey: 'lost-1' }), '/v2/astrology/vastu/room/kitchen'],
    ['vastuPlacement', c => c.vastuPlacement('borewell', { zone: 'NE' }, { idempotencyKey: 'lost-1' }), '/v2/astrology/vastu/placement/borewell'],
    ['vastuMandalaProject', c => c.vastuMandalaProject('9-zone', { plotPolygon: [] }, { idempotencyKey: 'lost-1' }), '/v2/astrology/vastu/mandala/project/9-zone'],
    ['vastuEntrancePada', c => c.vastuEntrancePada({ plotPolygon: [], doorXY: [0, 0] }, { idempotencyKey: 'lost-1' }), '/v2/astrology/vastu/entrance/pada'],
  ])('%s: a new invocation after a lost response reuses the key', async (_name, call, path) => {
    const s = await serve(() => [200, { success: true, data: { ok: true } }]);
    try {
      // Invocation 1 loses its response (the client is torn down mid-flight), invocation 2 is a fresh call.
      await call(s.client());
      await call(s.client());
    } finally { await s.close(); }
    expect(s.requests).toHaveLength(2);
    for (const r of s.requests) {
      expect(r.url).toBe(path);
      expect(r.headers['idempotency-key']).toBe('lost-1');
    }
  });

  test('without options each invocation still gets its own generated key', async () => {
    const s = await serve(() => [200, { success: true, data: { ok: true } }]);
    try { await s.client().vastuScore('overall', {}); await s.client().vastuScore('overall', {}); } finally { await s.close(); }
    const keys = s.requests.map(r => r.headers['idempotency-key']);
    expect(keys[0]).toBeTruthy();
    expect(keys[0]).not.toBe(keys[1]);
  });

  test('a blank retained key is refused before transport', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test' });
    const post = jest.spyOn(client.client, 'post');
    await expect(client.vastuScore('overall', {}, { idempotencyKey: ' ' })).rejects.toThrow(/Idempotency-Key/);
    expect(post).not.toHaveBeenCalled();
  });
});

test('public types cover jobs, upload, reportRef and the typed listing helper', () => {
  const { spawnSync } = require('node:child_process');
  const path = require('node:path');
  const result = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--strict', '--noEmit', '--skipLibCheck', '--target', 'ES2020', '--module', 'commonjs', '--moduleResolution', 'node', path.join(__dirname, 'type-fixtures/vastu-jobs.ts')], { encoding: 'utf8' });
  expect(`${result.stdout}${result.stderr}`).toBe('');
  expect(result.status).toBe(0);
});
