const http = require('http');
const sdk = require('../dist');

// The AI question routes refuse some requests before billing and report a cut-off
// answer in the response metadata. These tests answer from a real HTTP server and
// pin three things: the typed errors, the retry rules (a 400 is never resent, a
// monthly-spend 429 is never resent, a 503 is resent only with its idempotency key
// and never on another tier), and the truncation fields that reach the caller.

const { VedikaClient, VedikaAPIError, ServerError, RateLimitError } = sdk;
const birthDetails = { datetime: '1990-06-15T14:30:00+05:30', latitude: 28.6139, longitude: 77.209, timezone: '+05:30' };

async function withServer(handler, run, options = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      requests.push({ path: req.url, headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') });
      handler(requests.length, req, res);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const client = new VedikaClient({ apiKey: 'vk_test_local', baseUrl: `http://127.0.0.1:${server.address().port}`, ...options });
    const sleeps = [];
    client.sleep = (ms) => { sleeps.push(ms); return Promise.resolve(); };
    await run(client, requests, sleeps);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const reply = (status, payload, headers = {}) => (call, req, res) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(payload));
};

const proUltraDown = {
  success: false,
  error: 'Vedika Pro Ultra is temporarily unavailable',
  code: 'PRO_ULTRA_UNAVAILABLE',
};
const budgetExhausted = {
  success: false,
  error: "The output budget for this request was used up before an answer was written. You were not charged. Retry with a higher 'maxTokens', or set 'detail' to \"brief\".",
  code: 'OUTPUT_BUDGET_EXHAUSTED',
};
const question = { question: 'What are my career prospects?', birthDetails, speed: 'pro-ultra', maxTokens: 600 };

describe('503 PRO_ULTRA_UNAVAILABLE', () => {
  test('is a ProUltraUnavailableError, still a ServerError, and carries code and retryAfter', async () => {
    await withServer(reply(503, proUltraDown, { 'Retry-After': '5' }), async (client) => {
      const error = await client.askQuestion(question).catch((e) => e);
      expect(error).toBeInstanceOf(sdk.ProUltraUnavailableError);
      expect(error).toBeInstanceOf(ServerError);
      expect(error).toBeInstanceOf(VedikaAPIError);
      expect(error.name).toBe('ProUltraUnavailableError');
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe(sdk.QuestionErrorCode.PRO_ULTRA_UNAVAILABLE);
      expect(error.retryAfter).toBe(5);
      expect(error.body).toEqual(proUltraDown);
      expect(error.message).toBe('Vedika Pro Ultra is temporarily unavailable');
    });
  });

  test('is resent only under the same idempotency key, always on Pro Ultra, then raised', async () => {
    await withServer(reply(503, proUltraDown), async (client, requests, sleeps) => {
      await expect(client.askQuestion(question)).rejects.toBeInstanceOf(sdk.ProUltraUnavailableError);
      // One attempt and three retries, each with the one key and the unchanged body.
      expect(requests).toHaveLength(4);
      expect(sleeps).toHaveLength(3);
      const keys = new Set(requests.map((request) => request.headers['idempotency-key']));
      expect(keys.size).toBe(1);
      expect([...keys][0]).toBeTruthy();
      for (const request of requests) {
        expect(request.path).toBe('/api/v1/astrology/query');
        expect(request.body.speed).toBe('pro-ultra');
        expect(request.body.maxTokens).toBe(600);
      }
    });
  });

  test('maxRetries 0 sends it once', async () => {
    await withServer(reply(503, proUltraDown), async (client, requests) => {
      await expect(client.askQuestion(question)).rejects.toBeInstanceOf(sdk.ProUltraUnavailableError);
      expect(requests).toHaveLength(1);
    }, { maxRetries: 0 });
  });

  test('a stream is never resent, and fails with the same type before any frame', async () => {
    await withServer(reply(503, proUltraDown, { 'Retry-After': '5' }), async (client, requests, sleeps) => {
      const consume = async () => { for await (const chunk of client.askQuestionStream(question)) void chunk; };
      const error = await consume().catch((e) => e);
      expect(error).toBeInstanceOf(sdk.ProUltraUnavailableError);
      expect(error.code).toBe('PRO_ULTRA_UNAVAILABLE');
      expect(error.retryAfter).toBe(5);
      expect(requests).toHaveLength(1);
      expect(requests[0].path).toBe('/api/v1/astrology/query/stream');
      expect(sleeps).toEqual([]);
    });
  });

  test('a plain 503 without that code stays a ServerError', async () => {
    await withServer(reply(503, { error: 'down', code: 'SERVICE_UNAVAILABLE' }), async (client) => {
      const error = await client.askQuestion(question).catch((e) => e);
      expect(error).toBeInstanceOf(ServerError);
      expect(error).not.toBeInstanceOf(sdk.ProUltraUnavailableError);
    }, { maxRetries: 0 });
  });
});

describe('400 OUTPUT_BUDGET_EXHAUSTED', () => {
  test('is an OutputBudgetExhaustedError with the API message, and is never resent', async () => {
    await withServer(reply(400, budgetExhausted), async (client, requests, sleeps) => {
      const error = await client.askQuestion({ ...question, birthDetails: undefined }).catch((e) => e);
      expect(error).toBeInstanceOf(sdk.OutputBudgetExhaustedError);
      expect(error).toBeInstanceOf(VedikaAPIError);
      expect(error).not.toBeInstanceOf(ServerError);
      expect(error.name).toBe('OutputBudgetExhaustedError');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(sdk.QuestionErrorCode.OUTPUT_BUDGET_EXHAUSTED);
      expect(error.message).toBe(budgetExhausted.error);
      expect(error.body).toEqual(budgetExhausted);
      // The SDK never raises maxTokens or changes detail for the caller.
      expect(requests).toHaveLength(1);
      expect(requests[0].body.maxTokens).toBe(600);
      expect(requests[0].body).not.toHaveProperty('detail');
      expect(sleeps).toEqual([]);
    });
  });

  test('a 400 on a stream call is mapped the same way, and not resent', async () => {
    await withServer(reply(400, budgetExhausted), async (client, requests) => {
      const consume = async () => { for await (const chunk of client.askQuestionStream(question)) void chunk; };
      await expect(consume()).rejects.toBeInstanceOf(sdk.OutputBudgetExhaustedError);
      expect(requests).toHaveLength(1);
    });
  });
});

describe('a 400 is never resent', () => {
  test.each([
    ['CONTROL_UNSUPPORTED_FOR_TIER', { speed: 'pro-ultra', seed: 7 }],
    ['INVALID_DETAIL', { detail: 'verbose' }],
    ['INVALID_STOP', { stop: [] }],
    ['STOP_MATCHED_BEFORE_ANSWER', { stop: ['Your'] }],
    ['DETAIL_BUDGET_CONFLICT', { detail: 'detailed', maxTokens: 128 }],
    ['VALIDATION_ERROR', { speed: 'fast', version: '2' }],
  ])('%s comes back once, as a VedikaAPIError with its code', async (code, controls) => {
    const body = { success: false, error: `refused: ${code}`, code };
    await withServer(reply(400, body), async (client, requests, sleeps) => {
      const error = await client.askQuestion({ question: 'q', birthDetails, ...controls }).catch((e) => e);
      expect(error).toBeInstanceOf(VedikaAPIError);
      expect(error).not.toBeInstanceOf(sdk.OutputBudgetExhaustedError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(code);
      expect(error.body).toEqual(body);
      expect(requests).toHaveLength(1);
      expect(sleeps).toEqual([]);
      for (const [name, value] of Object.entries(controls)) expect(requests[0].body[name]).toEqual(value);
    });
  });

  test('QuestionErrorCode names every code the controls can return', () => {
    expect(sdk.QuestionErrorCode).toEqual({
      CONTROL_UNSUPPORTED_FOR_TIER: 'CONTROL_UNSUPPORTED_FOR_TIER',
      INVALID_DETAIL: 'INVALID_DETAIL',
      INVALID_STOP: 'INVALID_STOP',
      STOP_MATCHED_BEFORE_ANSWER: 'STOP_MATCHED_BEFORE_ANSWER',
      DETAIL_BUDGET_CONFLICT: 'DETAIL_BUDGET_CONFLICT',
      OUTPUT_BUDGET_EXHAUSTED: 'OUTPUT_BUDGET_EXHAUSTED',
      PRO_ULTRA_UNAVAILABLE: 'PRO_ULTRA_UNAVAILABLE',
      ECO_UNAVAILABLE: 'ECO_UNAVAILABLE',
      VERSION_UNAVAILABLE: 'VERSION_UNAVAILABLE',
    });
  });
});

describe('429 MONTHLY_SPEND_LIMIT_REACHED', () => {
  test('is raised at once on a Pro Ultra question, with no retry and no wait', async () => {
    const body = { success: false, error: 'Monthly spend limit reached', code: 'MONTHLY_SPEND_LIMIT_REACHED', retryAfter: 2 };
    await withServer(reply(429, body, { 'Retry-After': '2' }), async (client, requests, sleeps) => {
      const error = await client.askQuestion(question).catch((e) => e);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('MONTHLY_SPEND_LIMIT_REACHED');
      expect(requests).toHaveLength(1);
      expect(sleeps).toEqual([]);
    });
  });
});

describe('a cut-off answer is reported in metadata', () => {
  const truncated = {
    success: true,
    response: 'Your career is shaped by the tenth house, where',
    answer: 'Your career is shaped by the tenth house, where',
    metadata: {
      speed: 'pro-ultra',
      language: 'en',
      finishReason: 'length',
      truncated: true,
      degraded: true,
      degradedReason: 'budget_truncated',
      cost: { total: '0' },
    },
  };

  test('askQuestion returns finishReason, truncated, degraded and degradedReason unchanged', async () => {
    await withServer(reply(200, truncated), async (client, requests) => {
      const result = await client.askQuestion(question);
      expect(result.metadata.finishReason).toBe('length');
      expect(result.metadata.truncated).toBe(true);
      expect(result.metadata.degraded).toBe(true);
      expect(result.metadata.degradedReason).toBe('budget_truncated');
      expect(result.metadata.cost).toEqual({ total: '0' });
      // One call: a truncated answer is not an error, and the SDK does not ask again.
      expect(requests).toHaveLength(1);
    });
  });

  test('the final completed frame of a stream carries the same fields', async () => {
    const frame = JSON.stringify({ success: true, response: truncated.response, metadata: truncated.metadata });
    const sse = (call, req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.end(`event: started\ndata: {"stage":0}\n\nevent: completed\ndata: ${frame}\n\n`);
    };
    await withServer(sse, async (client) => {
      const frames = [];
      for await (const chunk of client.askQuestionStream(question)) frames.push(JSON.parse(chunk));
      const completed = frames[frames.length - 1];
      expect(completed.metadata.finishReason).toBe('length');
      expect(completed.metadata.truncated).toBe(true);
      expect(completed.metadata.degradedReason).toBe('budget_truncated');
    });
  });
});
