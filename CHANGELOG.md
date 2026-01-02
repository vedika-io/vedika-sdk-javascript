# Changelog

All notable changes to the Vedika JavaScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Improved accuracy for planetary calculations (Swiss Ephemeris precision)
- Better handling of DST transitions

---

## [1.0.0] - 2025-11-08

### Added

#### Core Features
- Initial release of Vedika JavaScript/Node.js SDK
- `VedikaClient` class for interacting with Vedika Astrology API
- Support for AI-powered conversational astrology queries
- Multi-agent intelligence integration
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

[1.3.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v1.3.0
[1.2.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v1.2.0
[1.1.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v1.1.0
[1.0.0]: https://github.com/vedika-io/vedika-sdk-javascript/releases/tag/v1.0.0
