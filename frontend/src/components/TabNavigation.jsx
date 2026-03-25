import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, Users, Plus, Trash2, Sun, Moon } from 'lucide-react';

export default function TabNavigation() {
    const location = useLocation();
    const navigate = useNavigate();

    // Theme state
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('pf-theme');
        return saved ? saved === 'dark' : true;
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('pf-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Active tab detection
    let activeTab = 'dashboard';
    if (location.pathname.includes('/community')) activeTab = 'community';
    else if (location.pathname.includes('/new-roadmap')) activeTab = 'generate';
    else if (location.pathname.includes('/trash')) activeTab = 'trash';

    const getTabClass = (tabName) => {
        const isActive = activeTab === tabName;
        return `flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 transition-colors duration-200 ${
            isActive
                ? 'bg-brand/10 text-brand border-brand'
                : 'text-text-secondary border-transparent hover:bg-white/5 hover:text-white'
        }`;
    };

    return (
        <div className="w-full border-b border-white/10 mb-8 pt-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-4 px-4 md:px-8 w-full">

                {/* Logo */}
                <div
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-3 mr-4 md:mr-8 cursor-pointer hover:opacity-80 transition-opacity"
                    title="PathFindR Home"
                >
                    <img src="/logo.png" alt="PathFindR Logo" className="w-9 h-9 rounded-xl shadow-[0_0_10px_rgba(236,72,153,0.3)] border border-white/10" />
                    <span className="font-heading font-bold text-xl text-white tracking-tight hidden sm:block">PathFindR</span>
                </div>

                <button onClick={() => navigate('/dashboard')} className={getTabClass('dashboard')}>
                    <Map size={18} />
                    My Learning Paths
                </button>

                <button onClick={() => navigate('/community')} className={getTabClass('community')}>
                    <Users size={18} />
                    Community Hub
                </button>

                <button onClick={() => navigate('/new-roadmap')} className={getTabClass('generate')}>
                    <Plus size={18} />
                    Create New Path
                </button>

                <button onClick={() => navigate('/trash')} className={getTabClass('trash')}>
                    <Trash2 size={18} />
                    Trash
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Dark / Light Toggle */}
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </div>
    );
}
