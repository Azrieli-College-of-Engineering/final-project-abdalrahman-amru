import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-light dark:bg-card-dark border-b border-border-light dark:border-border-darker px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
            Secure Notes
          </h1>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary"
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-[22px]">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {isAuthenticated ? (
            <>
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'text-primary dark:text-primary-light'
                      : 'text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary'
                  }`}
                >
                  My Notes
                </Link>
                <Link
                  to="/settings"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/settings')
                      ? 'text-primary dark:text-primary-light'
                      : 'text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary'
                  }`}
                >
                  Settings
                </Link>
              </nav>

              <div className="h-6 w-px bg-border-light dark:bg-border-darker hidden md:block"></div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent hover:bg-background-light dark:hover:bg-background-dark text-text-sub-light dark:text-text-sub-dark hover:text-danger-red transition-colors text-sm font-medium"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Log Out
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-background-light dark:hover:bg-background-dark transition-colors cursor-pointer">
                <span className="text-sm font-semibold hidden sm:block text-text-main-light dark:text-text-main-dark">
                  {user?.email?.split('@')[0]}
                </span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent-teal flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-background-dark">
                  <span className="text-sm font-bold">{getUserInitials()}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-4 bg-transparent hover:bg-background-light dark:hover:bg-white/5 text-text-main-light dark:text-white text-sm font-bold transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
