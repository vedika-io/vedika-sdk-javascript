const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');
const { execFileSync } = require('child_process');
const ts = require('typescript');
const sdk = require('../dist');
const { referencePath } = require('./reference-fixtures');
const root = process.env.VEDIKA_GUIDE_ROOT || path.dirname(referencePath('web/vedika-public/docs/sdk/installation.html', 'guides/installation.html'));
const extract = String.raw`
import json,sys
from html.parser import HTMLParser
class Samples(HTMLParser):
 def __init__(self): super().__init__(); self.active=False; self.samples=[]
 def handle_starttag(self,t,a):
  if t=='code' and any(k=='class' and 'language-' in v for k,v in a): self.active=True; self.samples.append('')
 def handle_endtag(self,t):
  if t=='code': self.active=False
 def handle_data(self,s):
  if self.active: self.samples[-1]+=s
p=Samples(); p.feed(open(sys.argv[1]).read()); print(json.dumps(p.samples))
`;
const samples = name => JSON.parse(execFileSync('python3', ['-c', extract, path.join(root, `${name}.html`)], { encoding: 'utf8' }));
function run(code, extra = {}) {
  const context = { exports: {}, module: { exports: {} }, console: { log() {}, error() {} },
    process: { env: { VEDIKA_API_KEY: ['synthetic', 'guide', 'key'].join('-') } },
    require(name) { if (name !== '@vedika-io/sdk') throw new Error(`Unsupported import: ${name}`); return sdk; }, ...extra };
  vm.createContext(context);
  vm.runInContext(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context;
}
test('installation uses actual package exports without a fabricated health method', () => {
  const code = samples('installation')[3];
  run(code);
  expect(code).toMatch(/\bVERSION\b/);
  expect(code).not.toMatch(/VedikaClient\.VERSION|\.health\(/);
});
test('installation TypeScript compiles against current declarations', () => {
  const dir = fs.mkdtempSync(path.join(__dirname, 'guide-type-'));
  try {
    const file = path.join(dir, 'sample.ts');
    fs.writeFileSync(file, samples('installation')[4].replace(/@vedika-io\/sdk/g, '../../dist'));
    execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), file, '--noEmit', '--strict', '--skipLibCheck'], { stdio: 'pipe' });
  } finally { fs.rmSync(dir, { recursive: true }); }
});
test('authentication factory explicitly supplies the server environment key', () => {
  const context = run(samples('authentication')[0]);
  expect(context.module.exports.createVedikaClient()).toBeInstanceOf(sdk.VedikaClient);
  context.process.env = {};
  expect(() => context.module.exports.createVedikaClient()).toThrow(/Configure/);
});
test('browser installation sample calls only the application proxy', async () => {
  const seen = [];
  const code = samples('installation')[5];
  expect(code).not.toMatch(/VedikaClient|apiKey|Authorization|unpkg/);
  await run(`exports.done = (async () => { ${code} })();`, {
    fetch: async (url, options) => { seen.push({ url, options }); return { ok: true, json: async () => ({}) }; }
  }).exports.done;
  expect(seen[0].url).toBe('/api/birth-chart');
  expect(seen[0].options.method).toBe('POST');
});
test('quickstart preserves the actual V1 chart envelope over the SDK transport', async () => {
  const wire = { chartData: { success: true, credits_used: 0, data: {
    ascendant: { sign: 'fixture' }, planets: [{ name: 'fixture', sign: 'fixture', degree: 0 }], houses: []
  } }, metadata: { creditsUsed: 0, creditsRemaining: 0 } };
  const seen = [];
  const server = http.createServer((req, res) => { seen.push(req.url); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(wire)); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const client = new sdk.VedikaClient({ apiKey: ['synthetic', 'guide', 'key'].join('-'), baseUrl: `http://127.0.0.1:${server.address().port}`, maxRetries: 0 });
    const context = run(`${samples('quickstart')[2]}\nexports.readBirthChart = readBirthChart;`);
    expect(await context.exports.readBirthChart(client)).toEqual(wire);
    expect(seen).toEqual(['/api/v1/chart']);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('selected guides contain no secret-inlining instructions or obsolete package names', () => {
  for (const name of ['authentication', 'installation', 'quickstart']) {
    const html = fs.readFileSync(path.join(root, `${name}.html`), 'utf8');
    expect(html).not.toMatch(/@vedika\/sdk|JSON\.stringify\(process\.env\.VEDIKA_API_KEY\)|vk_live_abc123xyz789|Current Mahadasha: Venus|sunSign: 'Taurus'/);
  }
});
