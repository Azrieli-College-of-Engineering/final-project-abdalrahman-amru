# Comprehensive Testing Checklist

## Overview

This document provides a complete testing checklist for the Secure Notes application. Work through each section systematically to ensure all features work correctly.

**Testing Date:** _____________  
**Tester Name:** _____________  
**Environment:** Development / Production

---

## 1. Functional Testing

### 1.1 User Registration ✓

**Prerequisites:** None (fresh start)

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1.1.1 | Valid registration | 1. Go to `/register`<br>2. Enter valid email<br>3. Enter password (min 8 chars)<br>4. Click Register | User created, redirected to login | ☐ Pass ☐ Fail | |
| 1.1.2 | Duplicate email | 1. Try registering with existing email | Error: "User already exists" | ☐ Pass ☐ Fail | |
| 1.1.3 | Invalid email format | 1. Enter invalid email (e.g., "test")<br>2. Try to register | Validation error shown | ☐ Pass ☐ Fail | |
| 1.1.4 | Weak password | 1. Enter password < 8 chars<br>2. Try to register | Error: Password too short | ☐ Pass ☐ Fail | |
| 1.1.5 | Password confirmation | 1. Enter mismatched passwords<br>2. Try to register | Error: Passwords don't match | ☐ Pass ☐ Fail | |

**Registration Data Flow Verification:**
- [ ] Email stored in database
- [ ] Password NOT stored in plaintext
- [ ] `saltLogin` stored correctly
- [ ] `usernameHash` generated and stored
- [ ] `passwordVerifier` hashed with bcrypt

---

### 1.2 User Login ✓

**Prerequisites:** At least one registered user

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1.2.1 | Valid login | 1. Go to `/login`<br>2. Enter correct credentials<br>3. Click Login | User logged in, redirected to dashboard | ☐ Pass ☐ Fail | |
| 1.2.2 | Wrong password | 1. Enter valid email<br>2. Enter wrong password<br>3. Click Login | Error: "Invalid credentials" | ☐ Pass ☐ Fail | |
| 1.2.3 | Non-existent email | 1. Enter unregistered email<br>2. Click Login | Error: "Invalid credentials" | ☐ Pass ☐ Fail | |
| 1.2.4 | JWT token generation | 1. Login successfully<br>2. Check localStorage | JWT token stored in localStorage | ☐ Pass ☐ Fail | |
| 1.2.5 | Master key in memory | 1. Login successfully<br>2. Check localStorage/sessionStorage | Master key NOT in storage (memory only) | ☐ Pass ☐ Fail | |

**Login Data Flow Verification:**
- [ ] Master key derived from password (client-side)
- [ ] Master key stored in React ref (not localStorage)
- [ ] JWT token received from server
- [ ] User context updated with user info

---

### 1.3 Notes - Create ✓

**Prerequisites:** User logged in

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1.3.1 | Create simple note | 1. Click "New Note"<br>2. Enter text: "Test note"<br>3. Click Save | Note saved, appears in list | ☐ Pass ☐ Fail | |
| 1.3.2 | Create with markdown | 1. Create note with markdown syntax<br>2. Save | Markdown rendered correctly in preview | ☐ Pass ☐ Fail | |
| 1.3.3 | Create empty note | 1. Try to save empty note | Error or warning shown | ☐ Pass ☐ Fail | |
| 1.3.4 | Create large note | 1. Paste 10,000+ characters<br>2. Save | Note saved successfully | ☐ Pass ☐ Fail | |
| 1.3.5 | Special characters | 1. Enter: `<>&"'`\n`中文日本語`<br>2. Save and view | Characters preserved exactly | ☐ Pass ☐ Fail | |

**Encryption Verification:**
- [ ] Note encrypted on client-side before sending
- [ ] Ciphertext, IV, and authTag sent to server
- [ ] Open Prisma Studio: ciphertext is gibberish
- [ ] Plaintext never sent to server

---

### 1.4 Notes - Read/View ✓

