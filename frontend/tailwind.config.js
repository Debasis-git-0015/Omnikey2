/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#07111F',
        cardGlass: 'rgba(255, 255, 255, 0.08)',
        accentBlue: '#3B82F6',
        accentBlueLight: '#60A5FA',
        textLight: '#F8FAFC',
        textMuted: '#94A3B8',
        successGreen: '#22C55E',
        dangerRed: '#EF4444',
        warningYellow: '#F59E0B',
      },
      borderRadius: {
        'premium': '20px',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
