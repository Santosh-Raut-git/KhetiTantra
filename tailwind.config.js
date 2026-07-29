/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        leaf: '#2E7D32',
        'leaf-light': '#4CAF50',
        'leaf-dark': '#1B5E20',
        harvest: '#F9A825',
        'harvest-light': '#FBC02E',
        'harvest-dark': '#F57F17',
        sand: '#F5F5F0',
        surface: '#FFFFFF',
        soil: '#3E2723',
        'soil-muted': '#6D4C41',
        clay: '#D32F2F',
        'clay-light': '#EF5350',
        'clay-dark': '#B71C1C',
      },
      fontSize: {
        body: ['16px', { lineHeight: '24px' }],
      },
    },
  },
  plugins: [],
};
