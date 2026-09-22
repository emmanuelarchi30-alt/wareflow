/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          start: '#0B1220',
          mid: '#16324F',
          end: '#0B1220',
        },
        accent: {
          orange: '#FF6B1A',
          yellow: '#FFC81A',
          blue: '#2E9CFF',
          steel: '#7C8DA6',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.14)',
          border: 'rgba(255, 255, 255, 0.18)',
          highlight: 'rgba(255, 255, 255, 0.35)',
        },
        status: {
          critical: '#FF3B3B',
          warning: '#FFC81A',
          good: '#2ED47A',
        },
        text: {
          primary: '#F5F7FA',
          secondary: '#A9B4C4',
        },
      },
      backgroundImage: {
        'bg-gradient': 'linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-mid), var(--bg-gradient-end))',
      },
      animation: {
        'gradient-shift': 'gradientShift 20s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(46, 156, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(46, 156, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};