# Component Documentation

## Overview

This document provides detailed information about all React components in the Secure Notes application, including their purpose, props, state management, and usage examples.

---

## Table of Contents

1. [Layout Components](#layout-components)
2. [Authentication Components](#authentication-components)
3. [Notes Components](#notes-components)
4. [UI Components](#ui-components)
5. [Pages](#pages)
6. [Context Providers](#context-providers)

---

## Layout Components

### Layout

**File:** `frontend/src/components/Layout/Layout.tsx`

**Purpose:** Main layout wrapper providing consistent structure across all pages.

**Props:**
```typescript
interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;  // Default: true
  showFooter?: boolean;   // Default: true
}
```

**Features:**
- Conditional sidebar rendering based on authentication
- Responsive design with proper spacing
- Dark mode support
- Automatic margin adjustment when sidebar is present

**Usage:**
```tsx
<Layout showFooter={false}>
  <YourPageContent />
</Layout>
```

---

### Sidebar

**File:** `frontend/src/components/Layout/Sidebar.tsx`

**Purpose:** Navigation sidebar with links to all major sections.

**Features:**
- Material Symbols icons
- Active link highlighting
- Dark mode styling
- Logout functionality
- Links to:
  - Dashboard
  - Account Settings
  - Security Tests
  - Crypto Tests

**Styling:**
- Fixed position on left side
- 16rem (256px) width
- Backdrop blur effect
- Border separator

---

### Header

**File:** `frontend/src/components/Layout/Header.tsx`

**Purpose:** Top header bar (currently minimal, can be expanded).

**Features:**
- Displays application name
- Can be extended for additional navigation

---

### Footer

**File:** `frontend/src/components/Layout/Footer.tsx`

**Purpose:** Bottom footer with copyright and links.

**Features:**
- Copyright information
- Links to documentation
- Dark mode support
- Minimal, unobtrusive design

---

## Authentication Components

### Login

**File:** `frontend/src/components/Auth/Login.tsx`

**Purpose:** User login form with password verification.

**Key Features:**
- Email and password validation
- PBKDF2 password verification
- Master key derivation
- Error handling with user-friendly messages
- Loading states during authentication
- Automatic redirect after successful login

**State:**
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

**Cryptographic Flow:**
1. User enters email and password
2. Fetch user's salt from server
3. Derive password verifier using PBKDF2
4. Send email + verifier to server
5. On success, derive master key and store in memory
6. Navigate to dashboard

---

### Register

**File:** `frontend/src/components/Auth/Register.tsx`

**Purpose:** New user registration with client-side key derivation.

**Key Features:**
- Email validation
- Password strength requirements (min 8 characters)
- Password confirmation
- Salt generation (16 bytes)
- Master key derivation (100k PBKDF2 iterations)
- Separate login verifier derivation
- Error handling

**Cryptographic Flow:**
1. User enters email, password, and confirmation
2. Generate random salt (16 bytes)
3. Derive master key using PBKDF2 (100k iterations)
4. Derive login verifier using PBKDF2 (50k iterations, different salt)
5. Send registration data to server (NEVER the master key)
6. Store master key in memory
7. Navigate to dashboard

**Validation:**
- Email format check
- Password minimum length (8 characters)
- Password confirmation match
- Duplicate email detection

---

## Notes Components

### Dashboard

**File:** `frontend/src/components/Notes/Dashboard.tsx`

**Purpose:** Main notes list view with search, create, edit, and delete functionality.

**Key Features:**
- Grid/list view of encrypted notes
- Real-time search by title/content
- Note preview (first 100 characters, Markdown stripped)
- Create new note button
- Edit and delete actions with modals
- Loading states
- Error handling
- Empty state when no notes

**State:**
```typescript
const [notes, setNotes] = useState<DecryptedNote[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [openMenuId, setOpenMenuId] = useState<number | null>(null);
const [deleteConfirmModal, setDeleteConfirmModal] = useState({...});
const [errorModal, setErrorModal] = useState({...});
```

**Note Decryption Flow:**
1. Fetch encrypted notes from server
2. Get master key from memory
3. Decrypt each note using AES-256-GCM
4. Strip Markdown for preview
5. Extract title from first line
6. Display in UI

**Markdown Stripping:**
- Removes headings (#, ##, ###)
- Removes bold/italic markers
- Removes links and images
- Removes code blocks
- Removes list markers
- Keeps plain text only

**Modal Integration:**
- Delete confirmation modal (type: 'confirm')
- Error display modal (type: 'error')

---

### NoteEditor

**File:** `frontend/src/components/Notes/NoteEditor.tsx`

**Purpose:** Full-featured note editing interface with Markdown support.

**Key Features:**
- Live Markdown preview
- Syntax-highlighted rendering
- Auto-save after 2 seconds of inactivity
- Manual save button
- Toggle between edit and preview modes
- Markdown toolbar for formatting shortcuts
- Full-screen editing
- Back to dashboard navigation

**State:**
```typescript
const [content, setContent] = useState('');
const [isSaving, setIsSaving] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [error, setError] = useState('');
const [isLoading, setIsLoading] = useState(!isNewNote);
const [isPreviewMode, setIsPreviewMode] = useState(!isNewNote);
```

**Auto-Save Logic:**
```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    if (content && !isNewNote) {
      handleSave();
    }
  }, 2000); // 2-second debounce
  
  return () => clearTimeout(timeout);
}, [content]);
```

**Encryption Flow (Save):**
1. User types note content
2. After 2 seconds of inactivity, trigger save
3. Generate random IV (12 bytes)
4. Encrypt content with AES-256-GCM
5. Send {ciphertext, iv, authTag} to server
6. Update lastSaved timestamp

**Decryption Flow (Load):**
1. Fetch note from server
2. Get encrypted data {ciphertext, iv, authTag}
3. Decrypt using master key
4. Display plaintext in editor
5. Handle integrity failures gracefully

---

### MarkdownToolbar

**File:** `frontend/src/components/Notes/MarkdownToolbar.tsx`

**Purpose:** Quick formatting toolbar for Markdown editing.

**Features:**
- Bold, italic, strikethrough buttons
- Heading levels (H1, H2, H3)
- Lists (ordered, unordered)
- Links and images
- Code blocks and inline code
- Blockquotes
- Horizontal rules
- Inserts Markdown syntax at cursor position

**Toolbar Actions:**
```typescript
const formatActions = {
  bold: '**text**',
  italic: '*text*',
  strikethrough: '~~text~~',
  heading1: '# ',
  heading2: '## ',
  heading3: '### ',
  bulletList: '- ',
  numberedList: '1. ',
  link: '[text](url)',
  image: '![alt](url)',
  code: '```\ncode\n```',
  inlineCode: '`code`',
  quote: '> ',
  hr: '\n---\n',
};
```

---

## UI Components

### Modal

**File:** `frontend/src/components/Modal.tsx`

**Purpose:** Reusable modal dialog for alerts, confirmations, and messages.

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  confirmText?: string;    // Default: 'OK'
  cancelText?: string;     // Default: 'Cancel'
  onConfirm?: () => void;  // Required for type='confirm'
}
```

**Modal Types:**

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `info` | info | Blue | General information |
| `warning` | warning | Yellow | Warnings that need attention |
| `error` | error | Red | Error messages |
| `success` | check_circle | Green | Success confirmations |
| `confirm` | help | Blue | Yes/No confirmations |

**Features:**
- Smooth fade-in/scale-in animations (200ms)
- Backdrop blur effect
- Click outside to close
- ESC key to close
- Prevents body scrolling when open
- Material Symbols icons
- Dark mode support
- Accessible keyboard navigation

**Animations:**
```css
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

.animate-scaleIn {
  animation: scaleIn 0.2s ease-out;
}
```

**Usage Examples:**

**Error Modal:**
```tsx
<Modal
  isOpen={errorModal.isOpen}
  onClose={() => setErrorModal({ isOpen: false, message: '' })}
  title="Error"
  message={errorModal.message}
  type="error"
  confirmText="OK"
/>
```

**Confirmation Modal:**
```tsx
<Modal
  isOpen={deleteConfirmModal.isOpen}
  onClose={() => setDeleteConfirmModal({ isOpen: false, noteId: null })}
  title="Delete Note"
  message="Are you sure you want to delete this note? This action cannot be undone."
  type="confirm"
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={handleDeleteConfirm}
/>
```

**Success Modal:**
```tsx
<Modal
  isOpen={successModal.isOpen}
  onClose={() => setSuccessModal({ isOpen: false })}
  title="Success"
  message="Your password has been changed successfully!"
  type="success"
  confirmText="Great!"
/>
```

---

## Pages

### AccountSettings

**File:** `frontend/src/pages/AccountSettings.tsx`

**Purpose:** User account management and password change.

**Key Features:**
- Display user information (email, join date)
- Change master password
- Re-encrypt all notes with new key
- Form validation
- Error handling
- Success/error messages
- Dark mode support

**Password Change Flow:**
1. User enters current password, new password, confirmation
2. Verify current password by deriving key
3. Fetch all encrypted notes
4. Decrypt all notes with current key
5. Derive new master key from new password
6. Re-encrypt all notes with new key
7. Generate new login verifier
8. Update server with new credentials and re-encrypted notes
9. Update in-memory master key
10. Show success message

**State:**
```typescript
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPasswordForm, setShowPasswordForm] = useState(false);
const [isChangingPassword, setIsChangingPassword] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
```

**Validation:**
- Current password verification
- New password minimum length (8 characters)
- Password confirmation match
- All notes must decrypt successfully before proceeding

---

### CryptoTest

**File:** `frontend/src/pages/CryptoTest.tsx`

**Purpose:** Interactive cryptography testing and demonstration.

**Key Features:**
- 3 test categories with visual cards
- Terminal-style output display
- Material icons
- Loading states
- Dark mode support

**Test Categories:**

**1. Encryption/Decryption Test:**
- Generates random salt
- Derives key using PBKDF2
- Encrypts plaintext with AES-256-GCM
- Decrypts ciphertext
- Verifies plaintext matches original
- Displays all cryptographic artifacts (ciphertext, IV, auth tag, salt)

**2. Tampering Detection Test:**
- Encrypts a message
- Manually modifies ciphertext (last 5 characters)
- Attempts decryption
- Verifies that integrity check fails
- Demonstrates AES-GCM authentication

**3. Wrong Key Test:**
- Encrypts with one password
- Attempts to decrypt with different password
- Verifies decryption fails
- Demonstrates key verification

**UI Design:**
- Interactive card buttons with hover effects
- Color-coded icons (blue, red, yellow)
- Terminal-style output with monospace font
- Loading spinner during tests
- Info panel with test descriptions

---

### SecurityTest

**File:** `frontend/src/pages/SecurityTest.tsx`

**Purpose:** Security feature testing dashboard.

**Key Features:**
- 6 security test categories
- Terminal-style output
- Developer-friendly interface
- Material icons
- Dark mode support

**Test Categories:**

**1. XSS Protection:**
- Tests 8 different XSS payloads
- Demonstrates React's automatic escaping
- Shows that malicious scripts render as text
- Payloads include: `<script>`, `<img onerror>`, `<svg onload>`, etc.

**2. Content Security Policy:**
- Tests inline script execution
- Tests external script loading
- Shows CSP violations in console
- Explains CSP directives

**3. Rate Limiting (General):**
- Sends 10 rapid requests
- Tests 100 req/15min limit
- Shows request status codes
- Demonstrates throttling behavior

**4. Auth Rate Limiting:**
- Sends 7 rapid login attempts
- Tests 5 req/15min strict limit
- Shows HTTP 429 (Too Many Requests)
- Demonstrates brute-force protection

**5. Tampering Detection:**
- Creates/fetches user's note
- Uses admin endpoint to tamper with database
- Instructs user to try opening note
- Demonstrates integrity check failure
- **Note:** Admin endpoint only works in development mode

**6. CORS Protection:**
- Tests origin validation
- Explains CORS configuration
- Shows allowed origins
- Discusses cross-origin blocking

**UI Design:**
- 3-column grid layout (responsive to 2 or 1 column)
- Each test has icon, title, description
- Hover effects with border color changes
- Warning banner explaining dev/test purpose
- Info panel with testing tips
- Terminal output with green text on dark background

---

### NotFound

**File:** `frontend/src/pages/NotFound.tsx`

**Purpose:** 404 error page for invalid routes.

**Features:**
- Clear "Page Not Found" message
- Link back to dashboard
- Consistent styling
- Dark mode support

---

## Context Providers

### AuthContext

**File:** `frontend/src/context/AuthContext.tsx`

**Purpose:** Global authentication state management.

**Provides:**
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, authToken: string, masterKey: CryptoKey) => void;
  logout: () => void;
  getMasterKey: () => CryptoKey | null;
}
```

**Key Features:**
- Stores user info and JWT token
- Manages master key in memory (React ref)
- Persists token to localStorage
- Automatic token validation on mount
- Logout clears all state

**Master Key Management:**
- Stored in `useRef` (not in state)
- Never persisted to storage
- Cleared on logout
- Exists only in browser memory during session

**Usage:**
```tsx
const { user, token, isAuthenticated, login, logout, getMasterKey } = useAuth();
```

---

### ThemeContext

**File:** `frontend/src/context/ThemeContext.tsx`

**Purpose:** Dark/light theme management.

**Provides:**
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

**Features:**
- System preference detection
- LocalStorage persistence
- HTML class toggle for Tailwind
- Smooth theme transitions

**Usage:**
```tsx
const { theme, toggleTheme } = useTheme();
```

---

## Services

### cryptoService.ts

**File:** `frontend/src/services/cryptoService.ts`

**Key Functions:**

**`generateSalt(): Uint8Array`**
- Generates 16 random bytes
- Uses `crypto.getRandomValues()`

**`deriveKey(password, salt, iterations, isLoginVerifier): Promise<CryptoKey>`**
- Uses PBKDF2-HMAC-SHA256
- Master key: 100,000 iterations
- Login verifier: 50,000 iterations (or custom)
- Returns 256-bit key

**`encryptNote(plaintext, key, userId): Promise<EncryptedData>`**
- Generates random 12-byte IV
- Uses AES-256-GCM
- AAD includes userId for binding
- Returns {ciphertext, iv, authTag}

**`decryptNote(encryptedData, key, userId): Promise<string>`**
- Verifies authentication tag
- Decrypts using AES-256-GCM
- Throws error if integrity check fails
- Returns plaintext

**`arrayBufferToBase64(buffer): string`**
**`base64ToArrayBuffer(base64): ArrayBuffer`**
- Conversion utilities for storage/transmission

---

### apiService.ts

**File:** `frontend/src/services/apiService.ts`

**Key Functions:**

**Auth API:**
- `authAPI.register(data)`
- `authAPI.login(data)`
- `authAPI.getSalt(email)`

**Notes API:**
- `notesAPI.getAll(token)`
- `notesAPI.getOne(token, noteId)`
- `notesAPI.create(token, encryptedNote)`
- `notesAPI.update(token, noteId, encryptedNote)`
- `notesAPI.delete(token, noteId)`

**Features:**
- Centralized error handling
- Automatic JWT token attachment
- Response data extraction
- TypeScript types for all requests/responses

---

## Styling Conventions

### Tailwind Classes

**Background Colors:**
- Light: `bg-background-light`, `bg-surface-light`
- Dark: `bg-background-dark`, `bg-card-dark`, `bg-[#0a0f16]`

**Text Colors:**
- Light: `text-text-main-light`, `text-text-sub-light`
- Dark: `text-white`, `text-gray-300`, `text-gray-400`

**Borders:**
- Light: `border-border-light`
- Dark: `border-border-darker`, `border-[#1a2332]`

**Accent Color:**
- Primary: `text-primary`, `bg-primary`, `border-primary`

**Material Icons:**
```tsx
<span className="material-symbols-outlined">icon_name</span>
```

### Responsive Design

All components use Tailwind's responsive prefixes:
- `sm:` - Small screens (640px+)
- `md:` - Medium screens (768px+)
- `lg:` - Large screens (1024px+)
- `xl:` - Extra large screens (1280px+)

---

## Best Practices

### Security

1. **Never** use `dangerouslySetInnerHTML`
2. **Always** validate and sanitize user input
3. **Never** store master key in localStorage
4. **Always** use HTTPS in production
5. **Never** log sensitive data (keys, plaintexts)

### Performance

1. Use `useMemo` for expensive computations
2. Use `useCallback` for event handlers passed to children
3. Lazy load heavy components
4. Debounce search and auto-save
5. Virtualize long lists if needed

### Code Quality

1. Use TypeScript for type safety
2. Follow React hooks rules
3. Keep components focused and single-purpose
4. Extract reusable logic to custom hooks
5. Use meaningful variable/function names

### User Experience

1. Show loading states for async operations
2. Provide clear error messages
3. Confirm destructive actions (delete, etc.)
4. Use modals instead of browser alerts
5. Implement responsive design
6. Support dark mode
7. Use icons for visual clarity

---

## Component Hierarchy

```
App
├── AuthContext.Provider
│   └── ThemeContext.Provider
│       ├── Layout
│       │   ├── Sidebar
│       │   └── Footer
│       │
│       ├── Login
│       ├── Register
│       │
│       ├── Dashboard (Notes List)
│       │   └── Modal (Delete Confirmation)
│       │   └── Modal (Error)
│       │
│       ├── NoteEditor
│       │   └── MarkdownToolbar
│       │
│       ├── AccountSettings
│       │
│       ├── CryptoTest
│       │
│       ├── SecurityTest
│       │
│       └── NotFound
```

---

## Future Enhancements

Potential component improvements:

1. **Note Sharing:** Add collaboration components
2. **Tags/Categories:** Note organization components
3. **Export/Import:** Data portability components
4. **Attachments:** File upload/encryption components
5. **Search Filters:** Advanced search UI
6. **Keyboard Shortcuts:** Shortcut modal and handlers
7. **Accessibility:** Enhanced ARIA labels and keyboard navigation
8. **PWA Support:** Offline mode components

---

**Last Updated:** February 16, 2026  
**Version:** 1.0.0
