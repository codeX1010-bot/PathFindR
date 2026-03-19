/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-dark': '#0b0f19',
                'bg-card': 'rgba(17, 24, 39, 0.7)',
                'text-primary': '#f8fafc',
                'text-secondary': '#94a3b8',
                'brand': '#2dd4bf',      // Teal-400
                'brand-hover': '#14b8a6', // Teal-500
                'accent': '#38bdf8',     // Sky-400
                'success': '#10b981',    // Emerald-500
            },
            fontFamily: {
                heading: ['Plus Jakarta Sans', 'sans-serif'],
                body: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
