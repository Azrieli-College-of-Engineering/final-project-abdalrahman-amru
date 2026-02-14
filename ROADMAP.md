# Project Roadmap – Secure Notes Implementation

## Overview

This roadmap provides a step-by-step plan to implement the Secure Notes zero-knowledge encrypted notes application over **14-18 days**. Each phase includes specific tasks, deliverables, and validation steps.

---

## Phase 1: Project Setup & Crypto Foundation (Days 1-3)

### Goals
- Set up development environment
- Implement core cryptographic functions
- Validate crypto implementation with tests

### Day 1: Environment Setup

**Tasks:**
- [ ] Initialize Git repository
- [ ] Create project structure (frontend/ and backend/ folders)
- [ ] Set up PostgreSQL database locally
- [ ] Initialize backend (Express + Prisma)
- [ ] Initialize frontend (React with Vite)

**Commands:**
```bash
# Create project structure
mkdir secure-notes
cd secure-notes
git init

# Backend setup
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client jsonwebtoken bcrypt dotenv cors helmet express-rate-limit express-validator
npm install --save-dev nodemon
npx prisma init

# Frontend setup
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom

# Create initial .env files
cd ../backend
cp .env.example .env
cd ../frontend
cp .env.example .env
```

**Deliverables:**
- ✅ Project folder structure created
- ✅ Dependencies installed
- ✅ Database connection configured
- ✅ Both servers can start without errors

**Validation:**
```bash
# Test backend
cd backend
npm run dev  # Should start on port 5000

# Test frontend (separate terminal)
cd frontend
npm run dev  # Should start on port 3000
```

---

### Day 2: Database Schema & Core Crypto (Part 1)

**Tasks:**
- [ ] Define Prisma schema for users and notes tables
- [ ] Create and run initial migration
- [ ] Create crypto service module
- [ ] Implement PBKDF2 key derivation function

**Prisma Schema:**
```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

**Run Migration:**
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

**Crypto Service (Frontend):**
```javascript
// frontend/src/services/cryptoService.js

// Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive encryption key from password using PBKDF2
export async function deriveKey(password, salt, iterations = 100000) {
  const encoder = new TextEncoder();
  
  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
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
    false,  // not extractable
    ['encrypt', 'decrypt']
  );
  
  return key;
}

// Generate random salt
export function generateSalt(length = 16) {
  return crypto.getRandomValues(new Uint8Array(length));
}
```

**Deliverables:**
- ✅ Database schema defined and migrated
- ✅ PBKDF2 key derivation implemented
- ✅ Utility functions for Base64 conversion

---

### Day 3: Core Crypto (Part 2) - Encryption/Decryption

**Tasks:**
- [ ] Implement AES-256-GCM encryption function
- [ ] Implement AES-256-GCM decryption function
- [ ] Create simple test page to validate crypto
- [ ] Test round-trip encryption/decryption

**Encryption/Decryption Functions:**
```javascript
// frontend/src/services/cryptoService.js (continued)

// Encrypt plaintext note
export async function encryptNote(plaintext, key, userId, noteId) {
  const encoder = new TextEncoder();
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Prepare Additional Authenticated Data
  const aad = encoder.encode(JSON.stringify({ userId, noteId }));
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      additionalData: aad,
      tagLength: 128
    },
    key,
    encoder.encode(plaintext)
  );
  
  // Extract auth tag (last 16 bytes)
  const authTag = ciphertext.slice(-16);
  const actualCiphertext = ciphertext.slice(0, -16);
  
  return {
    ciphertext: arrayBufferToBase64(actualCiphertext),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(authTag)
  };
}

