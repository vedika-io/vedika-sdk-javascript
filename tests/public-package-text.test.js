// The text customers read stays accurate and public: the npm tarball ships the
// README and dist/, and the public repository also carries the changelog,
// security policy and examples.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

// Internal tracker ids (task, audit and incident ids), pull-request numbers and
// deployment-status notes mean nothing to a customer and go stale.
const INTERNAL_REFERENCE =
  /(?<![A-Za-z0-9_])(?:[MRP]-\d{3}|SDK-\d{1,3}|INC-\d{8}(?:-\d+)?)(?![0-9])|\bPR #\d+|not\s+yet\s+deployed|docs[/]ops[/]/i;

const listedExamples = (markdown) =>
  new Set([...markdown.matchAll(/^\s*- \*{0,2}`([\w.-]+\.jsx?)`/gm)].map((match) => match[1]));

function walk(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

describe('public package text', () => {
  test('customer-facing files carry no internal references', () => {
    const files = ['README.md', 'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md', ...walk('src'), ...walk('examples'), ...walk('tests')];
    const offenders = files.flatMap((file) =>
      read(file)
        .split('\n')
        .map((line, index) => [line, index + 1])
        .filter(([line]) => INTERNAL_REFERENCE.test(line))
        .map(([line, number]) => `${file}:${number}: ${line.trim().slice(0, 120)}`),
    );
    expect(offenders).toEqual([]);
    // Known-positive control: the pattern fires on the shapes that shipped before.
    expect(INTERNAL_REFERENCE.test('See R-' + '004 and the incident record')).toBe(true);
    expect(INTERNAL_REFERENCE.test('(API change, PR #' + '844)')).toBe(true);
    expect(INTERNAL_REFERENCE.test('SHA-256, UTF-8, ISO-8601 and Brihat Samhita 53.43-48')).toBe(false);
  });

  // Rule 11: the public text names what the API does, never how it is built.
  // Each of these shipped once and was removed: an agent count, a routing
  // architecture, an internal build number, and pipeline stage names that are
  // not even real SSE events.
  test('customer-facing files describe no internal architecture', () => {
    const ARCHITECTURE = /\b\d+\s*(?:AI\s*)?agents?\b|multi-?model|\bswarm\b|\bconsensus\b|\borchestrat/i;
    const INTERNAL_VERSION = /\(v\d{2}[:\s)]/i;
    const PIPELINE_STAGE = /'(?:synthesis|consensus|optimized_path|single_path)'/i;
    const files = ['README.md', 'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md', ...walk('src'), ...walk('examples')];
    const offenders = files.flatMap((file) =>
      read(file)
        .split('\n')
        .map((line, index) => [line, index + 1])
        .filter(([line]) => ARCHITECTURE.test(line) || INTERNAL_VERSION.test(line) || PIPELINE_STAGE.test(line))
        .map(([line, number]) => `${file}:${number}: ${line.trim().slice(0, 120)}`),
    );
    expect(offenders).toEqual([]);
    // Known-positive controls: the exact shapes that shipped before.
    expect(ARCHITECTURE.test('Detailed astrological answer from 6 AI agents')).toBe(true);
    expect(ARCHITECTURE.test('**Advanced Multi-Model AI** (intelligent query routing)')).toBe(true);
    expect(INTERNAL_VERSION.test('**Voice AI** (v33: 3-tier voice interface)')).toBe(true);
    expect(PIPELINE_STAGE.test("// Events: 'started', 'synthesis', 'completed'")).toBe(true);
    // And it leaves ordinary product copy alone.
    expect(ARCHITECTURE.test('Multi-Turn Conversations (maintain context via conversationId)')).toBe(false);
    expect(INTERNAL_VERSION.test('Supported since v3 of the API')).toBe(false);
  });

  test('README example lists match the examples directory', () => {
    const onDisk = new Set(fs.readdirSync(path.join(root, 'examples')).filter((name) => /\.jsx?$/.test(name)));
    for (const document of ['README.md', 'examples/README.md']) {
      const listed = listedExamples(read(document));
      expect({ document, missing: [...listed].filter((name) => !onDisk.has(name)) }).toEqual({ document, missing: [] });
      expect({ document, unlisted: [...onDisk].filter((name) => !listed.has(name)) }).toEqual({ document, unlisted: [] });
    }
  });

  test('the security policy names only real key classes', () => {
    const policy = read('SECURITY.md');
    for (const prefix of ['vk_live_', 'vk_ent_', 'vk_sandbox_']) expect(policy).toContain(`\`${prefix}\``);
    const testKeyLines = policy.split('\n').filter((line) => line.includes('vk_test_'));
    expect(testKeyLines.filter((line) => !line.includes('reject'))).toEqual([]);
  });

  test('install and repository links use the published names', () => {
    const examplesReadme = read('examples/README.md');
    expect(examplesReadme).toContain('npm install @vedika-io/sdk');
    expect(examplesReadme).not.toMatch(/npm install vedika-sdk|yarn add vedika-sdk/);
    // Each example loads the package the README tells you to install.
    for (const example of walk('examples').filter((file) => /\.jsx?$/.test(file))) {
      const specifiers = [...read(example).matchAll(/require\('([^']*vedika[^']*)'\)/g)].map((match) => match[1]);
      expect({ example, specifiers }).toEqual({ example, specifiers: ['@vedika-io/sdk'] });
    }
    for (const file of ['README.md', 'examples/README.md', 'CONTRIBUTING.md', 'SECURITY.md']) {
      expect({ file, stale: read(file).includes('github.com/vedika-intelligence') }).toEqual({ file, stale: false });
    }
  });
});
