/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        prospecta: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6969',
          500: '#f52f2f',
          600: '#dc1717',
          700: '#CC0000',
          800: '#A30000',
          900: '#7d0b0b'
        }
      },
      boxShadow: {
        card: '0 10px 30px rgba(31,31,31,.08)',
        soft: '0 6px 20px rgba(204,0,0,.12)'
      }
    }
  },
  plugins: []
}
