import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient, ApiError, chatEvents } from '../shared/client.mjs';
import { serve, birth } from './helpers.mjs';
import { explanationQuestion } from '../shared/views.mjs';
import { fixture } from './helpers.mjs';

test('server credentials are omitted in sandbox and required for explicit live mode', async () => {
  assert.throws(() => createClient({ mode: 'live', apiKey: '' }), /requires/);
  let headers;
  const client = createClient({ mode: 'sandbox', apiKey: 'test-only-placeholder', fetchImpl: async (_url, init) => { headers = init.headers; return Response.json({ success: true }); } });
  await client.json('/v2/astrology/panchang'); assert.equal(headers.has('Authorization'), false);
  let calledUrl;
  const live = createClient({ mode: 'live', apiKey: 'test-only-placeholder', fetchImpl: async (url, init) => { calledUrl = String(url); headers = init.headers; return Response.json({ success: true }); } });
  await live.json('/v2/astrology/birth-chart', { method: 'POST', body: birth });
  assert.equal(headers.get('Authorization'), 'Bearer test-only-placeholder'); assert.equal(headers.has('X-API-Key'), false); assert.ok(!calledUrl.includes('placeholder'));
});

test('unknown endpoints and query fields are rejected before fetch', async () => {
  const client = createClient({ fetchImpl: async () => { assert.fail('Unexpected network'); } });
  await assert.rejects(client.json('/invented'), /absent/);
  await assert.rejects(client.json('/v2/astrology/panchang', { query: { invented: 'x' } }), /absent/);
});

test('errors never expose upstream body or retry a paid request', async () => {
  for (const status of [400, 401, 402, 403, 429, 500]) {
    let calls = 0;
    const client = createClient({ fetchImpl: async () => { calls++; return new Response('sensitive upstream details', { status }); } });
    await assert.rejects(client.json('/v2/astrology/kundli', { method: 'POST', body: birth }), e => e instanceof ApiError && e.status === status && !e.message.includes('sensitive'));
    assert.equal(calls, 1);
  }
});

test('invalid inputs and cross-origin posts make no calculation calls', async t => {
  const { request, calls } = await serve(t, 'kundli');
  for (const invalid of [{ ...birth, latitude: '' }, { ...birth, longitude: '181' }, { ...birth, datetime: '1990-02-31T10:30' }, { ...birth, datetime: '1990-05-15T99:00' }, { ...birth, timezone: '+14:30' }]) assert.equal((await request('/', invalid)).status, 400);
  assert.equal((await request('/', birth, { Origin: 'https://other.example' })).status, 403);
  assert.equal(calls.length, 0);
});

test('SSE handles split UTF-8, CRLF, multiline data and fails on incomplete streams', async () => {
  const encoded = new TextEncoder().encode(': comment\r\nevent: stage_started\r\ndata: {"message":\r\ndata: "तिथि"}\r\n\r\nevent: completed\r\ndata: {"answer":"Ready"}\r\n\r\n');
  const stream = new ReadableStream({ start(controller) { for (const byte of encoded) controller.enqueue(new Uint8Array([byte])); controller.close(); } });
  const events = []; for await (const event of chatEvents(stream)) events.push(event);
  assert.equal(events[0].data.message, 'तिथि'); assert.equal(events[1].data.answer, 'Ready');
  await assert.rejects(async () => { for await (const _ of chatEvents(new Response('event: started\ndata: {"message":"Waiting"}\n\n').body)) {} }, /before completed/);
});

test('AI question includes documented calculated facts without undocumented payloads', () => {
  const chart = fixture('spec-birth.json'); const kundli = fixture('spec-kundli.json'); chart.data.extra = 'do not include';
  const question = explanationQuestion(chart, kundli);
  assert.ok(question.includes('Taurus')); assert.ok(question.includes('Libra'));
  assert.ok(!question.includes('do not include')); assert.ok(!question.includes('balanceBefore'));
});
