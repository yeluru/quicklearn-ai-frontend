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
      padding: {
        '1px': '1px', // Add 1px padding utility
        '2': '7px', // Reduce default '2' padding from 8px to 7px (1px less)
        '3': '11px', // Reduce default '3' padding from 12px to 11px
        '4': '15px', // Reduce default '4' padding from 16px to 15px
        '5': '19px', // Reduce default '5' padding from 20px to 19px
        '6': '23px', // Reduce default '6' padding from 24px to 23px
        '8': '31px', // Reduce default '8' padding from 32px to 31px
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
  plugins: [
    require('@tailwindcss/typography'),
    // Add custom scrollbar styling
    function({ addUtilities }) {
      addUtilities({
        '.custom-scrollbar': {
          'scrollbar-width': 'thin',
          'scrollbar-color': `${theme => theme('colors.purple.400')} ${theme => theme('colors.gray.800')}`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme => theme('colors.gray.800'),
            'border-radius': '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme => theme('colors.purple.400'),
            'border-radius': '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme => theme('colors.purple.300'),
          },
        },
      });
    },
  ],
};