/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#006838', 
        secondary: '#D81C2C', 
        tertiary: '#FFCC00', 
        neutral: {
          900: '#1A1C1E', 
          100: '#F3F4F6', 
        }
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
      }
    },
  },
  plugins: [],
}