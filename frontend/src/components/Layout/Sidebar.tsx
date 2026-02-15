import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const parts = user.email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  if (!isAuthenticated) return null;

  return (
    <aside className="w-64 h-screen bg-[#0a0f16] dark:bg-[#0a0f16] border-r border-[#1a2332] flex flex-col fixed left-0 top-0 z-50">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-[#1a2332]">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/30 transition-colors">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Secure Notes
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive('/dashboard')
              ? 'bg-primary/10 text-primary'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            description
          </span>
          <span className="font-medium">Notes</span>
        </Link>

        <Link
          to="/security"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive('/security')
              ? 'bg-primary/10 text-primary'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            security
          </span>
          <span className="font-medium">Security Demo</span>
        </Link>

        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive('/settings')
              ? 'bg-primary/10 text-primary'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            settings
          </span>
          <span className="font-medium">Settings</span>
        </Link>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-[#1a2332] space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined text-[22px]">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
          <span className="font-medium">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>

        {/* User Profile */}
        <div className="px-3 py-2 rounded-lg bg-[#151d2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-teal flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <span className="text-sm font-bold">{getUserInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.email || 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">
            logout
          </span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
