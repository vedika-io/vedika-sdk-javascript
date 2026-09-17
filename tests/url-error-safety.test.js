const { VedikaClient } = require('../dist');
describe('base URL error privacy', () => {
  test.each(['not-a-url-SECRET_SENTINEL', 'https://user:SECRET_SENTINEL@api.example.com', 'https://api.example.com/?key=SECRET_SENTINEL', 'ftp://SECRET_SENTINEL.invalid'])('does not echo %s', baseUrl => {
    let error;
    try { new VedikaClient({apiKey: 'vk_test', baseUrl}); } catch (caught) { error = caught; }
    expect(error).toBeDefined();
    expect(error.message).not.toContain('SECRET_SENTINEL');
  });
  test('rejects a custom HTTPS first hop', () => {
    expect(() => new VedikaClient({apiKey: 'vk_test', baseUrl: 'https://customer-api.example.com'})).toThrow();
  });
});

const deniedOrigins = [
  'https://attacker.invalid', 'https://api.vedika.io.attacker.invalid',
  'https://api.vedika.io:8443', 'https://127.0.0.1:443',
  'http://api.vedika.io', 'http://127.attacker.invalid',
  'https://api.vedika.io/path', 'https://api.vedika.io/?key=SECRET_SENTINEL',
  'https://user:SECRET_SENTINEL@api.vedika.io',
];
test.each(deniedOrigins)('rejects credential first hop %s even with legacy opt-in', baseUrl => {
  for (const allowInsecureHttp of [false, true]) {
    expect(() => new VedikaClient({apiKey: 'vk_test', baseUrl, allowInsecureHttp})).toThrow();
  }
});
test.each(['https://api.vedika.io', 'https://api.vedika.io:443/', 'http://127.0.0.1:8080', 'http://localhost:8080', 'http://[::1]:8080'])('accepts trusted origin %s', baseUrl => {
  expect(() => new VedikaClient({apiKey: 'vk_test', baseUrl})).not.toThrow();
});
