import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F59E0B',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        charcoal: {
          DEFAULT: '#111111',
          50: '#2a2a2a',
          100: '#222222',
          200: '#1a1a1a',
          300: '#151515',
          400: '#111111',
          500: '#0d0d0d',
          600: '#0a0a0a',
          900: '#050505',
        }
      },
    },
  },
  plugins: [],
};
export default config;
