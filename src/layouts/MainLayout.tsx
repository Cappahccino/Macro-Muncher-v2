import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiPieChart, 
  FiSearch, 
  FiCalendar, 
  FiAward, 
  FiFlag, 
  FiUser,
  FiPlusCircle,
  FiX
} from 'react-icons/fi';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  
  const navItems = [
    { icon: <FiHome size={24} />, path: '/', label: 'Home' },
    { icon: <FiCalendar size={24} />, path: '/food-log', label: 'Food Log' },
    { icon: <FiPieChart size={24} />, path: '/stats', label: 'Stats' },
    { icon: <FiAward size={24} />, path: '/achievements', label: 'Achieve' },
    { icon: <FiUser size={24} />, path: '/profile', label: 'Profile' },
  ];
  
  const quickAddItems = [
    { label: 'Scan Food', action: () => navigate('/food-search?mode=scan') },
    { label: 'Search Food', action: () => navigate('/food-search') },
    { label: 'Quick Add', action: () => navigate('/food-search?mode=quick') },
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      
      {/* Quick Add Menu Overlay */}
      <AnimatePresence>
        {quickAddOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickAddOpen(false)}
            />
            
            {/* Quick Add Menu */}
            <motion.div 
              className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {quickAddItems.map((item, index) => (
                <motion.button
                  key={index}
                  className="bg-white text-primary-700 rounded-full py-3 px-6 shadow-lg font-semibold flex items-center justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.05 * index } 
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 20,
                    transition: { delay: 0.05 * (quickAddItems.length - index - 1) } 
                  }}
                  onClick={() => {
                    setQuickAddOpen(false);
                    item.action();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                </motion.button>
              ))}
              
              {/* Close Button */}
              <motion.button
                className="bg-secondary-500 text-white rounded-full p-4 mx-auto mt-2 shadow-lg"
                onClick={() => setQuickAddOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX size={24} />
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-30">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center px-3 py-2 transition-colors relative ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-0 w-1/2 h-1 bg-primary-500 rounded-t-full"
                    layoutId="activeTab"
                  />
                )}
              </button>
            );
          })}
          
          {/* Center Quick Add Button */}
          <div className="absolute left-1/2 bottom-2 transform -translate-x-1/2">
            <motion.button
              className="bg-primary-500 text-white rounded-full p-3 shadow-lg"
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={quickAddOpen ? { rotate: 45 } : { rotate: 0 }}
            >
              {quickAddOpen ? <FiX size={28} /> : <FiPlusCircle size={28} />}
            </motion.button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
