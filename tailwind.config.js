/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17243d',
        brand: {
          50: '#f0f5ff',
          100: '#dfeaff',
          500: '#3b68ee',
          600: '#2854d6',
          700: '#203faa',
        },
      },
      boxShadow: {
        card: '0 20px 60px -30px rgba(23, 32, 42, 0.35)',
      },
    },
  },
  plugins: [],
}
