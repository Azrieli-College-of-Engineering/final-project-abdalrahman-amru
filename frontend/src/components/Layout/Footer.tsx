import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-light dark:bg-card-dark border-t border-border-light dark:border-border-darker mt-auto">
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-6">
          <Link
            to="/about"
            className="text-sm text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link
            to="/privacy"
            className="text-sm text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="text-sm text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to="/security"
            className="text-sm text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary transition-colors"
          >
            Security
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">code</span>
            GitHub
          </a>
        </div>
        <div className="text-center">
          <p className="text-sm text-text-sub-light dark:text-gray-600">
            © {currentYear} Secure Notes Inc. All rights reserved.
          </p>
          <p className="text-xs text-text-sub-light dark:text-gray-700 mt-2">
            Zero-knowledge encryption • Your data, your keys
          </p>
        </div>
      </div>
    </footer>
  );
}