**Prerequisites:** At least one note created

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1.4.1 | View note list | 1. Go to dashboard | All user's notes displayed | ☐ Pass ☐ Fail | |
| 1.4.2 | Open note | 1. Click on a note | Note opens, content decrypted and displayed | ☐ Pass ☐ Fail | |
| 1.4.3 | View after page refresh | 1. Refresh page<br>2. Click note | Note still decrypts correctly | ☐ Pass ☐ Fail | |
| 1.4.4 | Multiple notes | 1. Create 5+ notes<br>2. View each | Each note shows correct content | ☐ Pass ☐ Fail | |
| 1.4.5 | Note timestamps | 1. Check created/updated dates | Dates display correctly | ☐ Pass ☐ Fail | |

**Decryption Verification:**
- [ ] Ciphertext fetched from server
- [ ] Decryption happens on client-side
- [ ] Master key used from memory
- [ ] Original content restored exactly

---

### 1.5 Notes - Update ✓

**Prerequisites:** At least one note exists

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1.5.1 | Update existing note | 1. Open note<br>2. Modify content<br>3. Save | Note updated, changes visible | ☐ Pass ☐ Fail | |
| 1.5.2 | Update timestamp | 1. Update note<br>2. Check timestamp | `updatedAt` timestamp changed | ☐ Pass ☐ Fail | |
| 1.5.3 | Cancel edit | 1. Start editing<br>2. Click Cancel/Back | Changes discarded | ☐ Pass ☐ Fail | |
| 1.5.4 | Rapid updates | 1. Update note multiple times quickly | All updates saved correctly | ☐ Pass ☐ Fail | |

**Re-encryption Verification:**
- [ ] Note re-encrypted with new IV
- [ ] New authTag generated
- [ ] Old version replaced in database
- [ ] Decryption still works after update

---

### 1.6 Notes - Delete ✓

**Prerequisites:** At least one note exists

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1.6.1 | Delete note | 1. Click delete on a note<br>2. Confirm | Note removed from list and database | ☐ Pass ☐ Fail | |
| 1.6.2 | Delete confirmation | 1. Click delete | Confirmation dialog shown | ☐ Pass ☐ Fail | |
| 1.6.3 | Cancel delete | 1. Click delete<br>2. Click Cancel | Note NOT deleted | ☐ Pass ☐ Fail | |
| 1.6.4 | Delete last note | 1. Delete all notes | Empty state shown | ☐ Pass ☐ Fail | |

---

### 1.7 User Logout ✓

**Prerequisites:** User logged in

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1.7.1 | Logout | 1. Click Logout | Redirected to login page | ☐ Pass ☐ Fail | |
| 1.7.2 | Session cleared | 1. Logout<br>2. Check localStorage | Token removed from localStorage | ☐ Pass ☐ Fail | |
| 1.7.3 | Master key cleared | 1. Logout<br>2. Check memory | Master key cleared from memory | ☐ Pass ☐ Fail | |
| 1.7.4 | Access after logout | 1. Logout<br>2. Try to access `/dashboard` | Redirected to login | ☐ Pass ☐ Fail | |

---

### 1.8 Account Settings ✓

**Prerequisites:** User logged in

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1.8.1 | View settings | 1. Go to Settings page | User email and info displayed | ☐ Pass ☐ Fail | |
| 1.8.2 | Change password | 1. Enter current password<br>2. Enter new password<br>3. Save | Password changed successfully | ☐ Pass ☐ Fail | |
| 1.8.3 | Wrong current password | 1. Enter wrong current password<br>2. Try to change | Error: Invalid current password | ☐ Pass ☐ Fail | |
| 1.8.4 | Login with new password | 1. Change password<br>2. Logout<br>3. Login with new password | Login successful | ☐ Pass ☐ Fail | |

---

## 2. Security Testing

### 2.1 XSS (Cross-Site Scripting) Protection ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 2.1.1 | Script injection in note | 1. Create note with: `<script>alert('XSS')</script>`<br>2. Save and view | Script rendered as text, not executed | ☐ Pass ☐ Fail | |
| 2.1.2 | Image XSS | 1. Create note: `<img src=x onerror="alert('XSS')">`<br>2. View | No alert shown, rendered safely | ☐ Pass ☐ Fail | |
| 2.1.3 | SVG XSS | 1. Create note: `<svg onload="alert('XSS')">`<br>2. View | No alert shown | ☐ Pass ☐ Fail | |
| 2.1.4 | Event handler injection | 1. Try various event handlers<br>2. View | All rendered as text | ☐ Pass ☐ Fail | |
| 2.1.5 | Security test page | 1. Go to `/security-test`<br>2. Run XSS tests | All 8 payloads neutralized | ☐ Pass ☐ Fail | |

