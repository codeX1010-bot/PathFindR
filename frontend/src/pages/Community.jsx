import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, LayoutDashboard, GitFork, Eye, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api` : '/api';

export default function Community() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [roadmaps, setRoadmaps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isForking, setIsForking] = useState(null); // Track ID being forked

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
        e.stopPropagation(); // prevent clicking the card underneath
        if (!token) {
            navigate('/login');
            return;
        }

        setIsForking(roadmap._id);
        try {
            await axios.post(`${API_BASE}/roadmaps/${roadmap._id}/fork`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Redirect to dashboard to see their newly forked roadmap
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to fork roadmap", err);
            alert("Failed to fork. Please try again.");
            setIsForking(null);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 md:px-8 max-w-6xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
                        <Users className="text-brand" size={32} />
                        Community Hub
                    </h1>
                    <p className="text-text-secondary mt-1">Discover and fork learning paths created by others.</p>
                </div>
                <Link
                    to="/dashboard"
                    className="flex items-center gap-2 btn-secondary border-brand/30 text-brand hover:bg-brand/10"
                >
                    <LayoutDashboard size={18} />
                    <span>My Dashboard</span>
                </Link>
            </header>

            {/* Main Content */}
            <main>
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="loader border-[3px] !w-12 !h-12"></div>
                    </div>
                ) : roadmaps.length === 0 ? (
                    <div className="glass-card text-center py-16 border-dashed border-2">
                        <Users className="w-16 h-16 text-text-secondary opacity-50 mx-auto mb-4" />
                        <h3 className="text-xl font-heading mb-2">No Community Roadmaps Found</h3>
                        <p className="text-text-secondary mb-6">Be the first to publish a personalized learning path!</p>
                        <Link to="/new-roadmap" className="btn-primary inline-flex !w-auto !py-3 !px-8 shadow-brand/20">
                            Create a Roadmap to Share
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roadmaps.map((map) => {
                            const totalNodes = map.nodes.length;

                            return (
                                <div key={map._id} className="glass-card p-6 flex flex-col items-start hover:-translate-y-1 transition-transform group relative overflow-hidden">
                                    {/* Glowing hover effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex justify-between w-full mb-3 relative z-10">
                                        <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-md">
                                            Public Path
                                        </span>
                                        <span className="flex items-center text-xs text-text-secondary gap-1">
                                            <Clock size={12} />
                                            {new Date(map.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-heading font-semibold mb-2 line-clamp-2 leading-tight relative z-10">
                                        "{map.original_prompt}"
                                    </h3>

                                    <p className="text-sm text-text-secondary mb-8 relative z-10">
                                        Contains {totalNodes} distinct AI-curated milestones.
                                    </p>

                                    <div className="w-full mt-auto flex gap-3 relative z-10">
                                        <button
                                            onClick={() => navigate('/roadmap', { state: { roadmap: map } })}
                                            className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2"
                                        >
                                            <Eye size={16} /> Preview
                                        </button>

                                        <button
                                            onClick={(e) => handleFork(e, map)}
                                            disabled={isForking === map._id}
                                            className="flex-1 bg-brand text-white border border-brand/50 font-bold rounded-lg flex items-center justify-center gap-2 py-2 hover:bg-brand-hover transition-colors disabled:opacity-50"
                                        >
                                            {isForking === map._id ? (
                                                <div className="w-4 h-4 border-2 border-white/50 rounded-full border-t-white animate-spin"></div>
                                            ) : (
                                                <>
                                                    <GitFork size={16} /> Fork
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
