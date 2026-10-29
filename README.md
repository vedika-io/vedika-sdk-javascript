# Vedika JavaScript/Node.js SDK

Official JavaScript/Node.js SDK for the Vedika Astrology API - structured calculations and conversational readings for application developers.

[![npm version](https://badge.fury.io/js/@vedika-io/sdk.svg)](https://badge.fury.io/js/@vedika-io/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/@vedika-io/sdk.svg)](https://www.npmjs.com/package/@vedika-io/sdk)

## Capabilities

The SDK provides access to these Vedika capabilities:
- ✅ **AI-Powered Chatbot Queries** (conversational astrology questions)
- ✅ **Voice AI** (spoken answers in Indian languages and English; see `/api/v1/voice/pricing` for the current tiers and their languages)
- ✅ **Fast, Standard, Eco & Pro Ultra Delivery Tiers** (availability varies by route and plan; response time depends on the request and selected tier)
- ✅ **Multi-Turn Conversations** (maintain context via conversationId)
- ✅ **Traditional Vedic Coverage** (birth charts, dashas, yogas, doshas, compatibility)
- ✅ **Multi-Language Answers** (availability varies by operation and plan; see the current API reference)

Use structured calculations and conversational readings through the same authenticated API.

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
  apiKey: process.env.VEDIKA_API_KEY
});

const birthDetails = {
  datetime: '1990-06-15T14:30:00+05:30',
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: '+05:30'
};

// Ask a conversational astrology question
const response = await client.askQuestion({
  question: 'What are my career prospects for this year?',
  birthDetails,
  language: 'en',  // See the language codes and route-specific coverage below
  speed: 'standard'  // 'fast', 'standard' (default), 'eco' or 'pro-ultra'; availability varies by route and plan
});

console.log(response.answer);
console.log(`Conversation ID: ${response.conversationId}`);  // Use for multi-turn
console.log(response.followUpSuggestions);  // Suggested next questions
// Cost and wallet balance for this call are in the response metadata.
console.log(response.metadata?.cost, response.metadata?.wallet);

