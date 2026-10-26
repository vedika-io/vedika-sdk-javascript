# Kundli demo

Enter local birth time, coordinates and the historical UTC offset. The page calls birth-chart and kundli, draws a grid of returned houses, and tabulates returned planetary positions. Click Explain to consume a streamed explanation. Non-live mode clearly labels the published recorded SSE example; a live explanation is a separate metered call from Vedika AI models.

Every calculation field comes from the public Vedika API; the app performs no astrology
calculations itself.

With Node 22+, from `examples/apps`:

```bash
npm install --no-audit --no-fund
VEDIKA_DEMO_MODE=fixture npm run kundli
# Open http://127.0.0.1:3102
```

Omit VEDIKA_DEMO_MODE to use the keyless sandbox. VEDIKA_API_KEY is read only
server-side and omitted in sandbox and fixture requests. See the [shared
README](../README.md) for explicit live-mode configuration and local gates.

```bash
node --test kundli/fixture.test.mjs
```

The complete page and API adapter run against [recorded fixtures](../fixtures/README.md)
with external fetch disabled. No live calls in tests or CI.
