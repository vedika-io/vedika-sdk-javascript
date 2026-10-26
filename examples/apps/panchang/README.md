# Daily Panchang demo

Select a date, latitude, longitude and IANA timezone. The widget renders tithi, nakshatra, yoga and karana returned by the calculation endpoint, along with the requested date and returned timestamp. Date-only requests use the documented noon IST anchor.

Every calculation field comes from the public Vedika API; the app performs no astrology
calculations itself.

With Node 22+, from `examples/apps`:

```bash
npm install --no-audit --no-fund
VEDIKA_DEMO_MODE=fixture npm run panchang
# Open http://127.0.0.1:3101
```

Omit VEDIKA_DEMO_MODE to use the keyless sandbox. VEDIKA_API_KEY is read only
server-side and omitted in sandbox and fixture requests. See the [shared
README](../README.md) for explicit live-mode configuration and local gates.

```bash
node --test panchang/fixture.test.mjs
```

The complete page and API adapter run against [recorded fixtures](../fixtures/README.md)
with external fetch disabled. No live calls in tests or CI.
