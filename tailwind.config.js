/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#003645",
        "secondary": "#006876",
        "secondary-container": "#58e6ff",
        "on-secondary-container": "#006573",
        "surface": "#f9f9fb",
        "on-surface": "#1a1c1d",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f5",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e2e2e4",
        "background": "#f9f9fb",
        "on-background": "#1a1c1d",
        "outline": "#71787c",
        "outline-variant": "#c0c8cc",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      }
    },
  },
  plugins: [],
}
