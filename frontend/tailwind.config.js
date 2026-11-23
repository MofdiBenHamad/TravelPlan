/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          deep: '#0c1526',
          DEFAULT: '#142238',
          soft: '#1c3050',
        },
        gold: {
          DEFAULT: '#d4af37',
          soft: '#f2cf8b',
          deep: '#b8860b',
        },
        coral: {
          DEFAULT: '#ff6b4a',
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
