import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, ArrowRight, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api` : '/api';

export default function RoadmapFlow() {
    const [prompt, setPrompt] = useState('');
    const [learningStyle, setLearningStyle] = useState('Mixed');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError('');

        try {
            const response = await axios.post(`${API_BASE}/generate_roadmap`, {
                prompt,
                learning_style: learningStyle
            });

            const newRoadmap = {
                _id: response.data.roadmap_id,
                original_prompt: prompt,
                nodes: response.data.nodes,
                completed_node_ids: []
            };

            navigate('/roadmap', { state: { roadmap: newRoadmap } });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to generate roadmap. Gemini API might be busy.");
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-accent/5 rounded-full blur-[120px]" />

            <AnimatePresence mode="wait">
                {!isGenerating ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="glass-card w-full max-w-2xl z-10 p-8 md:p-12"
                    >
                        <div className="mb-8 text-center">
                            <div className="flex justify-center mb-6">
                                <img src="/logo.png" alt="PathFindR Logo" className="w-20 h-20 rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.3)] border border-white/10" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">What do you want to learn?</h1>
                            <p className="text-text-secondary text-lg">
                                Type anything. Our AI will instantly map out a curated curriculum from absolute scratch.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div>
                                <textarea
                                    className="input-field min-h-[120px] text-lg leading-relaxed resize-none p-5"
                                    placeholder="e.g. 'How to build a SaaS marketing website using Next.js and Tailwind'"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    maxLength={150}
                                    required
                                    autoFocus
                                />
                                <div className="flex justify-end mt-2">
                                    <span className="text-xs text-text-secondary">{prompt.length} / 150</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-heading font-medium mb-3">Preferred Learning Style</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Visual (Video/Articles)', 'Hands-on (Projects)', 'Mixed (Both)'].map((style) => (
                                        <button
                                            key={style}
                                            type="button"
                                            onClick={() => setLearningStyle(style)}
                                            className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${learningStyle === style
                                                ? 'bg-brand/20 border-brand/50 text-brand outline outline-1 outline-brand/30 shadow-lg shadow-brand/10'
                                                : 'bg-black/20 border-white/5 text-text-secondary hover:bg-black/40'
                                                } border`}
                                        >
                                            {style.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="btn-primary py-5 text-xl shadow-brand/25"
                                    disabled={!prompt.trim()}
                                >
                                    Generate Curriculum
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center z-10"
                    >
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-brand blur-2xl opacity-40 animate-pulse rounded-full"></div>
                            <BrainCircuit size={64} className="text-brand relative z-10 animate-bounce" />
                        </div>

                        <h2 className="text-2xl font-heading font-bold mb-3 gradient-text">Consulting the AI...</h2>
                        <p className="text-text-secondary animate-pulse text-lg">
                            Synthesizing milestones for "{prompt.slice(0, 30)}{prompt.length > 30 ? '...' : ''}"
                        </p>

                        <div className="mt-12 flex items-center justify-center gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2.5 h-2.5 rounded-full bg-brand"
                                    animate={{ y: ["0%", "-100%", "0%"] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
