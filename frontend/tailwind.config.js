/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',// Permite alternar modo oscuro usando la clase 'dark' en el tag <html>
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        card: 'var(--bg-card)',
        sidebar: 'var(--bg-sidebar)',
        header: 'var(--bg-header)',
        
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          glow: 'var(--accent-glow)',
          strong: 'var(--accent-glow-strong)',
        },
        border: 'var(--border)',
        tableHover: 'var(--table-hover)',
        inputBg: 'var(--input-bg)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}