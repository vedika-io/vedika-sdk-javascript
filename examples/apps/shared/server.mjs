import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient, ApiError, chatEvents } from './client.mjs';
import { fixtureFetch, explanationFixture } from './fixtures.mjs';
import { page, field, birthFields, panchangView, chartView, matchView, explanationQuestion, escape } from './views.mjs';

/** @typedef {'panchang'|'kundli'|'compatibility'} App */
/** @param {URLSearchParams} form @param {string} key @param {number} min @param {number} max */
function coordinate(form, key, min, max) {
  const value = form.get(key);
  if (value === null || !value.trim()) throw new Error('Missing coordinate');
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error('Invalid coordinate');
  return number;
}
/** @param {URLSearchParams} form @param {string} [prefix] */
export function birthInput(form, prefix = '') {
  const datetime = form.get(`${prefix}datetime`) ?? '';
  const timezone = form.get(`${prefix}timezone`) ?? '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(datetime) || !validDate(datetime.slice(0, 10)) || Number(datetime.slice(11, 13)) > 23 || Number(datetime.slice(14, 16)) > 59 || Number(datetime.slice(17, 19) || '0') > 59) throw new Error('Invalid birth datetime');
  if (!/^[+-](0\d|1[0-4]):[0-5]\d$/.test(timezone) || (timezone.slice(1, 3) === '14' && timezone.slice(4) !== '00')) throw new Error('Invalid UTC offset');
  return { datetime, latitude: coordinate(form, `${prefix}latitude`, -90, 90), longitude: coordinate(form, `${prefix}longitude`, -180, 180), timezone };
}
/** @param {string} value */
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
/** @param {App} app */
function formFor(app) {
  const fields = app === 'panchang'
    ? field('date', 'Requested date (noon IST)', new Date().toISOString().slice(0, 10), 'date') + field('latitude', 'Latitude', 28.6139, 'number', 'min="-90" max="90" step="any"') + field('longitude', 'Longitude', 77.209, 'number', 'min="-180" max="180" step="any"') + field('timezone', 'IANA timezone', 'Asia/Kolkata')
    : app === 'kundli' ? birthFields()
      : `<fieldset><legend>First person (male wire record)</legend>${birthFields('male_')}</fieldset><fieldset><legend>Second person (female wire record)</legend>${birthFields('female_')}</fieldset>`;
  return `<form method="post" action="/"><fieldset><legend>Calculation inputs</legend>${fields}<button>Calculate${app === 'kundli' ? ' chart and kundli' : ''}</button></fieldset></form>`;
}
const explanationScript = `<script>
const button=document.querySelector('#explain');
button?.addEventListener('click',async()=>{
  button.disabled=true;
  const output=document.querySelector('#answer');
  output.textContent='Starting explanation…';
  try {
    const response=await fetch('/explain',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:button.dataset.token})});
    if(!response.ok) throw new Error('Explanation unavailable. Recalculate before trying again.');
    const reader=response.body.getReader();const decoder=new TextDecoder();let pending='';let completed=false;
    while(true){const {value,done}=await reader.read();pending+=decoder.decode(value,{stream:!done});let end;
      while((end=pending.indexOf('\\n'))>=0){const line=pending.slice(0,end);pending=pending.slice(end+1);if(!line)continue;const row=JSON.parse(line);
        if(row.error)throw new Error(row.error);
        if(row.event==='completed'){output.textContent=row.data.answer;completed=true;}
        else if(row.data.message)output.textContent=row.data.message;
      }
      if(done)break;
    }
    if(!completed)throw new Error('Explanation interrupted before completion.');
  }catch(error){output.textContent=error.message;}
});
</script>`;

