/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: 'rgba(30, 30, 30, 0.95)',
          card: 'rgba(50, 50, 50, 0.9)',
          hover: 'rgba(70, 70, 70, 0.9)',
          selected: 'rgba(59, 130, 246, 0.3)',
          border: 'rgba(255, 255, 255, 0.1)'
        }
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
