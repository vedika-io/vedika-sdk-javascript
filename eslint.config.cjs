const parser = require('@typescript-eslint/parser');

module.exports = [{
  files: ['src/**/*.ts'],
  languageOptions: { parser, ecmaVersion: 2020, sourceType: 'module' },
  // TypeScript's strict build owns type, name, and unused-symbol checks.
  rules: {
    'constructor-super': 'error',
    'for-direction': 'error',
    'no-async-promise-executor': 'error',
    'no-constant-condition': 'error',
    'no-debugger': 'error',
    'no-dupe-args': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    'no-ex-assign': 'error',
    'no-self-assign': 'error',
    'no-unreachable': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
  },
}];
