import React, { useState } from 'react';
import Layout from './components/Layout';
import InputForm from './components/InputForm';
import RoadmapDisplay from './components/RoadmapDisplay';
import { generateRoadmap } from './utils/generator';
import './App.css';

function App() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState(null);

  const handleGenerate = async (data) => {
    setLoading(true);
    setSavedData(data); // Save input for later
    try {
      const result = await generateRoadmap(data.goal, data.knowledge, data.style);
      setRoadmap(result);
    } catch (error) {
      console.error("Failed to generate", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRoadmap(null);
    // Do NOT clear savedData so form can pre-fill
  };

  return (
    <Layout>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }} className="animate-fade-in">
          <div className="spinner" style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            margin: '0 auto 2rem auto'
          }}></div>
          <h3 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>Charting your course...</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Analyzing learning paths and resources</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : roadmap ? (
        <RoadmapDisplay roadmap={roadmap} onReset={handleReset} />
      ) : (
        <InputForm onGenerate={handleGenerate} initialValues={savedData} />
      )}
    </Layout>
  );
}

export default App;
