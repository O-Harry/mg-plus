/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mg: {
          primary: '#1F3864',
          accent: '#F57C00',
          success: '#2E7D32',
          danger: '#C62828',
        },
      },
      fontFamily: {
        sans: [
          'Yu Gothic',
          'YuGothic',
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Meiryo',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
