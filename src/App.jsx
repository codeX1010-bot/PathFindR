import React, { useState } from 'react';
import Layout from './components/Layout';
import InputForm from './components/InputForm';
import RoadmapDisplay from './components/RoadmapDisplay';
import { generateRoadmap } from './utils/generator';
import './App.css';

export default function App() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (data) => {
    setLoading(true);
    setError(null);
    setSavedData(data); // Save input for later

    // Client-side retry logic
    let attempts = 0;
    const maxAttempts = 5;

    const tryGenerate = async () => {
      try {
        attempts++;
        const result = await generateRoadmap(data.goal, data.knowledge, data.style);

        // Check if backend returned a 429 "Rate Limit" object
        if (result && result.status === 429) {
          if (attempts < maxAttempts) {
            setError(`Rate limit hit. Waiting 5s... (Attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait in browser (no timeout limit here)
            return tryGenerate(); // Recursive retry
          } else {
            throw new Error("Rate limit exceeded. Please try again later.");
          }
        }

        setRoadmap(result);
        setError(null); // Clear any temp errors
      } catch (error) {
        console.error("Failed to generate", error);
        setError(error.message || "Failed to generate roadmap. Please try again.");
      } finally {
        if (attempts >= maxAttempts || (roadmap && roadmap.status !== 429)) {
          setLoading(false);
        }
      }
    };

    await tryGenerate();
    setLoading(false); // Ensure loading stops
  };

  const handleReset = () => {
    setRoadmap(null);
    setError(null);
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
        <>
          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '8px',
              background: 'rgba(255,100,100,0.15)',
              border: '1px solid rgba(255,100,100,0.3)',
              color: '#ff8080',
              textAlign: 'center'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}
          <InputForm onGenerate={handleGenerate} initialValues={savedData} />
        </>
      )}
    </Layout>
  );
}