/** @param {App} app @param {{client?: ReturnType<typeof createClient>, mode?: string}} [options] */
export function demoServer(app, { client, mode = process.env.VEDIKA_MODE ?? 'sandbox' } = {}) {
  const fixtureMode = process.env.VEDIKA_DEMO_MODE === 'fixture';
  client ??= createClient(fixtureMode ? { mode: 'sandbox', fetchImpl: fixtureFetch } : { mode });
  const api = client;
  const displayMode = fixtureMode ? 'fixture' : api.mode;
  const titles = { panchang: 'Daily panchang', kundli: 'Kundli and birth chart', compatibility: 'Compatibility checker' };
  /** @type {Map<string,{question:string,expires:number}>} */
  const explanations = new Map();
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    const url = new URL(req.url ?? '/', 'http://localhost');
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const signal = controller.signal;
    try {
      if (req.method === 'GET' && url.pathname === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(page(titles[app], formFor(app), displayMode)); return;
      }
      if (req.method !== 'POST' || !['/', '/explain'].includes(url.pathname)) { res.writeHead(404).end('Not found'); return; }
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) { res.writeHead(403).end('Origin rejected'); return; }
      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 16_384) { res.writeHead(413).end('Form too large'); return; }
      }
      const form = new URLSearchParams(body);
      if (url.pathname === '/explain') {
        const token = form.get('token') ?? '';
        const context = explanations.get(token); explanations.delete(token);
        if (!context || context.expires < Date.now()) { res.writeHead(410).end('Recalculate to request an explanation'); return; }
        const response = api.mode === 'live' && !fixtureMode
          ? await api.request('/api/vedika/chat/stream', { query: { question: context.question, language: 'en' }, signal })
          : explanationFixture();
        if (!response.body) throw new Error('Stream missing body');
        res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
        res.flushHeaders();
        for await (const event of chatEvents(response.body)) res.write(`${JSON.stringify(event)}\n`);
        res.end(); return;
      }
      let content;
      if (app === 'panchang') {
        const date = form.get('date') ?? '';
        if (!validDate(date)) throw new Error('Invalid date');
        const timezone = form.get('timezone') ?? '';
        new Intl.DateTimeFormat('en', { timeZone: timezone });
        const result = await api.json('/v2/astrology/panchang', { query: { date, latitude: coordinate(form, 'latitude', -90, 90), longitude: coordinate(form, 'longitude', -180, 180), timezone }, signal });
        content = `<p>Requested date: ${escape(date)}</p>${panchangView(result)}`;
      } else if (app === 'compatibility') {
        const result = await api.json('/v2/astrology/kundali-matching', { method: 'POST', body: { male: birthInput(form, 'male_'), female: birthInput(form, 'female_') }, signal });
        content = matchView(result);
      } else {
        const birth = birthInput(form);
        const chart = await api.json('/v2/astrology/birth-chart', { method: 'POST', body: { ...birth, ayanamsa: 'lahiri' }, signal });
        const kundli = await api.json('/v2/astrology/kundli', { method: 'POST', body: birth, signal });
        content = chartView(chart, 'Birth chart') + chartView(kundli, 'Kundli', true);
        for (const [key, value] of explanations) if (value.expires < Date.now()) explanations.delete(key);
        if (explanations.size >= 32) explanations.delete(/** @type {string} */ (explanations.keys().next().value));
        const token = randomUUID();
        explanations.set(token, { question: explanationQuestion(chart, kundli), expires: Date.now() + 600_000 });
        content += `<article><h2>AI explanation</h2><p>${displayMode === 'live' ? 'Vedika AI models explain the returned calculation. This is a separate metered call.' : 'Recorded explanation demo: the published SSE example, not an interpretation of these mock inputs. The keyless sandbox has no chat stream.'}</p><button id="explain" data-token="${token}">Explain${displayMode === 'live' ? '' : ' (recorded example)'}</button><pre id="answer" aria-live="polite"></pre></article>${explanationScript}`;
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(page(titles[app], content + formFor(app), displayMode));
    } catch (error) {
      if (res.destroyed) return;
      const message = error instanceof ApiError ? error.message : 'Request failed. Check the inputs or retry after resolving the connection problem.';
      if (res.headersSent) { res.end(`${JSON.stringify({ error: message })}\n`); return; }
      res.writeHead(error instanceof ApiError ? error.status : 400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page(titles[app], `<p role="alert">${escape(message)}</p>${formFor(app)}`, displayMode));
    }
  });
}
/** @param {App} app @param {string} entry */
export function startDemo(app, entry) {
  if (process.argv[1] !== fileURLToPath(entry)) return;
  const port = Number(process.env.PORT ?? ({ panchang: 3101, kundli: 3102, compatibility: 3103 })[app]);
  demoServer(app).listen(port, '127.0.0.1', () => console.log(`Open http://127.0.0.1:${port}`));
}
