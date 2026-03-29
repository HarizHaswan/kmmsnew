module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#d5efde',
          DEFAULT: '#6FCF97', // Soft green (replaces pink-600)
          dark: '#27AE60',    // Deeper green (replaces pink-700)
        },
        accent: {
          light: '#ffc8b4',
          DEFAULT: '#FF8A65', // Soft coral (replaces blue-600)
          dark: '#e07653',    // (replaces blue-700)
        },
        brand: {
          bg: '#F6FFF9',      // Background
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
