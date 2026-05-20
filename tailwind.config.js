/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E8192C',
        'primary-dark': '#C41425',
        'primary-light': '#FF4D5E',
      },
    },
  },
  plugins: [],
}
