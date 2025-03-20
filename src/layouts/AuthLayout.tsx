import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, profile, checkingAuth } = useAuthStore();
  
  // Show loading indicator while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-primary-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // Redirect authenticated users based on onboarding status
  if (isAuthenticated) {
    // If user has completed onboarding, redirect to home
    // Otherwise, allow access to onboarding page
    if (profile?.onboarded && window.location.pathname !== '/onboarding') {
      return <Navigate to="/" />;
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
