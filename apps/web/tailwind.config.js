/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta principal do projeto
        primary: {
          50: '#e8eef5',
          100: '#c5d4e5',
          200: '#9eb8d3',
          300: '#779cc1',
          400: '#5986b4',
          500: '#3b70a7',
          600: '#2d5a8a',
          700: '#1e3a5f',
          800: '#152a46',
          900: '#0c1a2e'
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        }
      },
      fontFamily: {
        // Inter para textos gerais, JetBrains Mono para codigos e timestamps
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
