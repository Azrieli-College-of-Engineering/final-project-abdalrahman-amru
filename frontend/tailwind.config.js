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
        "primary": "#137fec",
        "primary-dark": "#0b5ed7",
        "accent-teal": "#14b8a6",
        "accent-teal-hover": "#0d9488",
        "background-light": "#f8fafc",
        "background-dark": "#0f172a",
        "surface-light": "#ffffff",
        "surface-dark": "#1e293b",
        "text-main-light": "#111418",
        "text-main-dark": "#f1f5f9",
        "text-sub-light": "#64748b",
        "text-sub-dark": "#94a3b8",
        "border-light": "#e2e8f0",
        "border-dark": "#334155",
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
  plugins: [],
}
