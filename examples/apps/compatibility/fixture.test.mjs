import test from 'node:test';
import assert from 'node:assert/strict';
import { serve, birth, fixture } from '../tests/helpers.mjs';
import { matchView } from '../shared/views.mjs';

test('compatibility sends both records and renders recorded recommendation without invented score', async t => {
  const { request, calls } = await serve(t, 'compatibility');
  const form = Object.fromEntries(['male_', 'female_'].flatMap(prefix => Object.entries(birth).map(([k, v]) => [prefix + k, v])));
  const response = await request('/', form); assert.equal(response.status, 200);
  const html = await response.text(); assert.match(html, /Score unavailable/);
  assert.ok(html.includes(fixture('sandbox-match.json').data.recommendation));
  assert.equal(calls.length, 1); assert.equal(calls[0].url.pathname, '/sandbox/v2/astrology/kundali-matching');
  assert.deepEqual(calls[0].body, { male: { ...birth, latitude: 19.07, longitude: 72.87 }, female: { ...birth, latitude: 19.07, longitude: 72.87 } });
});

test('documented matching response displays returned score, verdict and escaped recommendation', () => {
  const result = fixture('spec-match.json'); result.data.recommendation = '<script>bad()</script>';
  const html = matchView(result); assert.match(html, /28 \/ 36/); assert.match(html, /Good/);
  assert.doesNotMatch(html, /<script>/); assert.match(html, /&lt;script&gt;/);
});
