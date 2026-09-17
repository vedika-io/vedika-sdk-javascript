#!/usr/bin/env node
/**
 * Vastu Analysis Example
 *
 * Vastu takes a BUILDING (plot polygon, rooms, compass zone) — never a birth
 * chart. This example demonstrates the 9-zone mandala projection, a single
 * room placement check, an overall compliance score, and the generic
 * `vastu()` escape hatch that reaches all 92 operation paths.
 */

const { VedikaClient } = require('@vedika-io/sdk');

// Initialize client
const apiKey = process.env.VEDIKA_API_KEY;
if (!apiKey) {
  console.log('❌ Please set VEDIKA_API_KEY environment variable');
  process.exit(1);
}

const client = new VedikaClient({ apiKey, baseUrl: process.env.VEDIKA_BASE_URL || 'https://api.vedika.io' });

// A simple rectangular plot, north-facing, in local Cartesian coordinates.
// Coordinates use [x, y] pairs here. The API also accepts {x, y} points.
const plotPolygon = [
  [0, 0],
  [40, 0],
  [40, 60],
  [0, 60],
];

async function main() {
  try {
    console.log('🧭 Projecting 9-zone mandala onto the plot...');
    const mandala = await client.vastuMandalaProject('9-zone', {
      plotPolygon,
      bearingDeg: 0,
    });
    console.log('   Cells:', mandala.cells.length);

    console.log('\n🍳 Checking kitchen placement in the southeast...');
    const kitchen = await client.vastuRoom('kitchen', { zone: 'southeast' });
    console.log('   Verdict:', kitchen.verdict);

    console.log('\n📊 Getting overall Vastu compliance score...');
    const score = await client.vastuScore('overall', {
      rooms: [{ roomType: 'kitchen', zone: 'southeast' }],
      plotPolygon,
    });
    console.log('   Score:', score.score);

    console.log('\n🛰️  Fetching the 9-zone reference table...');
    const reference = await client.vastuReference('reference/mandala/9-zone');
    console.log('   Reference keys:', Object.keys(reference).join(', '));

    console.log('\n🔧 Generic escape hatch — same score call via vastu()...');
    const generic = await client.vastu('score/overall', {
      rooms: [{ roomType: 'kitchen', zone: 'southeast' }],
      plotPolygon,
    });
    console.log('   Score (via vastu()):', generic.score);

    console.log('\n✅ Vastu analysis complete!');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
