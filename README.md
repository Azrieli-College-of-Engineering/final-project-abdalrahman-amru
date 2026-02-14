[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Nt4zUlkt)


# 🔐 Secure Notes – Zero-Knowledge Encrypted Notes Application

A web application for managing personal notes with **client-side encryption** using the Web Crypto API. The server acts only as a storage layer and has **no access** to plaintext note content.

> **Course Project**: Web System Security  
> **Institution**: Azrieli College Of Engineering  
> **Date**: 28 February 2026

---

## 🎯 Project Goals

This project demonstrates practical implementation of cryptographic principles and web security concepts:

- **Client-side encryption**: Implement PBKDF2 + AES-256-GCM entirely in the browser using Web Crypto API
- **Zero-knowledge architecture**: Backend cannot decrypt user data even with full database access
- **Integrity verification**: Detect data tampering via AES-GCM authentication tags
- **Security analysis**: Analyze and demonstrate the impact of XSS attacks on encrypted applications
- **Secure development**: Apply web security best practices (CSP, HTTPS, secure sessions)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │               React Application                    │ │
│  │  • Web Crypto API (PBKDF2 + AES-GCM)               │ │
│  │  • Master key stored in memory only                │ │
│  │  • Encryption/decryption happens here              │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS (encrypted data only)
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js/Express Backend                    │
│  • JWT authentication                                   │
│  • Stores only ciphertext blobs                         │
│  • No access to keys or plaintext                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                        │
│  • Stores encrypted note content (ciphertext)           │
│  • Initialization vectors (IV)                          │
│  • Authentication tags (for integrity)                  │
│  • User credentials (hashed)                            │
└─────────────────────────────────────────────────────────┘
```

📖 **See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design**

---

## ✨ Features

### Core Functionality

- ✅ **Client-side AES-256-GCM encryption** – All notes encrypted before leaving browser
- ✅ **PBKDF2 key derivation** – Strong key generation from master password
- ✅ **Zero-knowledge design** – Server and database never see plaintext
- ✅ **Integrity verification** – Detect tampered data using GCM authentication tags
- ✅ **JWT authentication** – Secure stateless session management
- ✅ **CRUD operations** – Create, read, update, delete encrypted notes

### Security Features

- 🔒 **Content Security Policy (CSP)** – XSS attack mitigation
- 🔒 **HTTPS enforcement** – Encrypted transport layer
- 🔒 **HTTP-only cookies** – Session token protection
- 🔒 **Rate limiting** – Brute force attack prevention
- 🔒 **Input validation** – SQL injection and XSS prevention
- 🔒 **Security headers** – Helmet.js for Express hardening
- 🔒 **Tamper detection** – Real-time integrity check warnings

---

## 🛠️ Technology Stack

### Frontend
- **React 18** – Modern UI framework with hooks
- **Web Crypto API** – Native browser cryptography (no external crypto libraries)
- **React Router** – Client-side routing
- **Axios** – HTTP client for API communication
- **Tailwind CSS** – Utility-first styling framework
- **Vite** – Fast development build tool

### Backend
- **Node.js 18+** – JavaScript runtime
- **Express.js** – Web application framework
- **PostgreSQL** – Relational database
- **Prisma** – Type-safe ORM with migrations
- **JWT** – JSON Web Tokens for authentication
- **Helmet** – Security headers middleware
- **express-rate-limit** – Rate limiting
- **cors** – Cross-origin resource sharing

### Development Tools
- **TypeScript** (optional) – Type safety
- **ESLint + Prettier** – Code quality
- **Jest** – Testing framework
- **Prisma Studio** – Database GUI

---

## 📁 Project Structure

```
secure-notes/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Auth/           # Login, Register
│   │   │   ├── Notes/          # NotesList, NoteEditor
│   │   │   └── Security/       # TamperDemo, IntegrityWarning
│   │   ├── pages/              # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NotesPage.jsx
│   │   │   └── SecurityDemo.jsx
│   │   ├── services/           # Business logic
│   │   │   ├── cryptoService.js    # PBKDF2 + AES-GCM
│   │   │   └── apiService.js       # HTTP requests
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useAuth.js
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   │   ├── auth.js         # /api/auth/*
│   │   │   └── notes.js        # /api/notes/*
│   │   ├── controllers/        # Request handlers
│   │   │   ├── authController.js
│   │   │   └── notesController.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── authenticate.js # JWT verification
│   │   │   ├── rateLimiter.js
│   │   │   └── validator.js
│   │   ├── utils/              # Helper functions
│   │   └── server.js           # Express app entry
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/
│   ├── package.json
│   └── .env.example
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md         # System architecture
│   ├── SECURITY.md             # Security analysis
│   ├── API.md                  # API reference
│   └── SETUP.md                # Setup instructions
│
├── README.md                    # This file
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **PostgreSQL 14+** installed ([Download](https://www.postgresql.org/download/))
- **npm** or **pnpm** package manager
- Basic knowledge of React and Node.js

### 1. Clone and Setup Database

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE securenotes;
\q
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/securenotes"
# JWT_SECRET="your-super-secret-key-minimum-32-characters"
# PORT=5000
# NODE_ENV=development

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create environment file
cp .env.example .env

# Edit .env:
# VITE_API_URL=http://localhost:5000

# Start React development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Access Application

Open your browser and navigate to:
```
http://localhost:3000
```

📖 **For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md)**

---

## 🔑 How It Works

### Registration Flow

```
1. User enters email + master password
   ↓
2. Browser generates random salt (16 bytes)
   ↓
3. Browser derives encryption key using PBKDF2
   - Algorithm: PBKDF2-HMAC-SHA256
   - Iterations: 100,000
   - Output: 256-bit key
   ↓
4. Browser derives separate login password hash
   ↓
5. Browser sends {email, passwordHash, salt} to server
   ↓
6. Server stores credentials (NEVER sees master key)
   ↓
7. Master key stays in browser memory only
```

### Note Creation Flow

```
1. User types note content
   ↓
2. Browser generates random IV (12 bytes)
   ↓
3. Browser encrypts note with AES-256-GCM
   - Key: derived master key
   - IV: random per note
   - AAD: {userId, noteId} for integrity binding
   ↓
4. Browser sends {ciphertext, iv, authTag} to server
   ↓
5. Server stores encrypted blob in database
   ↓
6. Server returns note ID
```

### Note Retrieval Flow

```
1. User selects note to view
   ↓
2. Browser requests note from server
   ↓
3. Server returns {ciphertext, iv, authTag}
   ↓
4. Browser decrypts with in-memory key
   ↓
5. Browser verifies authentication tag
   ↓
6. If valid → Display plaintext
   If invalid → Show "TAMPERED DATA" warning
```

---

## 🛡️ Security Model

### What the Server CANNOT Do

- ❌ **Read note content** – Only ciphertext is visible
- ❌ **Decrypt notes** – No access to encryption keys
- ❌ **Recover passwords** – Key derivation is one-way
- ❌ **Forge valid ciphertexts** – No access to master key

### What the Server CAN Do

- ✅ **Authenticate users** – Via password hash verification
- ✅ **Store encrypted data** – Acts as dumb storage
- ✅ **Delete notes** – Remove records from database
- ✅ **Manage metadata** – Timestamps, note IDs, user IDs

### Critical Security Considerations

#### ⚠️ XSS Vulnerability (Explicitly Addressed)

Even with zero-knowledge encryption, **XSS attacks can completely bypass security**:

**What an attacker can do with XSS:**
- 🚨 Steal master password as user types (keylogging)
- 🚨 Read encryption key from browser memory
- 🚨 Exfiltrate decrypted plaintext from DOM/state
- 🚨 Replace crypto functions with backdoored versions
- 🚨 Send data to external attacker-controlled servers

**Our XSS Mitigations:**
- ✅ **Strict Content Security Policy (CSP)**
  - No inline scripts allowed
  - Script sources restricted to same-origin
  - No eval() or dynamic code execution
- ✅ **React automatic escaping** – All user input escaped by default
- ✅ **Avoid dangerouslySetInnerHTML** – Never render raw HTML
- ✅ **Input validation** – Sanitize and validate all user input
- ✅ **HTTP-only cookies** – Session tokens not accessible to JavaScript
- ✅ **Security headers** – X-Frame-Options, X-Content-Type-Options, HSTS

**Residual Risk:**
Even with all mitigations, if the JavaScript code itself is compromised (e.g., supply chain attack, malicious CDN), zero-knowledge property breaks on that client.

#### 🔍 Data Tampering Detection

**Attack Scenario:** Attacker gains database access and modifies stored data

**What happens:**
1. Attacker changes ciphertext, IV, or auth tag in database
2. User requests the tampered note
3. Browser attempts decryption
4. **AES-GCM authentication tag verification fails**
5. Browser shows integrity warning instead of plaintext
6. User is notified that note may be compromised

**Protection Mechanism:**
- AES-GCM provides authenticated encryption
- Authentication tag computed over ciphertext + AAD
- AAD includes userId + noteId (binds ciphertext to specific owner)
- Prevents replay attacks between users/notes
- Any modification detected immediately

**Demonstration:**
We provide a tamper simulation feature in the Security Demo page.

📖 **For detailed threat analysis, see [docs/SECURITY.md](docs/SECURITY.md)**

---

## 🧪 Testing

### Automated Tests

```bash
# Backend unit tests
cd backend
npm test

# Frontend component tests
cd frontend
npm test

# Run all tests with coverage
npm test -- --coverage
```

### Manual Testing Checklist

**Basic Functionality:**
- [ ] Register new account with email and password
- [ ] Log in with registered credentials
- [ ] Create a new encrypted note
- [ ] View and edit existing note
- [ ] Delete note
- [ ] Log out and verify session cleared

**Security Verification:**
- [ ] Open Prisma Studio and verify note content is unreadable ciphertext
  ```bash
  cd backend
  npx prisma studio
  ```
- [ ] Manually modify ciphertext in database
- [ ] Reload note in browser and verify integrity warning appears
- [ ] Try injecting `<script>alert('XSS')</script>` in note content
- [ ] Verify script does not execute (escaped or blocked by CSP)
- [ ] Check browser console for CSP violations
- [ ] Confirm password recovery is impossible (no reset mechanism)
- [ ] Verify HTTPS enforcement in production
- [ ] Test rate limiting by making rapid login attempts

**Performance:**
- [ ] Create note with 10,000 characters – verify encryption speed
- [ ] Load 50+ notes – verify decryption performance
- [ ] Test on mobile device/browser

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  email             VARCHAR(255) UNIQUE NOT NULL,
  username_hash     VARCHAR(255) UNIQUE NOT NULL,
  password_verifier VARCHAR(255) NOT NULL,
  salt_login        VARCHAR(255) NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notes Table
```sql
CREATE TABLE notes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ciphertext  TEXT NOT NULL,
  iv          VARCHAR(255) NOT NULL,
  auth_tag    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
```

**Important:** All note content is stored as ciphertext. Even database administrators cannot read plaintext.

---

## 📝 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "usernameHash": "sha256_hash_of_username",
  "passwordVerifier": "pbkdf2_derived_hash",
  "saltLogin": "base64_encoded_salt"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "userId": 123
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "passwordVerifier": "pbkdf2_derived_hash"
}

