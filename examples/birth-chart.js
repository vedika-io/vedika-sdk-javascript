#!/usr/bin/env node
/**
 * Birth Chart Analysis Example
 *
 * This example demonstrates how to generate a complete birth chart (Kundali)
 * with planetary positions, houses, and ascendant.
 */

const { VedikaClient } = require('vedika-sdk');

// Initialize client
const apiKey = process.env.VEDIKA_API_KEY;
if (!apiKey) {
  console.log('❌ Please set VEDIKA_API_KEY environment variable');
  process.exit(1);
}

const client = new VedikaClient({ apiKey });

function printPlanet(planet) {
  const retrograde = planet.retrograde ? ' (R)' : '';
  console.log(
    `  ${planet.name.padEnd(12)} → ${planet.sign.padEnd(12)} ` +
    `| House ${planet.house} | ${planet.nakshatra}${retrograde}`
  );
}

function printHouse(house) {
  console.log(
    `  House ${String(house.number).padStart(2)} → ${house.sign.padEnd(12)} ` +
    `| ${house.degree.toFixed(2)}° | Lord: ${house.lord}`
  );
}

async function main() {
  console.log('📅 Birth Details:');
  console.log('  Date/Time: June 15, 1990 at 2:30 PM');
  console.log('  Location: Delhi, India');
  console.log();

  try {
    // Generate birth chart
    console.log('🔮 Generating birth chart...');
    const chart = await client.getBirthChart({
      datetime: '1990-06-15T14:30:00+05:30',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 'Asia/Kolkata',
      ayanamsa: 'lahiri'  // Try: lahiri, raman, krishnamurti
    });

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('✨ BIRTH CHART (KUNDALI)');
    console.log('='.repeat(60));

    // Ascendant
    console.log(`\n🌅 Ascendant (Lagna): ${chart.ascendant}`);
    console.log(`   Ayanamsa: ${chart.ayanamsa.charAt(0).toUpperCase() + chart.ayanamsa.slice(1)}`);

    // Planets
    console.log('\n🪐 Planetary Positions:');
    console.log('  ' + '-'.repeat(56));
    console.log(`  ${'Planet'.padEnd(12)}   ${'Sign'.padEnd(12)}   House   Nakshatra`);
    console.log('  ' + '-'.repeat(56));
    chart.planets.forEach(printPlanet);

    // Houses
    console.log('\n🏠 House Cusps:');
    console.log('  ' + '-'.repeat(56));
    chart.houses.forEach(printHouse);

    console.log('\n' + '='.repeat(60));

    // Additional analysis
    console.log('\n💡 Quick Analysis:');

    // Count retrograde planets
    const retrogradePlanets = chart.planets.filter(p => p.retrograde);
    if (retrogradePlanets.length > 0) {
      console.log(`  • Retrograde planets: ${retrogradePlanets.map(p => p.name).join(', ')}`);
    } else {
      console.log('  • No retrograde planets');
    }

    // Find planets in own sign
    const ownSignPlanets = chart.planets.filter(p =>
      p.name.toLowerCase().includes(p.sign.toLowerCase().substring(0, 3))
    );
    if (ownSignPlanets.length > 0) {
      console.log(`  • Planets in own sign: ${ownSignPlanets.map(p => p.name).join(', ')}`);
    }

    console.log('\n✅ Birth chart generated successfully!');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

main();
