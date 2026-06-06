/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#C4A265',
          'gold-light': '#D4B87A',
          'gold-dark': '#A8894F',
          bg: '#FAFAF8',
          text: '#1A1A1A',
          'text-secondary': '#6B6B6B',
          border: '#E8E4DC',
        },
      },
    },
  },
  plugins: [],
}
