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
        island: {
          bg: '#09090b',
          surface: '#121215',
          card: '#18181b',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.04)',
          text: '#f4f4f5',
          muted: '#a1a1aa',
          dim: '#71717a',
        },
        accent: {
          blue: '#0078d4',
          emerald: '#10b981',
          purple: '#8b5cf6',
          amber: '#f59e0b',
          white: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Segoe UI Variable', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'island-sm': '0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 2px 6px 0 rgba(0, 0, 0, 0.4)',
        'island-lg': '0 20px 48px -8px rgba(0, 0, 0, 0.75), 0 4px 12px 0 rgba(0, 0, 0, 0.5)',
        'glow-accent': '0 0 20px -3px var(--accent-glow, rgba(0, 120, 212, 0.35))',
      },
      transitionTimingFunction: {
        'spring-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-morph': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring-bounce': 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      }
    },
  },
  plugins: [],
}
