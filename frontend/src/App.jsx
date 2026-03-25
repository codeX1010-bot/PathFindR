import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoadmapFlow from './pages/RoadmapFlow';
import RoadmapView from './pages/RoadmapView';
import Community from './pages/Community';
import Trash from './pages/Trash';

import TabNavigation from './components/TabNavigation';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="loader"></div></div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// Main Layout with Tabs
const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <TabNavigation />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="background-mesh"></div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/community" element={
            <MainLayout>
              <Community />
            </MainLayout>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/new-roadmap" element={
            <ProtectedRoute>
              <MainLayout>
                <RoadmapFlow />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/roadmap" element={
            <ProtectedRoute>
              <RoadmapView />
            </ProtectedRoute>
          } />

          <Route path="/trash" element={
            <ProtectedRoute>
              <MainLayout>
                <Trash />
              </MainLayout>
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
