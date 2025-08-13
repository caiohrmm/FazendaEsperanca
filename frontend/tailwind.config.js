/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5fbf7',
          100: '#e7f7ed',
          200: '#c9ecd8',
          300: '#9cdab9',
          400: '#6fc99b',
          500: '#34b07a',
          600: '#2a9265',
          700: '#237652',
          800: '#1c5b41',
          900: '#164a35'
        }
      }
    },
    container: { center: true, padding: '1rem' }
  },
  plugins: []
}


