module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        purple: {
          50: '#f5f3ff',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          900: '#4c1d95',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: (theme) => ({
        dark: {
          css: {
            '--tw-prose-body': theme('colors.gray.200'),
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-links': theme('colors.purple.300'),
            '--tw-prose-quotes': theme('colors.gray.200'),
            '--tw-prose-quote-borders': theme('colors.gray.700'),
            '--tw-prose-code': theme('colors.green.300'),
            '--tw-prose-pre-bg': theme('colors.gray.800'),
            '--tw-prose-pre-code': theme('colors.gray.100'),
            '--tw-prose-th-borders': theme('colors.gray.600'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};