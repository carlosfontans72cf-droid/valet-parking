import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        valet: {
          blue: '#3498DB',
          green: '#2ECC71',
          yellow: '#F1C40F',
          orange: '#E67E22',
          brown: '#8B4513',
          red: '#E74C3C',
          purple: '#9B59B6',
          gray: '#95A5A6',
          dark: '#2C3E50',
        },
      },
    },
  },
  plugins: [],
};
export default config;
