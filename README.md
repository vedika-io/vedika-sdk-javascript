# Vedika JavaScript/Node.js SDK

Official JavaScript/Node.js SDK for the Vedika Astrology API - The **only B2B astrology API with AI-powered chatbot queries**.

[![npm version](https://badge.fury.io/js/@vedika-io/sdk.svg)](https://badge.fury.io/js/@vedika-io/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/@vedika-io/sdk.svg)](https://www.npmjs.com/package/@vedika-io/sdk)

## 🌟 What Makes Vedika Unique?

Vedika is the **ONLY B2B astrology API** that offers:
- ✅ **AI-Powered Chatbot Queries** (conversational astrology questions)
- ✅ **Advanced AI Intelligence Engine
- ✅ **Voice AI (multilingual support across 14 Indian languages plus English)
- ✅ **Fast & Standard Speed Modes** (1.5-3s fast queries vs 12-18s comprehensive)
- ✅ **Multi-Turn Conversations** (maintain context via conversationId)
- ✅ **130+ Traditional Features** (birth charts, dashas, yogas, doshas, compatibility)
- ✅ **Citation-Verified Accuracy (grounded in classical texts)
- ✅ **99.9% Uptime SLA
- ✅ **22 Language Support** (including 11 Indian languages)

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
  apiKey: 'vk_test_your_api_key_here'
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
  language: 'en',  // Supports 22 languages!
  speed: 'standard'  // 'fast' (1.5-3s) or 'standard' (12-18s, default)
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

const client = new VedikaClient({ apiKey: 'vk_test_...' });

// Use async/await
const response = await client.askQuestion({
  question: 'When should I start my new business?',
  birthDetails: { /* ... */ }
});
```

### React Example

```jsx
import { VedikaClient } from '@vedika-io/sdk';
import { useState } from 'react';

function AstrologyChat() {
  const [answer, setAnswer] = useState('');
  const client = new VedikaClient({ apiKey: process.env.REACT_APP_VEDIKA_API_KEY });

  const askQuestion = async (question) => {
    const response = await client.askQuestion({
      question,
      birthDetails: {
        datetime: '1990-06-15T14:30:00+05:30',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: '+05:30'
      }
    });
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

## 🌍 Multi-Language Support

Vedika supports 22 languages:

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
- 🇮🇳 Indian: Hindi, Bengali, Telugu, Tamil, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Odia, Assamese
- 🌍 International: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic

## 🎨 Advanced Features

### Voice AI

```javascript
// Stream voice response (Business/Enterprise plans only)
const audioStream = await client.askVoice({
  question: 'What are my career prospects?',
  birthDetails: birthInfo,
  tier: 'vedika-standard',  // $0.072/query: balanced quality + latency (~1s)
  // or 'vedika-native' ($0.040): audio-native engine, 14+ languages (~800ms)
  // or 'vedika-jarvis' ($0.080): ultra-low-latency streaming (<500ms voice-to-voice)
  language: 'hi'  // 22 languages supported
});

// Rates per tier:
// vedika-standard: 30/min (Business), 100/min (Enterprise)
// vedika-native: 30/min (Business), 100/min (Enterprise)
// vedika-jarvis: 30/min (Business), 100/min (Enterprise)
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

// Events: 'started', 'progress', 'data_sources', 'billing_completed', 'completed', 'error'
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
VEDIKA_API_KEY=vk_test_your_api_key_here
VEDIKA_API_URL=https://api.vedika.io  # Optional
```

### Client Options

```javascript
const client = new VedikaClient({
  apiKey: 'vk_test_...',
  baseUrl: 'https://api.vedika.io',  // Optional
  timeout: 60000,  // Request timeout in milliseconds
  maxRetries: 3,  // Retry failed requests
  cacheEnabled: true,  // Enable prompt caching for cost savings
  language: 'en'  // Default language for responses
});
```

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

Check out the `examples/` directory:

- `basic-chatbot.js` - Simple conversational astrology bot
- `birth-chart.js` - Complete birth chart generation
- `compatibility.js` - Marriage compatibility analysis
- `dosha-detector.js` - Comprehensive dosha analysis
- `muhurtha-finder.js` - Find auspicious times
- `multi-language.js` - Multi-language support demo
- `streaming.js` - Real-time streaming responses
- `express-app.js` - Express server example
- `react-app.jsx` - React component example

## 🐛 Troubleshooting

### "Invalid API Key"

Make sure you're using a valid API key from https://vedika.io/dashboard.html

Keys start with:
- `vk_test_` for testing
- `vk_live_` for production

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
- **Uptime:** 99.9% (multi-region failover)
- **Accuracy: Citation-verified from classical texts

## 🔒 Security

- ✅ API keys encrypted in transit (HTTPS)
- ✅ GDPR compliant
- ✅ No data retention (unless explicitly enabled)
- ✅ Security score: 95/100 (A grade)

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
| Uptime | 99.9% | ~99% |
| Security Score | 95/100 (A) | Unknown |
| **Unique Value** | **Traditional + AI** | Traditional only |

**Bottom line:** Vedika provides everything other astrology APIs offer, **PLUS** the only conversational AI chatbot capability in the market.

---

**Built with ❤️ by Vedika Intelligence**

**The only B2B astrology API with AI-powered chatbot queries.**

Get started: https://vedika.io
