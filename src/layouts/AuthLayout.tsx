import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, profile } = useAuthStore();

  // Redirect authenticated users to dashboard or onboarding
  if (isAuthenticated) {
    if (profile && !profile.onboarded) {
      return <Navigate to="/onboarding" />;
    }
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* App Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20, 
              delay: 0.2 
            }}
            className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mb-4 shadow-lg"
          >
            <span className="text-white text-4xl font-bold">MM</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-primary-800"
          >
            Macro Muncher
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-primary-600 text-center mt-2"
          >
            Track your macros. Level up your nutrition game.
          </motion.p>
        </div>

        {/* Auth Form Container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden"
        >
          <Outlet />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
