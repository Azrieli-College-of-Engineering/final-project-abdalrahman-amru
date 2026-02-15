import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/apiService';
import { deriveKey, base64ToArrayBuffer } from '../../services/cryptoService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // First, derive a password verifier from the password
      const passwordSalt = new TextEncoder().encode(email.toLowerCase());
      const passwordVerifierKey = await deriveKey(password, passwordSalt, 10000, true);
      
      // Export the key to get a consistent hash
      const keyData = await crypto.subtle.exportKey('raw', passwordVerifierKey);
      const passwordVerifier = btoa(String.fromCharCode(...new Uint8Array(keyData)));

      // Login with the server
      const response = await authAPI.login({ email, passwordVerifier });

      // Derive the master encryption key from password + salt from server
      const saltLogin = base64ToArrayBuffer(response.saltLogin!);
      const masterKey = await deriveKey(password, new Uint8Array(saltLogin), 100000);

      // Store user data and master key
      login(
        { id: response.userId, email: response.email },
        response.token,
        masterKey
      );

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4">
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

        {/* Right Panel: Login Form */}
        <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-[#1a2632]">
          <div className="max-w-[420px] w-full mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-display">
                Log in to your vault
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Enter your credentials to decrypt your data.
              </p>
            </div>

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

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-[#15202b] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your master password"
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
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>

              {/* Sign Up Link */}
              <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-semibold"
                >
                  Create one
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
