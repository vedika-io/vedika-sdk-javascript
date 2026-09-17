# Vedika JavaScript/Node.js SDK

Official JavaScript/Node.js SDK for the Vedika Astrology API - The **only B2B astrology API with AI-powered chatbot queries**.

[![npm version](https://badge.fury.io/js/@vedika-io/sdk.svg)](https://badge.fury.io/js/@vedika-io/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/@vedika-io/sdk.svg)](https://www.npmjs.com/package/@vedika-io/sdk)

## 🌟 What Makes Vedika Unique?

Vedika is the **ONLY B2B astrology API** that offers:
- ✅ **AI-Powered Chatbot Queries** (conversational astrology questions)
- ✅ **Voice AI** (spoken answers in Indian languages and English; see `/api/v1/voice/pricing` for the current tiers and their languages)
- ✅ **Fast, Standard & Eco Delivery Tiers** (1.5-3s fast vs 12-18s comprehensive; eco is the lower-cost engine)
- ✅ **Multi-Turn Conversations** (maintain context via conversationId)
- ✅ **Traditional Vedic Coverage** (birth charts, dashas, yogas, doshas, compatibility)
- ✅ **Multi-Language Answers** (14 Indian languages plus English, and major world languages)

**In summary:** All the features of traditional astrology APIs, **PLUS** conversational AI capabilities no other provider has.

## 🚀 Quick Start

### Installation

```bash
npm install @vedika-io/sdk
# or
yarn add @vedika-io/sdk
```

### Basic Usage (Node.js)

```javascript
const { VedikaClient } = require('@vedika-io/sdk');

// Initialize client
const client = new VedikaClient({
  apiKey: 'vk_live_...'
});

// Ask a conversational astrology question (UNIQUE to Vedika!)
const response = await client.askQuestion({
  question: 'What are my career prospects for this year?',
  birthDetails: {
    datetime: '1990-06-15T14:30:00+05:30',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: '+05:30'
  },
  language: 'en',  // 29 languages; see the language list below
  speed: 'standard'  // 'fast' (1.5-3s), 'standard' (12-18s, default), or 'eco' (lower cost)
});

console.log(response.answer);
console.log(`Confidence: ${response.confidence}`);
console.log(`Credits used: ${response.creditsUsed}`);
console.log(`Conversation ID: ${response.conversationId}`);  // Use for multi-turn

// Continue conversation
const followUp = await client.askQuestion({
  question: 'Tell me about my marriage prospects',
  birthDetails: response.birthDetails,
  conversationId: response.conversationId  // Maintains context
});
```

### ES6 Modules

```javascript
import { VedikaClient } from '@vedika-io/sdk';

const client = new VedikaClient({ apiKey: 'vk_live_...' });

// Use async/await
const response = await client.askQuestion({
  question: 'When should I start my new business?',
  birthDetails: { /* ... */ }
});
```

### React Example

⚠️ **Never construct a `VedikaClient` with a live API key inside browser code.**
A `REACT_APP_*` / `NEXT_PUBLIC_*` / `VITE_*` env var is inlined into the JS
bundle at build time and shipped to every visitor — anyone can read it from
the network tab and spend your wallet. Call your own backend from the
component, and let the backend hold the real `VedikaClient` (see "Basic Usage
(Node.js)" above). If you only have a static/serverless frontend, put a thin
proxy endpoint in front of Vedika instead of embedding the key.

```jsx
// Client component — calls YOUR backend, never Vedika directly.
import { useState } from 'react';

function AstrologyChat() {
  const [answer, setAnswer] = useState('');

  const askQuestion = async (question) => {
    // /api/ask is a route on your own server that holds the real API key
    // and calls VedikaClient server-side (see the Node.js example above).
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        birthDetails: {
          datetime: '1990-06-15T14:30:00+05:30',
          latitude: 28.6139,
          longitude: 77.2090,
          timezone: '+05:30'
        }
      })
    });
    const response = await res.json();
    setAnswer(response.answer);
  };

  return (
    <div>
      <button onClick={() => askQuestion('What are my career prospects?')}>
        Ask AI Astrologer
      </button>
      <p>{answer}</p>
    </div>
  );
}
```

## 📚 Features

### 🤖 AI Chatbot Queries (Unique Feature!)

```javascript
// Conversational astrology - No other API has this!
const response = await client.askQuestion({
  question: 'When should I start my new business?',
  birthDetails: birthInfo,
  language: 'hi'  // Ask in Hindi!
});
```

### 📊 Birth Chart Analysis

```javascript
// Generate complete birth chart
const chart = await client.getBirthChart({
  datetime: '1990-06-15T14:30:00+05:30',
  latitude: 28.6139,
  longitude: 77.2090,
  ayanamsa: 'lahiri'  // 8 ayanamsa systems supported
});

console.log(chart.planets);
console.log(chart.houses);
console.log(chart.ascendant);
```

### 🔮 Dasha Periods

```javascript
// Get Vimshottari Dasha periods
const dashas = await client.getDashas({ birthDetails: birthInfo });

dashas.mahadashas.forEach(dasha => {
  console.log(`${dasha.planet}: ${dasha.startDate} to ${dasha.endDate}`);
});
```

### 💑 Compatibility Analysis

```javascript
// Ashtakoota matching for marriage compatibility
const compatibility = await client.checkCompatibility({
  person1: birthInfo1,
  person2: birthInfo2
});

console.log(`Total score: ${compatibility.totalScore}/36`);
console.log(`Compatibility: ${compatibility.level}`);
```

### 🌟 Yoga Detection

```javascript
// Detect 300+ astrological yogas
const yogas = await client.detectYogas({ birthDetails: birthInfo });

console.log(`Found ${yogas.yogas.length} yogas:`);
yogas.yogas.forEach(yoga => {
  console.log(`- ${yoga.name}: ${yoga.description}`);
});
```

### ⚠️ Dosha Analysis

```javascript
// Check for Kaal Sarp, Mangal, Sade Sati doshas
const doshas = await client.analyzeDoshas({ birthDetails: birthInfo });

if (doshas.kaalSarpDosha.present) {
  console.log('Kaal Sarp Dosha detected');
  console.log(`Type: ${doshas.kaalSarpDosha.type}`);
  console.log(`Remedies: ${doshas.kaalSarpDosha.remedies}`);
}
```

### 🎯 Muhurtha (Auspicious Timing)

```javascript
// Find auspicious times for important events
const muhurtha = await client.getMuhurtha({
  date: '2025-11-01',
  location: { latitude: 28.6139, longitude: 77.2090 },
  eventType: 'wedding'
});

console.log(`Auspicious times: ${muhurtha.goodTimes}`);
console.log(`Inauspicious times: ${muhurtha.badTimes}`);
```

### 🔢 Numerology

```javascript
// 37 numerology calculations
const numerology = await client.getNumerology({
  name: 'John Doe',
  birthDate: '1990-06-15'
});

console.log(`Life Path Number: ${numerology.lifePath}`);
console.log(`Expression Number: ${numerology.expression}`);
console.log(`Soul Urge Number: ${numerology.soulUrge}`);
```

### 🃏 Tarot

```javascript
// Card of the day
const card = await client.tarot.cardOfTheDay();
console.log(`${card.name} (${card.orientation}): ${card.meaning}`);

// Draw a Celtic Cross spread
const reading = await client.tarot.draw('celtic-cross', 'What does my career hold?');
console.log(reading.interpretation);

// List available spreads
const spreads = await client.tarot.spreads();
```

### 🐉 Chinese Astrology

```javascript
// Chinese zodiac animal
const zodiac = await client.chinese.zodiacAnimal(1995);
console.log(`${zodiac.animal} (${zodiac.yearElement})`);
console.log(`Compatible: ${zodiac.compatible.join(', ')}`);

// BaZi (Four Pillars) chart
const bazi = await client.chinese.bazi(birthInfo);
console.log(`Day Master: ${bazi.dayMaster} (${bazi.dayMasterStrength})`);

// Feng Shui Kua number
const kua = await client.chinese.fengShui.kuaNumber(1990, 'male');
console.log(`Kua: ${kua.kuaNumber}, Group: ${kua.group}`);
```

### ☯️ I Ching

```javascript
// Cast a hexagram with a question
const hexagram = await client.iching.cast('Should I change careers?');
console.log(`${hexagram.englishName}: ${hexagram.interpretation}`);

// Daily hexagram
const daily = await client.iching.daily();
```

### 💎 Crystals

```javascript
// Crystals for your zodiac sign
const crystals = await client.crystals.byZodiac('aries');
crystals.forEach(c => console.log(`${c.name}: ${c.properties.join(', ')}`));

// Full catalog
const catalog = await client.crystals.catalog();
```

### 🔺 Human Design

```javascript
// Full body graph
const graph = await client.humanDesign.chart(birthInfo);
console.log(`Type: ${graph.type}, Strategy: ${graph.strategy}`);
console.log(`Authority: ${graph.authority}, Profile: ${graph.profile}`);

// Quick type lookup
const hdType = await client.humanDesign.type(birthInfo);
console.log(`${hdType.type}: ${hdType.description}`);
```

### 💍 Matrimony (Advanced Matching)

```javascript
// Unified match (Vedic + KP)
const match = await client.matrimony.unifiedMatch(person1, person2);
console.log(`Score: ${match.totalScore}/${match.maxScore} — ${match.verdict}`);

// Dosha cancellation check
const dosha = await client.matrimony.doshaCancellation(person1, person2);
console.log(`Cancelled: ${dosha.cancelled}`);
```

### 🙏 Spiritual Guidance

```javascript
// Personalized mantra
const mantra = await client.spiritual.mantra(birthInfo);
console.log(`${mantra.transliteration} — chant ${mantra.repetitions}x`);

// Recommended deity
const deity = await client.spiritual.deity(birthInfo);
console.log(`Worship ${deity.deity} on ${deity.auspiciousDay}`);

// Past life indicators
const pastLife = await client.spiritual.pastLife(birthInfo);
console.log(pastLife.interpretation);
```

### 📅 Daily Insights

```javascript
// Complete daily bundle
const bundle = await client.daily.bundle();
console.log(bundle.horoscope.prediction);
console.log(`Tithi: ${bundle.panchang.tithi}`);

// Daily horoscope for a sign
const horoscope = await client.daily.horoscope('aries');
```

### 🪐 Extended Dasha Systems

```javascript
// Ashtottari Dasha (108-year cycle)
const ashtottari = await client.dasha.ashtottari(birthInfo);

// Chara (Jaimini) Dasha
const chara = await client.dasha.chara(birthInfo);

// All dasha systems at once
const allDasha = await client.dasha.currentAll(birthInfo);
console.log(`Recommended system: ${allDasha.recommended}`);
```

### 🏥 Health & Career Astrology

```javascript
// Health analysis
const health = await client.health.analysis(birthInfo);
console.log(`Ayurvedic dosha: ${health.ayurvedicDosha}`);

// Career analysis
const career = await client.career.analysis(birthInfo);
console.log(`Best fields: ${career.suitableFields.join(', ')}`);
```

### 🏠 Vastu Shastra (93 operation paths)

Vastu takes a building: a plot polygon, room list, and compass zone. All 93 operation paths use `/v2/astrology/vastu/`. `vastuOperation()` and the typed named helpers return the full `{success, data, billing?, meta?}` response. Generic helpers such as `vastu()` and `vastuScore()` return the data payload.

```typescript
const rooms = [
  { name: 'Kitchen', roomType: 'kitchen', zone: 'SE' },
  { name: 'Pooja', roomType: 'pooja', zone: 'NE' },
];
const score = await client.vastuOperation('score/overall', { rooms });
console.log(score.data.score, score.data.scoring.version);

// A batch has 1–20 properties. Retain this key with this exact batch before
// sending; reuse it after a lost response or client restart. Use a new key
// for a different logical batch. Missing or blank keys fail before network.
const batchKey = 'property-import-001';
const batch = await client.vastuOperation('assessments/batch', {
  items: [{
    id: 'property-1',
    assessment: { inputSource: 'plan-derived', rooms: [{ roomType: 'kitchen', zone: 'SE' }] },
  }],
}, { idempotencyKey: batchKey });
for (const item of batch.data.results) {
  console.log(item.id, item.status, item.response);
}

// Keep geometry and scores while omitting SVG drawings.
const plan = await client.vastuOperation('plan/from-requirements', {
  plot: { width: 40, length: 60, facing: 'east' },
  requirements: {
    bedrooms: 2, toilets: 2, floors: 1,
    hasKitchen: true, hasLiving: true, hasDining: true, hasPooja: true,
    hasStudy: true, hasGuest: false, hasStore: false, hasStaircase: false,
  },
  includeSvg: false,
});
console.log(plan.data.rooms);

// HTML is a standalone artifact. Save its content using its filename,
// open it offline, or use the browser's Print to PDF.
const report = await client.vastuOperation('plan/report', {
  rooms: [{ name: 'Kitchen', zone: 'SE' }, { name: 'Pooja', zone: 'NE' }],
  format: 'html',
  brand: { reportTitle: 'Property Vastu Report', generatedFor: 'Buyer' },
});
console.log(report.data.artifact?.filename, report.data.artifact?.content);
```

Each batch item uses the existing assessment price; there is no batch fee. Inspect every item status even when the batch succeeds. Scores are versioned conventions. Compare the same scoring version and equivalent room coverage. Detailed audits report missing input and do not certify physical survey completeness.

## 🌍 Multi-Language Support

Vedika answers in 29 languages:

```javascript
// Ask in Hindi
const response = await client.askQuestion({
  question: 'मेरी कुंडली में कौन से योग हैं?',
  birthDetails: birthInfo,
  language: 'hi'
});

// Ask in Tamil
const response = await client.askQuestion({
  question: 'என் ஜாதகத்தில் என்ன யோகங்கள் உள்ளன?',
  birthDetails: birthInfo,
  language: 'ta'
});
```

**Supported languages:**
- 🇮🇳 South Asian: Hindi (`hi`), Bengali (`bn`), Tamil (`ta`), Telugu (`te`), Marathi (`mr`),
  Gujarati (`gu`), Kannada (`kn`), Malayalam (`ml`), Punjabi (`pa`), Odia (`od`), Assamese (`as`),
  Urdu (`ur`), Nepali (`ne`), Sinhala (`si`)
- 🌍 Other: English (`en`), Spanish (`es`), French (`fr`), German (`de`), Italian (`it`),
  Portuguese (`pt`), Russian (`ru`), Arabic (`ar`), Persian (`fa`), Chinese (`zh`),
  Japanese (`ja`), Korean (`ko`), Vietnamese (`vi`), Indonesian (`id`), Malay (`ms`)

Pass one of the codes above. An unrecognised code is not rejected, and the language of the
answer is then not guaranteed, so validate the code on your side.
Voice answers cover a smaller set than text; read `/api/v1/voice/pricing` for the current
per-tier voice languages.

## 🎨 Advanced Features

### Voice AI

`askVoice()` uploads recorded audio and returns audio or a text fallback. Check
the current API catalog for voice tier availability, languages, access and pricing.

```javascript
// audioBlob is a recorded audio Blob, Buffer or ArrayBuffer.
const voice = await client.askVoice({
  audio: audioBlob,
  birthDetails: birthInfo,
  tier: 'vedika-voice-standard',
  language: 'hi'
});

if (voice.isAudio) {
  // voice.audio contains the audio response bytes.
} else {
  console.log(voice.json?.response);
}
```

### Speed Modes

```javascript
// Fast mode: 1.5-3 seconds, English only, ~700 word cap
const fastResp = await client.askQuestion({
  question: 'Quick career check?',
  birthDetails: birthInfo,
  speed: 'fast'  // Optimized for latency
});

// Standard mode: 12-18 seconds, all languages, full depth (default)
const fullResp = await client.askQuestion({
  question: 'Full career analysis?',
  birthDetails: birthInfo,
  speed: 'standard'  // Comprehensive response
});
```

### Streaming Responses (Real-Time)

```javascript
// Stream responses for better UX
for await (const chunk of client.askQuestionStream({
  question: 'What are my career prospects?',
  birthDetails: birthInfo,
  speed: 'standard'  // Fast mode not available on streaming
})) {
  process.stdout.write(chunk);
}

// Events: 'started', 'progress', 'stage_completed', 'data_sources', 'billing_completed', 'billing_error', 'completed', 'error'
```

### Batch Processing

```javascript
// Process multiple queries efficiently
const queries = [
  { question: 'Career prospects?', birthDetails: birth1 },
  { question: 'Marriage timing?', birthDetails: birth2 },
  { question: 'Business success?', birthDetails: birth3 }
];

const results = await client.batchProcess(queries);
```

### Error Handling

```javascript
try {
  const response = await client.askQuestion({
    question: 'What are my career prospects?',
    birthDetails: birthInfo
  });
  console.log(response.answer);
} catch (error) {
  if (error.name === 'AuthenticationError') {
    console.error('Invalid API key');
  } else if (error.name === 'InsufficientCreditsError') {
    console.error('Add more credits at https://vedika.io/dashboard.html');
  } else if (error.name === 'RateLimitError') {
    console.error('Rate limit exceeded, please wait');
  } else {
    console.error('API error:', error.message);
  }
}
```

## 💰 Pricing

Token-based pricing - pay only for what you use:

| Query Type | Cost | Tokens |
|------------|------|--------|
| Simple (daily horoscope) | $0.19 | ~500 |
| Standard (birth chart) | $0.35 | ~800 |
| Complex (comprehensive) | $0.65 | ~1,500 |

**Free sandbox:** Test with 65 mock endpoints at [vedika.io/sandbox](https://vedika.io/sandbox) — no signup required. Production starts at $12/month.

See full pricing: https://vedika.io/pricing.html

## 🔧 Configuration

### Environment Variables

```bash
# .env file
VEDIKA_API_KEY=vk_live_...
VEDIKA_API_URL=https://api.vedika.io  # Optional
```

### Client Options

```javascript
const client = new VedikaClient({
  apiKey: 'vk_live_...',
  baseUrl: 'https://api.vedika.io',  // Optional -- must be a Vedika origin (see below)
  timeout: 60000,  // Request timeout in milliseconds
  maxRetries: 3,  // Retry failed requests
  cacheEnabled: true,  // Enable prompt caching for cost savings
  language: 'en',  // Default language for responses
  allowInsecureHttp: false  // Legacy option; cannot enable custom origins or remote HTTP
});
```

`baseUrl` accepts a Vedika origin (`vedika.io` or a `*.vedika.io` subdomain) over
HTTPS, or loopback (`localhost`, `127.0.0.1`, `::1`) for local development.
Anything else throws immediately, because the client would otherwise send your
API key there. There is no opt-in that relaxes this: to route calls through your
own gateway, proxy them server-side and keep the key on the server.

> Upgrading from 3.0.6? That version was never published to npm. Its
> `allowInsecureHttp` option is gone — remote cleartext is not a supported way to
> send a live key.

### Structured JSON Output

Pass `responseFormat: 'json'` to receive a parsed section-by-section object alongside the markdown text:

```javascript
const res = await client.askQuestion({
  question: 'What is my marriage timing?',
  birthDetails: { /* ... */ },
  responseFormat: 'json'
});

// Access structured sections
console.log(res.structuredResponse?.title);     // "Marriage Timing"
console.log(res.structuredResponse?.sections);  // Array of section objects

// Each section has:
// { heading, level (1-6), paragraphs [], bullets [], numbered [] }
res.structuredResponse?.sections.forEach(section => {
  console.log(`## ${section.heading}`);
  section.paragraphs.forEach(p => console.log(p));
  section.bullets.forEach(b => console.log(`• ${b}`));
  section.numbered.forEach((n, i) => console.log(`${i+1}. ${n}`));
});

// Original markdown still available
console.log(res.answer);
```

Perfect for rendering sections independently without parsing markdown.

## 🧪 Testing

```bash
# Install dev dependencies
npm install --save-dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test -- test/chatbot.test.js
```

## 📝 Examples

`examples/` is **not included in the published npm package** (the package
ships only `dist/`, this README and the license). Clone the repository or
browse it on GitHub to run these:
https://github.com/vedika-io/vedika-sdk-javascript/tree/main/examples

- `basic-chatbot.js` - Simple conversational astrology bot
- `birth-chart.js` - Complete birth chart generation
- `streaming.js` - Real-time streaming responses
- `vastu.js` - Vastu mandala projection, room placement, and scoring

## 🐛 Troubleshooting

### "Invalid API Key"

Make sure you're using a valid API key from https://vedika.io/dashboard.html

Keys start with:
- `vk_live_` for production
- `vk_ent_` for enterprise accounts

Keys that start with `vk_test_` are rejected. To test without a key, use the free sandbox at `https://api.vedika.io/sandbox/...`.

### "Insufficient Credits"

Add credits to your account: https://vedika.io/dashboard.html

### "Request Timeout"

For complex queries, increase timeout:

```javascript
const client = new VedikaClient({
  apiKey: '...',
  timeout: 120000  // 2 minutes
});
```

### "Rate Limit Exceeded"

You're sending too many requests. Wait a moment or upgrade your plan.

## 📊 Performance

- **Average response time:** 2.14 seconds (simple queries)
- **Complex queries:** 28-36 seconds (deep analysis path)
- **Availability:** single region (AWS `ap-south-1`, Mumbai) with multi-AZ redundancy. There is no cross-region failover; availability commitments are set per contract.

## 🔒 Security

- ✅ API keys encrypted in transit (HTTPS)
- ✅ **Credential-routing policy:** credentials may use only `https://api.vedika.io` on its default HTTPS port, or literal loopback HTTP (`localhost`, `127.x.x.x`, `::1`) for local development. Custom HTTPS origins and remote HTTP are rejected, even with the legacy insecure-HTTP flag. Redirect protection keeps keys off a different origin. Browser applications must keep the real key on their server and use their own app-session transport.

## 📜 License

MIT License - see [LICENSE](LICENSE) file

## 🌐 Links

- **Website:** https://vedika.io
- **Documentation:** https://vedika.io/docs.html
- **API Reference:** https://vedika.io/api-reference.html
- **Dashboard:** https://vedika.io/dashboard.html
- **Support:** support@vedika.io
- **GitHub:** https://github.com/vedika-io

## ⭐ Support

If you find this SDK helpful, please:
- ⭐ Star this repository
- 🐛 Report issues on GitHub
- 💬 Join our community discussions
- 📧 Contact support@vedika.io for help

---

## 🎯 Why Choose Vedika?

### Vedika vs Traditional Astrology APIs

| Feature | Vedika | Others |
|---------|--------|--------|
| **AI Chatbot Queries** | ✅ YES (UNIQUE!) | ❌ No |
| Birth Charts | ✅ Yes | ✅ Yes |
| Dashas | ✅ Yes | ✅ Yes |
| Compatibility | ✅ Yes | ✅ Yes |
| 300+ Yogas | ✅ Yes | ⚠️ Limited |
| Dosha Analysis | ✅ Complete | ⚠️ Basic |
| Conversational AI | ✅ Yes | ❌ No |
| 30 Languages | ✅ Yes | ❌ English only |
| Streaming | ✅ Yes | ❌ No |
| **Unique Value** | **Traditional + AI** | Traditional only |

**Bottom line:** Vedika provides everything other astrology APIs offer, **PLUS** the only conversational AI chatbot capability in the market.

---

**Built with ❤️ by Vedika Intelligence**

**The only B2B astrology API with AI-powered chatbot queries.**

Get started: https://vedika.io