Response: 200 OK
{
  "token": "jwt_token_here",
  "userId": 123
}
```

### Notes Endpoints (Require JWT)

#### Get All Notes
```http
GET /api/notes
Authorization: Bearer <jwt_token>

Response: 200 OK
{
  "notes": [
    {
      "id": 1,
      "ciphertext": "base64_encrypted_content",
      "iv": "base64_initialization_vector",
      "authTag": "base64_authentication_tag",
      "createdAt": "2026-02-07T19:00:00Z",
      "updatedAt": "2026-02-07T19:00:00Z"
    }
  ]
}
```

#### Create Note
```http
POST /api/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "ciphertext": "base64_encrypted_content",
  "iv": "base64_initialization_vector",
  "authTag": "base64_authentication_tag"
}

Response: 201 Created
{
  "noteId": 456
}
```

#### Update Note
```http
PUT /api/notes/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "ciphertext": "base64_encrypted_content",
  "iv": "base64_initialization_vector",
  "authTag": "base64_authentication_tag"
}

Response: 200 OK
```

#### Delete Note
```http
DELETE /api/notes/:id
Authorization: Bearer <jwt_token>

Response: 204 No Content
```

📖 **For complete API reference, see [docs/API.md](docs/API.md)**

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build

# Deploy 'dist' folder to:
# - Vercel: vercel deploy
# - Netlify: netlify deploy
```

