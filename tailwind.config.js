/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: '#FAF9F4',
        ink: {
          DEFAULT: '#211F1A',
          soft: '#514E44',
          faint: '#8B8778',
        },
        line: '#E4E0D3',
        panel: '#FFFFFF',
        moss: {
          50: '#F1F4EC',
          100: '#DEE6CE',
          300: '#9AAE79',
          500: '#5C7239',
          600: '#4A5C2D',
          700: '#3B4A24',
          900: '#242E15',
        },
        clay: {
          50: '#FBF1E7',
          100: '#F2DBBE',
          300: '#D9A363',
          500: '#B8752F',
          600: '#9B5F24',
          700: '#7A4A1C',
        },
        wheat: {
          50: '#FBF6E3',
          100: '#F3E4A8',
          300: '#E2C158',
          500: '#C79B2E',
          600: '#A67F22',
        },
        rust: {
          100: '#F4DAD2',
          500: '#B34C34',
          600: '#973D28',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(33,31,26,0.04), 0 1px 0 rgba(33,31,26,0.04)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
}
