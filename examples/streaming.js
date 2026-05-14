#!/usr/bin/env node
/**
 * Streaming Response Example
 *
 * This example demonstrates how to stream AI responses in real-time
 * for better user experience.
 */

const { VedikaClient } = require('vedika-sdk');

// Initialize client
const apiKey = process.env.VEDIKA_API_KEY;
if (!apiKey) {
  console.log('❌ Please set VEDIKA_API_KEY environment variable');
  process.exit(1);
}

const client = new VedikaClient({ apiKey });

// Birth details
const birthDetails = {
  datetime: '1990-06-15T14:30:00+05:30',
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 'Asia/Kolkata'
};

// Question
const question = 'What are my career prospects and what career path would be most suitable for me?';

async function main() {
  console.log('🌊 Streaming Response Example');
  console.log('='.repeat(60));
  console.log(`\n❓ Question: ${question}`);
  console.log('\n⏳ Streaming response (this may take 20-40 seconds)...');
  console.log('\n' + '-'.repeat(60));
  console.log();

  try {
    // Stream the response
    for await (const chunk of client.askQuestionStream({
      question,
      birthDetails,
      language: 'en'
    })) {
      // Print each chunk as it arrives
      process.stdout.write(chunk);
    }

    console.log('\n' + '-'.repeat(60));
    console.log('\n✅ Response complete!');

  } catch (error) {
    console.error(`\n\n❌ Error: ${error.message}`);
  }
}

main();
