/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface + text tokens. These are CSS variables so the entire site can
        // switch between the dark and light palettes without dark: variants.
        ink: {
          950: token('ink-950'),
          900: token('ink-900'),
          850: token('ink-850'),
          800: token('ink-800'),
          700: token('ink-700'),
          600: token('ink-600'),
          500: token('ink-500'),
          // Fixed near-black for text placed on gold buttons in both themes.
          1000: '#0A0A0B',
        },
        champagne: {
          100: token('gold-100'),
          200: token('gold-200'),
          300: token('gold-300'),
          400: token('gold-400'),
          500: token('gold-500'),
          600: token('gold-600'),
        },
        ivory: token('ivory'),
        stone: token('stone'),
        parchment: token('parchment'),
        // Theme-aware status accents.
        success: token('success'),
        'success-ink': token('success-ink'),
        danger: token('danger'),
        'danger-ink': token('danger-ink'),
        info: token('info'),
        'info-ink': token('info-ink'),
        // Fixed colours for imagery overlays, lightboxes and the hero, which
        // stay cinematic in both themes.
        jet: {
          950: '#08080A',
          900: '#0D0D10',
        },
        pearl: '#F6F2EA',
        goldleaf: '#F0D7A2',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 40px -20px rgba(0,0,0,0.55)',
        lift: '0 30px 60px -30px rgba(0,0,0,0.65)',
      },
      letterSpacing: {
        cap: '0.18em',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        kenburns: {
          '0%': { transform: 'scale(1.02) translate3d(0, 0, 0)' },
          '100%': { transform: 'scale(1.18) translate3d(-1.2%, -0.8%, 0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-out both',
        rise: 'rise 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
        toastIn: 'toastIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
        // 10s of slow movement; the first 3s already produce a clearly visible zoom.
        kenburns: 'kenburns 10s cubic-bezier(0.25, 0.1, 0.25, 1) both',
      },
    },
  },
  plugins: [],
};
