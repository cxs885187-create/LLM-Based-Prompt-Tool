/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "Noto Sans SC", "sans-serif"],
        body: ["Manrope", "Noto Sans SC", "sans-serif"]
      },
      colors: {
        deep: "#0f172a",
        mist: "#f1f5f9",
        mint: "#34d399",
        coral: "#fb7185",
        amber: "#f59e0b"
      },
      boxShadow: {
        float: "0 18px 40px rgba(2, 6, 23, 0.16)"
      }
    }
  },
  plugins: []
};
