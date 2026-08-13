/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        secondary: "#565e74",
        primary: "#006c49",
        "secondary-fixed-dim": "#bec6e0",
        "outline-variant": "#bbcabf",
        "primary-container": "#10b981",
        "on-secondary-fixed-variant": "#3f465c",
        "on-secondary-container": "#001a41",
        "surface-container-low": "#f2f4f7",
        "surface-container-high": "#e1e3e7",
        "on-surface-variant": "#404943",
        "on-surface": "#191c1a",
        surface: "#f8faf9",
      },
    },
  },
  plugins: [],
}
