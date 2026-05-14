# Changelog

All notable changes to the Vedika JavaScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