**XSS Payloads to Test:**
```html
<script>alert("XSS")</script>
<img src=x onerror="alert('XSS')">
<svg onload="alert('XSS')">
javascript:alert("XSS")
<iframe src="javascript:alert('XSS')">
<body onload="alert('XSS')">
<input onfocus="alert('XSS')" autofocus>
<marquee onstart="alert('XSS')">
```

---

### 2.2 Content Security Policy (CSP) ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 2.2.1 | CSP headers present | 1. Open DevTools > Network<br>2. Check response headers | CSP header present | ☐ Pass ☐ Fail | |
| 2.2.2 | Inline script blocked | 1. Go to `/security-test`<br>2. Run CSP test<br>3. Check console | CSP violation logged | ☐ Pass ☐ Fail | |
| 2.2.3 | External script blocked | 1. Run CSP test<br>2. Check network | External script blocked | ☐ Pass ☐ Fail | |
| 2.2.4 | CSP violation reporting | 1. Trigger CSP violation<br>2. Check server logs | Violation reported to server | ☐ Pass ☐ Fail | |

**Expected CSP Directives:**
- `default-src 'self'`
- `script-src 'self'`
- `style-src 'self' 'unsafe-inline'`
- `img-src 'self' data: https:`
- `connect-src 'self'`
- `frame-ancestors 'none'`

---

### 2.3 Rate Limiting ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 2.3.1 | General API rate limit | 1. Go to `/security-test`<br>2. Run rate limit test | First 100 requests succeed | ☐ Pass ☐ Fail | |
| 2.3.2 | Auth rate limit | 1. Run auth rate limit test | After 5 attempts, HTTP 429 returned | ☐ Pass ☐ Fail | |
| 2.3.3 | Rate limit headers | 1. Make API request<br>2. Check headers | `X-RateLimit-*` headers present | ☐ Pass ☐ Fail | |
| 2.3.4 | Rate limit reset | 1. Hit rate limit<br>2. Wait 15 minutes<br>3. Try again | Requests allowed again | ☐ Pass ☐ Fail | |

**Rate Limit Configuration:**
- General API: 100 requests / 15 minutes
- Auth endpoints: 5 requests / 15 minutes

---

### 2.4 Cryptographic Integrity Protection ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 2.4.1 | Crypto test - encryption | 1. Go to `/crypto-test`<br>2. Run encryption test | ✅ SUCCESS shown | ☐ Pass ☐ Fail | |
| 2.4.2 | Tampering detection (local) | 1. Run tampering test | Tampering detected error shown | ☐ Pass ☐ Fail | |
| 2.4.3 | Wrong key rejection | 1. Run wrong key test | Wrong key rejected | ☐ Pass ☐ Fail | |
| 2.4.4 | Database tampering | 1. Create note<br>2. Go to `/security-test`<br>3. Run DB tampering test<br>4. Try to open note | Integrity check failure shown | ☐ Pass ☐ Fail | |
| 2.4.5 | Manual DB tampering | 1. Open Prisma Studio<br>2. Modify ciphertext directly<br>3. Try to decrypt | Decryption fails with error | ☐ Pass ☐ Fail | |

---

### 2.5 Authentication & Authorization ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 2.5.1 | Protected routes | 1. Logout<br>2. Try to access `/dashboard` | Redirected to login | ☐ Pass ☐ Fail | |
| 2.5.2 | Invalid token | 1. Modify token in localStorage<br>2. Try to access API | HTTP 401 Unauthorized | ☐ Pass ☐ Fail | |
| 2.5.3 | Expired token | 1. Wait for token expiry (1 hour)<br>2. Try to access API | HTTP 401, redirected to login | ☐ Pass ☐ Fail | |
| 2.5.4 | Cross-user access | 1. Login as User A<br>2. Try to access User B's note ID | HTTP 404 or 403 | ☐ Pass ☐ Fail | |
| 2.5.5 | JWT secret security | 1. Check .env file | JWT_SECRET is strong (32+ chars) | ☐ Pass ☐ Fail | |

---

