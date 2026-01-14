import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-roboto)", "sans-serif"],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        material: {
          "primary": "#6750A4",          // M3 Purple 40
          "primary-content": "#FFFFFF",  // M3 White
          "secondary": "#625B71",        // M3 Purple Grey 40
          "secondary-content": "#FFFFFF",
          "accent": "#7D5260",           // M3 Pink 40
          "accent-content": "#FFFFFF",
          "neutral": "#1D1B20",          // M3 Grey 10
          "neutral-content": "#E6E1E5",
          "base-100": "#FEF7FF",         // M3 Surface
          "base-200": "#F3EDF7",         // M3 Surface Container Low
          "base-300": "#EADDFF",         // M3 Primary Container (usado para destaques)
          "base-content": "#1D1B20",     // M3 On Surface
          
          "--rounded-box": "1.5rem",     // M3 usa bordas bem arredondadas (24px)
          "--rounded-btn": "9999px",     // Botões Pill shape
          "--rounded-badge": "9999px",   
          "--animation-btn": "0.2s",     // Animações mais rápidas e sutis
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.98",
          "--border-btn": "0px",         // M3 buttons geralmente não tem borda, usam cor de superfície
        },
      },
    ],
  },
};
export default config;
