#!/usr/bin/env node
/**
 * Basic AI Astrology Chatbot Example
 *
 * This example demonstrates how to use Vedika's unique AI-powered chatbot
 * to ask conversational astrology questions.
 *
 * UNIQUE FEATURE: Only Vedika offers AI chatbot queries for astrology!
 */

const { VedikaClient } = require('vedika-sdk');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize client with API key from environment
const apiKey = process.env.VEDIKA_API_KEY;
if (!apiKey) {
  console.log('❌ Please set VEDIKA_API_KEY environment variable');
  console.log('   Get your key at: https://vedika.io/dashboard.html');
  process.exit(1);
}

const client = new VedikaClient({ apiKey });

// Sample birth details
const birthDetails = {
  datetime: '1990-06-15T14:30:00+05:30',
  latitude: 28.6139,   // Delhi
  longitude: 77.2090,
  timezone: 'Asia/Kolkata'
};

// Example questions to ask
const questions = [
  'What are my career prospects for this year?',
  'When is the best time for me to start a new business?',
  'What are the major yogas in my birth chart?',
  'Do I have Kaal Sarp Dosha?',
  'What is my current Mahadasha period?'
];

function showMenu() {
  console.log('\n🌟 Vedika AI Astrology Chatbot');
  console.log('='.repeat(50));
  console.log('\nExample questions:');
  questions.forEach((q, i) => console.log(`${i + 1}. ${q}`));
  console.log('0. Enter custom question');
  console.log('q. Quit');
  console.log();
}

async function askQuestion(question) {
  try {
    console.log(`\n🤔 Asking: ${question}`);
    console.log('⏳ Processing (this may take 20-40 seconds)...\n');

    // Ask the question
    const response = await client.askQuestion({
      question,
      birthDetails,
      language: 'en'  // Try 'hi' for Hindi!
    });

    // Display results
    console.log('='.repeat(50));
    console.log('✨ ANSWER:');
    console.log('='.repeat(50));
    console.log(response.answer);
    console.log();
    console.log(`📊 Confidence: ${(response.confidence * 100).toFixed(1)}%`);
    console.log(`💰 Credits used: ${response.creditsUsed}`);
    console.log(`⏱️  Processing time: ${response.processingTime.toFixed(2)}s`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  showMenu();

  while (true) {
    const choice = await prompt('Select a question (1-5, 0, q): ');

    if (choice.toLowerCase() === 'q') {
      console.log('\n👋 Goodbye!');
      rl.close();
      break;
    }

    if (choice === '0') {
      const customQuestion = await prompt('Enter your question: ');
      if (customQuestion.trim()) {
        await askQuestion(customQuestion.trim());
      }
    } else {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < questions.length) {
        await askQuestion(questions[index]);
      } else {
        console.log('❌ Invalid choice');
      }
    }
  }
}

main();
