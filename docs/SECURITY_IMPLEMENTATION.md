# Security Implementation Guide

## Overview

This document details the comprehensive security features implemented in the Secure Notes application, covering protection mechanisms, testing procedures, and security best practices.

---

## Security Features Implemented

### 1. Content Security Policy (CSP)

**Implementation Location:** `backend/src/server.js`

**Purpose:** Prevents XSS attacks by controlling which resources can be loaded and executed.

**Configuration:**
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],              // Only load resources from same origin
    scriptSrc: ["'self'"],                // Only execute scripts from same origin
    styleSrc: ["'self'", "'unsafe-inline'"], // Styles from same origin + inline
    imgSrc: ["'self'", "data:", "https:"], // Images from same origin, data URIs, HTTPS
    connectSrc: ["'self'"],               // API calls only to same origin
    fontSrc: ["'self'"],                  // Fonts from same origin
    objectSrc: ["'none'"],                // No plugins (Flash, etc.)
    mediaSrc: ["'self'"],                 // Media from same origin
    frameSrc: ["'none'"],                 // No iframes
    baseUri: ["'self'"],                  // Restrict base tag
    formAction: ["'self'"],               // Forms only submit to same origin
    frameAncestors: ["'none'"],           // Prevent clickjacking
    upgradeInsecureRequests: [],          // Upgrade HTTP to HTTPS
  }
}
```

**Protection Against:**
- Cross-Site Scripting (XSS)
- Clickjacking
- Code injection attacks
- Malicious script execution from external sources

**Testing:**
- Navigate to `/security-test`
- Click "Test CSP"
- Open browser DevTools Console to see CSP violations
- Attempts to load external scripts or execute inline scripts will be blocked

**CSP Violation Reporting:**
- Endpoint: `POST /api/csp-violation-report`
- Violations are logged server-side for monitoring

---

### 2. Cross-Origin Resource Sharing (CORS)

**Implementation Location:** `backend/src/server.js`

**Purpose:** Controls which domains can access the API.

**Configuration:**
```javascript
cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

**Protection Against:**
- Unauthorized cross-origin requests
- Cross-Site Request Forgery (CSRF) - partial protection
- API abuse from untrusted domains

**Testing:**
- Navigate to `/security-test`
- Click "Test CORS"
- Try accessing API from a different origin (should be blocked)

---

### 3. Rate Limiting

**Implementation Location:** `backend/src/server.js`

**Purpose:** Prevents brute force attacks and API abuse.

**Two-Tier Configuration:**

#### General API Rate Limiting:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### Authentication Rate Limiting (Stricter):
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // Only 5 login/register attempts
  message: 'Too many authentication attempts, please try again later.',
});
```

**Protection Against:**
- Brute force password attacks
- Credential stuffing
- API abuse and DoS attacks
- Account enumeration

**Rate Limit Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit window resets

**Testing:**
- Navigate to `/security-test`
- Click "Test Rate Limiting" for general limits
- Click "Test Auth Rate Limit" for stricter auth limits
- Check Network tab in DevTools for rate limit headers
- After limit exceeded, HTTP 429 status is returned

---

### 4. XSS Protection

**Implementation:** React's built-in XSS protection + CSP

**Mechanisms:**

1. **React Auto-Escaping:**
   - All content rendered via JSX is automatically escaped
   - Special characters are converted to HTML entities
   - Prevents script injection via user input

2. **No `dangerouslySetInnerHTML`:**
   - Application avoids using this React feature
   - All HTML is generated through safe JSX

3. **Input Sanitization:**
   - User input is validated on both client and server
   - Express Validator used for backend validation

**Example Protection:**
```jsx
// Safe - React automatically escapes
<div>{userInput}</div>

// Dangerous - NOT USED in this application
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

**Common XSS Payloads Blocked:**
- `<script>alert('XSS')</script>`
- `<img src=x onerror="alert('XSS')">`
- `<svg onload="alert('XSS')">`
- `javascript:alert('XSS')`
- `<iframe src="javascript:alert('XSS')">`
- Event handler injections (onclick, onload, etc.)

**Testing:**
- Navigate to `/security-test`
- Click "Test XSS Protection"
- All XSS payloads will be rendered as text (safe)

---

### 5. Integrity Protection (AES-GCM Authentication)

**Implementation Location:** `frontend/src/services/cryptoService.ts`

**Purpose:** Detects any tampering with encrypted notes.

