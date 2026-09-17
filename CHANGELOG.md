# Changelog

All notable changes to the Vedika JavaScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.9] - 2026-09-17

### Changed
- Vastu mandala responses changed in the API on 2026-09-17: heatmap and
  64-pada devatas follow the numbered squares of Brihat Samhita 53.43-48,
  and 81-pada cells carry `verseSquare`, with `null` devata fields on the
  28 squares the verse leaves unnamed.
- `VastuEntrancePadaData.pada` types the devata labels the API now returns:
  `deityRosterName`, `deityNameClassification`,
  `deityPlacementClassification` and `deityPlacementSource` (all optional).

### Fixed
- The README lists only example scripts that exist in the repository's
  `examples/` folder, and every example loads `@vedika-io/sdk`.
- `SECURITY.md` lists the key types the API issues: `vk_live_`, `vk_ent_`
  and the sandbox-only `vk_sandbox_`. `vk_test_` keys are not issued and are
  rejected.
- Removed internal tracking references from this changelog.

## [3.0.8] - 2026-09-16

### Added
- `ar/room-capture` Vastu operation with typed `VastuRoomCapture` requests,
  `pointCloudDensityBasis` on scan-quality requests, and an optional `capture`
  on saved-scan snapshots.
- `askVastuReport` and the `VastuReportQuestion` / `VastuReportContext` types:
  ask questions about a Vastu report without sending birth details. A
  `conversationId` alone reuses the report saved on that conversation.
- Multi-floor plan types (`floors[]`, shared `core`, `verticalChecks`) and
  bounded conversation continuation.
- Complete typed contracts for every Vastu operation, validated against the
  recorded Rust response fixtures.

### Changed
- Vastu provenance labels. These API responses changed on 2026-09-17:
  - Score `verdict` strings now describe agreement with the scored placement
    rules instead of giving building advice.
  - The top-level `verified` field is now `false` on `room/*`,
    `placement/borewell`, `placement/well`, placement and specialized results
    when the guidance is later convention. Use `placementVerified` and the
    per-field source labels to find the parts backed by a classical verse.
  - `reference/mandala/9-zone` labels every row `convention` and lists the
    verse-backed rooms, deity and element sources separately.
  - Remedies carry `remedyClassification` and `remedySource`.
  If your code shows `verdict` text or checks `verified`, review it for this
  change.

### Fixed
- Package artifacts no longer carry internal service or provider names.
- Declination sandbox and executable examples match the live contract.

## [3.0.7] - 2026-09-07

### Security
- **The API key now only ever goes to a Vedika origin.** `baseUrl` previously
  accepted any host, so a misconfigured deployment — or an attacker-controlled
  value arriving through an environment variable or a compromised config —
  received a live `vk_live_*` key in the `Authorization` and `X-API-Key` headers
  of the first request. `baseUrl` is now restricted to `vedika.io` and its
  subdomains over HTTPS, plus loopback for local development; anything else
  throws `AuthenticationError` at construction. **Everyone on 3.0.5 or earlier
  should upgrade.**
- **Every request is re-checked against that origin.** axios ignores `baseURL`
  when a request URL is absolute or protocol-relative, and a per-request
  `baseURL` overrides the instance default — so the construction-time check was
  not by itself the guarantee. A request interceptor now resolves each outgoing
  URL against the approved origin and refuses anything that lands elsewhere.
- **A routing refusal is no longer retried or retyped.** The response-error
  handler treated the interceptor's throw as a transport failure: it re-dialled
  the refusal up to three times and then reported it as a generic
  `VedikaAPIError`. Typed SDK errors now surface unchanged.

### Removed (breaking, but no published consumer)
- **`allowInsecureHttp`.** This 3.0.6-only option opted in to sending the key
  over remote cleartext HTTP. 3.0.6 was never published to npm — the option is
  absent from the released 3.0.5 artifact — so no published version ever exposed
  it and no consumer can be relying on it. Sending a live key in the clear is not
  a supported mode.

## [3.0.6] - 2026-06-15 — NEVER PUBLISHED TO NPM

> This version was built but never released; npm went 3.0.5 → 3.0.7. Its
> `baseUrl` policy below is superseded by 3.0.7: the HTTPS-only rule it describes
> still allowed *any* HTTPS host, including an attacker's, and its
> `allowInsecureHttp` opt-in was removed before release.