### Backend (Railway/Render/Heroku)

```bash
cd backend

# Set environment variables on platform:
# DATABASE_URL=postgresql://...
# JWT_SECRET=your-secret-key
# NODE_ENV=production
# CORS_ORIGIN=https://your-frontend.vercel.app

# Deploy using platform CLI or Git push
```

### Production Checklist

- [ ] Set strong JWT_SECRET (minimum 32 random characters)
- [ ] Configure DATABASE_URL with production credentials
- [ ] Enable HTTPS/TLS on all endpoints
- [ ] Set CORS_ORIGIN to frontend domain only
- [ ] Enable rate limiting (production values)
- [ ] Configure CSP headers for production
- [ ] Set secure, HTTP-only cookies
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Review and test all security headers
- [ ] Perform security audit/penetration testing
- [ ] Set up monitoring and logging
- [ ] Configure database backups

---

## ⚠️ Limitations

### By Design (Zero-Knowledge Trade-offs)

1. **No password recovery** – If you forget your master password, your notes are permanently lost. This is by design; the server cannot help you.

2. **Single device** – Encryption key is not synchronized across devices. Each login requires re-entering the master password.

3. **Performance constraints** – Encrypting very large notes (>1MB) may be slow on mobile devices or older browsers.

### Technical Limitations