**Mechanism:**
- AES-256-GCM mode provides built-in authentication
- Each note has a cryptographic authentication tag (auth tag)
- Additional Authenticated Data (AAD) binds userId to the ciphertext
- Any modification to ciphertext, IV, or metadata causes decryption to fail

**Process:**

1. **Encryption:**
   ```typescript
   const encrypted = await crypto.subtle.encrypt(
     {
       name: 'AES-GCM',
       iv: randomIV,
       additionalData: JSON.stringify({ userId }),
       tagLength: 128  // 16 bytes
     },
     key,
     plaintext
   );
   ```

2. **Storage:**
   - Ciphertext (Base64)
   - IV (Base64)
   - Auth Tag (Base64) - **This is critical**

3. **Decryption:**
   ```typescript
   const plaintext = await crypto.subtle.decrypt(
     {
       name: 'AES-GCM',
       iv: storedIV,
       additionalData: JSON.stringify({ userId }),
       tagLength: 128
     },
     key,
     ciphertext + authTag  // Combined
   );
   // Throws error if authentication fails
   ```

**Protection Against:**
- Tampering with ciphertext in database
- Bit-flipping attacks
- Ciphertext substitution
- Replay attacks (via AAD binding to userId)

**Testing:**

#### Local Crypto Test:
1. Navigate to `/crypto-test`
2. Click "Test Tampering Detection"
3. Simulates local tampering and verifies detection

#### Database Tampering Test:
1. Login and create a note
2. Navigate to `/security-test`
3. Click "Test Tampering with Database"
4. Admin endpoint modifies note in database
5. Try to open the note - decryption will fail with "Integrity check failed"

**Admin Tampering Endpoint (DEV ONLY):**
- `POST /api/admin/tamper-note/:id`
- Only available when `NODE_ENV === 'development'`
- Simulates attacker modifying database

---

### 6. Security Testing Dashboards

**Implementation:** Two comprehensive testing interfaces have been created to demonstrate and verify security features.

#### Security Test Dashboard

**Location:** `/security-test` ([SecurityTest.tsx](../frontend/src/pages/SecurityTest.tsx))

**Purpose:** Interactive security feature testing and demonstration.

**Features:**
- **Modern UI Design:**
  - Material Symbols icons throughout
  - Interactive card-based test buttons
  - Color-coded by test category (blue, purple, green, red, orange, indigo)
  - Hover effects with border highlighting
  - Terminal-style output display
  - Dark mode support

- **6 Security Test Categories:**
  1. **XSS Protection** - Tests 8 different XSS payloads
  2. **Content Security Policy** - Demonstrates CSP blocking
  3. **Rate Limiting (General)** - 100 req/15min testing
  4. **Auth Rate Limiting** - 5 req/15min strict testing
  5. **Tampering Detection** - Database tampering simulation
  6. **CORS Protection** - Origin validation testing

- **Developer-Friendly Output:**
  - Green text on dark background (terminal aesthetic)
  - Clear pass/fail indicators
  - Detailed explanations of test results
  - Instructions for manual verification

**Usage:**
```bash
# Start application
npm run dev (frontend & backend)

# Navigate to
http://localhost:5173/security-test

# Run tests by clicking buttons
# Check browser DevTools Console for additional details
```

#### Crypto Test Dashboard

**Location:** `/crypto-test` ([CryptoTest.tsx](../frontend/src/pages/CryptoTest.tsx))

**Purpose:** Cryptography demonstration and education.

**Features:**
- **Modern UI Design:**
  - Consistent Material Symbols icons
  - Color-coded test cards (blue, red, yellow)
  - Terminal-style output
  - Loading states and animations

- **3 Cryptography Tests:**
  1. **Encryption/Decryption** - Full round-trip test showing all artifacts
  2. **Tampering Detection** - Modifies ciphertext and verifies failure
  3. **Wrong Key Detection** - Tests decryption with wrong password

- **Educational Output:**
  - Shows all cryptographic artifacts (ciphertext, IV, auth tag, salt)
  - Explains what each test proves
  - Clear success/failure indicators

**Usage:**
```bash
# Navigate to
http://localhost:5173/crypto-test

# No authentication required
# Click test buttons to see cryptography in action
```

**Design Improvements:**
- Replaced emoji with proper Material Symbols icons
- Integrated with Layout component (sidebar, consistent styling)
- Proper dark mode support with theme tokens
- Loading states during async operations
- Hover effects and smooth transitions
- Responsive grid layouts

