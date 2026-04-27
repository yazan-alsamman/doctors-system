/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Clinical Clarity palette
        surface: {
          DEFAULT: "#f7f9fb",
          dim: "#d8dadc",
          bright: "#f7f9fb",
          base: "#ffffff",
          low: "#f2f4f6",
          mid: "#eceef0",
          high: "#e6e8ea",
          highest: "#e0e3e5",
        },
        ink: {
          DEFAULT: "#191c1e",
          variant: "#404850",
          mute: "#707881",
          line: "#bfc7d1",
        },
        primary: {
          DEFAULT: "#005d90",
          hover: "#0077b6",
          soft: "#cde5ff",
          fg: "#ffffff",
        },
        secondary: {
          DEFAULT: "#126c40",
          soft: "#a1f5bc",
          fg: "#ffffff",
        },
        tertiary: {
          DEFAULT: "#3b5e65",
          soft: "#c3e9f1",
          fg: "#ffffff",
        },
        danger: {
          DEFAULT: "#ba1a1a",
          soft: "#ffdad6",
          fg: "#ffffff",
        },
        warn: {
          DEFAULT: "#c2780b",
          soft: "#ffe2bf",
        },
      },
      fontFamily: {
        display: ['Cairo', 'Manrope', 'ui-sans-serif', 'system-ui'],
        sans: ['"IBM Plex Sans Arabic"', 'Inter', 'ui-sans-serif', 'system-ui'],
        latin: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        card: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        pop: '0px 12px 32px rgba(0, 0, 0, 0.1)',
        focus: '0 0 0 4px rgba(0, 93, 144, 0.15)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
