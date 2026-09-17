const packageJson = require('../package.json');
const packageLock = require('../package-lock.json');
const axiosPackage = require('axios/package.json');
const sdk = require('../dist');

describe('published package', () => {
  test('keeps manifest, lockfile, and runtime metadata aligned', () => {
    expect(packageLock.version).toBe(packageJson.version);
    expect(packageLock.packages[''].version).toBe(packageJson.version);
    expect(packageLock.packages[''].dependencies).toEqual(packageJson.dependencies);
    expect(sdk.VERSION).toBe(packageJson.version);
  });

  test('loads with a patched Axios 1.x release', () => {
    const [major, minor] = axiosPackage.version.split('.').map(Number);

    expect(packageJson.dependencies.axios).toBe('^1.16.0');
    expect(major).toBe(1);
    expect(minor).toBeGreaterThanOrEqual(16);
    expect(typeof sdk.VedikaClient).toBe('function');
  });
});
