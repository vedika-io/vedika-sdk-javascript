const http = require('http');
const { VedikaClient, VedikaAPIError } = require('../dist');

/** An approved origin that answers every request with a redirect to a second origin, and the second origin. */
async function redirectPair(status, locationFor) {
  const second = [];
  const target = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      second.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { fromTarget: true } }));
    });
  });
  await new Promise(r => target.listen(0, '127.0.0.1', r));
  const first = [];
  const origin = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      first.push({ method: req.method, url: req.url, body: Buffer.concat(chunks).toString() });
      res.writeHead(status, { Location: locationFor(target.address().port, req) });
      res.end();
    });
  });
  await new Promise(r => origin.listen(0, '127.0.0.1', r));
  return {
    first, second,
    client: () => new VedikaClient({ apiKey: 'vk_test_secret', baseUrl: `http://127.0.0.1:${origin.address().port}`, maxRetries: 2 }),
    close: () => { target.close(); origin.close(); },
  };
}

const crossOrigin = (port) => `http://127.0.0.1:${port}/collect`;
const sameOrigin = () => '/v2/astrology/vastu/score/overall';

describe('every 3xx is refused: no second request, no body or key egress', () => {
  test.each([301, 302, 303, 307, 308])('a private POST answered %i never reaches the redirect target', async (status) => {
    const pair = await redirectPair(status, crossOrigin);
    try {
      const room = { rooms: [{ roomType: 'kitchen', zone: 'SE', polygon: [[0, 0], [3, 0], [3, 4]] }] };
      await expect(pair.client().vastuOperation('score/overall', room, { idempotencyKey: 'private-key-1' }))
        .rejects.toThrow(/redirect/i);
      await expect(pair.client().vastuOperation('score/overall', room, { idempotencyKey: 'private-key-1' }))
        .rejects.toBeInstanceOf(VedikaAPIError);
    } finally { pair.close(); }
    expect(pair.second).toHaveLength(0);
    // Refused, not retried: each call reached the approved origin exactly once.
    expect(pair.first).toHaveLength(2);
  });

  test('a GET answered 302 never reaches the redirect target', async () => {
    const pair = await redirectPair(302, crossOrigin);
    try {
      await expect(pair.client().getHoroscope('aries')).rejects.toThrow(/redirect/i);
    } finally { pair.close(); }
    expect(pair.second).toHaveLength(0);
    expect(pair.first).toHaveLength(1);
  });

  test('a same-origin redirect is refused too', async () => {
    const pair = await redirectPair(307, sameOrigin);
    try {
      await expect(pair.client().vastu('score/overall', { zone: 'north' })).rejects.toThrow(/redirect/i);
    } finally { pair.close(); }
    expect(pair.first).toHaveLength(1);
    expect(pair.second).toHaveLength(0);
  });

  test('the streaming and voice transports refuse a redirect as well', async () => {
    const pair = await redirectPair(307, crossOrigin);
    try {
      const client = pair.client();
      await expect((async () => { for await (const _ of client.askQuestionStream({ question: 'q', birthDetails: {} })) { void _; } })())
        .rejects.toThrow(/redirect/i);
      await expect(client.askVoice({ audio: new Uint8Array([1, 2, 3]) })).rejects.toThrow(/redirect/i);
    } finally { pair.close(); }
    expect(pair.second).toHaveLength(0);
  });
});
