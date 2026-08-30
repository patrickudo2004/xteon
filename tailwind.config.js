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
        cyan: {
          300: 'var(--accent-cyan)',
          400: 'var(--accent-cyan)',
          500: 'var(--accent-cyan)',
          600: 'var(--accent-cyan)',
        },
        amber: {
          300: 'var(--accent-amber)',
          400: 'var(--accent-amber)',
          500: 'var(--accent-amber)',
          600: 'var(--accent-amber)',
        },
        emerald: {
          300: 'var(--accent-emerald)',
          400: 'var(--accent-emerald)',
          500: 'var(--accent-emerald)',
          600: 'var(--accent-emerald)',
        },
        rose: {
          300: 'var(--accent-rose)',
          400: 'var(--accent-rose)',
          500: 'var(--accent-rose)',
          600: 'var(--accent-rose)',
        },
        blue: {
          300: 'var(--accent-blue)',
          400: 'var(--accent-blue)',
          500: 'var(--accent-blue)',
          600: 'var(--accent-blue)',
        },
        foh: {
          bg: '#0A0B0E',
          card: '#14171F',
          elevated: '#1E2330',
          border: '#2D3748',
          hover: '#262D3D',
        },
        port: {
          hdmi: '#8B5CF6',
          dp: '#3B82F6',
          sdi: '#EC4899',
          ethernet: '#10B981',
          fiber: '#F97316',
          usbc: '#06B6D4',
          legacy: '#64748B',
        },
        status: {
          ok: '#10B981',
          warn: '#F59E0B',
          alert: '#EF4444',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'Menlo', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
