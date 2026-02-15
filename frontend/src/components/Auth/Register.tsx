import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/apiService';
import { deriveKey, generateSalt, arrayBufferToBase64 } from '../../services/cryptoService';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Calculate password strength
  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'red' };
    if (score <= 3) return { level: 2, label: 'Good', color: 'emerald' };
    return { level: 4, label: 'Strong', color: 'green' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // Generate salt for login
      const saltLogin = generateSalt(16);

      // Create username hash (SHA-256 of email)
      const emailEncoder = new TextEncoder();
      const emailHash = await crypto.subtle.digest('SHA-256', emailEncoder.encode(email.toLowerCase()));
      const usernameHash = arrayBufferToBase64(emailHash);

      // Create password verifier (different salt and iterations)
      const passwordSalt = emailEncoder.encode(email.toLowerCase());
      const passwordVerifierKey = await deriveKey(password, passwordSalt, 10000, true);
      const keyData = await crypto.subtle.exportKey('raw', passwordVerifierKey);
      const passwordVerifier = btoa(String.fromCharCode(...new Uint8Array(keyData)));

      // Convert saltLogin to base64
      const saltLoginBase64 = arrayBufferToBase64(saltLogin.buffer as ArrayBuffer);

      // Register with server
      await authAPI.register({
        email,
        usernameHash,
        passwordVerifier,
        saltLogin: saltLoginBase64,
      });

      // Redirect to login
      navigate('/login', {
        state: { message: 'Account created successfully! Please log in.' }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 relative">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary z-10"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined text-[24px]">
          {theme === 'light' ? 'dark_mode' : 'light_mode'}
        </span>
      </button>
      
      {/* Main Card Container */}
      <div className="w-full max-w-[1000px] bg-white dark:bg-[#1a2632] rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Panel: Value Proposition */}
        <div className="w-full md:w-5/12 bg-slate-50 dark:bg-[#15202b] p-8 md:p-12 flex flex-col justify-between relative border-r border-gray-100 dark:border-gray-800">
          {/* Background Decorative Element */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-400"></div>
          
          <div className="flex flex-col gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display">
                Secure Notes
              </span>
            </div>

            {/* Headline */}
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
                Total privacy for your thoughts.
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                Zero-knowledge encryption means we can't read your notes even if we wanted to.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mt-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Client-side encryption</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Data is encrypted on your device before it ever reaches our servers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">No data access</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    We don't store your master password, so we can never access your vault.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Open Source</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Our cryptography code is open for anyone to audit and verify.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-sm text-slate-400 dark:text-slate-500">
            © 2024 Secure Notes Inc.
          </div>
        </div>

        {/* Right Panel: Registration Form */}
        <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-[#1a2632]">
          <div className="max-w-[420px] w-full mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-display">
                Create your vault
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Start protecting your notes with zero-knowledge encryption.
              </p>
            </div>

            {/* Warning Box */}
            <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-xl mt-0.5">
                  warning
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Important: Save your password!
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
                    We cannot recover your password. If you lose it, your data is lost forever.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-[#15202b] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Master Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-[#15202b] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong master password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Strength Indicator */}
                {password && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex gap-1 h-1 w-full">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-full w-1/4 rounded-full transition-colors ${
                            level <= passwordStrength.level
                              ? passwordStrength.color === 'red'
                                ? 'bg-red-500'
                                : passwordStrength.color === 'emerald'
                                ? 'bg-emerald-500'
                                : 'bg-green-500'
                              : 'bg-slate-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Strength:{' '}
                      <span
                        className={`font-medium ${
                          passwordStrength.color === 'red'
                            ? 'text-red-600 dark:text-red-400'
                            : passwordStrength.color === 'emerald'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-[#15202b] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 px-6 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-lg shadow-primary/30 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              {/* Login Link */}
              <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-semibold"
                >
                  Log in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
