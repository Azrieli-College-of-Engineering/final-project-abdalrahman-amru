# Demo Video Script - Secure Notes Application

**Target Duration:** 12-15 minutes  
**Format:** Screen recording with voiceover  
**Tools:** OBS Studio / Loom / QuickTime

---

## Pre-Recording Checklist

- [ ] Clean browser with no bookmarks/extensions visible
- [ ] Backend server running (`cd backend && npm run dev`)
- [ ] Frontend server running (`cd frontend && npm run dev`)
- [ ] Prisma Studio ready to open (`cd backend && npx prisma studio`)
- [ ] Database has NO existing data (fresh start)
- [ ] Browser DevTools ready (F12)
- [ ] Demo script notes visible on second monitor
- [ ] Microphone tested and audio levels checked
- [ ] Screen resolution set to 1920x1080
- [ ] Disable notifications

---

## Scene 1: Introduction (1 minute)

**Visual:** Application login page

**Script:**

> "Hello, and welcome to my demonstration of Secure Notes, a zero-knowledge encrypted note-taking application.
>
> This application implements true end-to-end encryption, meaning that the server never has access to your unencrypted data or encryption keys. Everything is encrypted on your device before being sent to the server.
>
> Let me show you how this works in practice. We'll cover:
> - User registration and authentication
> - Creating encrypted notes
> - Inspecting the database to see encrypted data
> - Demonstrating tampering detection
> - And testing various security features
>
> Let's get started."

---

## Scene 2: Registration (2 minutes)

**Visual:** Navigate to registration page (`http://localhost:5173/register`)

**Actions:**
1. Click "Register" link
2. Enter email: `demo@example.com`
3. Enter password: `SecurePass123!`
4. Enter confirm password: `SecurePass123!`
5. Click "Register" button

**Script:**

> "First, let's register a new user. I'll use the email demo@example.com and a secure password.
>
> **[While typing]**
>
> During registration, something interesting happens behind the scenes. The application derives TWO separate keys from my password:
>
> First, a MASTER KEY for encrypting and decrypting notes. This key is derived using PBKDF2 with 100,000 iterations and will NEVER be sent to the server.
>
> Second, a LOGIN VERIFIER for authentication. This is derived separately with 50,000 iterations and is sent to the server where it's hashed again with bcrypt.
>
> **[Click Register]**
>
> Notice that after registration, we're redirected to the login page. The server has stored our credentials, but crucially, it does NOT have our master encryption key."

**Expected Result:** Successful registration, redirected to login page

---

## Scene 3: Login and Dashboard (2 minutes)

**Visual:** Login page

**Actions:**
1. Enter email: `demo@example.com`
2. Enter password: `SecurePass123!`
3. Click "Login"
4. Show dashboard (empty state)

**Script:**

> "Now let's log in with our credentials.
>
> **[While logging in]**
>
> During login, the master key is re-derived from my password and stored in memory - specifically in a React ref, not in localStorage or sessionStorage. This is crucial for security.
>
> **[After login, open DevTools > Application > Local Storage]**
>
> If we check localStorage, you'll see a JWT token, but notice - no encryption key is stored here. The key exists only in memory and is cleared when I logout or close the browser.
>
> **[Show dashboard]**
>
> Here's the dashboard. Currently empty because we haven't created any notes yet. Let's create our first encrypted note."

**Expected Result:** Successfully logged in, dashboard visible

---

## Scene 4: Creating an Encrypted Note (3 minutes)

**Visual:** Dashboard → New Note

**Actions:**
1. Click "New Note" or "+" button
2. Type note content with some markdown:
   ```
   # My Secret Note
   
   This is **important** confidential information:
   
   - Password: MySecretPass123
   - API Key: sk-1234567890abcdef
   - Credit Card: 1234-5678-9012-3456
   
   This data is *encrypted* before leaving my browser!
   ```
3. Show markdown preview (if available)
4. Click "Save"

**Script:**

