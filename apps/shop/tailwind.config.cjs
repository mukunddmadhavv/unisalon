const baseConfig = require("@unisalon/config/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme?.extend,
      colors: {
        ...baseConfig.theme?.extend?.colors,
        "on-background": "#1a1c1d",
        "surface-container-highest": "#e2e2e4",
        "surface-container-high": "#e8e8ea",
        "surface-container-low": "#f3f3f5",
        "secondary-fixed-dim": "#ffb59d",
        "on-primary-fixed-variant": "#92001c",
        "error": "#ba1a1a",
        "outline": "#8f6f6e",
        "tertiary-fixed-dim": "#c8c5cc",
        "surface-dim": "#d9dadc",
        "inverse-on-surface": "#f0f0f2",
        "on-secondary-container": "#fffbff",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "secondary-container": "#d24200",
        "on-secondary": "#ffffff",
        "on-tertiary-fixed": "#1b1b20",
        "surface-tint": "#bb162c",
        "on-error": "#ffffff",
        "on-surface-variant": "#5b403f",
        "primary": "#b7122a",
        "tertiary-fixed": "#e4e1e8",
        "surface": "#f9f9fb",
        "on-secondary-fixed-variant": "#832600",
        "surface-variant": "#e2e2e4",
        "inverse-primary": "#ffb3b1",
        "surface-container": "#eeeef0",
        "surface-bright": "#f9f9fb",
        "tertiary-container": "#75747a",
        "on-secondary-fixed": "#390c00",
        "error-container": "#ffdad6",
        "on-primary-fixed": "#410007",
        "on-tertiary-fixed-variant": "#46464c",
        "tertiary": "#5c5b61",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#fffbff",
        "primary-fixed": "#ffdad8",
        "inverse-surface": "#2f3132",
        "secondary-fixed": "#ffdbd0",
        "primary-container": "#db313f",
        "secondary": "#a83300",
        "on-primary-container": "#fffbff",
        "on-surface": "#1a1c1d",
        "outline-variant": "#e4bebc",
        "background": "#f9f9fb",
        "surface-container-lowest": "#ffffff",
        "primary-fixed-dim": "#ffb3b1",
        
        // App-specific semantic overrides mapped to Vibrant palette
        "brand-gold": "#b7122a", // map old gold primary to new crimson red
        "brand-slate": "#1a1c1d",
        "brand-teal": "#a83300",
        
        // Custom surface mappings to match Stitch
        "surface-card": "#ffffff",
        "surface-border": "#E0E0E5",
      },
      borderRadius: {
        ...baseConfig.theme?.extend?.borderRadius,
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        ...baseConfig.theme?.extend?.spacing,
        "gutter": "16px",
        "stack-lg": "40px",
        "stack-md": "20px",
        "margin-desktop": "40px",
        "stack-sm": "8px",
        "base": "8px",
        "margin-mobile": "16px",
        "container-max": "1440px",
        "card-gap": "20px",
        "container-padding": "24px",
        "section-margin": "40px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Lexend", "sans-serif"],
      }
    }
  }
};
