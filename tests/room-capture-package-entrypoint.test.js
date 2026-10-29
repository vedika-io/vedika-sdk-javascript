const { referencePath } = require('./reference-fixtures');
// Package-boundary proof: a consumer that imports the shipped
// entrypoint (package.json "main"/"types" -> dist/index) can reach the named
// room-capture and capture-merge helpers and their types. The private-module
// behaviour (tagged-room and missing-key refusals) stays in vastu-room-capture.test.js.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const pkg = require('../package.json');
const fx = require(referencePath('sdks/fixtures/room-scan-bridge/messages.json', 'room-scan-messages.json'));

const root = path.resolve(__dirname, '..');
const entry = require.resolve(path.join(root, pkg.main));
const entryTypes = path.join(root, pkg.types);
const sdk = require(entry);

function wired() {
  const client = new sdk.VedikaClient({ apiKey: 'vk_test_x' });
  const seen = [];
  client.client.defaults.adapter = async (config) => {
    seen.push({ method: config.method, url: config.url, headers: { ...config.headers }, body: config.data ? JSON.parse(config.data) : undefined });
    return { data: { success: true, data: { ok: true } }, status: 200, statusText: 'OK', headers: {}, config };
  };
  return { client, seen };
}
const key = (req) => Object.entries(req.headers).find(([k]) => k.toLowerCase() === 'idempotency-key')?.[1];

describe('package entrypoint exposes the room-scan helpers', () => {
  test('main and types point at the built index', () => {
    expect(pkg.main).toBe('dist/index.js');
    expect(pkg.types).toBe('dist/index.d.ts');
    expect(fs.existsSync(entryTypes)).toBe(true);
  });

  test('uploadRoomCapture is a function on the package root and sends through the real client', async () => {
    expect(typeof sdk.uploadRoomCapture).toBe('function');
    const { client, seen } = wired();
    await sdk.uploadRoomCapture(client, fx.validCapture, { idempotencyKey: 'pkg-room-key-0001', zoneResolution: 16 });
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('post');
    expect(seen[0].url).toBe('/v2/astrology/vastu/ar/room-capture');
    expect(seen[0].body).toEqual({ capture: fx.validCapture, zoneResolution: 16 });
    expect(key(seen[0])).toBe('pkg-room-key-0001');
  });

  test('mergeRoomCaptures is a function on the package root and keeps the retained key', async () => {
    expect(typeof sdk.mergeRoomCaptures).toBe('function');
    const { client, seen } = wired();
    await sdk.mergeRoomCaptures(client, fx.mergeBody, { idempotencyKey: 'pkg-merge-key-0001' });
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('post');
    expect(seen[0].url).toBe('/v2/astrology/vastu/ar/capture-merge');
    expect(seen[0].body).toEqual(fx.mergeBody);
    expect(key(seen[0])).toBe('pkg-merge-key-0001');
  });

  test('a consumer type-checks the named types against dist/index.d.ts (strict)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'va20-consumer-'));
    const file = path.join(dir, 'consumer.ts');
    const spec = JSON.stringify(entryTypes.replace(/\.d\.ts$/, ''));
    fs.writeFileSync(file, `
import { VedikaClient, uploadRoomCapture, mergeRoomCaptures } from ${spec};
import type {
  UploadRoomCaptureOptions, VastuRoomCaptureResult, VastuCaptureMergeResult, VastuRoomScanClient,
} from ${spec};

declare const client: VedikaClient;
declare const capture: Parameters<typeof uploadRoomCapture>[1];
declare const mergeRequest: Parameters<typeof mergeRoomCaptures>[1];

const scanClient: VastuRoomScanClient = client;
const options: UploadRoomCaptureOptions = { idempotencyKey: 'k', zoneResolution: 16 };
export const upload: Promise<VastuRoomCaptureResult> = uploadRoomCapture(scanClient, capture, options);
export const merge: Promise<VastuCaptureMergeResult> = mergeRoomCaptures(scanClient, mergeRequest, { idempotencyKey: 'k' });

// @ts-expect-error the merge key is mandatory in the declared signature
export const noKey = mergeRoomCaptures(scanClient, mergeRequest, {});
// @ts-expect-error only 8, 16 or 32 are declared zone resolutions
export const badZone: UploadRoomCaptureOptions = { zoneResolution: 9 };
`);
    try {
      const result = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--strict', '--noEmit', '--skipLibCheck', '--target', 'ES2020', '--module', 'commonjs', '--moduleResolution', 'node', file], { encoding: 'utf8' });
      expect(result.stdout + result.stderr).toBe('');
      expect(result.status).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
