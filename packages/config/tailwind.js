/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f5f5',
          100: '#ebebeb',
          200: '#d6d6d6',
          300: '#b0b0b0',
          400: '#6e6e6e',
          500: '#111111',  // primary black (UniSalon brand accent)
          600: '#0a0a0a',
          700: '#080808',
          800: '#050505',
          900: '#020202',
          950: '#000000',
        },
        surface: {
          DEFAULT: '#ffffff',
          card:    '#f5f7fa',
          border:  '#e4ebf3',
          muted:   '#d0d7e2',
          dark:    '#1a1a1a',
        }
      },
      fontFamily: {
        sans:    ['Montserrat', 'Arial', 'sans-serif'],
        display: ['Montserrat', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-hold': 'pulseHold 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseHold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(17,17,17,0.3)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(17,17,17,0)' },
        }
      },
    },
  },
  plugins: [],
}
