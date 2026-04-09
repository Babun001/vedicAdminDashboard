/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        cosmos: {
          50:  "#f5f0ff",
          100: "#ede4ff",
          200: "#d3bfff",
          300: "#b48fff",
          400: "#9155ff",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#2e1065",
          950: "#1a0533",
        },
        gold: {
          300: "#fde68a",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        ember: {
          400: "#f87171",
          500: "#ef4444",
        },
        jade: {
          400: "#34d399",
          500: "#10b981",
        },
        ink: {
          50:  "#f8f7ff",
          100: "#f0eeff",
          200: "#e2deff",
          800: "#1e1b2e",
          900: "#13111f",
          950: "#0a0812",
        }
      },
      backgroundImage: {
        "starfield": "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.08) 0%, transparent 40%), radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.06) 0%, transparent 40%)",
        "card-glow": "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(245,158,11,0.05) 100%)",
      },
      boxShadow: {
        "cosmos": "0 0 0 1px rgba(124,58,237,0.2), 0 4px 24px rgba(124,58,237,0.12)",
        "gold": "0 0 0 1px rgba(245,158,11,0.3), 0 4px 24px rgba(245,158,11,0.1)",
        "glow": "0 0 40px rgba(124,58,237,0.3)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "spin-slow": "spin 20s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
}
