import test from 'node:test';
import assert from 'node:assert/strict';
import { serve, fixture } from '../tests/helpers.mjs';

test('daily widget renders recorded panchang with requested and returned times', async t => {
  const { request, calls } = await serve(t, 'panchang');
  const home = await request(); assert.match(await home.text(), /name="date"/);
  const response = await request('/', { date: '2026-05-15', latitude: '28.6139', longitude: '77.209', timezone: 'Asia/Kolkata' });
  assert.equal(response.status, 200);
  const html = await response.text(); const data = fixture('sandbox-panchang.json').data;
  assert.ok(html.includes(data.tithi.name)); assert.ok(html.includes(data.nakshatra.name));
  assert.ok(html.includes(data.datetime)); assert.ok(html.includes('Requested date: 2026-05-15'));
  assert.match(html, /Mock data/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, '/sandbox/v2/astrology/panchang');
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { date: '2026-05-15', latitude: '28.6139', longitude: '77.209', timezone: 'Asia/Kolkata' });
  assert.equal(calls[0].init.headers.has('X-API-Key'), false);
});