// Decrypt encrypted note
export async function decryptNote(encryptedData, key, userId, noteId) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const { ciphertext, iv, authTag } = encryptedData;
  
  // Reconstruct AAD (must match encryption)
  const aad = encoder.encode(JSON.stringify({ userId, noteId }));
  
  // Concatenate ciphertext + auth tag
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const authTagBuffer = base64ToArrayBuffer(authTag);
  const combined = new Uint8Array(
    ciphertextBuffer.byteLength + authTagBuffer.byteLength
  );
  combined.set(new Uint8Array(ciphertextBuffer), 0);
  combined.set(new Uint8Array(authTagBuffer), ciphertextBuffer.byteLength);
  
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
    
    return decoder.decode(plaintext);
    
  } catch (error) {
    throw new Error('Integrity check failed - data may be tampered');
  }
}
```

**Test Page:**
```jsx
// frontend/src/pages/CryptoTest.jsx
import { useState } from 'react';
import { deriveKey, generateSalt, encryptNote, decryptNote, arrayBufferToBase64 } from '../services/cryptoService';

export default function CryptoTest() {
  const [result, setResult] = useState('');
  
  async function testCrypto() {
    try {
      // Test parameters
      const password = 'test-password-123';
      const plaintext = 'This is a secret note!';
      const userId = 1;
      const noteId = 1;
      
      // Generate salt and derive key
      const salt = generateSalt();
      const key = await deriveKey(password, salt);
      
      // Encrypt
      const encrypted = await encryptNote(plaintext, key, userId, noteId);
      
      // Decrypt
      const decrypted = await decryptNote(encrypted, key, userId, noteId);
      
      // Verify
      if (decrypted === plaintext) {
        setResult(`✅ SUCCESS!\nOriginal: ${plaintext}\nDecrypted: ${decrypted}\n\nCiphertext: ${encrypted.ciphertext.slice(0, 50)}...`);
      } else {
        setResult('❌ FAILED: Decrypted text does not match');
      }
      
    } catch (error) {
      setResult(`❌ ERROR: ${error.message}`);
    }
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Crypto Test Page</h1>
      <button onClick={testCrypto}>Test Encryption/Decryption</button>
      <pre style={{ marginTop: '20px', background: '#f5f5f5', padding: '10px' }}>
        {result}
      </pre>
    </div>
  );
}
```

**Deliverables:**
- ✅ Encryption function implemented
- ✅ Decryption function implemented
- ✅ Test page validates round-trip encryption
- ✅ Auth tag verification working

**Validation:**
- Run test page and verify encryption/decryption works
- Try decrypting with wrong key → should fail
- Try modifying ciphertext → should detect tampering

---

## Phase 2: Backend API Development (Days 4-6)

### Day 4: Authentication Routes

**Tasks:**
- [ ] Create Express server with security middleware
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Create JWT authentication middleware

**Server Setup:**
```javascript
// backend/src/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    }
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// Body parsing
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Auth Controller:**
```javascript
// backend/src/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function register(req, res) {
  try {
    const { email, usernameHash, passwordVerifier, saltLogin } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password verifier
    const hashedVerifier = await bcrypt.hash(passwordVerifier, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        usernameHash,
        passwordVerifier: hashedVerifier,
        saltLogin
      }
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, passwordVerifier } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(
      passwordVerifier,
      user.passwordVerifier
    );
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      token,
      userId: user.id,
      email: user.email
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { register, login };
```

**Auth Routes:**
```javascript
// backend/src/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');

const router = express.Router();

const registerValidation = [
  body('email').isEmail(),
  body('usernameHash').notEmpty(),
  body('passwordVerifier').notEmpty(),
  body('saltLogin').notEmpty()
];

const loginValidation = [
  body('email').isEmail(),
  body('passwordVerifier').notEmpty()
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

module.exports = router;
```

**Authentication Middleware:**
```javascript
// backend/src/middleware/authenticate.js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authenticate;
```

**Deliverables:**
- ✅ Express server with security headers
- ✅ Registration endpoint working
- ✅ Login endpoint working
- ✅ JWT authentication middleware

---

### Day 5-6: Notes CRUD API

**Tasks:**
- [ ] Implement GET /api/notes (list all user notes)
- [ ] Implement POST /api/notes (create note)
- [ ] Implement PUT /api/notes/:id (update note)
- [ ] Implement DELETE /api/notes/:id (delete note)
- [ ] Add input validation
- [ ] Test with Postman/Thunder Client

