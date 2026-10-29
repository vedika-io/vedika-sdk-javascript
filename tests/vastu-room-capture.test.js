const { referencePath } = require('./reference-fixtures');
const { VedikaClient } = require('../dist');
const { uploadRoomCapture, mergeRoomCaptures } = require('../dist/vastu-room-capture');
const fx = require(referencePath('sdks/fixtures/room-scan-bridge/messages.json', 'room-scan-messages.json'));

// Real client, real axios pipeline, fake adapter: proves the named helpers put
// the right path, body and Idempotency-Key on the wire.
function wired(respond) {
  const client = new VedikaClient({ apiKey: 'vk_test_x' });
  const seen = [];
  client.client.defaults.adapter = async (config) => {
    seen.push({ method: config.method, url: config.url, headers: { ...config.headers }, body: config.data ? JSON.parse(config.data) : undefined });
    return { data: respond ? respond(config) : { success: true, data: { ok: true } }, status: 200, statusText: 'OK', headers: {}, config };
  };
  return { client, seen };
}
const key = (seen) => Object.entries(seen.headers).find(([k]) => k.toLowerCase() === 'idempotency-key')?.[1];

describe('uploadRoomCapture', () => {
  test('posts the capture to ar/room-capture and keeps the caller key', async () => {
    const { client, seen } = wired();
    await uploadRoomCapture(client, fx.validCapture, { idempotencyKey: 'room-key-0001', zoneResolution: 16 });
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('post');
    expect(seen[0].url).toBe('/v2/astrology/vastu/ar/room-capture');
    expect(seen[0].body).toEqual({ capture: fx.validCapture, zoneResolution: 16 });
    expect(key(seen[0])).toBe('room-key-0001');
  });

  test('leaves key generation to the client when the caller gave none', async () => {
    const { client, seen } = wired();
    await uploadRoomCapture(client, fx.validCapture);
    expect(key(seen[0])).toMatch(/^[\x21-\x7e]{8,256}$/);
    expect(seen[0].body).toEqual({ capture: fx.validCapture });
  });

  test('refuses an untagged capture before any request', async () => {
    const { client, seen } = wired();
    await expect(uploadRoomCapture(client, fx.untaggedCapture)).rejects.toThrow(/Tag at least one room/);
    expect(seen).toHaveLength(0);
  });

  test.each([[null], [{}], [{ schema: 'vedika.roomCapture/2', quality: { roomsTagged: 1 } }]])('refuses a non-capture %j', async (bad) => {
    const { client, seen } = wired();
    await expect(uploadRoomCapture(client, bad)).rejects.toThrow(/vedika\.roomCapture\/1/);
    expect(seen).toHaveLength(0);
  });
});

describe('mergeRoomCaptures', () => {
  test('posts to ar/capture-merge with the retained key', async () => {
    const { client, seen } = wired();
    await mergeRoomCaptures(client, fx.mergeBody, { idempotencyKey: 'merge-key-0001' });
    expect(seen[0].url).toBe('/v2/astrology/vastu/ar/capture-merge');
    expect(seen[0].body).toEqual(fx.mergeBody);
    expect(key(seen[0])).toBe('merge-key-0001');
  });

  test('a retry with the same key sends the same identity', async () => {
    const { client, seen } = wired();
    await mergeRoomCaptures(client, fx.mergeBody, { idempotencyKey: 'merge-key-0001' });
    await mergeRoomCaptures(client, fx.mergeBody, { idempotencyKey: 'merge-key-0001' });
    expect(seen.map(key)).toEqual(['merge-key-0001', 'merge-key-0001']);
  });

  test.each([[undefined], [{}], [{ idempotencyKey: '' }], [{ idempotencyKey: 'has space' }], [{ idempotencyKey: 7 }]])('refuses options %j without a request', async (opts) => {
    const { client, seen } = wired();
    await expect(mergeRoomCaptures(client, fx.mergeBody, opts)).rejects.toThrow(/Idempotency-Key/);
    expect(seen).toHaveLength(0);
  });
});
