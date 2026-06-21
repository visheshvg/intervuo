import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1c1b19", soft: "#57564f" },
        paper: "#f4f3ee",
        line: "#e5e3db",
        // accent, kept under the `primary` name so existing usages pick it up
        primary: {
          DEFAULT: "#0d7d6a",
          hover: "#0a6757",
          light: "#e2efeb",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
