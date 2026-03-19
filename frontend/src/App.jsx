import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoadmapFlow from './pages/RoadmapFlow';
import RoadmapView from './pages/RoadmapView';
import Community from './pages/Community';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="loader"></div></div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="background-mesh"></div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/community" element={<Community />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/new-roadmap" element={
            <ProtectedRoute>
              <RoadmapFlow />
            </ProtectedRoute>
          } />

          <Route path="/roadmap" element={
            <ProtectedRoute>
              <RoadmapView />
            </ProtectedRoute>
          } />

          {/* Default redirect based on auth status is handled inside the components, or catch-all here */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
