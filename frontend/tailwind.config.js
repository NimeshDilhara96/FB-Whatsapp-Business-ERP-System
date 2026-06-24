/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        danger: {
          50: '#fef2f2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
        },
        base: {
          bg: '#f9fafb',
          surface: '#ffffff',
          border: '#e5e7eb',
          'border-subtle': '#f3f4f6',
        },
        tx: {
          main: '#1f2937',
          muted: '#4b5563',
          subtle: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}
