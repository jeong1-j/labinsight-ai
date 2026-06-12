import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#001A70",
          foreground: "#FFFFFF"
        },
        science: {
          DEFAULT: "#1F4FCB",
          foreground: "#FFFFFF"
        },
        accent: {
          DEFAULT: "#F7E600",
          foreground: "#111827"
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: {
          DEFAULT: "#EEF2F7",
          foreground: "#6B7280"
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827"
        }
      },
      boxShadow: {
        portal: "0 10px 30px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      }
    }
  },
  plugins: []
};

export default config;