> "I'll create a note with some sensitive information - passwords, API keys, and a credit card number. Obviously these are fake, but they represent the kind of data you might want to protect.
>
> **[While typing]**
>
> The application supports markdown formatting, so I can use headers, bold text, and lists.
>
> Now here's the critical part - **[About to save]** - when I click save, the encryption happens RIGHT HERE in my browser.
>
> **[Open DevTools > Network tab before clicking Save]**
>
> Let me open the Network tab so you can see what gets sent to the server.
>
> **[Click Save]**
>
> **[Click on the POST /api/notes request in Network tab]**
>
> Look at the request payload. You can see three fields:
> - ciphertext: This is the encrypted note - complete gibberish
> - iv: The initialization vector, randomly generated
> - authTag: The authentication tag from AES-GCM mode
>
> Notice what's NOT in this request: the plaintext content and the encryption key. The server receives ONLY encrypted data and has no way to decrypt it."

**Expected Result:** Note saved successfully, visible in notes list

---

## Scene 5: Database Inspection - The Zero-Knowledge Proof (3 minutes)

**Visual:** Open Prisma Studio in new window/tab

**Actions:**
1. Open new terminal
2. Run: `cd backend && npx prisma studio`
3. Navigate to "notes" table
4. Select the note we just created
5. Show ciphertext, IV, and authTag fields
6. Compare with plaintext in app

**Script:**

> "Now for the moment of truth. Let's look at what's actually stored in the database.
>
> **[Opening Prisma Studio]**
>
> I'm opening Prisma Studio, which gives us a direct view of our PostgreSQL database.
>
> **[Navigate to notes table]**
>
> Here's our notes table. You can see our note was just created.
>
> **[Click on the note to expand]**
>
> Let me expand this to show all the fields:
>
> - userId: Links the note to the user
> - ciphertext: **[Highlight]** Look at this - it's complete gibberish. This is our sensitive data, but it's encrypted with AES-256-GCM. Even as the database administrator, I cannot read this.
> - iv: The initialization vector
> - authTag: The authentication tag - this is what prevents tampering
> - Timestamps for created and updated dates
>
> **[Split screen: Prisma Studio and App]**
>
> Compare the encrypted ciphertext in the database with the readable text in the application. The server stores only encrypted blobs. It cannot decrypt them because it doesn't have the master key.
>
> This is the essence of zero-knowledge encryption: the server knows nothing about your data content."

**Expected Result:** Ciphertext visible and unreadable in database

---

## Scene 6: Viewing the Decrypted Note (1 minute)

**Visual:** Back to application, open the note

**Actions:**
1. Close or minimize Prisma Studio
2. Click on the note in the dashboard
3. Show decrypted content matching original

**Script:**

> "Back in the application, when I click to open this note...
>
> **[Click note]**
>
> The application fetches the encrypted data from the server, then decrypts it right here in my browser using the master key that's stored in memory.
>
> And there's our original sensitive content, perfectly restored. The decryption happened entirely on the client side.
>
> Let's explore what happens if someone tries to tamper with this data."

**Expected Result:** Note opens and displays decrypted content correctly

---

## Scene 7: Tampering Detection Demo (3 minutes)

**Visual:** Navigate to Security Test page

**Actions:**
1. Go to `/security-test`
2. Scroll to "Tampering Detection" section
3. Click "Test Tampering with Database"
4. Show success message
5. Try to open the tampered note from dashboard
6. Show integrity check failure error

**Script:**

