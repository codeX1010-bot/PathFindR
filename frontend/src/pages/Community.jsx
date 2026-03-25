import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, GitFork, Eye, Clock, Lock, Sparkles, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api` : '/api';

const toTitleCase = (str) => {
    if (!str) return '';
    // Strip redundant leading/trailing quotes and apply title case
    const cleanStr = str.trim().replace(/^["']|["']$/g, '');
    return cleanStr.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();
};

// Dummy example cards to showcase the feature
const DUMMY_ROADMAPS = [
    { title: 'Full Stack Web Development', milestones: 12, author: 'Alex K.', category: 'Engineering', color: 'from-brand/20 to-accent/10' },
    { title: 'Machine Learning & AI Fundamentals', milestones: 10, author: 'Priya S.', category: 'Data Science', color: 'from-accent/20 to-brand/10' },
    { title: 'UI/UX Design Mastery', milestones: 8, author: 'Jordan M.', category: 'Design', color: 'from-purple-500/20 to-brand/10' },
];

export default function Community() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [roadmaps, setRoadmaps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isForking, setIsForking] = useState(null);

    useEffect(() => {
        const fetchCommunityRoadmaps = async () => {
            try {
                const response = await axios.get(`${API_BASE}/community/roadmaps`);
                setRoadmaps(response.data.roadmaps);
            } catch (err) {
                console.error("Failed to fetch community roadmaps", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCommunityRoadmaps();
    }, []);

    const handleFork = async (e, roadmap) => {
        e.stopPropagation();
        if (!token) { navigate('/login'); return; }
        setIsForking(roadmap._id);
        try {
            await axios.post(`${API_BASE}/roadmaps/${roadmap._id}/fork`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to fork roadmap", err);
            setIsForking(null);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 md:px-8 w-full">
            {/* Header */}
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
                        <Users className="text-brand" size={32} />
                        Community Hub
                    </h1>
                    <p className="text-text-secondary mt-1">Discover and fork learning paths created by others.</p>
                </div>
            </header>

            {/* Coming Soon Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card mb-10 p-8 text-center relative overflow-hidden border border-brand/30"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-accent/5 to-brand/5 animate-pulse pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex justify-center mb-4">
                        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-brand/20 text-brand px-4 py-2 rounded-full border border-brand/30">
                            <Sparkles size={14} />
                            Coming Soon
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3 gradient-text">
                        The Community is Almost Here!
                    </h2>
                    <p className="text-text-secondary max-w-xl mx-auto text-base">
                        Soon you'll be able to share your AI-generated curriculums, fork paths from others,
                        and discover what the world is learning. Here's a preview:
                    </p>
                    <div className="flex justify-center gap-3 mt-6">
                        <span className="flex items-center gap-1.5 text-sm text-text-secondary bg-white/5 px-3 py-1.5 rounded-full">
                            <Rocket size={14} className="text-brand" /> Share your learning paths
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-text-secondary bg-white/5 px-3 py-1.5 rounded-full">
                            <GitFork size={14} className="text-accent" /> Fork & customize others'
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Dummy Preview Cards */}
            <div className="mb-6">
                <h3 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                    <Lock size={16} className="text-brand" />
                    Preview — Example Paths
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-10">
                    {DUMMY_ROADMAPS.map((dummy, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`glass-card p-6 relative overflow-hidden select-none`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${dummy.color} pointer-events-none`} />
                            {/* Blur lock overlay */}
                            <div className="absolute inset-0 backdrop-blur-[1px] bg-black/10 flex items-center justify-center z-20 rounded-3xl opacity-0 hover:opacity-100 transition-opacity">
                                <span className="bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2">
                                    <Lock size={12} /> Available Soon
                                </span>
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-md">
                                        {dummy.category}
                                    </span>
                                    <Lock size={14} className="text-text-secondary opacity-50" />
                                </div>
                                <h3 className="text-lg font-heading font-semibold mb-2 leading-tight">
                                    {dummy.title}
                                </h3>
                                <p className="text-sm text-text-secondary mb-5">
                                    {dummy.milestones} AI-curated milestones · by {dummy.author}
                                </p>
                                <div className="w-full flex gap-3">
                                    <button disabled className="flex-1 btn-secondary opacity-40 text-sm py-2 flex items-center justify-center gap-1.5 cursor-not-allowed">
                                        <Eye size={14} /> Preview
                                    </button>
                                    <button disabled className="flex-1 bg-brand/30 text-brand border border-brand/20 font-bold rounded-lg flex items-center justify-center gap-2 py-2 text-sm opacity-40 cursor-not-allowed">
                                        <GitFork size={14} /> Fork
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Real Community Roadmaps (if any) */}
            <main>
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="loader border-[3px] !w-10 !h-10"></div>
                    </div>
                ) : roadmaps.length > 0 && (
                    <>
                        <h3 className="text-lg font-heading font-semibold mb-4">Live Paths</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {roadmaps.map((map) => (
                                <div key={map._id} className="glass-card p-6 flex flex-col items-start hover:-translate-y-1 transition-transform group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between w-full mb-3 relative z-10">
                                        <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-md">Public Path</span>
                                        <span className="flex items-center text-xs text-text-secondary gap-1">
                                            <Clock size={12} />
                                            {new Date(map.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-heading font-semibold mb-2 line-clamp-2 leading-tight relative z-10">
                                        {toTitleCase(map.original_prompt)}
                                    </h3>
                                    <p className="text-sm text-text-secondary mb-8 relative z-10">
                                        Contains {map.nodes.length} distinct AI-curated milestones.
                                    </p>
                                    <div className="w-full mt-auto flex gap-3 relative z-10">
                                        <button onClick={() => navigate('/roadmap', { state: { roadmap: map } })} className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2">
                                            <Eye size={16} /> Preview
                                        </button>
                                        <button
                                            onClick={(e) => handleFork(e, map)}
                                            disabled={isForking === map._id}
                                            className="flex-1 bg-brand text-white border border-brand/50 font-bold rounded-lg flex items-center justify-center gap-2 py-2 hover:bg-brand-hover transition-colors disabled:opacity-50"
                                        >
                                            {isForking === map._id ? <div className="w-4 h-4 border-2 border-white/50 rounded-full border-t-white animate-spin" /> : <><GitFork size={16} /> Fork</>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

