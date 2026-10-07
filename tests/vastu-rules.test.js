const { VedikaClient } = require('../dist');
test('comparison preserves two pins, exact input and retry identity', async () => {
  const client = new VedikaClient({ apiKey: 'vk_test' });
  const body = { fromVersion: 'vastu-rules-2026-09-23', toVersion: 'vastu-rules-2026-10-04', input: { rooms: [{ name: 'bedroom', zone: 'SW' }] } };
  const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: { success: true, data: { changed: true, changes: [] }, billing: { charged: 0.01 } } });
  await client.vastuCompareVersions(body, { idempotencyKey: 'retained-comparison' });
  expect(post.mock.calls[0][0]).toContain('/plan/compare-versions');
  expect(post.mock.calls[0][1]).toEqual(body);
  expect(post.mock.calls[0][2].headers['Idempotency-Key']).toBe('retained-comparison');
});
test('version discovery uses GET and verification uses POST without an assessment call', async () => {
  const client = new VedikaClient({ apiKey: 'vk_test' });
  const get = jest.spyOn(client.client, 'get').mockResolvedValue({ data: { success: true, data: { versions: [] }, billing: { charged: 0 } } });
  const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: { success: true, data: { valid: true }, billing: { charged: 0 } } });
  await client.vastuRuleVersions();
  await client.vastuVerifyReceipt({ token: 'test.receipt.signature', input: { rooms: [] } });
  expect(get.mock.calls[0][0]).toContain('/rules/versions');
  expect(post.mock.calls[0][0]).toContain('/receipt/verify');
  expect(post.mock.calls[0][1].token).toBe('test.receipt.signature');
});
