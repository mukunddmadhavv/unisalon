const baseConfig = require("@unisalon/config/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
};
