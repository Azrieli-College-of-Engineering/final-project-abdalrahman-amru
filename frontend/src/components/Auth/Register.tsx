import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display min-h-screen flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* Header / Navigation */}
      <header className="w-full border-b border-[#f0f2f4] dark:border-[#22303c] bg-white dark:bg-[#111a22] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">Secure Notes</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[#617589] dark:text-[#9ba8b8] hidden sm:block">
            Already have an account?
          </span>
          <Link
            to="/login"
            className="flex items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-transparent border border-[#dbe0e6] dark:border-[#334454] text-[#111418] dark:text-white text-sm font-bold hover:bg-[#f0f2f4] dark:hover:bg-[#1a2632] transition-colors"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 w-full">
        <div className="w-full max-w-[480px] flex flex-col gap-6">
          {/* Headings */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#111418] dark:text-white">
              Create your Secure Vault
            </h1>
            <p className="text-[#617589] dark:text-[#9ba8b8] text-base font-normal">
              Zero-knowledge encryption means only you can access your data.
            </p>
          </div>

          {/* Warning Box */}
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 shrink-0 mt-0.5">
                warning
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-amber-900 dark:text-amber-200 text-sm font-bold">
                  Important Security Notice
                </p>
                <p className="text-amber-800 dark:text-amber-300/80 text-sm leading-relaxed">
                  We cannot recover or reset your Master Password. If you lose it, your data is lost forever 
                  because we do not store your keys.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 bg-white dark:bg-[#111a22] p-6 sm:p-8 rounded-2xl border border-[#dbe0e6] dark:border-[#22303c] shadow-sm"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label
                className="text-[#111418] dark:text-white text-sm font-medium leading-normal"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  className="flex w-full rounded-lg border border-[#dbe0e6] dark:border-[#334454] bg-white dark:bg-[#1a2632] h-11 px-3 py-2 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] dark:placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#617589] dark:text-[#6b7280]">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
                </div>
              </div>
            </div>

            {/* Master Password Field */}
            <div className="space-y-2">
              <label
                className="text-[#111418] dark:text-white text-sm font-medium leading-normal"
                htmlFor="password"
              >
                Master Password
              </label>
              <div className="relative">
                <input
                  className="flex w-full rounded-lg border border-[#dbe0e6] dark:border-[#334454] bg-white dark:bg-[#1a2632] h-11 pl-3 pr-10 py-2 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] dark:placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  id="password"
                  placeholder="Create a strong master password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#617589] hover:text-[#111418] dark:text-[#6b7280] dark:hover:text-white transition-colors cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
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
                        className={`h-full w-1/4 rounded-full ${
                          level <= passwordStrength.level
                            ? `bg-${passwordStrength.color}-500`
                            : 'bg-[#dbe0e6] dark:bg-[#334454]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#617589] dark:text-[#9ba8b8]">
                    Strength: <span className={`text-${passwordStrength.color}-600 dark:text-${passwordStrength.color}-400 font-medium`}>
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label
                className="text-[#111418] dark:text-white text-sm font-medium leading-normal"
                htmlFor="confirmPassword"
              >
                Confirm Master Password
              </label>
              <div className="relative">
                <input
                  className="flex w-full rounded-lg border border-[#dbe0e6] dark:border-[#334454] bg-white dark:bg-[#1a2632] h-11 pl-3 pr-10 py-2 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] dark:placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#617589] hover:text-[#111418] dark:text-[#6b7280] dark:hover:text-white transition-colors cursor-pointer"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center h-11 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold px-6 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Secure Account'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
