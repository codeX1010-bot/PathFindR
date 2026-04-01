import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, ArrowRight, BrainCircuit, ArrowLeft } from 'lucide-react';
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
            setError(err.response?.data?.error || "Failed to generate roadmap. Groq might be busy.");
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 md:px-8 w-full relative overflow-hidden">

            {/* Background glows */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <AnimatePresence mode="wait">
                {!isGenerating ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-2xl mx-auto z-10 relative"
                    >
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 gradient-text">
                                What do you want to learn?
                            </h1>
                            <p className="text-text-secondary text-lg max-w-xl mx-auto">
                                Describe any skill or topic. Our AI will instantly map out a curated, step-by-step curriculum.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleGenerate} className="glass-card p-8 space-y-6">
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
                                    {[
                                        { label: 'Visual', sub: 'Video & Articles', value: 'Visual (Video/Articles)' },
                                        { label: 'Hands-on', sub: 'Projects & Practice', value: 'Hands-on (Projects)' },
                                        { label: 'Mixed', sub: 'Both formats', value: 'Mixed (Both)' },
                                    ].map((style) => (
                                        <button
                                            key={style.value}
                                            type="button"
                                            onClick={() => setLearningStyle(style.value)}
                                            className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all border-2 flex flex-col items-center gap-1 ${
                                                learningStyle === style.value
                                                    ? 'border-brand bg-brand/15 text-brand shadow-lg shadow-brand/20'
                                                    : 'border-gray-300 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-600 dark:text-text-secondary hover:border-brand/40 hover:text-brand'
                                            }`}
                                        >
                                            <span>{style.label}</span>
                                            <span className="text-xs font-normal opacity-60">{style.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
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
                        className="flex flex-col items-center justify-center min-h-[60vh] z-10"
                    >
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-brand blur-2xl opacity-40 animate-pulse rounded-full"></div>
                            <BrainCircuit size={64} className="text-brand relative z-10 animate-bounce" />
                        </div>

                        <h2 className="text-2xl font-heading font-bold mb-3 gradient-text">Consulting the AI...</h2>
                        <p className="text-text-secondary animate-pulse text-lg">
                            Synthesizing milestones for {prompt.slice(0, 30)}{prompt.length > 30 ? '...' : ''}
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

