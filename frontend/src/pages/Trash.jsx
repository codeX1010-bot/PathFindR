import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trash2, RotateCcw, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api` : '/api';

const toTitleCase = (str) => {
    if (!str) return '';
    // Strip redundant leading/trailing quotes and apply title case
    const cleanStr = str.trim().replace(/^["']|["']$/g, '');
    return cleanStr.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();
};

export default function Trash() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [roadmaps, setRoadmaps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrash = async () => {
            try {
                const res = await axios.get(`${API_BASE}/trash`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRoadmaps(res.data.roadmaps || []);
            } catch (err) {
                console.error('Failed to fetch trash', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrash();
    }, [token]);

    const handleRestore = async (e, id) => {
        e.stopPropagation();
        try {
            await axios.post(`${API_BASE}/roadmaps/${id}/restore`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoadmaps(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            console.error('Failed to restore', err);
        }
    };

    const handlePermanentDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Permanently delete this roadmap? This cannot be undone.')) return;
        try {
            await axios.delete(`${API_BASE}/roadmaps/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoadmaps(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const getDaysLeft = (deletedAt) => {
        const msLeft = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(deletedAt).getTime());
        return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    };

    return (
        <div className="min-h-screen py-10 px-4 md:px-8 w-full">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
                        <Trash2 className="text-red-400" size={28} />
                        Trash
                    </h1>
                    <p className="text-text-secondary mt-1">Roadmaps here are permanently deleted after 7 days.</p>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="loader border-[3px] !w-12 !h-12"></div>
                </div>
            ) : roadmaps.length === 0 ? (
                <div className="glass-card text-center py-16 border-dashed border-2">
                    <Trash2 className="w-16 h-16 text-text-secondary opacity-30 mx-auto mb-4" />
                    <h3 className="text-xl font-heading mb-2">Trash is empty</h3>
                    <p className="text-text-secondary">Deleted roadmaps will appear here for 7 days.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {roadmaps.map((map) => (
                        <motion.div
                            key={map._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 flex flex-col opacity-70 hover:opacity-100 transition-opacity relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                                    In Trash
                                </span>
                                <span className="flex items-center text-xs text-text-secondary gap-1">
                                    <Clock size={12} />
                                    {getDaysLeft(map.deleted_at)}d left
                                </span>
                            </div>

                            <h3 className="text-lg font-heading font-semibold mb-2 line-clamp-2 leading-tight opacity-50 line-through">
                                {toTitleCase(map.original_prompt)}
                            </h3>

                            <p className="text-sm text-text-secondary mb-6">
                                {map.nodes?.length} milestones
                            </p>

                            <div className="w-full flex gap-3 mt-auto">
                                <button
                                    onClick={(e) => handleRestore(e, map._id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-brand/10 text-brand border border-brand/30 hover:bg-brand/20 font-medium text-sm transition-colors"
                                >
                                    <RotateCcw size={15} /> Restore
                                </button>
                                <button
                                    onClick={(e) => handlePermanentDelete(e, map._id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 font-medium text-sm transition-colors"
                                >
                                    <X size={15} /> Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