### Added (2026-08-11)
- **Full Vastu Shastra surface** — 76 operations across 17 families (mandala projection, entrance, rooms, site placements, compliance audits, scoring, floor-plan generation, reference tables, direction/declination), all under `/v2/astrology/vastu/`. Generic `vastu(op, params)` escape hatch plus named helpers: `vastuReference()`, `vastuMandalaProject()`, `vastuEntrancePada()`/`vastuEntranceRecommend()`, `vastuRoom()`, `vastuPlacement()`, `vastuAudit()`, `vastuScore()`, `vastuPlanGenerate()`/`vastuPlanFromRequirements()`, `vastuDeclination()`. Verb selection is automatic: `reference/*` and `direction/declination` dispatch GET, everything else POST. Vastu takes a building (plot polygon, rooms, compass zone) — never a birth chart.

### Security (2026-08-11)
- **Fixed cross-origin redirect credential forwarding.** The legacy `X-API-Key` header was still forwarded to a redirect destination even when axios correctly stripped `Authorization` on a cross-origin or HTTPS→HTTP-downgrade redirect, leaking the key off-origin. Both headers are now stripped together on any such redirect. Node transport only — the browser XHR/fetch adapter follows redirects opaquely and can't be intercepted; browser callers should use a server proxy or an origin-restricted browser-safe credential.
- **Added a `baseUrl` origin policy.** The API key is now attached only to HTTPS origins by default; a non-loopback `http://` `baseUrl` is rejected unless the new `allowInsecureHttp: true` client option opts in. Loopback (`localhost`, `127.0.0.1`, `::1`) is always allowed for local dev.

### Changed (transition-compat — no breaking changes)
- **Resilient v2-envelope unwrapping for the platform transition.** The central response interceptor previously required a top-level `billing` block to recognise the `{ success, data, ... }` envelope. Some response families now send the envelope without `billing` (it can move into `meta` or be omitted on free/idempotent paths), which left those payloads wrapped — callers on the direct-return methods (`matrimony`, `getWesternRelationship`, `spiritual.*`, `humanDesign.*`, `iching.*`) received the raw envelope instead of the reading. Unwrapping is now keyed on the `success === true && data` signature shared by all responses; v1 shapes (`askQuestion`, `getBirthChart`) are still never touched.
- **`getWesternRelationship()` is now transition-tolerant.** Synastry/composite interpretive prose (`interpretation`, per-aspect `orbQuality`/`signifies`) may be absent on some responses while the computed geometry stays parity-exact. The result is normalized so those keys are always at least present, and a new optional `WesternRelationshipResult` type makes every prose field optional so typed consumers never break on a missing block. The full raw payload is preserved via an index signature.

### Added
- `normalizeWesternRelationship()` helper + `WesternRelationshipResult` / `SynastryAspect` types (all prose fields optional).

### Notes
- Fully backward-compatible. No request shape, method signature widening only (return types broadened to supersets), or pricing changes. Existing consumers upgrade transparently.

## [2.3.0] - 2026-04-17

### Added
- `responseFormat: 'json'` option on `askQuestion()` — server returns a `structuredResponse` object with parsed sections (title, preamble, sections with paragraphs/bullets/numbered). Original markdown `response` still present. No pricing change.
- New types exported: `ResponseFormat`, `StructuredResponse`, `StructuredResponseSection`.

## [2.2.2] - 2026-04-17

### Fixed
- **`getBirthChart()` and `checkCompatibility()` were calling 404 endpoints.** Wrong paths shipped in v2.2.0 + v2.2.1. Both methods now hit the correct `/api/v1/chart` and `/api/v1/compatibility` endpoints. **Anyone on v2.2.0 or v2.2.1 should upgrade immediately.**

### Changed
- README cleaned up — removed internal architecture descriptions and provider-name mentions for clearer enterprise positioning.

## [2.2.1] - 2026-04-16 [DEPRECATED — use 2.2.2+]

### Fixed
- Added missing `tslib` dependency.

## [2.2.0] - 2026-04-16 [DEPRECATED — use 2.2.2+]

### Added
- **Voice AI** — 3 tiers via `askVoice()`: `vedika-standard` ($0.072/query, ~1s), `vedika-native` ($0.040, ~800ms, audio-native), `vedika-jarvis` ($0.080, <500ms streaming voice-to-voice). Business + Enterprise plans only.
- **Speed modes** — `speed: 'fast'` (1.5–3s, English only, ~700-word cap) or `speed: 'standard'` (12–18s, all 30 languages, default).
- **Multi-turn conversations** — pass back `conversationId` from any 200 response to continue the conversation. Default 10 messages per conversation.
- **Voice rate limits documented** — Business: 30 calls/min, 2,000/day. Enterprise: 100/min, 10,000/day.

