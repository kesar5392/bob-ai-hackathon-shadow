/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names so unused styles are
  // purged from the production build.
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