4. **Browser dependency** – Requires modern browser with Web Crypto API support (Chrome 60+, Firefox 57+, Safari 11+, Edge 79+).

5. **Client compromise** – Zero-knowledge does not protect against XSS, malware, or compromised browser extensions.

6. **No collaboration** – Sharing notes between users requires implementing key exchange, which is out of scope.

---

## 🎓 Educational Purpose

This project demonstrates:

### Applied Cryptography
- PBKDF2 key derivation functions
- AES-256-GCM authenticated encryption
- Initialization vectors and salts
- Authentication tags for integrity
- Client-side encryption architecture

### Web Security
- XSS attack vectors and mitigations
- Content Security Policy (CSP)
- HTTPS/TLS transport security
- Secure session management (JWT)
- Input validation and sanitization
- Security headers (Helmet.js)

### Full-Stack Development
- React SPA with modern hooks
- RESTful API design
- PostgreSQL database design
- Prisma ORM and migrations
- Authentication and authorization
- Error handling and validation

Perfect for learning:
- How encryption works in practice
- When zero-knowledge helps (and when it doesn't)
- Real-world security trade-offs
- Secure application architecture

---

## 📚 References and Further Reading

### Web Crypto API
- [MDN Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Web Crypto API Examples](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)

### Cryptography
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [AES-GCM Encryption Explained](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [PBKDF2 Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### Web Security
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Zero-Knowledge Architecture
- [Zero-Knowledge Proof Concepts](https://en.wikipedia.org/wiki/Zero-knowledge_proof)
- [Client-Side Encryption Best Practices](https://www.aliasvault.net/blog/zero-knowledge-architecture)

---

## 👥 Contributing

This is an educational project. Suggestions and improvements welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -m 'Add improvement'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Open a Pull Request

---

## 📄 License

This project is for educational purposes as part of a Web Security course.

---

## 🙏 Acknowledgments

- **Course**: Web System Security
- **Institution**: [Your Institution Name]
- **Instructor**: [Instructor Name]
- **Date**: February 2026
- **Team**: [Your Name(s)]

Special thanks to:
- The OWASP Foundation for security resources
- Mozilla Developer Network for Web Crypto documentation
- The open-source community for tools and libraries

---

## ⚠️ Security Disclaimer

**This is an educational project.** While it implements real cryptographic principles correctly, it has not undergone professional security auditing.

**Do not use for sensitive production data without:**
- Professional security audit
- Penetration testing
- Code review by security experts
- Compliance verification for your use case

The primary goal is education and demonstration of security concepts, not production deployment.

---

## 📞 Support

For questions about this project:
- Review the [ARCHITECTURE.md](ARCHITECTURE.md) and [SECURITY.md](docs/SECURITY.md) documentation
- Check [docs/SETUP.md](docs/SETUP.md) for setup troubleshooting
- Refer to the [API documentation](docs/API.md)

---

**Built with ❤️ for learning web security and applied cryptography**
