const fs = require('node:fs');
const path = require('node:path');

function referencePath(sourceRelative, fixtureRelative) {
  const source = path.resolve(__dirname, '../../..', sourceRelative);
  if (fs.existsSync(source)) return source;
  const fixture = path.join(__dirname, 'fixtures', 'reference', fixtureRelative);
  if (!fs.existsSync(fixture)) throw new Error(`Required reference fixture is missing: ${fixtureRelative}`);
  return fixture;
}

module.exports = { referencePath };
