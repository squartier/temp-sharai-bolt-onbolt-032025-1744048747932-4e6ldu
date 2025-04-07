/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#BB86FC',
        secondary: '#03DAC6',
        background: '#121212',
        surface: '#1F1F1F',
        'surface-variant': '#2D2D2D',
        'on-surface': '#E0E0E0',
        'on-surface-variant': '#757575',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
