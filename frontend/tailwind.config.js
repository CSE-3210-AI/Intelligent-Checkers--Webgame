/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          dark: '#8B6F47',
          light: '#F5F5DC',
          highlight: '#D4AF37',
        },
        agent: {
          megha: '#3B82F6',
          adiba: '#EF4444',
        }
      },
    },
  },
}
