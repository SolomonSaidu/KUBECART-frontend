/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        page: "#f5f7fb",
        panel: "#ffffff",
        card: "#f7f8ff",
        accent: "#ff6b35",
        ink: "#172033",
        deep: "#1a1f2c",
        muted: "#67758b",
        line: "rgba(23, 32, 51, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 18px 40px rgba(18, 24, 38, 0.08)",
        card: "0 18px 28px rgba(18, 24, 38, 0.04)",
      },
      maxWidth: {
        page: "1180px",
      },
    },
  },
  plugins: [],
};