> "One of the critical security features is tampering detection. Let me demonstrate.
>
> **[Navigate to /security-test]**
>
> I've built a security testing dashboard for demonstration purposes. It's at /security-test.
>
> **[Scroll to tampering section]**
>
> Here's the tampering detection test. This will simulate a malicious actor who gains access to the database and tries to modify our encrypted note.
>
> **[Click 'Test Tampering with Database']**
>
> **[Read the output]**
>
> The test has just modified the ciphertext in the database directly, changing a few characters at the end. In a real attack, this could be:
> - A malicious database administrator
> - A hacker who compromised the database
> - Or corrupted storage
>
> Now let's try to open this tampered note.
>
> **[Navigate back to dashboard and click the note]**
>
> **[Show error message]**
>
> Perfect! The application detected the tampering and refused to decrypt. The error says 'Integrity check failed' or 'Data may be tampered'.
>
> This is thanks to AES-GCM's built-in authentication. The authTag we saw in the database is a cryptographic signature. Any change to the ciphertext, IV, or metadata causes the authentication to fail.
>
> This protects against:
> - Data tampering
> - Bit-flipping attacks
> - Replay attacks
> - And any unauthorized modifications

> This is a fundamental security property - integrity protection alongside encryption."

**Expected Result:** Tampering detected, decryption fails with error

---

## Scene 8: XSS Protection Demo (2 minutes)

**Visual:** Still on Security Test page

**Actions:**
1. Scroll to XSS Protection section
2. Click "Test XSS Protection"
3. Show results (all payloads rendered as text)
4. Open browser Console
5. Show no script execution

**Script:**

> "Let me demonstrate a few more security features. First, protection against Cross-Site Scripting attacks.
>
> **[Click 'Test XSS Protection']**
>
> **[Read output]**
>
> This test attempts to inject 8 different XSS payloads - common attack vectors that could execute malicious JavaScript. These include:
> - Script tags
> - Image onerror handlers
> - SVG onload events
> - And others
>
> As you can see, all of them are rendered as plain text. The angle brackets are escaped to HTML entities, so `<script>` becomes `&lt;script&gt;`.
>
> **[Open Console]**
>
> And if we check the browser console - no scripts executed, no alerts shown. React's built-in XSS protection is working, and we never use `dangerouslySetInnerHTML` anywhere in the code."

**Expected Result:** All XSS payloads neutralized

---

## Scene 9: Rate Limiting Demo (1 minute)

**Visual:** Security Test page

**Actions:**
1. Scroll to Rate Limiting section
2. Click "Test Auth Rate Limit"
3. Show results with HTTP 429 after 5 attempts

**Script:**

> "Another important security feature is rate limiting. This protects against brute force attacks.
>
> **[Click 'Test Auth Rate Limit']**
>
> This test rapidly sends login requests with invalid credentials. Watch what happens...
>
> **[Read results]**
>
> You can see:
> - Requests 1-5: Unauthorized (401) - this is expected for wrong credentials
> - Requests 6-7: Rate Limited (429) - blocked!
>
> After 5 failed login attempts within 15 minutes, the server blocks further attempts. This makes brute force attacks impractical.
>
> The general API has more lenient limits - 100 requests per 15 minutes - but authentication endpoints are strictly limited to 5 attempts."

**Expected Result:** Rate limiting working, 429 errors after threshold

---

## Scene 10: Content Security Policy (1 minute)

**Visual:** Browser DevTools Console

**Actions:**
1. Click "Test CSP"
2. Open DevTools Console
3. Show CSP violation warnings

**Script:**

> "Finally, let's look at Content Security Policy.
>
> **[Click 'Test CSP']**
>
> **[Open Console]**
>
> The test attempted to:
> - Execute inline scripts
> - Load external scripts from untrusted domains
>
> Look at the console - these are CSP violations. The browser blocked these attempts because our Content Security Policy headers prohibit them.
>
> **[Show Network tab > Response Headers]**
>
> If we check the response headers, you'll see the CSP directives:
> - default-src 'self' - only load resources from our domain
> - script-src 'self' - only execute scripts from our domain
> - frame-ancestors 'none' - prevent clickjacking
>
> These headers add a robust defense-in-depth layer."

**Expected Result:** CSP violations logged, scripts blocked

---

## Scene 11: Additional Features Quick Tour (1 minute)

**Visual:** Navigate through the app

**Actions:**
1. Show dark mode toggle
2. Create another note
3. Edit a note
4. Delete a note
5. Show account settings

