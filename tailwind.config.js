/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vinho: { DEFAULT: '#8b1a1a', 50: '#fbeeee', 100: '#f3caca', 400: '#a83232', 600: '#6e1414', 900: '#2a0707' },
        ink: { DEFAULT: '#141821', soft: '#454b57' },
        muted: '#69707d',
        line: '#e6e8ee',
        canvas: '#f4f6fb',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,24,33,0.06), 0 6px 16px rgba(20,24,33,0.04)',
        lift: '0 2px 4px rgba(20,24,33,0.06), 0 14px 32px rgba(20,24,33,0.10)',
      },
    },
  },
  plugins: [],
};
