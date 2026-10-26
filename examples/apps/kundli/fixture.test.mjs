import test from 'node:test';
import assert from 'node:assert/strict';
import { serve, birth, fixture } from '../tests/helpers.mjs';
import { chartView } from '../shared/views.mjs';

test('kundli page calculates both charts before explanation and consumes one stream token', async t => {
  const { request, calls } = await serve(t, 'kundli');
  const response = await request('/', birth); assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Birth chart/); assert.match(html, /Kundli/);
  assert.ok(html.includes(fixture('sandbox-birth.json').data.ascendant.sign));
  assert.match(html, /Recorded explanation demo/);
  assert.match(html, /House diagram unavailable/); assert.doesNotMatch(html, /House Unavailable/);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(c => c.url.pathname), ['/sandbox/v2/astrology/birth-chart', '/sandbox/v2/astrology/kundli']);
  assert.deepEqual(calls[1].body, { ...birth, latitude: 19.07, longitude: 72.87 });
  assert.equal(calls[0].body.ayanamsa, 'lahiri');
  const token = html.match(/data-token="([^"]+)"/)[1];
  const explanation = await request('/explain', { token }); assert.equal(explanation.status, 200);
  const events = (await explanation.text()).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(events.at(-1).event, 'completed'); assert.match(events.at(-1).data.answer, /Saturn transit/);
  assert.equal(calls.length, 2); // The sandbox's absent stream is a labeled published fixture.
  assert.equal((await request('/explain', { token })).status, 410);
});

test('chart renders documented examples without guessing missing houses or embedding SVG', () => {
  const result = fixture('spec-birth.json'); result.data.svg = '<svg onload="bad()"/>';
  const html = chartView(result, 'Birth chart');
  assert.match(html, /House 1/); assert.match(html, /Sun/); assert.doesNotMatch(html, /House 2|<svg/);
});
