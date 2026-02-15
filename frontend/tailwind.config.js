/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#14b8a6", // Teal-500
        "primary-hover": "#0d9488", // Teal-600
        "primary-light": "#2dd4bf", // Teal-400
        "primary-blue": "#137fec", // Blue for light mode
        "primary-blue-hover": "#0b5ed7",
        "accent-teal": "#14b8a6",
        "accent-teal-hover": "#0d9488",
        "background-light": "#f8fafc",
        "background-dark": "#121212", // Updated to match mockups
        "surface-light": "#ffffff",
        "surface-dark": "#1e293b",
        "card-dark": "#1E1E1E", // Dark mode card background
        "card-darker": "#161616", // Darker card variant
        "input-bg": "#2d2d2d", // Dark input background
        "input-border": "#3f3f46", // Dark input border
        "text-main-light": "#111418",
        "text-main-dark": "#f1f5f9",
        "text-sub-light": "#64748b",
        "text-sub-dark": "#94a3b8",
        "border-light": "#e2e8f0",
        "border-dark": "#334155",
        "border-darker": "#2A2A2A", // Even darker border for dark mode
        "danger-red": "#ef4444",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