// Continue conversation. Send the same birthDetails again; the response does
// not echo them back.
const followUp = await client.askQuestion({
  question: 'Tell me about my marriage prospects',
  birthDetails,
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

### 🤖 AI Chatbot Queries

```javascript
// Conversational astrology with documented request fields
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

// V1 returns the complete wire envelope, including metadata.
console.log(chart.chartData.data.planets);
console.log(chart.chartData.data.houses);
console.log(chart.chartData.data.ascendant);
console.log(chart.metadata);
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

### 🏠 Vastu Shastra (98 operation paths)

Vastu takes a building: a plot polygon, room list, and compass zone. All 98 operation paths use `/v2/astrology/vastu/`. `vastuOperation()` and the typed named helpers return the full `{success, data, billing?, meta?}` response. Generic helpers such as `vastu()` and `vastuScore()` return the data payload.

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

Large jobs and report questions:

```typescript
// Queue 1–1,000 assessments. The key is mandatory: store it with this exact
// body and reuse it after a lost response to get the original job back
// (replayed: true) instead of paying twice. Each item is charged after it succeeds.
const submitted = await client.vastuJobSubmit(
  { operation: 'assessments', items: [{ id: 'p1', input: { inputSource: 'plan-derived', rooms } }] },
  { idempotencyKey: 'import-2026-10-01' },
);
const { jobId } = submitted.data;
console.log((await client.vastuJobStatus(jobId)).data.counts);
for await (const item of client.vastuJobResultItems(jobId)) console.log(item.id, item.status);
await client.vastuJobCancel(jobId); // stops the items that have not run

// Ask about a report PDF. The upload is paid; its key names this one file.
const upload = await client.uploadVastuReport({ data: pdfBytes, filename: 'plan.pdf' }, { idempotencyKey: 'plan-upload-001' });
const answer = await client.askVastuReport({
  question: 'What should I fix first?',
  reportRef: { type: 'upload', id: upload.uploadId },
});
```

The named helpers (`vastuListingAssessment`, `vastuScore`, `vastuAudit`, `vastuRoom`, `vastuPlacement` and the rest) take `{ idempotencyKey }` as their last argument. Pass a key you saved when a retry may come from a new call.

Each batch item uses the existing assessment price; there is no batch fee. Inspect every item status even when the batch succeeds. Scores are versioned conventions. Compare the same scoring version and equivalent room coverage. Detailed audits report missing input and do not certify physical survey completeness.

## 🌍 Multi-Language Support

Set the response language using the codes below. Availability varies by operation, delivery tier and plan; confirm your route in the [API reference](https://vedika.io/api-reference).

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

**Language codes:**
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

Choose a supported tier for your operation and plan. Response time depends on the route, request complexity, answer length and selected tier; tier names do not guarantee a fixed duration.

```javascript
// Select the fast tier when supported by your route and plan
const fastResp = await client.askQuestion({
  question: 'Quick career check?',
  birthDetails: birthInfo,
  speed: 'fast'  // Optimized for latency
});

// Standard is the default tier; language and answer controls depend on the route
const fullResp = await client.askQuestion({
  question: 'Full career analysis?',
  birthDetails: birthInfo,
  speed: 'standard'  // Comprehensive response
});
```

### Pro Ultra and answer-length controls

`speed` also accepts `'pro-ultra'`. Beside it, `askQuestion`, `askVastuReport`
and `askQuestionStream` take these optional fields, each sent only when you set it:

| Field | Value |
| --- | --- |
| `speed` | `'standard'` (default), `'fast'`, `'eco'` or `'pro-ultra'` |
| `version` | `'2.5'` (default) or `'2'` (retiring). Standard speed only: with any other speed it is a 400 `VALIDATION_ERROR`. |
| `detail` | `'brief'`, `'standard'` or `'detailed'`. `'standard'` is the same as leaving it out. On Pro Ultra it also sets how much reasoning the model applies before it writes: `'brief'` the least, `'standard'` or omitted a balanced amount, `'detailed'` the most. |
| `maxTokens` | Integer output-token limit, 1 to 4000 (1 to 8192 on `eco`). Default 2500 (2000 on `fast`, 8192 on `eco`) when you set neither `maxTokens` nor `detail`. A whole number outside the range is clamped to it. |
| `stop` | One string, or 1 to 4 strings of 1 to 64 characters. Refused with an explicit `version: '2.5'`. |
| `seed` | Integer sampling hint. Best effort; not a guarantee of identical output. Refused on `pro-ultra` and with an explicit `version: '2.5'`. |

```javascript
const brief = await client.askQuestion({
  question: 'What are my career prospects this year?',
  birthDetails,
  speed: 'pro-ultra',
  detail: 'brief',    // a complete, shorter answer
  maxTokens: 600,     // output-token limit for this answer
  stop: ['END']       // one string, or up to 4
});

// Standard speed pinned to the retiring engine version
const legacy = await client.askQuestion({
  question: 'Full career analysis?',
  birthDetails,
  speed: 'standard',
  version: '2',
  seed: 42
});
```

The API checks each control against the tier before anything is billed. A
control the tier does not support (for example `seed` on Pro Ultra) is refused
with a 400 and the code `CONTROL_UNSUPPORTED_FOR_TIER`, so you are never charged
for it. On standard speed with no `version`, a request that carries `stop` or
`seed` is served on version `'2'` instead of being refused. The SDK passes your
values through and leaves those rules to the API.

| Refusal | Code | Charged |
| --- | --- | --- |
| A control the tier does not support (`seed` on Pro Ultra, `stop` or `seed` with an explicit `version: '2.5'`) | 400 `CONTROL_UNSUPPORTED_FOR_TIER` | No |
| `detail` is not `brief`, `standard` or `detailed` | 400 `INVALID_DETAIL` | No |
| `stop` is not 1 to 4 strings of 1 to 64 characters | 400 `INVALID_STOP` | No |
| A `stop` sequence matched before any answer text was written | 400 `STOP_MATCHED_BEFORE_ANSWER` (on a stream, an `error` event). Change or remove `stop`. | No |
| `detail: 'detailed'` with a `maxTokens` below 384 (not on `eco`) | 400 `DETAIL_BUDGET_CONFLICT` | No |
| `version` with a speed other than standard, or a value other than `'2'` or `'2.5'` | 400 `VALIDATION_ERROR` | No |
| Pro Ultra cannot serve right now | 503 `PRO_ULTRA_UNAVAILABLE`, raised as `ProUltraUnavailableError` | No |
| Pro Ultra used its whole output budget before writing any text, and the request had no birth chart | 400 `OUTPUT_BUDGET_EXHAUSTED`, raised as `OutputBudgetExhaustedError` | No |

`QuestionErrorCode` holds the control and tier code strings above (and
`ECO_UNAVAILABLE` and `VERSION_UNAVAILABLE`), so you can compare `error.code`
without typing them out. `VALIDATION_ERROR` is a general code and is not in it.

```javascript
const { ProUltraUnavailableError, OutputBudgetExhaustedError, QuestionErrorCode, VedikaAPIError } = require('@vedika-io/sdk');

try {
  const answer = await client.askQuestion({ question, birthDetails, speed: 'pro-ultra', maxTokens: 600 });
  console.log(answer.answer);
} catch (error) {
  if (error instanceof ProUltraUnavailableError) {
    // 503, not charged, and no other tier answered in its place.
    console.error(`Pro Ultra is unavailable; try again in ${error.retryAfter ?? 5}s`);
  } else if (error instanceof OutputBudgetExhaustedError) {
    // 400, not charged. Retry with a higher maxTokens, or detail: 'brief'.
    console.error(error.message);
  } else if (error instanceof VedikaAPIError && error.code === QuestionErrorCode.CONTROL_UNSUPPORTED_FOR_TIER) {
    console.error('Drop the control the tier does not support:', error.message);
  } else {
    throw error;
  }
}
```

**A cut-off answer is a normal response.** When an answer reaches its output
limit, the response comes back with `metadata.finishReason` set to `'length'`
(or `'budgetExceeded'` when it was found to end mid-sentence),
`metadata.truncated: true`, `metadata.degraded: true` and
`metadata.degradedReason: 'budget_truncated'`. It is not charged. The text may
stop mid-sentence, so check `truncated` before showing it as final, then ask
again with a higher `maxTokens` or `detail: 'brief'`. Every answer, cut off
or not, carries `finishReason` and `truncated`, whatever you sent: a finished
answer reads `'complete'` and `truncated: false`. On Vedika Pro Ultra a `stop`
match reads `'stopSequence'`; on the other speeds it reads `'complete'`.

A stream reports a cut-off the same way, on the `metadata` of its `completed`
frame: `finishReason`, `truncated`, `degraded: true` and
`degradedReason: 'budget_truncated'`. A cut-off stream is not charged either; the
text it already delivered stays with you.

```javascript
const answer = await client.askQuestion({ question, birthDetails, speed: 'pro-ultra', maxTokens: 300 });
if (answer.metadata?.truncated) {
  console.warn(`Cut off (${answer.metadata.finishReason}); not charged. Retry with a higher maxTokens.`);
}
```

On Pro Ultra, `maxTokens` is the answer budget and the service adds room for
reasoning on top of it. Reasoning is billed as output only when it is used, so
one request can bill up to `maxTokens` plus 8,192 output tokens;
`metadata.usage` and `metadata.cost` report what was actually used. A question
that uses even that room before any text is written is never charged: with a
birth chart you get the response above (`budget_truncated`, with a chart-only
answer), without one the 400 `OUTPUT_BUDGET_EXHAUSTED`.

### Streaming Responses (Real-Time)

```javascript
// Stream responses for better UX
for await (const chunk of client.askQuestionStream({
  question: 'What are my career prospects?',
  birthDetails: birthInfo,
  speed: 'standard'  // 'fast', 'eco' and 'pro-ultra' work on streaming too
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
    // 402: wallet.required / available / deficit are USD amounts from the API.
    console.error(`Short by $${error.deficit}. Top up at ${error.purchaseUrl}`);
  } else if (error.name === 'DailyLimitExceededError') {
    console.error(`Daily limit reached. Upgrade at ${error.upgradeUrl}`);
  } else if (error.name === 'RateLimitError') {
    console.error(`Rate limited, retry in ${error.retryAfter}s`);
  } else {
    console.error('API error:', error.code, error.message);
  }
}
```

Every `VedikaAPIError` carries `statusCode`, the API's machine-readable `code` (for example `INSUFFICIENT_BALANCE`) and the parsed error `body`.

### Retries and idempotency

The client retries only when a repeat cannot charge you twice, and it reads the API's JSON error `code`, never the rate-limit headers.

| Failure | Behaviour |
|---------|-----------|
| 402 `INSUFFICIENT_BALANCE` | Never retried. `InsufficientCreditsError` with `required`, `available`, `deficit`, `purchaseUrl`. |
| 401 | Never retried. `AuthenticationError`. |
| 429 `RATE_LIMIT_EXCEEDED` | Waits the body `retryAfter` (up to 30 s), then retries. A longer wait is raised as `RateLimitError` with `retryAfter`. |
| 429 `DAILY_LIMIT_EXCEEDED` | Never retried. `DailyLimitExceededError`: the allowance is gone until tomorrow. |
| 429 `MONTHLY_SPEND_LIMIT_REACHED` | Never retried. `RateLimitError` with `code` `MONTHLY_SPEND_LIMIT_REACHED`: the account's monthly spend limit is reached and clears only in the new month, or when the owner raises or removes it under Billing. |
| 400 (any code, including `CONTROL_UNSUPPORTED_FOR_TIER`, `DETAIL_BUDGET_CONFLICT`, `STOP_MATCHED_BEFORE_ANSWER` and `OUTPUT_BUDGET_EXHAUSTED`) | Never retried, and the SDK never changes your settings to make a retry fit. The request was refused before billing; change it and send it again. |
| 502 / 503 / 504 or a dropped connection | Retried for GETs and for requests that carry an idempotency key. A billed POST without a key is not retried. |
| 503 `PRO_ULTRA_UNAVAILABLE` | Retried like any 503: `askQuestion` and `askVastuReport` carry a key, so they are sent again, always on Pro Ultra. After the last retry it is raised as `ProUltraUnavailableError` with `retryAfter`. `askQuestionStream` is never retried. |
| 422 `IDEMPOTENCY_NOT_SUPPORTED` | The endpoint takes no key. The request is resent once without it (no charge was attempted) and that route is not keyed again. |

The API accepts an idempotency key only on certified operations (their OpenAPI entry lists `Idempotency-Key` or `X-Idempotency-Key`) and on the Vastu family. The client attaches a key by itself only there. Elsewhere it sends none: a key, or a custom `X-Request-Id`, on a calculator route is answered 422. To protect a call you retry yourself, pass your own key to a certified operation: `client.post('/v2/reports/prebuilt/generate', body, { idempotencyKey: 'order-123' })`.

### Any other endpoint

`client.request(method, path, { body, query, idempotencyKey })` (and the `get` / `post` shortcuts) calls any operation in the [OpenAPI document](https://api.vedika.io/openapi.json) with this client's key, retry and error rules. The path must start with a single `/`; a full URL is refused, so the key cannot be sent to another host.

```javascript
const kundli = await client.request('POST', '/v2/astrology/kundli', {
  body: { datetime: '1990-06-15T14:30:00+05:30', latitude: 28.6139, longitude: 77.2090 },
});
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
# .env file (read it yourself and pass it as apiKey; the SDK does not read the environment)
VEDIKA_API_KEY=vk_live_...
```

### Client Options

```javascript
const client = new VedikaClient({
  apiKey: 'vk_live_...',
  baseUrl: 'https://api.vedika.io',  // Optional -- only this origin or loopback (see below)
  timeout: 60000,  // Request timeout in milliseconds
  maxRetries: 3,  // Safe retries only (see Retries and idempotency)
  cacheEnabled: true,  // Enable prompt caching for cost savings
  language: 'en',  // Default language for responses
  allowInsecureHttp: false  // Legacy option; cannot enable custom origins or remote HTTP
});
```

`baseUrl` accepts `https://api.vedika.io` or loopback (`localhost`, `127.0.0.1`,
`::1`) for local development, with no path. Anything else throws immediately, because the client would otherwise send your
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
- `room-scan.js` - Upload a finished room scan and show the floor merge rule (a dry run unless you pass `--live`)

## 🐛 Troubleshooting

### "Invalid API Key"

Make sure you're using a valid API key from https://vedika.io/dashboard.html

Keys start with:
- `vk_live_` for production
- `vk_ent_` for enterprise accounts
- `vk_sandbox_` for sandbox keys

The API rejects any other prefix, including `vk_test_`, with a 401. To test without a key, use the free sandbox at `https://api.vedika.io/sandbox/...`.

### "Insufficient Credits"

Add credits to your account: https://vedika.io/dashboard.html. `error.required`, `error.available` and `error.deficit` give the USD amounts.

### "Request Timeout"

For complex queries, increase timeout:

```javascript
const client = new VedikaClient({
  apiKey: '...',
  timeout: 120000  // 2 minutes
});
```

### "Rate Limit Exceeded"

`RateLimitError` means too many requests in a minute: wait `error.retryAfter` seconds. `DailyLimitExceededError` means the plan's daily allowance is used up: upgrade or wait until tomorrow.

## 📊 Performance

Response time depends on the operation, request complexity, answer length and selected tier. Measure representative requests for your application and configure an appropriate timeout.
Availability commitments follow your [published plan and signed agreement](https://vedika.io/sla).

## 🔒 Security

- ✅ API keys encrypted in transit (HTTPS)
- ✅ **Credential-routing policy:** credentials may use only `https://api.vedika.io` on its default HTTPS port, or literal loopback HTTP (`localhost`, `127.x.x.x`, `::1`) for local development. Custom HTTPS origins and remote HTTP are rejected, even with the legacy insecure-HTTP flag. Redirects are never followed (a 3xx raises an error and no second request is sent), so keys and request bodies stay on the approved origin. Browser applications must keep the real key on their server and use their own app-session transport.

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

## Choosing an integration

Use the SDK when your application needs structured chart data, conversational readings, or both. Available operations, response languages and usage limits depend on your plan and the selected route.

- Start with the [API reference](https://vedika.io/api-reference) for request and response contracts.
- Use the [keyless sandbox](https://vedika.io/sandbox) for fixed mock examples.
- Review [pricing](https://vedika.io/pricing) before sending authenticated production requests.

---

**Built with ❤️ by Vedika Intelligence**

**Astrology APIs with structured calculations and conversational readings.**

Get started: https://vedika.io