### Known Issues (fixed in 2.2.2)
- `getBirthChart()` and `checkCompatibility()` call wrong endpoint paths → 404. Fixed in 2.2.2.

## [2.0.0] - 2026-03-13

### Added
- **V2 Computation Endpoints** — 20+ new methods for direct access to V2 API (faster, cheaper)
  - `getBirthChartV2()` — Kundli, planet positions, house cusps, ascendant via V2
  - `getDashaV2()` — Vimshottari, Mahadasha, Antardasha, Yogini Dasha via V2
  - `getDoshasV2()` — Mangal, Kaal Sarp, Sade Sati, all doshas via V2
  - `getCompatibilityV2()` — Guna Milan, Kundali matching, Ashtakoot via V2
  - `getPanchang()` — Hindu calendar (Tithi, Nakshatra, Yoga, Karana)
  - `getMuhurtaV2()` — Choghadiya, Hora, Rahu Kaal, Abhijit Muhurta via V2
  - `getDivisionalChart()` — All 16 divisional charts (D2-D60)
  - `getPrediction()` — Daily, weekly, monthly, quarterly, yearly predictions
  - `getAshtakavarga()` — Ashtakavarga and Sarvashtakavarga
  - `getVarshaphal()` — Annual horoscope (Solar return)
  - `getStrength()` — Shadbala, Chandra Bala, Tara Bala
  - `getNumerologyV2()` — Life path, destiny, personality, soul urge, complete, compatibility
- **Western Astrology** — 4 new methods for tropical/Western calculations
  - `getWesternTransits()` — Transit chart, positions, and aspects
  - `getWesternProgressions()` — Secondary progressions
  - `getWesternSolarReturn()` — Solar return chart
  - `getWesternRelationship()` — Synastry and composite charts
- **Horoscope** — `getHoroscope()` for daily/weekly/monthly, Vedic and Western
- **Conversations** — `getConversations()`, `deleteConversation()` for multi-turn chat management
- **Usage** — `getUsage()` for wallet balance and usage history
- **Enhanced AI Chat** — `askQuestion()` now supports `system` (vedic/western/kp), `speed`, `conversationId`, `partnerBirthDetails`, `includeRemedies`, `category`, `responseFormat`

### Changed
- Updated User-Agent to `vedika-javascript-sdk/2.0.0`
- 30 language support (was 22)
- Updated pricing: Starter $12, Pro $60, Business $120, Enterprise $240

---

## [1.3.0] - 2026-01-02

### Added

#### Free Sandbox Environment
- **New sandbox endpoints** - Test all API features without an API key
- `getSandboxHoroscope()` - Daily/weekly/monthly horoscopes (mock data)
- `getSandboxPanchang()` - Today's panchang (mock data)
- `sandboxChat()` - AI chat testing (mock responses)
- `getSandboxBirthChart()` - Birth chart generation (mock data)
- Zero cost testing for development and integration

#### New Computational Endpoints (15 new features)
- `getSadeSati()` - Saturn 7.5 year transit analysis with phases
- `getChandrashtama()` - Moon 8th house transit detection
- `getRitu()` - 6 Hindu seasons calculation
- `getSolstice()` - Equinoxes and solstices
- `getAnanadiYoga()` - Weekday + Nakshatra yoga combinations
- `getAuspiciousYoga()` - 27 yoga classifications
- `getAuspiciousPeriod()` - Good timing recommendations
- `getInauspiciousPeriod()` - Bad periods to avoid
- `getGowriNallaNeram()` - South Indian Choghadiya
- `getDishaShool()` - Inauspicious direction by weekday
- `getChandraBala()` - Moon strength analysis
- `getTaraBala()` - Nakshatra compatibility scoring
- `getUpagrahaPositions()` - Sub-planet positions (Dhuma, Vyatipata, etc.)
- `getPlanetRelationships()` - Naisargika Maitri (natural friendships)

#### Enhanced Compatibility Matching
- `getGunaMilan()` - Full 36 Guna (Ashtakoota) matching
  - All 8 Kootas: Varna, Vasya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi
  - Individual scores + total + recommendation
  - Dosha detection with remedies

### Changed
- **5x faster response times** - Optimized parallel processing (12s vs 60s)
- Improved error messages with actionable suggestions
- Better rate limit handling with automatic retry

### Fixed
- Timezone handling for edge cases
- Connection pooling for high-volume usage

---

## [1.2.0] - 2025-12-26

### Added

#### GraphQL Support
- `graphqlQuery()` - Execute GraphQL queries against Vedika API
- Full schema introspection support
- Nested query optimization

