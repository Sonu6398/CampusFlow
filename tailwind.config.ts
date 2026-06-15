import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1419",
        panel: "#161e2b",
        accent: "#ff9900",
      },
    },
  },
  plugins: [],
};
export default config;
