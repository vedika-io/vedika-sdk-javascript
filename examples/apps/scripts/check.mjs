import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
for (const dir of ['shared', 'scripts', 'tests', 'panchang', 'kundli', 'compatibility']) {
  for (const file of await readdir(new URL(`${dir}/`, root))) {
    if (!file.endsWith('.mjs')) continue;
    const result = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(`${dir}/${file}`, root))], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
console.log('Demo JavaScript syntax passed');
