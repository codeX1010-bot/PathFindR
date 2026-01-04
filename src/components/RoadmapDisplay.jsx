import React from 'react';

const RoadmapDisplay = ({ roadmap, onReset }) => {
    return (
        <div className="roadmap-container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="text-gradient" style={{ margin: 0 }}>Your Path forward</h2>
                <button
                    onClick={onReset}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        fontSize: '0.9rem'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                >
                    Start New Path
                </button>
            </div>

            <div className="steps-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {roadmap.map((step, index) => (
                    <div key={index} className="glass-panel" style={{
                        padding: '1.5rem',
                        borderLeft: '4px solid var(--accent-primary)',
                        background: 'rgba(30, 41, 59, 0.4)',
                        transition: 'transform 0.2s',
                        animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards`
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            Checkpoint 0{index + 1}
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{step.title}</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{step.description}</p>
                        {step.links && step.links.length > 0 && (
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {step.links.map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="resource-pill" style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '15px',
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        color: 'var(--accent-primary)',
                                        textDecoration: 'none',
                                        fontSize: '0.8rem',
                                        border: '1px solid rgba(56, 189, 248, 0.2)'
                                    }}>
                                        {link.label} ↗
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default RoadmapDisplay;
