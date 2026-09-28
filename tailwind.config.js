/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#17123D", 2: "#241D5A" },
        brand: { DEFAULT: "#5B3DF5", light: "#EEEBFF", dark: "#4529D6" },
        lime: { DEFAULT: "#C8F03C" },
        go: { DEFAULT: "#1E9E6A", bg: "#E3F5EC" },
        tight: { DEFAULT: "#B86E0C", bg: "#FDF0DC" },
        skip: { DEFAULT: "#D23F46", bg: "#FCE5E6" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"] },
    },
  },
  plugins: [],
};
