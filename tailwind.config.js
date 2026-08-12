/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17202A',
        brand: {
          50: '#eefbf7',
          100: '#d5f5e9',
          500: '#17a673',
          600: '#0c855d',
          700: '#0a6b4d',
        },
      },
      boxShadow: {
        card: '0 20px 60px -30px rgba(23, 32, 42, 0.35)',
      },
    },
  },
  plugins: [],
}
