# Security Policy

## Supported Versions

We release security updates for the following versions of the Vedika JavaScript SDK:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of the Vedika JavaScript SDK seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not:

- Open a public GitHub issue for security vulnerabilities
- Post about the vulnerability in public forums or social media
- Attempt to exploit the vulnerability beyond verifying its existence

### Please Do:

**Report security vulnerabilities to: security@vedika.io**

Include the following information:

1. **Type of vulnerability** (e.g., authentication bypass, API key exposure, injection attack)
2. **Full description** of the vulnerability
3. **Steps to reproduce** the issue
4. **Potential impact** of the vulnerability
5. **Suggested fix** (if you have one)
6. **Your contact information** for follow-up

### What to Expect:

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Updates**: We will send you regular updates about our progress
- **Timeline**: We aim to release a fix within 7-14 days for critical vulnerabilities
- **Credit**: We will credit you in our security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### API Key Management

**Never expose your API keys:**

```typescript
// ❌ DON'T: Hardcode API keys
const client = new VedikaClient({ apiKey: 'vk_live_your_actual_key' });

// ✅ DO: Use environment variables
const client = new VedikaClient({ apiKey: process.env.VEDIKA_API_KEY });
```

**Use .gitignore:**

```bash
# Add to .gitignore
.env
.env.local
*.key
credentials.json
```

**Rotate compromised keys immediately:**

If you accidentally expose your API key:
1. Immediately revoke it at https://vedika.io/dashboard.html
2. Generate a new key
3. Update your application with the new key
4. Review API logs for unauthorized usage

### Environment Variables

**Node.js:**

```bash
# .env file
VEDIKA_API_KEY=vk_test_your_api_key_here
```

```typescript
import dotenv from 'dotenv';
dotenv.config();

const client = new VedikaClient({
  apiKey: process.env.VEDIKA_API_KEY
});
```

**React:**

```bash
# .env.local
REACT_APP_VEDIKA_API_KEY=vk_test_your_api_key_here
```

```typescript
const client = new VedikaClient({
  apiKey: process.env.REACT_APP_VEDIKA_API_KEY
});
```

**WARNING**: Never expose API keys in client-side code in production. Use a backend proxy instead.

### Client-Side vs Server-Side

**Server-side (Node.js) - RECOMMENDED:**

```typescript
// ✅ Safe: API key stays on server
import { VedikaClient } from 'vedika-sdk';

const client = new VedikaClient({
  apiKey: process.env.VEDIKA_API_KEY
});

app.post('/api/astrology', async (req, res) => {
  const response = await client.askQuestion(req.body);
  res.json(response);
});
```

**Client-side (Browser) - USE PROXY:**

```typescript
// ❌ UNSAFE: API key exposed in browser
// DON'T do this in production!

// ✅ Safe: Use your own backend as proxy
async function askQuestion(question: string, birthDetails: any) {
  const response = await fetch('/api/astrology', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, birthDetails })
  });
  return response.json();
}
```

### Input Validation

**Always validate user input:**

```typescript
interface BirthDetails {
  datetime: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

function validateBirthDetails(details: BirthDetails): boolean {
  // Check required fields
  if (!details.datetime || !details.latitude || !details.longitude) {
    return false;
  }

  // Validate latitude (-90 to 90)
  if (details.latitude < -90 || details.latitude > 90) {
    return false;
  }

  // Validate longitude (-180 to 180)
  if (details.longitude < -180 || details.longitude > 180) {
    return false;
  }

  // Validate datetime format (ISO 8601)
  try {
    new Date(details.datetime);
  } catch {
    return false;
  }

  return true;
}
```

### HTTPS Only

The SDK enforces HTTPS for all API requests. Never modify the base URL to use HTTP:

```typescript
// ✅ HTTPS (default and required)
const client = new VedikaClient({
  apiKey: process.env.VEDIKA_API_KEY,
  baseUrl: 'https://vedika-api-854222120654.us-central1.run.app'
});

// ❌ HTTP (will fail)
// DO NOT attempt to use HTTP
```

### Rate Limiting

Respect rate limits to prevent account suspension:

```typescript
import { RateLimitError } from 'vedika-sdk';

async function safeApiCall(
  client: VedikaClient,
  query: any
): Promise<any> {
  const maxRetries = 3;
  let retryDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.askQuestion(query);
    } catch (error) {
      if (error instanceof RateLimitError) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
}
```

### Error Handling

Never expose sensitive information in error messages:

```typescript
try {
  const response = await client.askQuestion({
    question,
    birthDetails
  });
} catch (error) {
  // ❌ DON'T: Log full error with potentially sensitive data
  // console.error('API call failed:', error, 'with data:', birthDetails);

  // ✅ DO: Log sanitized error message
  console.error('API call failed. Check secure logs for details.');
  // Store detailed error in secure logs only
}
```

### Dependency Security

Keep dependencies up to date:

```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update vedika-sdk axios
```

## Known Security Considerations

### Data Privacy

- **Birth details are sensitive**: Treat birth information (date, time, location) as PII
- **No data retention**: Vedika API does not store queries unless explicitly enabled
- **GDPR compliant**: The API is GDPR compliant for EU users

### API Key Scopes

- **Test keys** (`vk_test_`): Limited functionality, safe for development
- **Live keys** (`vk_live_`): Full access, use only in production
- **Never commit keys**: Use environment variables or secret managers

### Network Security

- **TLS 1.2+**: All API requests use TLS 1.2 or higher
- **Certificate validation**: The SDK validates SSL certificates
- **No proxy support**: Direct connections only for security

## Security Audit History

| Date       | Type          | Findings | Status   |
|------------|---------------|----------|----------|
| 2025-10-15 | Code Review   | None     | Passed   |
| 2025-10-01 | Dependency    | None     | Passed   |

## Contact

For security concerns or questions:

- **Email**: security@vedika.io
- **Response time**: Within 48 hours
- **PGP Key**: Available on request

---

**Last updated**: November 2025