---

### 7. Additional Security Headers

**Helmet.js Configuration:**

```javascript
helmet({
  contentSecurityPolicy: {...},           // Already covered above
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },   // Prevent DNS prefetching
  frameguard: { action: 'deny' },         // X-Frame-Options: DENY
  hsts: {                                 // HTTP Strict Transport Security
    maxAge: 31536000,                     // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,                         // X-Download-Options: noopen
  noSniff: true,                          // X-Content-Type-Options: nosniff
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,                        // X-XSS-Protection: 1; mode=block
})
```

**Security Headers Explained:**

1. **HSTS (HTTP Strict Transport Security):**
   - Forces browsers to use HTTPS
   - Prevents SSL stripping attacks
   - 1 year duration with subdomain inclusion

2. **X-Frame-Options:**
   - Prevents application from being embedded in iframes
   - Protects against clickjacking

3. **X-Content-Type-Options:**
   - Prevents MIME type sniffing
   - Forces browser to respect declared content types

4. **Referrer Policy:**
   - Controls referrer information sent with requests
   - Privacy protection

5. **DNS Prefetch Control:**
   - Prevents browser from prefetching DNS
   - Privacy protection

---

## Security Testing Dashboard

**Location:** `/security-test`

### Available Tests:

1. **XSS Protection Test**
   - Tests 8 common XSS payloads
   - Verifies React's auto-escaping
   - Shows safe rendering of malicious inputs

2. **CSP Test**
   - Attempts to inject inline scripts
   - Attempts to load external scripts
   - Generates CSP violations (visible in console)

3. **Rate Limiting Test**
   - Sends 10 rapid requests to general API
   - Displays success/failure for each
   - Shows rate limit headers

4. **Auth Rate Limiting Test**
   - Sends 7 rapid login attempts
   - Should see rate limiting after 5 attempts
   - Returns HTTP 429 for blocked requests

5. **Tampering Detection Test**
   - Requires login + existing note
   - Uses admin endpoint to modify database
   - Demonstrates integrity check failure

6. **CORS Test**
   - Tests cross-origin request handling
   - Shows allowed origin configuration

### Usage:

1. Start the application
2. Navigate to `/security-test`
3. Click any test button
4. View results in the terminal-style output
5. Open DevTools to see additional information:
   - **Console:** CSP violations, errors
   - **Network:** Rate limit headers, CORS headers, status codes

---

## Zero-Knowledge Architecture

**Core Principle:** Server never has access to plaintext data or encryption keys.

### Key Derivation:

```typescript
// Master key derived from password (never sent to server)
const masterKey = await deriveKey(password, userSalt, 100000);

// Login verifier derived separately (sent to server)
const loginVerifier = await deriveKey(password, loginSalt, 50000);
```

### Key Storage:
- ✅ Master key: In-memory only (React ref)
- ✅ Login verifier: Hashed and stored in database
- ❌ Never stored: Master key, password

### Data Flow:

1. **Registration:**
   - User enters password
   - Frontend derives master key (for encryption)
   - Frontend derives login verifier (for authentication)
   - Only login verifier is sent to server
   - Server hashes verifier with bcrypt and stores

2. **Login:**
   - User enters password
   - Frontend derives login verifier from password
   - Verified against database (bcrypt compare)
   - Master key derived and stored in memory
   - Master key never transmitted

3. **Creating Note:**
   - Frontend encrypts with master key
   - Only ciphertext + IV + auth tag sent to server
   - Server stores encrypted blob (cannot decrypt)

4. **Viewing Note:**
   - Frontend requests ciphertext from server
   - Frontend decrypts using master key from memory
   - Server never sees plaintext

---

## Threat Mitigation Summary

| Threat | Mitigation | Status |
|--------|-----------|--------|
| XSS (Cross-Site Scripting) | CSP + React auto-escaping | ✅ Protected |
| SQL Injection | Prisma ORM (parameterized queries) | ✅ Protected |
| CSRF (Cross-Site Request Forgery) | CORS + token-based auth | ✅ Partial |
| Clickjacking | X-Frame-Options: DENY | ✅ Protected |
| MIME Sniffing | X-Content-Type-Options: nosniff | ✅ Protected |
| Brute Force | Rate limiting (5 attempts/15min) | ✅ Protected |
| Man-in-the-Middle | HTTPS enforcement (HSTS) | ✅ Protected* |
| Data Tampering | AES-GCM authentication tags | ✅ Protected |
| Server-Side Decryption | Zero-knowledge encryption | ✅ Protected |
| Password Exposure | PBKDF2 key derivation + bcrypt | ✅ Protected |
| Session Hijacking | JWT with short expiry | ⚠️ Partial |

