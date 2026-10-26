# Vedika astrology demos

Three small apps that call the Vedika API from a server and render the result:
[daily panchang](panchang/README.md), [kundli and birth chart](kundli/README.md),
and [compatibility](compatibility/README.md). Node 22+; no runtime dependencies.
A shared native HTTP server and API adapter keep credentials on the server.

From this directory (`examples/apps`):

```bash
npm install --no-audit --no-fund
VEDIKA_DEMO_MODE=fixture npm run panchang
# Or run kundli / compatibility instead, then open the printed address.
```

Fixture mode works offline and makes no external requests. Without
`VEDIKA_DEMO_MODE=fixture`, the apps use the public keyless sandbox by default.
Sandbox results are mock data and may ignore your input: each page labels them.
The apps read `VEDIKA_API_KEY` from the environment, but sandbox and fixture modes
omit it from requests. The key never reaches HTML, browser JavaScript, request
URLs or logs.

For a live deployment, set `VEDIKA_MODE=live` and provide `VEDIKA_API_KEY` through
your server environment's secret management. Each calculation and explanation may
incur charges; these examples make one attempt, show the returned receipt and
never retry a paid call automatically. Do not use production keys for demo tests.
`PORT` overrides the default; the examples listen only on 127.0.0.1.

```bash
npm run lint
npm run typecheck   # dev only: needs TypeScript from npm install
npm test
```

Tests inject recorded responses, disable the default network fetch and use only a
local HTTP server. [Fixture provenance](fixtures/README.md) separates real keyless
sandbox recordings from published OpenAPI examples. The sandbox matching record lacks
the documented score; the page shows it as unavailable. The sandbox has no AI chat
stream, so outside live mode the kundli explanation replays the published SSE
example. That demonstrates framing and UI behaviour, not an interpretation of a
user's birth details.

`shared/contract.mjs` lists the endpoints and query fields these demos use, taken
from the public OpenAPI document at https://api.vedika.io. The client refuses any
request outside that list.
