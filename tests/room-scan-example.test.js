const { referencePath } = require('./reference-fixtures');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Runs examples/room-scan.js as a user would, with the built package standing in for the
// installed @vedika-io/sdk. The default run is a dry run: nothing is sent anywhere.
const root = path.resolve(__dirname, '..');
const example = path.join(root, 'examples', 'room-scan.js');

function run(args = [], env = {}) {
  const modules = fs.mkdtempSync(path.join(os.tmpdir(), 'room-scan-example-'));
  fs.mkdirSync(path.join(modules, 'node_modules', '@vedika-io'), { recursive: true });
  fs.symlinkSync(root, path.join(modules, 'node_modules', '@vedika-io', 'sdk'), 'dir');
  const { VEDIKA_API_KEY, ...clean } = process.env;
  try {
    const stdout = execFileSync(process.execPath, [example, ...args], {
      env: { ...clean, NODE_PATH: path.join(modules, 'node_modules'), ...env },
      encoding: 'utf8',
    });
    return { code: 0, stdout };
  } catch (error) {
    return { code: error.status, stdout: String(error.stdout || '') };
  } finally {
    fs.rmSync(modules, { recursive: true, force: true });
  }
}

const requests = (stdout) => stdout.split('\n').filter((l) => l.startsWith('REQUEST ')).map((l) => JSON.parse(l.slice(8)));

describe('examples/room-scan.js', () => {
  test('dry run uploads twice under one key and merges under its own key', () => {
    const { code, stdout } = run();
    expect(code).toBe(0);
    const sent = requests(stdout);
    expect(sent.map((r) => r.operation)).toEqual(['ar/room-capture', 'ar/room-capture', 'ar/capture-merge']);
    expect(sent[0].idempotencyKey).toBe('room-fx-room-3x4-yaw0');
    expect(sent[1].idempotencyKey).toBe(sent[0].idempotencyKey);
    expect(sent[2].idempotencyKey).toBe('merge-fx-room-3x4-yaw0');
  });

  test('refuses an untagged capture and a keyless merge before any request', () => {
    const { stdout } = run();
    expect(stdout).toMatch(/REFUSED untagged capture: .*Tag at least one room/);
    expect(stdout).toMatch(/REFUSED merge without a key: .*Idempotency-Key/);
    expect(requests(stdout)).toHaveLength(3);
  });

  test('--live without a key stops without sending', () => {
    const { code, stdout } = run(['--live']);
    expect(code).toBe(1);
    expect(stdout).toMatch(/Set VEDIKA_API_KEY/);
    expect(requests(stdout)).toHaveLength(0);
  });
});

// The dry run validates nothing, so the payloads are held to the fixtures the server's own tests use.
describe('examples/room-scan.js payloads', () => {
  jest.mock('@vedika-io/sdk', () => require('../dist'), { virtual: true });
  const sample = require('../examples/room-scan.js');
  const fixture = require(referencePath('sdks/fixtures/vastu-room-capture/room-3x4-yaw0.json', 'room-capture.json')).expected.capture;

  test('the sample capture is the fixture capture the server accepts', () => {
    expect(sample.capture).toEqual(fixture);
  });

  test('the merge body has two captures on two framed floors, with matching room floors', () => {
    const body = sample.mergeBody(sample.capture);
    expect(body.captures).toHaveLength(2);
    expect(new Set(body.captures.map((c) => c.id)).size).toBe(2);
    expect(new Set(body.captures.map((c) => c.payload.captureId)).size).toBe(2);
    const frames = body.floors.map((f) => f.floorIndex);
    expect(new Set(frames).size).toBe(frames.length);
    for (const c of body.captures) {
      expect(frames).toContain(c.floorIndex);
      expect(c.payload.rooms.every((room) => room.floorIndex === c.floorIndex)).toBe(true);
      expect(c.payload.quality.roomsTagged).toBeGreaterThan(0);
    }
  });
});
