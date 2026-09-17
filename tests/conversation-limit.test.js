const http = require('http');
const { VedikaClient } = require('../dist');

test('conversation limits reach the HTTP route without claiming or fetching further pages', async () => {
  const paths = [];
  const items = Array.from({ length: 120 }, (_, i) => ({ conversationId: `conv_${i}` }));
  const server = http.createServer((req, res) => {
    paths.push(req.url);
    const limit = Number(new URL(req.url, 'http://localhost').searchParams.get('limit') || 10);
    const conversations = items.slice(0, limit);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { conversations, count: conversations.length } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const client = new VedikaClient({ apiKey: 'vk_test_local', baseUrl: `http://127.0.0.1:${server.address().port}` });
    expect((await client.getConversations()).count).toBe(10);
    expect((await client.getConversations(100)).count).toBe(100);
    expect((await client.getConversations(1)).conversations).toEqual(items.slice(0, 1));
    expect(paths).toEqual(['/api/v1/conversations', '/api/v1/conversations?limit=100', '/api/v1/conversations?limit=1']);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('invalid conversation limits fail before an HTTP request', async () => {
  const client = new VedikaClient({ apiKey: 'vk_test_local' });
  const get = jest.spyOn(client.client, 'get').mockResolvedValue({ data: {} });
  for (const limit of [0, -1, 101, 1.5, NaN, Infinity, true, '10', null]) {
    await expect(client.getConversations(limit)).rejects.toThrow('limit must be an integer between 1 and 100');
  }
  expect(get).not.toHaveBeenCalled();
});
