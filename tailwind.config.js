/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
import daisyuiThemes from "daisyui/src/theming/themes.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#4f46e5",
        brand: {
          50: "#f0f5ff",
          100: "#e0eaff",
          200: "#c7d9ff",
          300: "#a4beff",
          400: "#7e9cff",
          500: "#5b7cfd",
          600: "#4860f0",
          700: "#3a4bdc",
          800: "#3140b3",
          900: "#2d398d",
        },
      },
      animation: {
        "bounce-slow": "bounce 3s linear infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          ...daisyuiThemes["light"],
          primary: "#4860f0",
          secondary: "#6b46c1",
          accent: "#f97316",
          neutral: "#334155",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f1f5f9",
        },
        dark: {
          ...daisyuiThemes["dark"],
          primary: "#5b7cfd",
          secondary: "#9f7aea",
          accent: "#f97316",
          neutral: "#94a3b8",
          "base-100": "#1e293b",
          "base-200": "#0f172a",
          "base-300": "#020617",
        },
      },
    ],
    darkTheme: "dark",
  },
};