### 2.6 CORS Protection ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 2.6.1 | CORS headers | 1. Check API response headers | CORS headers present | ☐ Pass ☐ Fail | |
| 2.6.2 | Allowed origin | 1. Request from localhost:5173 | Request succeeds | ☐ Pass ☐ Fail | |
| 2.6.3 | Blocked origin | 1. Try from different domain | Request blocked by browser | ☐ Pass ☐ Fail | |
| 2.6.4 | CORS test page | 1. Go to `/security-test`<br>2. Run CORS test | Shows configuration correctly | ☐ Pass ☐ Fail | |

---

### 2.7 Additional Security Headers ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 2.7.1 | X-Frame-Options | Check response headers | `X-Frame-Options: DENY` | ☐ Pass ☐ Fail | |
| 2.7.2 | X-Content-Type-Options | Check response headers | `X-Content-Type-Options: nosniff` | ☐ Pass ☐ Fail | |
| 2.7.3 | X-XSS-Protection | Check response headers | `X-XSS-Protection: 1; mode=block` | ☐ Pass ☐ Fail | |
| 2.7.4 | HSTS | Check response headers | `Strict-Transport-Security` present | ☐ Pass ☐ Fail | |
| 2.7.5 | Referrer-Policy | Check response headers | `Referrer-Policy` present | ☐ Pass ☐ Fail | |

---

## 3. Zero-Knowledge Architecture Verification

### 3.1 Data in Transit ✓

| # | Verification | How to Test | Expected Result | Status | Notes |
|---|-------------|-------------|----------------|--------|-------|
| 3.1.1 | Master key never sent | 1. Open DevTools > Network<br>2. Login and create note<br>3. Filter requests | Master key not in any request | ☐ Pass ☐ Fail | |
| 3.1.2 | Plaintext never sent | 1. Create/update note<br>2. Check request payload | Only ciphertext/IV/authTag sent | ☐ Pass ☐ Fail | |
| 3.1.3 | Encryption client-side | 1. Set breakpoint in crypto code<br>2. Create note | Encryption happens in browser | ☐ Pass ☐ Fail | |

---

### 3.2 Data at Rest ✓

| # | Verification | How to Test | Expected Result | Status | Notes |
|---|-------------|-------------|----------------|--------|-------|
| 3.2.1 | DB contains ciphertext | 1. Open Prisma Studio<br>2. View notes table | Ciphertext is unreadable gibberish | ☐ Pass ☐ Fail | |
| 3.2.2 | No plaintext in DB | 1. Search DB for note content | Plaintext not found | ☐ Pass ☐ Fail | |
| 3.2.3 | Password not stored | 1. Check users table | Password not in plaintext | ☐ Pass ☐ Fail | |
| 3.2.4 | Auth tag stored | 1. Check notes table | authTag column populated | ☐ Pass ☐ Fail | |

**Database Inspection Steps:**
```bash
cd backend
npx prisma studio
```

---

### 3.3 Key Management ✓

| # | Verification | How to Test | Expected Result | Status | Notes |
|---|-------------|-------------|----------------|--------|-------|
| 3.3.1 | Key in memory only | 1. Login<br>2. Inspect localStorage/sessionStorage | Master key NOT stored | ☐ Pass ☐ Fail | |
| 3.3.2 | Key derivation | 1. Check crypto code | PBKDF2 with 100k iterations | ☐ Pass ☐ Fail | |
| 3.3.3 | Separate login key | 1. Check auth flow | Login verifier separate from master key | ☐ Pass ☐ Fail | |
| 3.3.4 | Key cleared on logout | 1. Logout<br>2. Check memory | Master key reference cleared | ☐ Pass ☐ Fail | |

---

## 4. Error Handling & Edge Cases

### 4.1 Network Errors ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 4.1.1 | Server offline | 1. Stop backend server<br>2. Try to create note | User-friendly error shown | ☐ Pass ☐ Fail | |
| 4.1.2 | Slow connection | 1. Throttle network in DevTools<br>2. Create note | Loading indicator shown | ☐ Pass ☐ Fail | |
| 4.1.3 | API timeout | 1. Simulate timeout<br>2. Check behavior | Timeout error handled | ☐ Pass ☐ Fail | |

---

