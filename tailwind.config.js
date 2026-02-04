/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        surface: '#141416',
        border: '#27272a',
        accent: {
          primary: '#00d4aa',
          secondary: '#e01b24',
          blue: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}