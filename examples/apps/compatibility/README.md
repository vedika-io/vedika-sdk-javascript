# Compatibility demo

Enter two complete birth records. The checker sends male and female wire records to kundali-matching and renders the returned compatibility and recommendation. The recorded sandbox response lacks the documented gunaMilan score block; the UI says Score unavailable. Published-example tests also verify score rendering.

Every calculation field comes from the public Vedika API; the app performs no astrology
calculations itself.

With Node 22+, from `examples/apps`:

```bash
npm install --no-audit --no-fund
VEDIKA_DEMO_MODE=fixture npm run compatibility
# Open http://127.0.0.1:3103
```

Omit VEDIKA_DEMO_MODE to use the keyless sandbox. VEDIKA_API_KEY is read only
server-side and omitted in sandbox and fixture requests. See the [shared
README](../README.md) for explicit live-mode configuration and local gates.

```bash
node --test compatibility/fixture.test.mjs
```

The complete page and API adapter run against [recorded fixtures](../fixtures/README.md)
with external fetch disabled. No live calls in tests or CI.
