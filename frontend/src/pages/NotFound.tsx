import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';

export default function NotFound() {
  return (
    <Layout showSidebar={false} showFooter={false}>
      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="flex flex-col items-center justify-center max-w-[600px] w-full gap-8">
          {/* Animated 404 Icon */}
          <div className="relative flex items-center justify-center w-full max-w-[320px] aspect-square rounded-full bg-surface-light dark:bg-card-dark p-8 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 rounded-full border border-border-light dark:border-white/5"></div>
            <div className="absolute inset-4 rounded-full border border-border-light dark:border-white/5 border-dashed"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-text-sub-light dark:text-gray-500">
              <span
                className="material-symbols-outlined text-[120px] md:text-[140px] text-text-sub-light dark:text-gray-600"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48" }}
              >
                search
              </span>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-2 ml-2">
                <span
                  className="material-symbols-outlined text-6xl text-primary opacity-90"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock
                </span>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-text-main-light dark:text-white text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              404
            </h1>
            <h2 className="text-text-main-light dark:text-gray-200 text-xl md:text-2xl font-semibold leading-tight mt-1">
              Page Not Found
            </h2>
            <p className="text-text-sub-light dark:text-gray-400 text-base font-normal leading-relaxed max-w-[460px] mt-2">
              We couldn't find the page you're looking for. It might have been encrypted, moved to a secure vault, or deleted by the owner.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center pt-4">
            <Link
              to="/dashboard"
              className="flex w-full sm:w-auto min-w-[160px] items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary hover:bg-primary-hover active:bg-primary-hover text-white dark:text-background-dark text-base font-bold leading-normal tracking-wide shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span>Go to Dashboard</span>
            </Link>
            <Link
              to="/security"
              className="flex w-full sm:w-auto min-w-[160px] items-center justify-center gap-2 rounded-lg h-12 px-6 bg-surface-light dark:bg-card-dark border border-border-light dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] hover:border-border-light dark:hover:border-[#444] text-text-main-light dark:text-gray-300 text-base font-bold leading-normal tracking-wide transition-colors"
            >
              <span className="material-symbols-outlined text-xl">contact_support</span>
              <span>Visit Help Center</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Custom Footer for 404 Page */}
      <footer className="flex flex-col gap-6 px-5 py-8 text-center border-t border-border-light dark:border-border-darker bg-surface-light dark:bg-card-dark mt-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Link
            to="/about"
            className="text-sm text-text-sub-light dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link
            to="/privacy"
            className="text-sm text-text-sub-light dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="text-sm text-text-sub-light dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to="/security"
            className="text-sm text-text-sub-light dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Security
          </Link>
        </div>
        <div className="text-sm text-text-sub-light dark:text-gray-600">
          © {new Date().getFullYear()} Secure Notes Inc.
        </div>
      </footer>
    </Layout>
  );
}
