# Vedika JavaScript SDK Examples

This directory contains example scripts demonstrating how to use the Vedika JavaScript/Node.js SDK.

## Setup

1. Install the SDK:
```bash
npm install vedika-sdk
# or
yarn add vedika-sdk
```

2. Set your API key:
```bash
export VEDIKA_API_KEY="vk_test_your_api_key_here"
```

Or create a `.env` file:
```
VEDIKA_API_KEY=vk_test_your_api_key_here
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

- **`compatibility.js`** - Marriage compatibility analysis
  - Ashtakoota matching
  - 36-point compatibility scoring
  - Best for: Relationship analysis

### Advanced Examples

- **`dosha-detector.js`** - Comprehensive dosha analysis
  - Kaal Sarp Dosha
  - Mangal Dosha
  - Sade Sati
  - Best for: Identifying astrological doshas

- **`streaming.js`** - Real-time streaming responses
  - Stream AI responses as they're generated
  - Better user experience
  - Best for: Interactive applications

### Web Framework Examples

- **`express-app.js`** - Express server example
  - Complete REST API server
  - Production-ready example
  - Best for: Backend applications

- **`react-app.jsx`** - React component example
  - React component with hooks
  - State management
  - Best for: React applications

## Running Examples

```bash
# Basic chatbot
node examples/basic-chatbot.js

# Birth chart analysis
node examples/birth-chart.js

# Express server
node examples/express-app.js
```

## Get Your API Key

Sign up for free at https://vedika.io/dashboard.html to get your API key.

## Need Help?

- Documentation: https://vedika.io/docs.html
- Support: support@vedika.io
- GitHub Issues: https://github.com/vedika-intelligence/vedika-sdk-javascript/issues
