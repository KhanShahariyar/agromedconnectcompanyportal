/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        bengali: ['"Noto Sans Bengali"', '"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      // Every colour resolves through a custom property, so src/design is the
      // only place a hex literal is allowed to live (audited in Task 26).
      colors: {
        primary: { DEFAULT: 'var(--primary)', hover: 'var(--primary-hover)' },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        base: 'var(--base)',
        panel: 'var(--panel)',
        sunken: 'var(--sunken)',
        line: 'var(--border)',
        ink: { DEFAULT: 'var(--ink)', soft: 'var(--ink-soft)', faint: 'var(--ink-faint)' },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,42,32,0.05), 0 1px 0 rgba(27,42,32,0.04)',
        lift: '0 6px 20px rgba(27,42,32,0.10)',
      },
      borderRadius: { card: '10px' },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [],
}
