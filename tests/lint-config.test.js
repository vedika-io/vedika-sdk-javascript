const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('the SDK lint config parses TypeScript and rejects a real rule violation', () => {
  function lint(input) {
    return spawnSync(process.execPath, [
      path.join(path.dirname(require.resolve('eslint/package.json')), 'bin/eslint.js'),
      '--stdin', '--stdin-filename', 'src/lint-fixture.ts', '--format', 'json',
    ], { cwd: path.resolve(__dirname, '..'), input, encoding: 'utf8', timeout: 10000 });
  }
  const valid = lint('export const value: number = 1;');
  expect(valid.status).toBe(0);
  expect(JSON.parse(valid.stdout)[0].messages).toEqual([]);
  const invalid = lint('export const value: number = 1; debugger;');
  expect(invalid.status).toBe(1);
  expect(JSON.parse(invalid.stdout)[0].messages.map(message => message.ruleId))
    .toEqual(['no-debugger']);
});
