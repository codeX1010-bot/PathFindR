import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, Map, Clock, Users, List, GitMerge, Globe, Share2, Trash2 } from 'lucide-react';
import ReactFlow, { Background, Controls, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api` : '/api';

// Normalize any casing (ALL CAPS, lowercase, mixed) to Title Case
const toTitleCase = (str) => {
    if (!str) return '';
    // Strip redundant leading/trailing quotes and apply title case
    const cleanStr = str.trim().replace(/^["']|["']$/g, '');
    return cleanStr.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();
};

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [roadmaps, setRoadmaps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'tree'
    const [isDark, setIsDark] = useState(
        () => document.documentElement.getAttribute('data-theme') !== 'light'
    );

    // Keep isDark in sync with theme toggle
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fetchRoadmaps = async () => {
            try {
                const response = await axios.get(`${API_BASE}/roadmaps`, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                setRoadmaps(response.data.roadmaps || []);
            } catch (err) {
                console.error("Failed to fetch roadmaps", err);
                setRoadmaps([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoadmaps();
    }, []);

    const { nodes, edges } = useMemo(() => {
        const n = [];
        const e = [];

        const totalRoadmaps = roadmaps?.length || 0;
        const rootY = Math.max(totalRoadmaps * 110, 200);

        // Theme colors
        const colors = isDark ? {
            rootBg: 'linear-gradient(135deg, #1a0a2e, #0f111a)',
            rootBorder: 'rgba(236,72,153,0.8)',
            rootShadow: '0 0 25px rgba(236,72,153,0.4)',
            rootText: 'white',
            curriculumBg: 'linear-gradient(135deg, #0d1f2d, #0f111a)',
            curriculumBorder: 'rgba(45,212,191,0.5)',
            curriculumShadow: '0 0 15px rgba(45,212,191,0.2)',
            curriculumText: 'white',
            completedNodeBg: 'linear-gradient(135deg, #052e1b, #0f1a14)',
            completedBorder: 'rgba(16,185,129,0.6)',
            completedShadow: '0 0 12px rgba(16,185,129,0.25)',
            pendingBg: 'rgba(255,255,255,0.03)',
            pendingBorder: 'rgba(255,255,255,0.08)',
            nodeText: 'rgba(255,255,255,0.9)',
            nodeTextDim: 'rgba(255,255,255,0.5)',
        } : {
            rootBg: 'linear-gradient(135deg, #e0f2fe, #f0fdf4)',
            rootBorder: '#ec4899',
            rootShadow: '0 0 20px rgba(236,72,153,0.25)',
            rootText: '#0f172a',
            curriculumBg: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
            curriculumBorder: '#2dd4bf',
            curriculumShadow: '0 0 12px rgba(45,212,191,0.15)',
            curriculumText: '#0f172a',
            completedNodeBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            completedBorder: '#10b981',
            completedShadow: '0 0 10px rgba(16,185,129,0.2)',
            pendingBg: 'rgba(0,0,0,0.04)',
            pendingBorder: 'rgba(0,0,0,0.12)',
            nodeText: '#1e293b',
            nodeTextDim: '#64748b',
        };

        // Root "Brain" Node — glowing pink
        n.push({
            id: 'root',
            data: {
                label: (
                    <div className="flex flex-col items-center gap-1 py-1">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ec4899', opacity: 0.7 }}>My</span>
                        <strong className="text-lg font-heading leading-tight" style={{ color: colors.rootText }}>{user?.name?.split(' ')[0] || 'My'}'s Brain</strong>
                    </div>
                )
            },
            position: { x: 30, y: rootY },
            style: {
                background: colors.rootBg,
                border: `2px solid ${colors.rootBorder}`,
                borderRadius: '16px',
                boxShadow: `${colors.rootShadow}, inset 0 0 20px rgba(236,72,153,0.05)`,
                color: colors.rootText,
                padding: '12px 16px',
                width: '160px',
                fontSize: '14px',
            },
        });

        (roadmaps || []).forEach((map, index) => {
            const startY = index * 220 + 30;
            const roadmapNodeId = `map-${map._id}`;
            const completedCount = map.completed_node_ids?.length || 0;
            const totalCount = map.nodes?.length || 0;
            const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            // Roadmap Node
            n.push({
                id: roadmapNodeId,
                data: {
                    label: (
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2dd4bf', opacity: 0.85 }}>Curriculum</span>
                            <strong className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: colors.curriculumText }}>
                                {map.original_prompt?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).slice(0, 40)}
                            </strong>
                            <span className="text-xs mt-1" style={{ color: colors.nodeTextDim }}>{completedCount}/{totalCount} done · {progressPct}%</span>
                        </div>
                    )
                },
                position: { x: 280, y: startY },
                style: {
                    background: colors.curriculumBg,
                    border: `1.5px solid ${colors.curriculumBorder}`,
                    borderRadius: '14px',
                    boxShadow: colors.curriculumShadow,
                    color: colors.curriculumText,
                    padding: '10px 14px',
                    width: '200px',
                    fontSize: '13px',
                },
                sourcePosition: 'right',
                targetPosition: 'left',
            });

            e.push({
                id: `e-root-${roadmapNodeId}`,
                source: 'root',
                target: roadmapNodeId,
                animated: true,
                style: { stroke: 'rgba(236,72,153,0.7)', strokeWidth: 2.5 },
                type: 'smoothstep',
            });

            let previousId = roadmapNodeId;
            let xPos = 580;

            if (map.nodes) {
                map.nodes.forEach((node) => {
                    const isCompleted = map.completed_node_ids?.includes(node.id);
                    const nodeId = `node-${map._id}-${node.id}`;

                    n.push({
                        id: nodeId,
                        data: {
                            label: (
                                <div className="flex flex-col gap-0.5">
                                    {isCompleted && (
                                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#10b981', opacity: 0.9 }}>✓ Done</span>
                                    )}
                                    <span className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: isCompleted ? colors.nodeText : colors.nodeTextDim }}>
                                        {node.title}
                                    </span>
                                </div>
                            )
                        },
                        position: { x: xPos, y: startY + 10 },
                        style: {
                            background: isCompleted ? colors.completedNodeBg : colors.pendingBg,
                            border: isCompleted ? `1.5px solid ${colors.completedBorder}` : `1.5px solid ${colors.pendingBorder}`,
                            borderRadius: '10px',
                            boxShadow: isCompleted ? colors.completedShadow : 'none',
                            color: colors.nodeText,
                            padding: '8px 12px',
                            width: '155px',
                            fontSize: '12px',
                        },
                        sourcePosition: 'right',
                        targetPosition: 'left',
                    });

                    e.push({
                        id: `e-${previousId}-${nodeId}`,
                        source: previousId,
                        target: nodeId,
                        animated: isCompleted,
                        style: {
                            stroke: isCompleted ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.1)',
                            strokeWidth: isCompleted ? 2 : 1,
                        },
                        type: 'smoothstep',
                    });

                    previousId = nodeId;
                    xPos += 210;
                });
            }
        });

        return { nodes: n, edges: e };
    }, [roadmaps, user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleTogglePublish = async (e, map) => {
        e.stopPropagation();
        try {
            const newStatus = !map.is_public;
            await axios.post(`${API_BASE}/roadmaps/${map._id}/publish`, { is_public: newStatus });
            setRoadmaps(prev => prev.map(r => r._id === map._id ? { ...r, is_public: newStatus } : r));
        } catch (err) {
            console.error("Failed to toggle publish status", err);
        }
    };

    const handleTrash = async (e, mapId) => {
        e.stopPropagation();
        try {
            await axios.post(`${API_BASE}/roadmaps/${mapId}/trash`, {}, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setRoadmaps(prev => prev.filter(r => r._id !== mapId));
        } catch (err) {
            console.error('Failed to delete roadmap', err);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 md:px-8 w-full">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">
                            Welcome back, {user?.name?.split(' ')[0] || ''}
                        </h1>
                        <p className="text-text-secondary mt-1">Ready to continue your journey?</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </header>

            {/* Main Content */}
            <main>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h2 className="text-2xl font-heading font-semibold">Your Learning Paths</h2>

                    <div className="flex flex-wrap items-center gap-4">
                        {(roadmaps?.length || 0) > 0 && (
                            <div className="bg-white/5 border border-white/10 p-1 rounded-lg flex items-center">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-brand/20 text-brand' : 'text-text-secondary hover:text-white'}`}
                                >
                                    <List size={16} /> Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('tree')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${viewMode === 'tree' ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-white'}`}
                                >
                                    <GitMerge size={16} /> Skill Tree
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="loader border-[3px] !w-12 !h-12"></div>
                    </div>
                ) : roadmaps.length === 0 ? (
                    <div className="glass-card text-center py-16 border-dashed border-2">
                        <Map className="w-16 h-16 text-text-secondary opacity-50 mx-auto mb-4" />
                        <h3 className="text-xl font-heading mb-2">No roadmaps yet</h3>
                        <p className="text-text-secondary mb-6">It looks like you haven't started any journeys. Let's fix that!</p>
                        <Link to="/new-roadmap" className="btn-primary inline-flex !w-auto !py-3 !px-8 shadow-brand/20">
                            Create Your First Roadmap
                        </Link>
                    </div>
                ) : viewMode === 'tree' ? (
                    <ReactFlowProvider>
                    <div className="h-[800px] rounded-3xl overflow-hidden border border-white/10 glass-card">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            fitView
                            style={{ background: isDark ? '#050505' : '#f1f5f9' }}
                        >
                            <Background color={isDark ? '#fff' : '#94a3b8'} gap={16} size={1} opacity={isDark ? 0.05 : 0.3} />
                            <Controls className="fill-brand stroke-brand bg-white/5 border border-white/10" />
                        </ReactFlow>
                    </div>
                    </ReactFlowProvider>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {(roadmaps || []).map((map) => {
                            const totalNodes = map.nodes.length;
                            const completedNodes = map.completed_node_ids.length;
                            const progressPct = Math.round((completedNodes / totalNodes) * 100) || 0;

                            return (
                                <div key={map._id} className="glass-card p-6 flex flex-col items-start hover:-translate-y-1 transition-transform group cursor-pointer relative overflow-hidden"
                                    onClick={() => navigate('/roadmap', { state: { roadmap: map } })}>

                                    {/* Glowing hover effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex justify-between w-full mb-3 relative z-10">
                                        <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-1 rounded-md">
                                            Personal Curriculum
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleTogglePublish(e, map)}
                                                className={`p-1.5 rounded-md transition-colors ${map.is_public ? 'bg-brand/20 text-brand' : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'}`}
                                                title={map.is_public ? "Public on Community" : "Make Public"}
                                            >
                                                {map.is_public ? <Globe size={14} /> : <Share2 size={14} />}
                                            </button>
                                            <button
                                                onClick={(e) => handleTrash(e, map._id)}
                                                className="p-1.5 rounded-md bg-white/5 text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                title="Move to Trash"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <span className="flex items-center text-xs text-text-secondary gap-1">
                                                <Clock size={12} />
                                                {new Date(map.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-heading font-semibold mb-2 line-clamp-2 leading-tight">
                                        {toTitleCase(map.original_prompt)}
                                    </h3>

                                    <p className="text-sm text-text-secondary mb-6 mt-auto">
                                        {totalNodes} distinct milestones generated by AI.
                                    </p>

                                    <div className="w-full mt-auto">
                                        <div className="flex justify-between text-xs font-bold mb-2">
                                            <span className="text-text-secondary">Progress</span>
                                            <span className={progressPct === 100 ? 'text-success' : 'text-accent'}>{progressPct}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${progressPct === 100 ? 'bg-success' : 'bg-gradient-to-r from-brand to-accent'}`}
                                                style={{ width: `${progressPct}%` }}
                                            ></div>
                                        </div>
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
