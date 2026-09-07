/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#f8fafc',
          card: '#ffffff',
          cardLight: '#f1f5f9',
          cardDark: '#0f172a',
          inner: '#f8fafc',
          border: '#e2e8f0',
          muted: '#64748b',
          peach: {
            DEFAULT: '#F8C39B',
            light: '#FCE2CD',
            soft: '#FDEFE3',
            dark: '#E7A97D',
            text: '#221B3E',
          },
          accent: '#172238',
          teal: '#10b981',
          rose: '#ef4444',
        },
        gov: {
          navy: '#172238',
          slate: '#243048',
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          muted: '#64748b',
          darkText: '#1b2535',
          emerald: '#10b981',
          emeraldLight: '#ecfdf5',
          amber: '#f59e0b',
          amberLight: '#fffbeb',
          blue: '#2563eb',
          blueLight: '#eff6ff',
          red: '#ef4444',
          redLight: '#fef2f2',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      }
    },
  },
  plugins: [],
};