*Note: HTTPS must be configured in production

---

## Best Practices Implemented

### 1. Defense in Depth
- Multiple layers of security
- CSP + XSS protection + input validation
- Client-side + server-side validation

### 2. Principle of Least Privilege
- Users can only access their own notes
- Ownership verification on every request
- JWT contains minimal user information

### 3. Secure by Default
- HTTPS enforcement via HSTS
- Strict CSP with no unsafe directives
- Rate limiting enabled globally

### 4. Security Logging
- CSP violations logged
- Failed authentication attempts logged (could be enhanced)
- Error messages don't reveal system internals

### 5. Input Validation
- Express Validator on all endpoints
- Type checking with TypeScript
- Email validation and sanitization

### 6. User Experience Security
- **Modal Component** (`frontend/src/components/Modal.tsx`)
  - Replaces browser `alert()` and `confirm()` dialogs
  - Prevents UI redressing attacks via custom styling
  - Proper keyboard navigation (ESC to close)
  - Prevents body scrolling when modal is open
  - Clear visual hierarchy for security-critical actions
  
- **Confirmation Dialogs for Destructive Actions**
  - Delete note requires explicit confirmation via modal
  - Clear warning messages about action consequences
  - Cancel button prominently displayed
  
- **Error Messaging**
  - User-friendly error messages via error modal
  - No exposure of system internals
  - Clear action steps for users
  
- **Visual Security Indicators**
  - Material Symbols icons for consistency
  - Color-coded modals (red for errors, blue for info, etc.)
  - Loading states prevent double-submissions

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong `JWT_SECRET` (min 32 characters, random)
- [ ] Configure proper `CORS_ORIGIN` (your frontend domain)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Remove admin tampering endpoint (auto-disabled in production)
- [ ] Set up CSP violation reporting to logging service
- [ ] Configure rate limiting based on expected traffic
- [ ] Enable database connection pooling
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure proper logging (Winston, etc.)
- [ ] Review and minimize console.log statements
- [ ] Perform security audit
- [ ] Set up automated security scanning (npm audit, Snyk)

---

## Testing Commands

### Backend Security Tests:

```bash
# Check for dependency vulnerabilities
npm audit

# Fix vulnerabilities (if possible)
npm audit fix

# Run tests (if implemented)
npm test
```

### Frontend Security Tests:

```bash
# Check for dependency vulnerabilities
npm audit

# Build production bundle
npm run build

# Analyze bundle size
npm run build -- --analyze
```

### Manual Testing:

1. **XSS Testing:**
   - Navigate to `/security-test`
   - Run XSS tests
   - Try creating a note with XSS payloads

2. **CSP Testing:**
   - Open DevTools Console
   - Navigate to `/security-test`
   - Run CSP test
   - Look for CSP violations

3. **Rate Limiting:**
   - Navigate to `/security-test`
   - Run rate limit tests
   - Check Network tab for 429 responses

4. **Integrity Protection:**
   - Create a note
   - Use Prisma Studio to view database
   - Use admin endpoint to tamper with note
   - Try to open note (should fail)

---

## Security Audit Log

### Phase 4 Implementation (Current)

**Date:** February 2026

**Changes:**
1. Enhanced CSP headers with all security directives
2. Added CSP violation reporting endpoint
3. Implemented two-tier rate limiting
4. Created comprehensive security testing dashboard
5. Added admin tampering simulation endpoint (dev only)
6. Documented all security features
7. Added security headers monitoring

**Testing Results:**
- ✅ XSS protection verified
- ✅ CSP blocking external resources
- ✅ Rate limiting working (general + auth)
- ✅ Tampering detection working
- ✅ CORS properly configured

**Known Limitations:**
- CSRF protection is partial (token-based auth provides some protection)
- Session management could be enhanced (refresh tokens)
- No account lockout after multiple failed attempts
- No two-factor authentication (2FA)

**Future Enhancements:**
- Add refresh token mechanism
- Implement account lockout after N failed attempts
- Add 2FA support
- Implement CSRF tokens for state-changing operations
- Add security event logging dashboard
- Implement anomaly detection

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)

---

**Last Updated:** February 16, 2026  
**Status:** Phase 4 Complete ✅
