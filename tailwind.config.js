// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // enables dark mode via the 'dark' class
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'sans-serif'],
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
