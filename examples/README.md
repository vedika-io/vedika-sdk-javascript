# Vedika JavaScript SDK Examples

This directory contains example scripts demonstrating how to use the Vedika JavaScript/Node.js SDK.

## Setup

1. Install the SDK:
```bash
npm install @vedika-io/sdk
# or
yarn add @vedika-io/sdk
```

2. Set your API key:
```bash
export VEDIKA_API_KEY="vk_live_..."
```

Or create a `.env` file:
```
VEDIKA_API_KEY=vk_live_...
```

## Examples

### Basic Examples

- **`basic-chatbot.js`** - Simple AI astrology chatbot
  - Ask conversational astrology questions
  - Get AI-powered insights
  - Best for: Getting started

- **`birth-chart.js`** - Complete birth chart generation
  - Generate full Kundali/Horoscope
  - Get planetary positions
  - Best for: Traditional astrology calculations

### Advanced Examples

- **`streaming.js`** - Real-time streaming responses
  - Stream AI responses as they're generated
  - Better user experience
  - Best for: Interactive applications

- **`vastu.js`** - Vastu Shastra building analysis (93 operations)
  - 9-zone mandala projection, room placement, compliance scoring
  - Takes a plot/building, not a birth chart
  - Best for: Architecture and interior-placement analysis

## Running Examples

```bash
# Basic chatbot
node examples/basic-chatbot.js

# Birth chart analysis
node examples/birth-chart.js

# Streaming responses
node examples/streaming.js

# Vastu building analysis
node examples/vastu.js
```

## Get Your API Key

Create an account at https://vedika.io/dashboard.html to get your API key.

## Need Help?

- Documentation: https://vedika.io/docs.html
- Support: support@vedika.io
- GitHub Issues: https://github.com/vedika-io/vedika-sdk-javascript/issues
