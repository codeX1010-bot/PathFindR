import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import generatePDF from 'react-to-pdf';
import { ArrowLeft, ExternalLink, CheckCircle2, Circle, Video, BookOpen, Headphones, Download, Calendar, Share2, Globe, X, Send, MessageCircle, Edit3, Save, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api` : '/api';

const toTitleCase = (str) => {
    if (!str) return '';
    // Strip redundant leading/trailing quotes and apply title case
    const cleanStr = str.trim().replace(/^["']|["']$/g, '');
    return cleanStr.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();
};

const generateGCalLink = (node) => {
    const text = encodeURIComponent(`Learning: ${node.title} `);
    const details = encodeURIComponent(`${node.description} `);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
};

export default function RoadmapView() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const initialRoadmap = location.state?.roadmap;

    const [roadmap, setRoadmap] = useState(initialRoadmap);
    const [completedNodes, setCompletedNodes] = useState(new Set(initialRoadmap?.completed_node_ids || []));
    const [checkedSubItems, setCheckedSubItems] = useState(() => {
        const initialSub = {};
        if (initialRoadmap && initialRoadmap.nodes) {
            initialRoadmap.nodes.forEach(n => {
                if (initialRoadmap.completed_node_ids?.includes(n.id) && n.checklist) {
                    initialSub[n.id] = new Set(n.checklist.map((_, i) => i));
                } else {
                    initialSub[n.id] = new Set();
                }
            });
        }
        return initialSub;
    });
    const [isUpdating, setIsUpdating] = useState(null);
    const [activeMedia, setActiveMedia] = useState({}); // { nodeId: 'video' | 'article' | 'podcast' }
    const [isPublic, setIsPublic] = useState(roadmap?.is_public || false);

    // Edit Mode States
    const [isEditing, setIsEditing] = useState(false);
    const [editNodes, setEditNodes] = useState([]);

    // AI Check-in Quiz States
    const [checkInNode, setCheckInNode] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [checkingAnswer, setCheckingAnswer] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState(null);
    const targetRef = useRef();

    const handleMediaToggle = (nodeId, type) => {
        setActiveMedia(prev => ({ ...prev, [nodeId]: type }));
    };

    // Fetch roadmap details if not provided via location state (e.g., direct access via URL)
    useEffect(() => {
        if (!initialRoadmap && location.state?.roadmapId) {
            const fetchRoadmap = async () => {
                try {
                    const response = await axios.get(`${API_BASE}/roadmaps/${location.state.roadmapId}`);
                    const fetchedRoadmap = response.data;
                    setRoadmap(fetchedRoadmap);
                    setCompletedNodes(new Set(fetchedRoadmap.completed_node_ids || []));
                    setIsPublic(fetchedRoadmap.is_public);

                    const initialSub = {};
                    if (fetchedRoadmap.nodes) {
                        fetchedRoadmap.nodes.forEach(n => {
                            if (fetchedRoadmap.completed_node_ids?.includes(n.id) && n.checklist) {
                                initialSub[n.id] = new Set(n.checklist.map((_, i) => i));
                            } else {
                                initialSub[n.id] = new Set();
                            }
                        });
                    }
                    setCheckedSubItems(initialSub);

                } catch (error) {
                    console.error("Failed to fetch roadmap:", error);
                    navigate('/dashboard'); // Redirect if roadmap not found or error
                }
            };
            fetchRoadmap();
        }
    }, [initialRoadmap, location.state?.roadmapId, navigate]);

    if (!roadmap) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card text-center p-8 max-w-md w-full">
                    <h2 className="text-xl font-heading mb-4">No Roadmap Found</h2>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const nodes = roadmap.nodes;

    // Calculate fractional progress based on checklists
    let totalPossibleItems = 0;
    let totalCompletedItems = 0;

    nodes.forEach(node => {
        const hasChecklist = node.checklist && node.checklist.length > 0;
        const totalNodeItems = hasChecklist ? node.checklist.length : 1;
        totalPossibleItems += totalNodeItems;

        if (completedNodes.has(node.id)) {
            // If the whole node is marked complete, all its items count as complete
            totalCompletedItems += totalNodeItems;
        } else if (hasChecklist && checkedSubItems[node.id]) {
            // Otherwise, add up the individual checked sub-items
            totalCompletedItems += checkedSubItems[node.id].size;
        }
    });

    const progressPercent = Math.round((totalCompletedItems / totalPossibleItems) * 100) || 0;

    const handleEditStart = () => {
        setEditNodes(JSON.parse(JSON.stringify(roadmap.nodes)));
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditNodes([]);
    };

    const handleEditSave = async () => {
        try {
            await axios.put(`${API_BASE}/roadmaps/${roadmap._id}`, { nodes: editNodes });
            setRoadmap(prev => ({ ...prev, nodes: editNodes }));
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save roadmap edits", err);
        }
    };

    const updateEditNode = (index, field, value) => {
        const newNodes = [...editNodes];
        newNodes[index][field] = value;
        setEditNodes(newNodes);
    };

    const deleteEditNode = (index) => {
        setEditNodes(prev => prev.filter((_, i) => i !== index));
    };

    const addEditNode = () => {
        setEditNodes(prev => [...prev, {
            id: `manual-${Date.now()}`,
            title: "New Milestone",
            description: "Describe what needs to be learned here...",
            difficulty_level: 1,
            estimated_time_mins: 30,
            checklist: []
        }]);
    };

    const handleToggleComplete = async (nodeId, forceState = null) => {
        if (isUpdating === nodeId) return; // Prevent double clicks

        setIsUpdating(nodeId);
        const isCurrentlyComplete = completedNodes.has(nodeId);

        // If forceState is provided, use it. Otherwise, toggle current state.
        const apiActionCompleted = forceState !== null ? forceState : !isCurrentlyComplete;

        // If we're already in the desired state, don't ping the API
        if (forceState !== null && isCurrentlyComplete === forceState) {
            setIsUpdating(null);
            return;
        }

        try {
            await axios.post(`${API_BASE}/progress/${roadmap._id}`, {
                node_id: nodeId,
                is_completed: apiActionCompleted
            });

            setCompletedNodes(prev => {
                const next = new Set(prev);
                if (apiActionCompleted) {
                    next.add(nodeId);
                } else {
                    next.delete(nodeId);
                }
                return next;
            });

            // Only update sub-items if this toggle originated from the main button 
            // (i.e. forceState wasn't passed by handleSubCheck)
            if (forceState === null) {
                setCheckedSubItems(prev => {
                    const next = { ...prev };
                    if (apiActionCompleted) {
                        const nodeObj = roadmap.nodes.find(n => n.id === nodeId);
                        next[nodeId] = new Set(nodeObj?.checklist ? nodeObj.checklist.map((_, i) => i) : []);
                    } else {
                        next[nodeId] = new Set();
                    }
                    return next;
                });
            }

        } catch (err) {
            console.error("Failed to update node progress", err);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleSubCheck = (nodeId, itemIndex, totalItems) => {
        if (isUpdating === nodeId) return;

        setCheckedSubItems(prev => {
            const nodeCheckedSet = new Set(prev[nodeId] || []);
            if (nodeCheckedSet.has(itemIndex)) {
                nodeCheckedSet.delete(itemIndex);
            } else {
                nodeCheckedSet.add(itemIndex);
            }

            // In React, state updates are asynchronous.
            // We need to decide right now based on our newly calculated `nodeCheckedSet`
            const allChecked = nodeCheckedSet.size === totalItems;

            // Force the parent node to match the sub-checklist completion state
            handleToggleComplete(nodeId, allChecked);

            // Persist the specific sub-items to the backend
            axios.post(`${API_BASE}/progress/subitem/${roadmap._id}`, {
                node_id: nodeId,
                checked_items: Array.from(nodeCheckedSet)
            }).catch(err => console.error("Failed to save sub-progress", err));

            return { ...prev, [nodeId]: nodeCheckedSet };
        });
    };
    const handleTogglePublish = async () => {
        try {
            const newStatus = !isPublic;
            await axios.post(`${API_BASE}/roadmaps/${roadmap._id}/publish`, { is_public: newStatus });
            setIsPublic(newStatus);
        } catch (err) {
            console.error("Failed to toggle publish status", err);
        }
    };

    const handleCheckInClick = (node) => {
        // If already complete, just uncheck it directly without a quiz
        if (completedNodes.has(node.id)) {
            handleToggleComplete(node.id);
        } else {
            // Otherwise, require them to pass the AI verification check
            setCheckInNode(node);
            setUserAnswer('');
            setQuizFeedback(null);
        }
    };

    const submitQuiz = async () => {
        if (!userAnswer.trim()) return;
        setCheckingAnswer(true);
        setQuizFeedback(null);

        try {
            const res = await axios.post(`${API_BASE}/progress/validate`, {
                node_title: checkInNode.title,
                node_description: checkInNode.description,
                user_answer: userAnswer
            });

            if (res.data.passed) {
                setQuizFeedback({ passed: true, message: res.data.feedback || "Great job! Keep going." });
                // Automatically mark as complete and close modal after a short delay
                setTimeout(() => {
                    handleToggleComplete(checkInNode.id, true);
                    setCheckInNode(null);
                }, 2000);
            } else {
                setQuizFeedback({ passed: false, message: res.data.feedback || "Not quite right. Try again!" });
            }
        } catch (err) {
            console.error("Failed to validate knowledge", err);
            setQuizFeedback({ passed: false, message: "Server error connecting to AI Tutor. Try again." });
        } finally {
            setCheckingAnswer(false);
        }
    };

    return (
        <div className="min-h-screen py-8 px-4 md:px-8 w-full pb-24">
            {/* Header */}
            <div className="mb-10 flex items-center justify-between">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-text-secondary hover:text-brand transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Dashboard
                </button>
                <div className="flex items-center gap-3">
                    {user?.id === roadmap.user_id && !isEditing && (
                        <button
                            onClick={handleEditStart}
                            className="btn-secondary !w-auto !py-2.5 !px-5 text-sm flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                        >
                            <Edit3 size={16} /> Edit
                        </button>
                    )}
                    {user?.id === roadmap.user_id && isEditing && (
                        <>
                            <button
                                onClick={handleEditCancel}
                                className="btn-secondary !w-auto !py-2.5 !px-5 text-sm flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-red-400 hover:text-red-300"
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                className="btn-primary !w-auto !py-2.5 !px-5 text-sm flex items-center gap-2"
                            >
                                <Save size={16} /> Save
                            </button>
                        </>
                    )}
                    {user?.id === roadmap.user_id && !isEditing && (
                        <button
                            onClick={handleTogglePublish}
                            className={`btn-secondary !w-auto !py-2.5 !px-5 text-sm flex items-center gap-2 transition-colors ${isPublic ? 'bg-brand/20 text-brand border-brand/40 hover:bg-brand/30' : 'bg-white/5 border-white/10 text-text-secondary hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {isPublic ? <Globe size={16} /> : <Share2 size={16} />}
                            {isPublic ? 'Public' : 'Make Public'}
                        </button>
                    )}
                    <button
                        onClick={() => generatePDF(targetRef, { filename: `${roadmap.original_prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_roadmap.pdf` })}
                        className="btn-secondary !w-auto !py-2.5 !px-5 text-sm flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                    >
                        <Download size={16} />
                        Download PDF
                    </button>
                </div>
            </div>

            <div ref={targetRef} className="p-2 md:p-8 rounded-3xl -mx-2 md:-mx-8">
                <div className="glass-card mb-12 p-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-accent/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl lg:text-4xl font-heading font-bold mb-6 gradient-text" style={{ lineHeight: 1.3 }}>
                            {toTitleCase(roadmap.original_prompt)}
                        </h1>

                        {/* Progress Bar Header */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-heading font-semibold">Your Progress</span>
                            <span className={`font-bold font-mono ${progressPercent === 100 ? 'text-success' : 'text-brand'}`}>
                                {progressPercent}%
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                            <motion.div
                                className={`h-full ${progressPercent === 100 ? 'bg-success' : 'bg-gradient-to-r from-brand to-accent'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            ></motion.div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                    <div className="absolute left-[39px] top-6 bottom-6 w-[2px] bg-slate-200 dark:bg-white/10 hidden md:block" />

                    {(isEditing ? editNodes : nodes).map((node, idx) => {
                        const isComplete = !isEditing && completedNodes.has(node.id);
                        const isLoading = isUpdating === node.id;
                        const isNext = !isComplete && (idx === 0 || completedNodes.has(nodes[idx - 1].id));

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={node.id}
                                className={`relative flex gap-6 md:gap-8 mb-8 ${isComplete ? 'opacity-70' : ''}`}
                            >
                                {/* Connector Pin */}
                                <div className="hidden md:flex flex-col items-center z-10 pt-1">
                                    <button
                                        onClick={() => handleCheckInClick(node)}
                                        disabled={isLoading}
                                        className={`w-[78px] h-[78px] rounded-full flex items-center justify-center transition-all duration-300 ${isComplete
                                            ? 'bg-success/20 text-success border-2 border-success shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            : isNext
                                                ? 'bg-brand/20 text-brand border-2 border-brand shadow-[0_0_20px_rgba(59,130,246,0.4)] animate-pulse'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-text-secondary border-2 border-slate-300 dark:border-white/10 hover:border-brand/40 hover:text-brand'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-2 border-current rounded-full border-t-transparent animate-spin" />
                                        ) : isComplete ? (
                                            <CheckCircle2 size={36} />
                                        ) : (
                                            <Circle size={32} />
                                        )}
                                    </button>
                                </div>

                                {/* Node Card */}
                                <div
                                    className={`flex-1 glass-card p-6 md:p-8 transition-colors ${isNext && !isComplete && !isEditing ? 'border-brand/50 bg-brand/5' : ''
                                        }`}
                                >
                                    {isEditing ? (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <input
                                                    type="text"
                                                    value={node.title}
                                                    onChange={(e) => updateEditNode(idx, 'title', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xl font-heading font-semibold text-white focus:border-brand/50 focus:outline-none"
                                                />
                                                <button onClick={() => deleteEditNode(idx)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg shrink-0">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                            <textarea
                                                value={node.description}
                                                onChange={(e) => updateEditNode(idx, 'description', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white/80 focus:border-brand/50 focus:outline-none min-h-[100px]"
                                            />
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-xs text-text-secondary mb-1 block">Time (mins)</label>
                                                    <input
                                                        type="number"
                                                        value={node.estimated_time_mins}
                                                        onChange={(e) => updateEditNode(idx, 'estimated_time_mins', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-brand/50 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-text-secondary mb-1 block">Difficulty (1-5)</label>
                                                    <input
                                                        type="number"
                                                        min="1" max="5"
                                                        value={node.difficulty_level}
                                                        onChange={(e) => updateEditNode(idx, 'difficulty_level', parseInt(e.target.value) || 1)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-brand/50 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>

                                            {/* Mobile Pin (Visible only on small screens) */}
                                            <div className="flex md:hidden items-center gap-3 mb-4 border-b border-white/10 pb-4">
                                                <button
                                                    onClick={() => handleCheckInClick(node)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? 'text-success' : 'text-text-secondary hover:text-brand'
                                                        }`}
                                                >
                                                    {isComplete ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                                                </button>
                                                <span className="font-heading text-sm text-text-secondary uppercase tracking-wider">Step {idx + 1}</span>
                                            </div>

                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <h3 className={`text-xl md:text-2xl font-heading font-semibold ${isComplete ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                                    {node.title}
                                                </h3>

                                                {isNext && !isComplete && (
                                                    <span className="hidden md:inline-flex bg-brand/20 text-brand text-xs px-3 py-1 rounded-full border border-brand/30 whitespace-nowrap">
                                                        Up Next
                                                    </span>
                                                )}
                                            </div>

                                            <p className={`text-lg mb-6 leading-relaxed ${isComplete ? 'text-text-secondary/60' : 'text-text-secondary'}`}>
                                                {node.description}
                                            </p>

                                            {/* Checklist / Mini-goals */}
                                            {node.checklist && node.checklist.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className={`text-sm font-heading font-semibold mb-3 uppercase tracking-wider ${isComplete ? 'text-text-secondary/40' : 'text-text-secondary/80'}`}>
                                                        Check your progress:
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {node.checklist.map((item, i) => {
                                                            const isSubChecked = checkedSubItems[node.id]?.has(i) || false;
                                                            return (
                                                                <li key={i} className={`flex items-start gap-3 text-sm md:text-base ${isComplete ? 'text-text-secondary/50' : 'text-text-secondary'}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSubChecked}
                                                                        onChange={() => handleSubCheck(node.id, i, node.checklist.length)}
                                                                        disabled={isLoading}
                                                                        className={`mt-1 w-4 h-4 cursor-pointer rounded border-white/20 bg-white/5 text-brand focus:ring-brand focus:ring-offset-bg-card transition-colors ${isComplete ? 'opacity-50' : ''}`}
                                                                    />
                                                                    <span className="leading-snug cursor-pointer" onClick={() => handleSubCheck(node.id, i, node.checklist.length)}>{item}</span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-medium mb-4">
                                                <span className="bg-brand/10 text-brand px-2 py-1 rounded-md border border-brand/20">
                                                    Level {node.difficulty_level}
                                                </span>
                                                <span className="flex items-center">
                                                    <span className="text-text-secondary">ETA:</span>
                                                    <span className="text-white ml-2">{node.estimated_time_mins} mins</span>
                                                </span>
                                                <a
                                                    href={generateGCalLink(node)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center text-text-secondary hover:text-white transition-colors ml-auto md:ml-0 gap-1.5"
                                                    title="Schedule on Google Calendar"
                                                >
                                                    <Calendar size={14} /> Schedule
                                                </a>
                                            </div>

                                            {/* Media Format Toggles */}
                                            {(node.video_link || node.article_link || node.podcast_link) && (
                                                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 w-full md:w-max">
                                                    {node.video_link && (
                                                        <button
                                                            onClick={() => handleMediaToggle(node.id, 'video')}
                                                            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${(activeMedia[node.id] === 'video' || (!activeMedia[node.id] && node.video_link))
                                                                ? 'bg-brand/20 text-brand'
                                                                : 'text-text-secondary hover:text-white'
                                                                }`}
                                                        >
                                                            <Video size={14} /> Video
                                                        </button>
                                                    )}
                                                    {node.article_link && (
                                                        <button
                                                            onClick={() => handleMediaToggle(node.id, 'article')}
                                                            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${(activeMedia[node.id] === 'article' || (!activeMedia[node.id] && !node.video_link && node.article_link))
                                                                ? 'bg-brand/20 text-brand'
                                                                : 'text-text-secondary hover:text-white'
                                                                }`}
                                                        >
                                                            <BookOpen size={14} /> Article
                                                        </button>
                                                    )}
                                                    {node.podcast_link && (
                                                        <button
                                                            onClick={() => handleMediaToggle(node.id, 'podcast')}
                                                            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${(activeMedia[node.id] === 'podcast' || (!activeMedia[node.id] && !node.video_link && !node.article_link && node.podcast_link))
                                                                ? 'bg-brand/20 text-brand'
                                                                : 'text-text-secondary hover:text-white'
                                                                }`}
                                                        >
                                                            <Headphones size={14} /> Audio
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="ml-auto flex w-full md:w-auto items-center justify-end gap-4 mt-4 md:mt-0">
                                                {(() => {
                                                    // Determine which link to display based on active toggle
                                                    let currentLink = node.link; // Fallback for legacy roadmaps
                                                    const currentType = activeMedia[node.id];

                                                    if (currentType === 'video' && node.video_link) currentLink = node.video_link;
                                                    else if (currentType === 'article' && node.article_link) currentLink = node.article_link;
                                                    else if (currentType === 'podcast' && node.podcast_link) currentLink = node.podcast_link;
                                                    else if (!currentType) {
                                                        if (node.video_link) currentLink = node.video_link;
                                                        else if (node.article_link) currentLink = node.article_link;
                                                        else if (node.podcast_link) currentLink = node.podcast_link;
                                                    }

                                                    return currentLink ? (
                                                        <a
                                                            href={currentLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-brand hover:text-brand-hover hover:underline transition-colors"
                                                        >
                                                            <ExternalLink size={16} />
                                                            View Resource
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href={`https://www.google.com/search?q=${encodeURIComponent(node.title + ' tutorial')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-text-secondary hover:text-brand transition-colors"
                                                        >
                                                            <ExternalLink size={16} />
                                                            Search Google
                                                        </a>
                                                    );
                                                })()}

                                                <button
                                                    onClick={() => handleCheckInClick(node)}
                                                    disabled={isLoading}
                                                    className={`px-4 py-2 flex items-center gap-2 rounded-lg font-body text-sm font-semibold transition-colors ${isComplete
                                                        ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
                                                        : isNext
                                                            ? 'bg-brand/20 text-brand border border-brand/50 hover:bg-brand/30'
                                                            : 'bg-white/5 text-text-primary border border-white/10 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {isLoading ? (
                                                        <div className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin" />
                                                    ) : isComplete ? (
                                                        <>
                                                            <CheckCircle2 size={16} /> Completed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Circle size={16} /> Mark Complete
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {isEditing && (
                    <div className="flex justify-center mt-8 pb-4">
                        <button
                            onClick={addEditNode}
                            className="btn-secondary w-full md:w-auto flex items-center justify-center gap-2 bg-brand/10 text-brand border-brand/30 hover:bg-brand/20"
                        >
                            <Plus size={20} /> Add Milestone
                        </button>
                    </div>
                )}

                {
                    progressPercent === 100 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-12 text-center p-8 bg-success/10 border border-success/30 rounded-3xl"
                        >
                            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                            <h2 className="text-3xl font-heading font-bold text-success mb-2">Journey Complete!</h2>
                            <p className="text-success/80">You've successfully mastered this roadmap.</p>
                        </motion.div>
                    )
                }
            </div >

            {/* AI Check-in Quiz Modal */}
            <AnimatePresence>
                {checkInNode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => !checkingAnswer && setCheckInNode(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-brand/5">
                                <h3 className="text-xl font-heading font-bold flex items-center gap-2">
                                    <MessageCircle className="text-brand" size={24} />
                                    Knowledge Check-in
                                </h3>
                                <button
                                    onClick={() => setCheckInNode(null)}
                                    className="text-text-secondary hover:text-white transition-colors"
                                    disabled={checkingAnswer}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-text-secondary mb-4 text-sm">
                                    Before marking <strong className="text-white">"{checkInNode.title}"</strong> as complete, explain the core concept in your own words to verify your understanding. Let the AI tutor grade you!
                                </p>

                                <textarea
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    disabled={checkingAnswer || quizFeedback?.passed}
                                    placeholder="Explain what you learned..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 min-h-[120px] resize-y mb-4"
                                />

                                {quizFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className={`p-4 rounded-lg mb-4 flex gap-3 text-sm ${quizFeedback.passed ? 'bg-success/10 border border-success/30 text-success' : 'bg-red-500/10 border border-red-500/30 text-red-200'}`}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {quizFeedback.passed ? <CheckCircle2 size={16} /> : <X size={16} />}
                                        </div>
                                        <p>{quizFeedback.message}</p>
                                    </motion.div>
                                )}

                                <button
                                    onClick={submitQuiz}
                                    disabled={!userAnswer.trim() || checkingAnswer || quizFeedback?.passed}
                                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    {checkingAnswer ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/50 rounded-full border-t-white animate-spin"></div>
                                            Tutor is verifying...
                                        </>
                                    ) : quizFeedback?.passed ? (
                                        <>
                                            <CheckCircle2 size={18} /> Validated!
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} /> Submit Answer
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
