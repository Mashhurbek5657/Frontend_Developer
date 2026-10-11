/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        xs: "300px",
        sm: "640px",
        md: "768px",
        lg: "960px",
        xl: "1184px",
      },
    },
    extend: {},
  },
  plugins: [],
}
