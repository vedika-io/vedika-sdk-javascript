// The slice of the public Vedika API contract these demos use.
// Anything not listed here is refused by the client before a request is made.
/** @type {{servers: {url: string}[], paths: Record<string, Record<string, {parameters: string[]}>>}} */
export const spec = {
  servers: [{ url: 'https://api.vedika.io' }, { url: 'https://api.vedika.io/sandbox' }],
  paths: {
    '/v2/astrology/panchang': { get: { parameters: ['date', 'datetime', 'latitude', 'longitude', 'timezone', 'include', 'lang'] } },
    '/v2/astrology/birth-chart': { post: { parameters: [] } },
    '/v2/astrology/kundli': { post: { parameters: [] } },
    '/v2/astrology/kundali-matching': { post: { parameters: [] } },
    '/api/vedika/chat/stream': { get: { parameters: ['question', 'language'] } },
  },
};
