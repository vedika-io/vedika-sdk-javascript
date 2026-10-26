import { spec } from './contract.mjs';

export class ApiError extends Error {
  /** @param {number} status */
  constructor(status) { super(`Vedika request failed (HTTP ${status}). Check inputs, key, balance or limits before retrying.`); this.status = status; }
}

/** Server-side only. Fixtures inject fetch; no automatic metered retry.
 * @param {{mode?: string, apiKey?: string, fetchImpl?: typeof fetch, baseUrl?: string}} [options]
 */
export function createClient({ mode = process.env.VEDIKA_MODE ?? 'sandbox', apiKey = process.env.VEDIKA_API_KEY, fetchImpl = fetch, baseUrl } = {}) {
  if (!['sandbox', 'live'].includes(mode)) throw new Error('VEDIKA_MODE must be sandbox or live');
  if (mode === 'live' && !apiKey) throw new Error('Live mode requires VEDIKA_API_KEY');
  const base = baseUrl ?? spec.servers[mode === 'sandbox' ? 1 : 0].url;
  /** @param {string} path @param {{method?: string, query?: Record<string,string|number>, body?: unknown, signal?: AbortSignal}} [options] */
  async function request(path, { method = 'GET', query = {}, body, signal } = {}) {
    const operation = spec.paths[path]?.[method.toLowerCase()];
    if (!operation) throw new Error('Endpoint/method absent from the public contract');
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (!operation.parameters.includes(key)) throw new Error('Query field absent from the public contract');
      url.searchParams.set(key, String(value));
    }
    const headers = new Headers({ Accept: path.endsWith('/stream') ? 'text/event-stream' : 'application/json' });
    if (mode === 'live') headers.set('Authorization', `Bearer ${/** @type {string} */ (apiKey)}`);
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetchImpl(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60_000)]) : AbortSignal.timeout(60_000), redirect: 'error' });
    if (!response.ok) { await response.body?.cancel(); throw new ApiError(response.status); }
    return response;
  }
  /** @param {string} path @param {Parameters<typeof request>[1]} [options] */
  async function json(path, options) {
    const result = await (await request(path, options)).json();
    if (result.success === false) throw new Error('Vedika returned an unsuccessful result');
    return result;
  }
  return { json, request, mode };
}

/** Parse calculation-chat SSE (not harness UI Message Stream).
 * @param {ReadableStream<Uint8Array>} stream
 */
export async function* chatEvents(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let completed = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      // Normalize after accumulating, including CRLF split across reads.
      pending = pending.replaceAll('\r\n', '\n');
      if (pending.length > 1_000_000) throw new Error('Chat frame exceeds demo limit');
      let end;
      while ((end = pending.indexOf('\n\n')) >= 0) {
        const frame = pending.slice(0, end); pending = pending.slice(end + 2);
        const lines = frame.split('\n');
        const event = lines.find(line => line.startsWith('event:'))?.slice(6).trim();
        const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        const payload = JSON.parse(data);
        if (event === 'completed' && typeof payload.answer === 'string') completed = true;
        yield { event, data: payload };
      }
      if (done) break;
    }
    if (!completed) throw new Error('Explanation stream ended before completed');
  } finally { await reader.cancel(); reader.releaseLock(); }
}
