const http = require('http');
const { VedikaClient } = require('../dist');

const payload = { items: [{ id: 'property-1', assessment: { inputSource: 'plan-derived', rooms: [{ roomType: 'kitchen', zone: 'SE' }] } }] };
const response = { success: true, data: { results: [{ id: 'property-1', status: 200, response: { success: true, data: { status: 'assessed', score: 100 } } }], summary: { total: 1, succeeded: 1, failed: 0 }, billingBasis: 'existing assessment price per item', execution: 'synchronous' } };

test('batch inventory supplies its exact request and response contracts', () => {
  expect(VedikaClient.VASTU_OPERATIONS).toContain('assessments/batch');
  expect(VedikaClient.VASTU_OPERATION_CONTRACTS['assessments/batch']).toMatchObject({ method: 'POST', requestSchema: 'VastuAssessmentsBatchRequest', responseSchema: 'VastuAssessmentsBatchResponse' });
});

test.each([undefined, '', '   '])('batch rejects missing or blank caller identity before transport: %s', async idempotencyKey => {
  const client = new VedikaClient({ apiKey: 'vk_test' });
  const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: response });
  for (const method of ['vastu', 'vastuOperation']) {
    await expect(client[method]('assessments/batch', payload, { idempotencyKey })).rejects.toThrow(/Idempotency-Key/);
  }
  expect(post).not.toHaveBeenCalled();
});

test('typed batch sends one body and retains caller identity on retry and client recreation', async () => {
  const requests = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      requests.push({ path: req.url, method: req.method, body: JSON.parse(body), key: req.headers['idempotency-key'] });
      res.writeHead(requests.length === 1 ? 503 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(requests.length === 1 ? { error: 'retry' } : response));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    for (let index = 0; index < 2; index += 1) {
      const client = new VedikaClient({ apiKey: 'vk_test', baseUrl: `http://127.0.0.1:${server.address().port}`, maxRetries: 1 });
      client.sleep = () => Promise.resolve();
      expect(await client.vastuOperation('assessments/batch', payload, { idempotencyKey: 'saved-batch-42' })).toEqual(response);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  expect(requests).toHaveLength(3);
  for (const request of requests) {
    expect(request).toEqual({ path: '/v2/astrology/vastu/assessments/batch', method: 'POST', body: payload, key: 'saved-batch-42' });
  }
});

test('public types expose batch results, drawing opt-out, and HTML report options', () => {
  const { spawnSync } = require('node:child_process');
  const path = require('node:path');
  const result = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--strict', '--noEmit', '--skipLibCheck', '--target', 'ES2020', '--module', 'commonjs', '--moduleResolution', 'node', path.join(__dirname, 'type-fixtures/vastu-batch-report.ts')], { encoding: 'utf8' });
  expect(`${result.stdout}${result.stderr}`).toBe('');
  expect(result.status).toBe(0);
});
