/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // primary orange (UniSalon brand)
          600: '#ea6f10',
          700: '#c2560d',
          800: '#9a3f0b',
          900: '#7c3209',
          950: '#431704',
        },
        surface: {
          DEFAULT: '#0f0f0f',
          card: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#3a3a3a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-hold': 'pulseHold 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseHold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(249,115,22,0)' },
        }
      },
    },
  },
  plugins: [],
}