### 4.2 Input Validation ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 4.2.1 | SQL injection attempt | 1. Try SQL in note: `'; DROP TABLE notes; --` | Stored safely, no SQL execution | ☐ Pass ☐ Fail | |
| 4.2.2 | Very long input | 1. Paste 1MB of text | Handled gracefully (error or success) | ☐ Pass ☐ Fail | |
| 4.2.3 | Unicode characters | 1. Use emoji, Chinese, Arabic, etc. | All preserved correctly | ☐ Pass ☐ Fail | |
| 4.2.4 | Null/undefined handling | 1. Send empty/null data | Validation error shown | ☐ Pass ☐ Fail | |

---

## 5. Performance & Usability

### 5.1 Performance ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 5.1.1 | Page load time | 1. Refresh dashboard | Loads in < 3 seconds | ☐ Pass ☐ Fail | |
| 5.1.2 | Encryption speed | 1. Encrypt 10KB note | Completes in < 1 second | ☐ Pass ☐ Fail | |
| 5.1.3 | List rendering | 1. Create 50+ notes<br>2. View list | List renders smoothly | ☐ Pass ☐ Fail | |
| 5.1.4 | Memory usage | 1. Use app for 10 minutes<br>2. Check browser memory | No memory leaks | ☐ Pass ☐ Fail | |

---

### 5.2 Usability ✓

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 5.2.1 | Responsive design | 1. Resize browser window | Layout adapts properly | ☐ Pass ☐ Fail | |
| 5.2.2 | Dark mode toggle | 1. Toggle dark/light mode | Theme switches correctly | ☐ Pass ☐ Fail | |
| 5.2.3 | Keyboard navigation | 1. Navigate with Tab/Enter | All interactive elements accessible | ☐ Pass ☐ Fail | |
| 5.2.4 | Error messages | 1. Trigger various errors | Messages are clear and helpful | ☐ Pass ☐ Fail | |

---

## 6. Browser Compatibility

### 6.1 Modern Browsers ✓

| Browser | Version | Status | Issues |
|---------|---------|--------|--------|
| Chrome | Latest | ☐ Pass ☐ Fail | |
| Firefox | Latest | ☐ Pass ☐ Fail | |
| Edge | Latest | ☐ Pass ☐ Fail | |
| Safari | Latest | ☐ Pass ☐ Fail | |

**Note:** Web Crypto API required (all modern browsers support it)

---

## 7. Demo Video Checklist

### 7.1 Scenes to Record ✓

- [ ] **Scene 1: Registration** (1 min)
  - Show registration form
  - Enter credentials
  - Explain zero-knowledge architecture
  - Show successful registration

- [ ] **Scene 2: Login** (1 min)
  - Show login form
  - Explain key derivation
  - Show successful login

- [ ] **Scene 3: Create Encrypted Note** (2 min)
  - Create a note with sample content
  - Show markdown preview
  - Explain client-side encryption
  - Save note

- [ ] **Scene 4: Database Inspection** (2 min)
  - Open Prisma Studio
  - Show notes table
  - Highlight ciphertext (gibberish)
  - Explain that server cannot decrypt

- [ ] **Scene 5: View Decrypted Note** (1 min)
  - Open the note
  - Show decrypted content
  - Explain client-side decryption

- [ ] **Scene 6: Tampering Simulation** (3 min)
  - Go to security test page
  - Run database tampering test
  - Try to open tampered note
  - Show integrity check failure
  - Explain AES-GCM authentication

- [ ] **Scene 7: Security Features** (2 min)
  - Run XSS protection test
  - Run rate limiting test
  - Show security headers in DevTools
  - Demonstrate CSP violations

- [ ] **Scene 8: Conclusion** (1 min)
  - Summarize key features
  - Mention zero-knowledge guarantee
  - Show logout

**Total Duration:** ~13 minutes

---

## 8. Test Results Summary

### Overall Status

- **Functional Tests:** ___ / ___ Passed
- **Security Tests:** ___ / ___ Passed
- **Zero-Knowledge Verification:** ___ / ___ Passed
- **Error Handling:** ___ / ___ Passed
- **Performance:** ___ / ___ Passed
- **Usability:** ___ / ___ Passed

### Critical Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Minor Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## 9. Sign-off

**Tester Signature:** _____________________  
**Date:** _____________________  
**Status:** ☐ Approved ☐ Approved with conditions ☐ Rejected

---

**Testing completed on:** February 16, 2026
