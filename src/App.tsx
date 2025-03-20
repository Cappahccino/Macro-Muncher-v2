import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layout Components
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import FoodLog from './pages/FoodLog';
import FoodSearch from './pages/FoodSearch';
import FoodDetail from './pages/FoodDetail';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';
import Achievements from './pages/Achievements';
import Challenges from './pages/Challenges';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Auth guard component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkingAuth } = useAuthStore();
  
  if (checkingAuth) {
    // Show loading spinner while checking auth status
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
      // Check if user is authenticated
      await checkAuth();
      setAppReady(true);
    };
    
    initializeApp();
  }, [checkAuth]);
  
  if (!appReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>
      
      {/* Protected app routes */}
      <Route element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/food-log" element={<FoodLog />} />
        <Route path="/food-search" element={<FoodSearch />} />
        <Route path="/food/:id" element={<FoodDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stats" element={<Statistics />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/challenges" element={<Challenges />} />
      </Route>
      
      {/* 404 page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
