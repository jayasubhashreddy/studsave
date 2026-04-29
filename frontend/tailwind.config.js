/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        surface: { 500:'#6b7280', 600:'#4b5563', 700:'#374151', 800:'#1f2937', 900:'#111827' },
        brand:   { 300:'#86efac', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 900:'#14532d' },
      },
    },
  },
  plugins: [],
};
