const { VedikaClient } = require('../dist');

test('conversation cursor survives the SDK boundary unchanged', async () => {
  const client = new VedikaClient({ apiKey: 'vk_test_local' });
  const get = jest.spyOn(client.client, 'get').mockResolvedValue({ data: { nextCursor: 'c1.aabb' } });
  expect(await client.getConversations(25, 'c1.1122')).toEqual({ nextCursor: 'c1.aabb' });
  expect(get).toHaveBeenCalledWith('/api/v1/conversations', { params: { limit: 25, cursor: 'c1.1122' } });
  get.mockClear();
  for (const cursor of ['', true, 42, null, 'x'.repeat(2049)]) {
    await expect(client.getConversations(undefined, cursor)).rejects.toThrow('cursor');
  }
  expect(get).not.toHaveBeenCalled();
});
