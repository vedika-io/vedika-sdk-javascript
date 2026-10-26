import { readFileSync } from 'node:fs';
const fixture = (/** @type {string} */ name) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');
/** Offline fetch replacement rejects every unrecorded route. @type {typeof fetch} */
export const fixtureFetch = async (input, options) => {
  const path = new URL(String(input)).pathname.replace(/^\/sandbox/, '');
  const files = new Map([
    ['GET /v2/astrology/panchang', 'sandbox-panchang.json'],
    ['POST /v2/astrology/birth-chart', 'sandbox-birth.json'],
    ['POST /v2/astrology/kundli', 'sandbox-kundli.json'],
    ['POST /v2/astrology/kundali-matching', 'sandbox-match.json'],
    ['GET /api/vedika/chat/stream', 'chat.sse'],
  ]);
  const file = files.get(`${options?.method ?? 'GET'} ${path}`);
  if (!file) throw new Error('No recorded fixture for request; network disabled');
  return new Response(fixture(file), { headers: { 'Content-Type': file.endsWith('.sse') ? 'text/event-stream' : 'application/json' } });
};
export const explanationFixture = () => new Response(fixture('chat.sse'));