#### Webhook Integration
- `registerWebhook()` - Subscribe to real-time events
- `verifyWebhookSignature()` - Validate webhook authenticity
- Supported events: `chart.generated`, `ai.response.complete`, `billing.threshold`

#### Postman Collection
- Official Postman collection published to API Network
- Pre-configured environments (Sandbox/Production)
- One-click import: https://www.postman.com/vedikaai/intelligence-platform

### Changed
- Updated base URL routing for better latency (geo-aware)
- Improved streaming response handling

---

## [1.1.0] - 2025-12-15

### Added

#### Enhanced Muhurta Features
- `getChoghadiya()` - Day/night Choghadiya periods
- `getHora()` - Planetary hour calculations
- `getRahuKaal()` - Rahu Kaal timing
- `getGulikaKaal()` - Gulika Kaal timing
- `getYamaghanta()` - Yamaghanta periods
- `getAbhijitMuhurta()` - Most auspicious muhurta
- `getBrahmaMuhurta()` - Pre-dawn auspicious time
- `getDurmuhurta()` - Inauspicious muhurta periods

#### Enhanced Dosha Analysis
- `getMangalDosha()` - Mars dosha with intensity levels
- `getKaalSarpDosha()` - Kaal Sarp with type classification
- `getPitruDosha()` - Ancestral karma indicators
- `getNadiDosha()` - Nadi compatibility issues

### Changed
- Improved accuracy for planetary calculations (Vedika Ephemeris precision)
- Better handling of DST transitions

---

## [1.0.0] - 2025-11-08

### Added

#### Core Features
- Initial release of Vedika JavaScript/Node.js SDK
- `VedikaClient` class for interacting with Vedika Astrology API
- Support for AI-powered conversational astrology queries
- Advanced AI-powered query processing
- Full TypeScript support with type definitions

#### API Methods
- `askQuestion()` - Ask conversational astrology questions
- `askQuestionStream()` - Stream responses in real-time
- `getBirthChart()` - Generate complete birth charts (Kundali)
- `getDashas()` - Calculate Vimshottari Dasha periods
- `checkCompatibility()` - Ashtakoota marriage compatibility matching
- `detectYogas()` - Detect 300+ astrological yogas
- `analyzeDoshas()` - Comprehensive dosha analysis
- `getMuhurtha()` - Find auspicious times for events
- `getNumerology()` - 37 numerology calculations
- `batchProcess()` - Process multiple queries efficiently

#### TypeScript Types
- `QuestionResponse` - AI chatbot response interface
- `BirthChart` - Complete birth chart with planets and houses
- `DashaResponse` - Mahadasha, Antardasha, and Pratyantardasha periods
- `CompatibilityResponse` - Ashtakoota matching results
- `YogaResponse` - Detected yogas with descriptions
- `DoshaResponse` - Kaal Sarp, Mangal, Sade Sati, Pitra dosha analysis
- `MuhurthaResponse` - Auspicious timing analysis
- `NumerologyResponse` - Numerology calculation results

#### Exception Handling
- `VedikaAPIError` - Base exception for all API errors
- `AuthenticationError` - Invalid API key errors
- `RateLimitError` - Rate limit exceeded errors
- `InsufficientCreditsError` - Insufficient credits errors
- `ValidationError` - Input validation errors
- `TimeoutError` - Request timeout errors
- `ServerError` - Internal server errors
- `NetworkError` - Network connectivity errors

#### Features
- Automatic retry logic with exponential backoff
- Request timeout configuration
- HTTPS-only communication
- Environment variable support for API keys
- 22 language support (including 11 Indian languages)
- Prompt caching for cost savings on repeated queries
- ES6 module and CommonJS support
- Promise-based async API
- Async generator for streaming

#### Documentation
- Comprehensive README with examples
- Detailed API reference documentation
- JSDoc comments for all public APIs
- Security best practices guide
- Contributing guidelines

#### Development Tools
- TypeScript 5.0+ support
- Node.js 14+ support
- ESLint for linting
- Prettier for code formatting
- Jest testing framework

---

## Version History

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **Major version** (1.x.x): Breaking changes
- **Minor version** (x.1.x): New features, backward compatible
- **Patch version** (x.x.1): Bug fixes, backward compatible

### Support Policy

- **Latest major version**: Full support, security updates, bug fixes, new features
- **Previous major version**: Security updates and critical bug fixes for 6 months
- **Older versions**: No support

---

For the complete version history, see: https://github.com/vedika-io/vedika-sdk-javascript/releases

[2.0.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v2.0.0
[1.3.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v1.3.0
[1.2.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v1.2.0
[1.1.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v1.1.0
[1.0.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v1.0.0
