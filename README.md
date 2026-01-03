# @vedika-io/sdk

[![npm version](https://img.shields.io/npm/v/@vedika-io/sdk.svg)](https://www.npmjs.com/package/@vedika-io/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@vedika-io/sdk.svg)](https://www.npmjs.com/package/@vedika-io/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The only B2B astrology API with AI-powered chatbot queries** - Official JavaScript/TypeScript SDK

## Installation

```bash
npm install @vedika-io/sdk
# or
yarn add @vedika-io/sdk
```

## Quick Start

```typescript
import { VedikaClient } from '@vedika-io/sdk';

const client = new VedikaClient({
  apiKey: 'vk_live_your_api_key'
});

// Ask an astrology question (AI-powered)
const response = await client.askQuestion({
  question: 'What are my career prospects this year?',
  birthDetails: {
    datetime: '1990-06-15T14:30:00+05:30',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata'
  }
});

console.log(response.answer);
```

## Features

- **AI Chat** - Natural language astrology queries (unique to Vedika!)
- **Birth Charts** - Complete Kundali generation
- **Compatibility** - 36 Guna (Ashtakoota) matching
- **Dasha Periods** - Vimshottari Dasha calculations
- **Doshas** - Mangal, Kaal Sarp, Sade Sati analysis
- **Muhurtha** - Auspicious timing finder
- **Numerology** - 37+ calculations
- **22 Languages** - Multilingual responses

## CLI Tool

```bash
# Initialize a new project
npx @vedika-io/cli init

# Test your API connection
npx @vedika-io/cli test --key YOUR_API_KEY

# Generate a birth chart
npx @vedika-io/cli generate chart
```

## API Methods

| Method | Description |
|--------|-------------|
| `askQuestion()` | AI-powered astrology chat |
| `askQuestionStream()` | Streaming responses |
| `getBirthChart()` | Generate birth chart |
| `getDashas()` | Vimshottari Dasha periods |
| `checkCompatibility()` | Marriage compatibility |
| `detectYogas()` | 300+ yoga detection |
| `analyzeDoshas()` | Dosha analysis |
| `getMuhurtha()` | Auspicious timing |
| `getNumerology()` | Numerology analysis |

## Documentation

- **API Docs**: https://vedika.io/docs.html
- **Quickstart**: https://vedika.io/quickstart.html
- **API Explorer**: https://vedika.io/api-explorer.html

## Get API Key

1. Sign up at https://vedika.io
2. Go to Dashboard
3. Create API key

**Free Sandbox** available for testing: `https://api.vedika.io/sandbox/*`

## Support

- Email: support@vedika.io
- Docs: https://vedika.io/docs.html

## License

MIT
