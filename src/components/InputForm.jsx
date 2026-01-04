import React, { useState } from 'react';

const InputForm = ({ onGenerate, initialValues }) => {
    const [goal, setGoal] = useState(initialValues?.goal || '');
    const [knowledge, setKnowledge] = useState(initialValues?.knowledge || '');
    const [style, setStyle] = useState(initialValues?.style || 'visual');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!goal || !knowledge) return;
        onGenerate({ goal, knowledge, style });
    };

    const inputStyle = {
        width: '100%',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--glass-border)',
        background: 'rgba(0, 0, 0, 0.2)',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
        boxSizing: 'border-box',
        marginTop: '0.5rem'
    };

    const labelStyle = {
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        fontWeight: '500',
        display: 'block'
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div className="form-group">
                <label style={labelStyle}>What is your main learning goal?</label>
                <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Become a Python Developer"
                    required
                    style={inputStyle}
                />
            </div>

            <div className="form-group">
                <label style={labelStyle}>What is your current knowledge level?</label>
                <input
                    type="text"
                    value={knowledge}
                    onChange={(e) => setKnowledge(e.target.value)}
                    placeholder="e.g. I know variables and loops"
                    required
                    style={inputStyle}
                />
            </div>

            <div className="form-group">
                <label style={labelStyle}>How do you prefer to learn?</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {['visual', 'hands-on', 'reading'].map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => setStyle(opt)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: '1px solid var(--glass-border)',
                                background: style === opt ? 'var(--accent-primary)' : 'rgba(0,0,0,0.2)',
                                color: style === opt ? 'black' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: style === opt ? '600' : '400'
                            }}
                        >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
                Generate Roadmap
            </button>
        </form>
    );
};

export default InputForm;
