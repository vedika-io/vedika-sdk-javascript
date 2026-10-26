import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { createClient } from '../shared/client.mjs';
import { fixtureFetch } from '../shared/fixtures.mjs';
import { demoServer } from '../shared/server.mjs';

export const fixture = name => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));
export const birth = { datetime: '1990-05-15T10:30', latitude: '19.07', longitude: '72.87', timezone: '+05:30' };
const localFetch = globalThis.fetch;
// Every default external fetch fails; server requests use injected recorded fixtures.
globalThis.fetch = async () => { throw new Error('Network disabled in fixture tests'); };
export async function serve(t, app, options = {}) {
  const calls = [];
  const client = createClient({ fetchImpl: async (url, init) => {
    calls.push({ url: new URL(String(url)), init, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return fixtureFetch(url, init);
  } });
  const server = demoServer(app, { client, ...options });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { calls, async request(path = '/', form, headers = {}) {
    assert.equal(new URL(base + path).hostname, '127.0.0.1');
    return localFetch(base + path, form ? { method: 'POST', body: new URLSearchParams(form), headers: { Origin: base, ...headers } } : undefined);
  } };
}
