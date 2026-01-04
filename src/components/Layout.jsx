import React from 'react';

const Layout = ({ children }) => {
    return (
        <div className="layout-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', letterSpacing: '-0.05em' }}>PathFindR</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Your Personalized Learning GPS</p>
            </header>
            <main className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '700px', boxSizing: 'border-box' }}>
                {children}
            </main>
            <footer style={{ marginTop: '3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                © 2026 PathFindR
            </footer>
        </div>
    );
};

export default Layout;