**Notes Controller:**
```javascript
// backend/src/controllers/notesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getNotes(req, res) {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
}

async function getNote(req, res) {
  try {
    const { id } = req.params;
    
    const note = await prisma.note.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
}

async function createNote(req, res) {
  try {
    const { ciphertext, iv, authTag } = req.body;
    
    const note = await prisma.note.create({
      data: {
        userId: req.userId,
        ciphertext,
        iv,
        authTag
      }
    });
    
    res.status(201).json({
      noteId: note.id,
      createdAt: note.createdAt
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
}

async function updateNote(req, res) {
  try {
    const { id } = req.params;
    const { ciphertext, iv, authTag } = req.body;
    
    // Verify ownership
    const existing = await prisma.note.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: { ciphertext, iv, authTag }
    });
    
    res.json({
      message: 'Note updated',
      updatedAt: note.updatedAt
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
}

async function deleteNote(req, res) {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const existing = await prisma.note.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    await prisma.note.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
}

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
};
```

**Notes Routes:**
```javascript
// backend/src/routes/notes.js
const express = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
} = require('../controllers/notesController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

const noteValidation = [
  body('ciphertext').notEmpty().isString(),
  body('iv').notEmpty().isString(),
  body('authTag').notEmpty().isString()
];

router.get('/', getNotes);
router.get('/:id', getNote);
router.post('/', noteValidation, createNote);
router.put('/:id', noteValidation, updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
```

**Deliverables:**
- ✅ All CRUD endpoints implemented
- ✅ Authentication required for all notes routes
- ✅ Ownership verification (users can only access own notes)
- ✅ Input validation working

---

## Phase 3: Frontend Development (Days 7-10)

### Day 7: Auth UI Components

**Tasks:**
- [ ] Create AuthContext for state management
- [ ] Build Login page
- [ ] Build Registration page
- [ ] Implement API service for auth

