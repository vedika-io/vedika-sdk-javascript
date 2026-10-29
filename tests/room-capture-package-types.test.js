// An external TypeScript consumer imports the two room-scan input types
// from the built package root declarations (dist/index.d.ts), not a private path.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');
const entryTypes = path.join(root, pkg.types);

describe('package root declarations expose the room-scan input types', () => {
  test('VastuRoomCapture and VastuArCaptureMergeRequest match the helper signatures', () => {
    expect(fs.existsSync(entryTypes)).toBe(true);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'va20-types-'));
    const file = path.join(dir, 'consumer.ts');
    const spec = JSON.stringify(entryTypes.replace(/\.d\.ts$/, ''));
    fs.writeFileSync(file, `
import { uploadRoomCapture, mergeRoomCaptures } from ${spec};
import type { VastuRoomCapture, VastuArCaptureMergeRequest } from ${spec};

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
export const uploadParam: Equal<Parameters<typeof uploadRoomCapture>[1], VastuRoomCapture> = true;
export const mergeParam: Equal<Parameters<typeof mergeRoomCaptures>[1], VastuArCaptureMergeRequest> = true;
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
