import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, Map, Clock, Users, List, GitMerge, Globe, Share2 } from 'lucide-react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api` : '/api';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [roadmaps, setRoadmaps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'tree'

    useEffect(() => {
        const fetchRoadmaps = async () => {
            try {
                const response = await axios.get(`${API_BASE}/roadmaps`);
                setRoadmaps(response.data.roadmaps);
            } catch (err) {
                console.error("Failed to fetch roadmaps", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoadmaps();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleTogglePublish = async (e, map) => {
        e.stopPropagation();
        try {
            const newStatus = !map.is_public;
            await axios.post(`${API_BASE}/roadmaps/${map._id}/publish`, { is_public: newStatus });

            // Update local state
            setRoadmaps(prev => prev.map(r => r._id === map._id ? { ...r, is_public: newStatus } : r));
        } catch (err) {
            console.error("Failed to toggle publish status", err);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 md:px-8 max-w-6xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">
                        Welcome back, {user?.name.split(' ')[0]}
                    </h1>
                    <p className="text-text-secondary mt-1">Ready to continue your journey?</p>
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
                        {roadmaps.length > 0 && (
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
                        <Link to="/community" className="btn-secondary !w-auto !py-2.5 !text-sm flex items-center gap-2">
                            <Users size={16} />
                            Community
                        </Link>
                        <Link to="/new-roadmap" className="btn-primary !w-auto !py-2.5 !text-sm shadow-brand/20 flex items-center gap-2">
                            <Plus size={16} />
                            Generate Path
                        </Link>
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
                    <div className="h-[600px] rounded-3xl overflow-hidden border border-white/10 glass-card">
                        {(() => {
                            const { nodes, edges } = useMemo(() => {
                                const n = [];
                                const e = [];

                                // Root Node
                                n.push({
                                    id: 'root',
                                    data: { label: <div className="text-center"><strong>{user?.name?.split(' ')[0] || 'My'}'s Brain</strong></div> },
                                    position: { x: 50, y: Math.max(roadmaps.length * 100, 200) },
                                    className: 'bg-[#0f111a] text-white font-bold border-2 border-brand/80 rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.3)] p-4 w-[180px]',
                                });

                                roadmaps.forEach((map, index) => {
                                    const startY = index * 200 + 50;
                                    const roadmapNodeId = `map-${map._id}`;

                                    n.push({
                                        id: roadmapNodeId,
                                        data: { label: map.original_prompt },
                                        position: { x: 350, y: startY },
                                        className: 'bg-[#1a1d2d] text-white border border-accent/50 rounded-xl p-3 w-[180px] text-sm font-semibold shadow-lg',
                                        sourcePosition: 'right',
                                        targetPosition: 'left',
                                    });

                                    e.push({
                                        id: `e-root-${roadmapNodeId}`,
                                        source: 'root',
                                        target: roadmapNodeId,
                                        animated: true,
                                        style: { stroke: '#ec4899', strokeWidth: 2, opacity: 0.7 }
                                    });

                                    let previousId = roadmapNodeId;
                                    let xPos = 630;

                                    map.nodes.forEach((node) => {
                                        if (map.completed_node_ids.includes(node.id)) {
                                            const nodeId = `node-${map._id}-${node.id}`;
                                            n.push({
                                                id: nodeId,
                                                data: { label: node.title },
                                                position: { x: xPos, y: startY + 10 },
                                                className: 'bg-success/10 text-success border border-success/40 rounded-lg p-2 w-[160px] text-xs shadow-md',
                                                sourcePosition: 'right',
                                                targetPosition: 'left',
                                            });
                                            e.push({
                                                id: `e-${previousId}-${nodeId}`,
                                                source: previousId,
                                                target: nodeId,
                                                style: { stroke: '#10b981', strokeWidth: 2 }
                                            });
                                            previousId = nodeId;
                                            xPos += 220;
                                        }
                                    });
                                });
                                return { nodes: n, edges: e };
                            }, [roadmaps, user]);

                            return (
                                <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    fitView
                                    className="bg-[#050505]"
                                >
                                    <Background color="#fff" gap={16} size={1} opacity={0.05} />
                                    <Controls className="fill-brand stroke-brand bg-white/5 border border-white/10" />
                                </ReactFlow>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roadmaps.map((map) => {
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
                                            Prompted Path
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => handleTogglePublish(e, map)}
                                                className={`p-1.5 rounded-md transition-colors ${map.is_public ? 'bg-brand/20 text-brand' : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'}`}
                                                title={map.is_public ? "Public on Community" : "Make Public"}
                                            >
                                                {map.is_public ? <Globe size={14} /> : <Share2 size={14} />}
                                            </button>
                                            <span className="flex items-center text-xs text-text-secondary gap-1">
                                                <Clock size={12} />
                                                {new Date(map.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-heading font-semibold mb-2 line-clamp-2 leading-tight">
                                        "{map.original_prompt}"
                                    </h3>

                                    <p className="text-sm text-text-secondary mb-6 mt-auto">
                                        {totalNodes} distinct milestones generated by AI.
                                    </p>

                                    <div className="w-full mt-auto">
                                        <div className="flex justify-between text-xs font-bold mb-2">
                                            <span className="text-text-secondary">Progress</span>
                                            <span className={progressPct === 100 ? 'text-success' : 'text-accent'}>{progressPct}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
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