**AuthContext:**
```jsx
// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useRef } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const masterKeyRef = useRef(null);
  
  const login = (userData, authToken, masterKey) => {
    setUser(userData);
    setToken(authToken);
    masterKeyRef.current = masterKey;
    localStorage.setItem('token', authToken);
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
    masterKeyRef.current = null;
    localStorage.removeItem('token');
  };
  
  const getMasterKey = () => masterKeyRef.current;
  
  return (
    <AuthContext.Provider value={{
      user,
      token,
      getMasterKey,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Login Page:**
```jsx
// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deriveKey, generateSalt, arrayBufferToBase64 } from '../services/cryptoService';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Step 1: Get user's salt from server (you'll need a GET /api/auth/salt/:email endpoint)
      const { data: { saltLogin } } = await api.get(`/api/auth/salt/${email}`);
      
      // Step 2: Derive master key (for encryption)
      const encryptionSalt = new Uint8Array(16); // In reality, fetch from server or derive
      const masterKey = await deriveKey(password, encryptionSalt);
      
      // Step 3: Derive login verifier
      const loginSalt = new Uint8Array(Buffer.from(saltLogin, 'base64'));
      const loginKey = await deriveKey(password, loginSalt, 50000);
      const loginKeyBytes = await crypto.subtle.exportKey('raw', loginKey);
      const passwordVerifier = arrayBufferToBase64(loginKeyBytes);
      
      // Step 4: Login to server
      const { data } = await api.post('/api/auth/login', {
        email,
        passwordVerifier
      });
      
      // Step 5: Store authentication
      login(
        { userId: data.userId, email: data.email },
        data.token,
        masterKey
      );
      
      navigate('/notes');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Master Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '20px' }}>
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
}
```

**(Continue in next section for registration and remaining days...)**

**Deliverables for Day 7:**
- ✅ AuthContext created
- ✅ Login page working
- ✅ Registration page working
- ✅ Master key stored in memory only

---

### Days 8-9: Notes UI & Crypto Integration

**Tasks:**
- [ ] Build Notes list page
- [ ] Build Note editor component
- [ ] Integrate encryption on note creation
- [ ] Integrate decryption on note viewing
- [ ] Handle integrity check failures

### Day 10: Error Handling & Polish

**Tasks:**
- [ ] Add loading states
- [ ] Add error messages
- [ ] Improve UI/UX
- [ ] Add basic styling (CSS or Tailwind)
- [ ] Test complete user flow

---

## Phase 4: Security Features & Documentation (Days 11-14)

### Day 11-12: Security Implementation

**Tasks:**
- [ ] Verify CSP headers in production
- [ ] Add tamper detection demo page
- [ ] Create admin endpoint for tampering simulation (dev only)
- [ ] Test XSS protection (try injecting scripts)
- [ ] Verify rate limiting works

### Day 13-14: Documentation & Testing

**Tasks:**
- [ ] Final testing of all features
- [ ] Record demo video showing:
  - Registration and login
  - Creating encrypted note
  - Viewing database (ciphertext gibberish)
  - Tampering simulation
  - Integrity check failure
- [ ] Write final project report
- [ ] Prepare presentation

---

## Phase 5: Optional Enhancements (Days 15-18)

If you have extra time:

- [ ] Add note titles (encrypted separately)
- [ ] Add search functionality (client-side only)
- [ ] Add note categories/tags (encrypted)
- [ ] Improve UI with Material-UI or Tailwind
- [ ] Add session timeout feature
- [ ] Deploy to production (Vercel + Railway)

---

## Testing Checklist

### Functional Testing
- [ ] User can register
- [ ] User can login
- [ ] User can create note
- [ ] User can view note (decrypted correctly)
- [ ] User can edit note
- [ ] User can delete note
- [ ] User can logout

### Security Testing
- [ ] Open Prisma Studio - verify ciphertext is unreadable
- [ ] Manually modify DB ciphertext - verify integrity error
- [ ] Try XSS payloads in note content - verify blocked
- [ ] Check browser console for CSP violations
- [ ] Verify master key not in localStorage
- [ ] Test rate limiting on login endpoint

### Error Handling
- [ ] Wrong password shows error
- [ ] Duplicate email registration shows error
- [ ] Invalid token shows 401
- [ ] Tampered data shows integrity warning
- [ ] Network errors handled gracefully

---

## Deliverables

### Code
- ✅ Backend API (Express + Prisma)
- ✅ Frontend SPA (React + Web Crypto)
- ✅ Database schema and migrations
- ✅ All CRUD operations working
- ✅ Crypto functions implemented

### Documentation
- ✅ README.md (project overview)
- ✅ ARCHITECTURE.md (system design)
- ✅ SECURITY.md (threat analysis)
- ✅ API documentation
- ✅ Setup instructions

### Demonstration
- ✅ Working application
- ✅ Database showing ciphertext
- ✅ Tampering detection demo
- ✅ XSS protection evidence

---

## Tips for Success

1. **Commit frequently** - Git commit after each major feature
2. **Test incrementally** - Don't wait until the end to test
3. **Start simple** - Get basic functionality working first
4. **Document as you go** - Add comments and update docs
5. **Ask for help** - Use course forums or office hours
6. **Time management** - Stick to the daily schedule

---

## Common Pitfalls to Avoid

❌ **Storing master key in localStorage** - Defeats zero-knowledge model  
❌ **Using `dangerouslySetInnerHTML`** - Opens XSS vulnerability  
❌ **Forgetting to bind AAD** - Allows replay attacks  
❌ **Not validating inputs** - Security risk  
❌ **Weak PBKDF2 iterations** - Makes brute force easier  
❌ **No HTTPS in production** - Network eavesdropping  

---

## Final Checklist

Before submitting:

- [ ] Code compiles and runs without errors
- [ ] All features work as demonstrated
- [ ] Database inspection shows encrypted data
- [ ] Documentation is complete and accurate
- [ ] Security analysis addresses XSS and tampering
- [ ] Demo video recorded
- [ ] Code is clean and commented
- [ ] No sensitive data in Git repository

---

**Good luck with your project! 🚀**
