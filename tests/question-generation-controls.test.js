const http = require('http');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { VedikaClient } = require('../dist');

// The AI question routes take a delivery tier (`speed`) and answer-length
// controls (`version`, `detail`, `maxTokens`, `stop`, `seed`). The API validates
// them and refuses an unsupported combination before billing, so the SDK only
// has to put each one on the wire under the right name. These tests read the
// bodies a real HTTP server receives.

const birthDetails = { datetime: '1990-06-15T14:30:00+05:30', latitude: 28.6139, longitude: 77.209, timezone: '+05:30' };

async function withServer(handler, run) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      requests.push({ method: req.method, path: req.url, body: JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') });
      handler(req, res);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const client = new VedikaClient({ apiKey: 'vk_test_local', baseUrl: `http://127.0.0.1:${server.address().port}` });
    await run(client, requests);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const json = (payload) => (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const answer = { answer: 'ok', confidence: 0.9, creditsUsed: 0.01, processingTime: 1, language: 'en' };

describe('askQuestion sends the tier and answer-length controls', () => {
  test('Pro Ultra with every control set', async () => {
    await withServer(json(answer), async (client, requests) => {
      await client.askQuestion({
        question: 'What are my career prospects?',
        birthDetails,
        speed: 'pro-ultra',
        detail: 'brief',
        maxTokens: 600,
        stop: ['END', 'STOP'],
      });
      expect(requests).toHaveLength(1);
      expect(requests[0].path).toBe('/api/v1/astrology/query');
      expect(requests[0].body).toEqual({
        question: 'What are my career prospects?',
        birthDetails,
        language: 'en',
        speed: 'pro-ultra',
        detail: 'brief',
        maxTokens: 600,
        stop: ['END', 'STOP'],
      });
    });
  });

  test('standard speed with version and seed; a seed of 0 is still sent', async () => {
    await withServer(json(answer), async (client, requests) => {
      await client.askQuestion({ question: 'q', birthDetails, speed: 'standard', version: '2', seed: 0, stop: 'END', detail: 'detailed' });
      await client.askQuestion({ question: 'q', birthDetails, version: '2.5', seed: 42 });
      expect(requests[0].body).toEqual({
        question: 'q', birthDetails, language: 'en', speed: 'standard', version: '2', detail: 'detailed', stop: 'END', seed: 0,
      });
      expect(requests[1].body).toEqual({ question: 'q', birthDetails, language: 'en', version: '2.5', seed: 42 });
    });
  });

  test('every published tier reaches the wire unchanged', async () => {
    await withServer(json(answer), async (client, requests) => {
      for (const speed of ['standard', 'fast', 'eco', 'pro-ultra']) {
        await client.askQuestion({ question: 'q', birthDetails, speed });
      }
      expect(requests.map((request) => request.body.speed)).toEqual(['standard', 'fast', 'eco', 'pro-ultra']);
    });
  });

  test('a question with no controls sends none of them', async () => {
    await withServer(json(answer), async (client, requests) => {
      await client.askQuestion({ question: 'q', birthDetails });
      await client.askQuestion({ question: 'q', birthDetails, speed: undefined, version: undefined, detail: undefined, maxTokens: undefined, stop: undefined, seed: undefined });
      for (const request of requests) {
        expect(request.body).toEqual({ question: 'q', birthDetails, language: 'en' });
      }
    });
  });

  test('other options keep going out beside the controls', async () => {
    await withServer(json(answer), async (client, requests) => {
      await client.askQuestion({
        question: 'q', birthDetails, system: 'kp', conversationId: 'conv_1', includeRemedies: false, category: 'career',
        responseFormat: 'json', speed: 'pro-ultra', maxTokens: 800,
      });
      expect(requests[0].body).toEqual({
        question: 'q', birthDetails, language: 'en', system: 'kp', conversationId: 'conv_1', includeRemedies: false,
        category: 'career', responseFormat: 'json', speed: 'pro-ultra', maxTokens: 800,
      });
    });
  });
});

describe('askVastuReport sends the same controls', () => {
  test('report question with Pro Ultra and answer-length controls', async () => {
    await withServer(json({ ...answer, conversationId: 'conv_9' }), async (client, requests) => {
      const report = { method: 'audit', defects: [] };
      await client.askVastuReport({ question: 'What first?', report, speed: 'pro-ultra', detail: 'brief', maxTokens: 500, stop: 'END' });
      await client.askVastuReport({ question: 'And then?', conversationId: 'conv_9', speed: 'standard', version: '2.5', seed: 7 });
      expect(requests[0].body).toEqual({
        question: 'What first?', language: 'en', vastuContext: { report }, speed: 'pro-ultra', detail: 'brief', maxTokens: 500, stop: 'END',
      });
      expect(requests[1].body).toEqual({
        question: 'And then?', language: 'en', conversationId: 'conv_9', speed: 'standard', version: '2.5', seed: 7,
      });
    });
  });

  test('without controls the body is unchanged', async () => {
    await withServer(json(answer), async (client, requests) => {
      const report = { method: 'audit' };
      await client.askVastuReport({ question: 'q', report });
      expect(requests[0].body).toEqual({ question: 'q', language: 'en', vastuContext: { report } });
    });
  });
});

describe('askQuestionStream sends the same controls', () => {
  const sse = (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.end('event: completed\ndata: {"success":true}\n\n');
  };

  test('streamed Pro Ultra question carries tier and controls', async () => {
    await withServer(sse, async (client, requests) => {
      const chunks = [];
      for await (const chunk of client.askQuestionStream({
        question: 'q', birthDetails, speed: 'pro-ultra', detail: 'detailed', maxTokens: 1200, stop: ['END'],
      })) chunks.push(chunk);
      expect(chunks).toEqual(['{"success":true}']);
      expect(requests[0].path).toBe('/api/v1/astrology/query/stream');
      expect(requests[0].body).toEqual({
        question: 'q', birthDetails, language: 'en', speed: 'pro-ultra', detail: 'detailed', maxTokens: 1200, stop: ['END'],
      });
    });
  });

  test('a streamed question with no controls sends none', async () => {
    await withServer(sse, async (client, requests) => {
      for await (const chunk of client.askQuestionStream({ question: 'q', birthDetails })) void chunk;
      expect(requests[0].body).toEqual({ question: 'q', birthDetails, language: 'en' });
    });
  });
});

test('public types accept Pro Ultra and the controls, and refuse unknown values', () => {
  const result = spawnSync(
    process.execPath,
    [require.resolve('typescript/bin/tsc'), '--strict', '--noEmit', '--skipLibCheck', '--target', 'ES2020', '--module', 'commonjs', '--moduleResolution', 'node', path.join(__dirname, 'type-fixtures/question-controls.ts')],
    { encoding: 'utf8' },
  );
  expect(`${result.stdout}${result.stderr}`).toBe('');
  expect(result.status).toBe(0);
});
