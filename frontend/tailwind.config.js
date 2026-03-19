/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-dark': '#0f172a',
                'bg-card': 'rgba(30, 41, 59, 0.7)',
                'text-primary': '#f8fafc',
                'text-secondary': '#94a3b8',
                'brand': '#3b82f6',
                'brand-hover': '#2563eb',
                'accent': '#8b5cf6',
                'success': '#10b981',
            },
            fontFamily: {
                heading: ['Plus Jakarta Sans', 'sans-serif'],
                body: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
