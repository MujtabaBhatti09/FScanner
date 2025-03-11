/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",  // Detects Tailwind usage in components
    "./common/**/*.{js,jsx,ts,tsx}",  // Detects Tailwind usage in components
    "./screens/**/*.{js,jsx,ts,tsx}",     // Detects Tailwind in screens/pages
    "./layouts/**/*.{js,jsx,ts,tsx}",     // Detects Tailwind in layout files
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}