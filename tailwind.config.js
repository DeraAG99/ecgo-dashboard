import { type Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        empty: "#9ca3af",
        charging: "#3b82f6",
        full: "#22c55e",
        locked: "#ef4444",
        fault: "#f97316",
        online: "#22c55e",
        offline: "#6b7280",
        maintenance: "#a16207",
      },
    },
  },
  plugins: [],
} satisfies Config