**Script:**

> "Let me quickly show a few more features:
>
> **[Toggle dark mode]**
>
> The application supports dark and light themes.
>
> **[Create/edit/delete notes quickly]**
>
> Full CRUD operations - Create, Read, Update, Delete - all with client-side encryption.
>
> **[Open settings]**
>
> And account settings where users can change their password. When changing the password, the master key changes, so all notes would need to be re-encrypted in a production version."

**Expected Result:** Smooth navigation through features

---

## Scene 12: Logout and Conclusion (1 minute)

**Visual:** Logout, return to login page

**Actions:**
1. Click Logout
2. Show login page
3. Try to access dashboard (should redirect)

**Script:**

> "When we logout...
>
> **[Click Logout]**
>
> Several things happen:
> - The JWT token is removed from localStorage
> - The master key is cleared from memory
> - And we're redirected to the login page
>
> **[Try to access /dashboard in URL bar]**
>
> If I try to access protected pages, I'm immediately redirected back to login. The session is completely cleared.
>
> **[Face camera/conclusion screen]**
>
> To summarize what we've demonstrated:
>
> 1. **Zero-Knowledge Encryption**: The server never sees plaintext data or encryption keys
> 2. **AES-256-GCM**: Strong encryption with built-in authentication
> 3. **Tamper Detection**: Any modifications to encrypted data are immediately detected
> 4. **XSS Protection**: Multiple layers prevent script injection
> 5. **Rate Limiting**: Brute force attacks are mitigated
> 6. **Content Security Policy**: Additional browser-level protections
> 7. **Secure Key Management**: Keys stored in memory only, never persisted
>
> This application demonstrates a practical implementation of zero-knowledge architecture with comprehensive security features.
>
> Thank you for watching!"

---

## Post-Recording Checklist

- [ ] Review video for audio quality
- [ ] Check that all text is readable on screen
- [ ] Verify no sensitive information shown (even if fake)
- [ ] Add title card / intro slide
- [ ] Add conclusion slide with summary
- [ ] Export in 1080p MP4 format
- [ ] Keep raw recording as backup
- [ ] Upload to required platform

---

## Technical Details for Recording

### OBS Settings (Recommended)
- **Resolution:** 1920x1080
- **Frame Rate:** 30 FPS
- **Encoder:** x264
- **Bitrate:** 5000 Kbps
- **Audio:** 192 Kbps AAC

### Screen Layout
- Browser: Full screen on main monitor
- Notes/script: Second monitor or phone
- Terminal: Hidden unless needed

### Lighting Tips
- Record in well-lit room
- Avoid backlighting
- If showing face, use ring light

### Audio Tips
- Use external microphone if possible
- Record in quiet environment
- Test audio levels before full recording
- Speak clearly and at moderate pace
- Pause between sections for easier editing

---

## Backup Plan

If live demo fails:
1. Have pre-recorded screen segments
2. Test everything 2x before recording
3. Have backend and frontend already running
4. Test all features work before starting
5. Keep database backup ready

---

## Timing Breakdown

| Scene | Duration | Cumulative |
|-------|----------|------------|
| 1. Introduction | 1:00 | 1:00 |
| 2. Registration | 2:00 | 3:00 |
| 3. Login & Dashboard | 2:00 | 5:00 |
| 4. Creating Note | 3:00 | 8:00 |
| 5. Database Inspection | 3:00 | 11:00 |
| 6. Viewing Note | 1:00 | 12:00 |
| 7. Tampering Demo | 3:00 | 15:00 |
| 8. XSS Protection | 2:00 | 17:00 |
| 9. Rate Limiting | 1:00 | 18:00 |
| 10. CSP | 1:00 | 19:00 |
| 11. Quick Tour | 1:00 | 20:00 |
| 12. Conclusion | 1:00 | 21:00 |

**Target:** 15-18 minutes (edit down as needed)

---

**Script Version:** 1.0  
**Last Updated:** February 16, 2026
