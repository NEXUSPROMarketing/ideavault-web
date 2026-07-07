import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#faf7f2",
        ink: {
          DEFAULT: "#1c1a16",
          soft: "#57524a",
          faint: "#8a8375",
        },
        terracotta: {
          DEFAULT: "#c2571b",
          deep: "#a34412",
          tint: "#f9ebe0",
        },
        moss: {
          DEFAULT: "#3d5a3d",
          tint: "#ecf1ec",
        },
        line: "#e8e1d5",
      },
      fontFamily: {
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 26, 22, 0.04), 0 4px 16px rgba(28, 26, 22, 0.05)",
        lift: "0 2px 4px rgba(28, 26, 22, 0.06), 0 10px 28px rgba(28, 26, 22, 0.09)",
      },
      maxWidth: {
        shell: "1140px",
      },
    },
  },
  plugins: [],
};

export default config;
