/** @param {unknown} value */
export const escape = value => String(value ?? 'Unavailable').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch);
/** @param {string} title @param {string} content @param {string} mode */
export function page(title, content, mode) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Vedika</title><style>body{font:17px system-ui;background:#fff;color:#1a1a1a;max-width:850px;margin:40px auto;padding:0 20px}h1{font-size:2rem}fieldset,article{border:1px solid #d4d4d4;border-radius:12px;padding:20px;margin:20px 0}label{display:block;margin:12px 0}input{display:block;padding:10px;font:inherit;max-width:100%;box-sizing:border-box}button{background:#1f2937;color:white;border:0;padding:12px 20px;border-radius:8px;font:inherit;cursor:pointer}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #d4d4d4}.placements{overflow-x:auto}.houses{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.house{overflow-wrap:anywhere}@media(max-width:600px){.houses{grid-template-columns:repeat(2,minmax(0,1fr))}th,td{padding:6px;font-size:14px}}.house{padding:12px;border:1px solid #d4d4d4;border-radius:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere}small{display:block;margin:12px 0}</style><header><small>VEDIKA · ${escape(mode.toUpperCase())}</small><h1>${escape(title)}</h1><p>${mode === 'live' ? 'Each calculation and AI explanation may incur a charge.' : 'Mock data: sandbox and fixtures can ignore your inputs. These results are for integration testing.'}</p></header><main>${content}</main></html>`;
}
/** @param {string} name @param {string} label @param {string|number} value @param {string} [type] @param {string} [extra] */
export function field(name, label, value, type = 'text', extra = '') { return `<label>${escape(label)}<input required name="${escape(name)}" value="${escape(value)}" type="${type}" ${extra}></label>`; }
/** @param {string} [prefix] */
export function birthFields(prefix = '') { return field(`${prefix}datetime`, 'Local birth date and time', '1990-05-15T10:30', 'datetime-local') + field(`${prefix}latitude`, 'Latitude', 19.07, 'number', 'min="-90" max="90" step="any"') + field(`${prefix}longitude`, 'Longitude', 72.87, 'number', 'min="-180" max="180" step="any"') + field(`${prefix}timezone`, 'UTC offset at birth (±HH:MM)', '+05:30'); }
/** @param {any} result */
export function receipt(result) { return result.billing?.charged == null ? '' : `<small>Returned receipt: ${escape(result.billing.charged)} ${escape(result.billing.currency)}</small>`; }
/** @param {any} result */
export function panchangView(result) {
  const d = result.data;
  if (!d?.tithi?.name || !d?.nakshatra?.name) throw new Error('Panchang response missing documented fields');
  return `<article><h2>Daily panchang</h2><p>Returned calculation time: ${escape(d.datetime)} · ${escape(d.timezone)}</p><p>Coordinates: ${escape(d.coordinates?.latitude)}, ${escape(d.coordinates?.longitude)}</p><dl><dt>Tithi</dt><dd>${escape(d.tithi.name)} (${escape(d.tithi.paksha?.name)})</dd><dt>Nakshatra</dt><dd>${escape(d.nakshatra.name)}</dd><dt>Yoga</dt><dd>${escape(d.yoga?.name)}</dd><dt>Karana</dt><dd>${escape(d.karana?.name)}</dd></dl>${receipt(result)}</article>`;
}
/** @param {any} result @param {string} title @param {boolean} [includeLord] */
export function chartView(result, title, includeLord = false) {
  const d = result.data;
  if (!Array.isArray(d?.planets) || !Array.isArray(d?.houses)) throw new Error('Chart response missing documented fields');
  const hasHouseNumbers = d.houses.length > 0 && d.houses.every((/** @type {any} */ h) => Number.isInteger(h.house) && h.house >= 1 && h.house <= 12);
  return `<article><h2>${escape(title)}</h2><p>Ascendant: ${escape(d.ascendant?.sign)} ${escape(d.ascendant?.degree)}°</p>${hasHouseNumbers ? `<div class="houses">${d.houses.map((/** @type {any} */ h) => `<div class="house"><strong>House ${escape(h.house)}</strong><p>${escape(h.sign)}${includeLord && h.lord ? ` · Lord ${escape(h.lord)}` : ''}</p>${d.planets.filter((/** @type {any} */ p) => p.house === h.house).map((/** @type {any} */ p) => escape(p.name)).join(', ')}</div>`).join('')}</div>` : '<p>House diagram unavailable: response lacks documented house numbers. Returned planetary placements are listed below.</p>'}<div class="placements"><table><caption>Returned planetary placements</caption><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>House</th></tr>${d.planets.map((/** @type {any} */ p) => `<tr><td>${escape(p.name)}</td><td>${escape(p.sign)}</td><td>${escape(p.degree)}</td><td>${escape(p.house)}</td></tr>`).join('')}</table></div>${receipt(result)}</article>`;
}
/** @param {any} result */
export function matchView(result) {
  if (!result.data) throw new Error('Matching response missing data');
  const d = result.data;
  return `<article><h2>Compatibility result</h2><p>${d.gunaMilan ? `Score: ${escape(d.gunaMilan.totalScore)} / ${escape(d.gunaMilan.maxScore)}` : 'Score unavailable: sandbox response lacks the documented gunaMilan block.'}</p><p>${escape(d.compatibility)}</p><p>${escape(d.recommendation)}</p>${receipt(result)}</article>`;
}
/** @param {any} chart @param {any} kundli */
export function explanationQuestion(chart, kundli) {
  // Include only fields documented for each operation, not arbitrary response payloads.
  return `Explain these calculated birth chart and kundli placements: ${JSON.stringify([chart, kundli].map(r => ({ ascendant: { sign: r.data.ascendant?.sign, degree: r.data.ascendant?.degree }, planets: r.data.planets.map((/** @type {any} */ p) => ({ name: p.name, sign: p.sign, degree: p.degree, house: p.house })), houses: r.data.houses.map((/** @type {any} */ h) => ({ house: h.house, sign: h.sign })) })))}`;
}
