/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'google-blue': '#1a73e8',
        'google-blue-dark': '#1557b0',
        'google-gray': '#5f6368',
        'google-gray-light': '#f8f9fa',
        'google-border': '#dadce0',
      },
      fontFamily: {
        'google': ['Google Sans', 'Roboto', 'Arial', 'sans-serif'],
      },
      animation: {
        'countdown': 'countdown 30s linear infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        countdown: {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        }
      }
    },
  },
  plugins: [],
}