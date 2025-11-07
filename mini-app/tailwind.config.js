/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        bebas: ['Bebas Neue', 'cursive'],
      },
      colors: {
        primary: '#0077B6',
        secondary: '#90E0EF',
        accent: '#ADE8F4',
        dark: '#0D1B2A',
        light: '#E0E1DD',
      },
    },
  },
  plugins: [],
}
