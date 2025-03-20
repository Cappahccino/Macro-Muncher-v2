import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { FiHome, FiList, FiUser, FiActivity, FiAward } from 'react-icons/fi';
import { useGamificationStore } from '../stores/gamificationStore';
import GamificationNotifier from '../components/GamificationNotifier';

const MainLayout: React.FC = () => {
  const { profile, showAchievementModal, closeAchievementModal, lastUnlockedAchievement } = useGamificationStore();
  
  // Define navigation items
  const navItems = [
    { path: '/', label: 'Home', icon: <FiHome size={24} /> },
    { path: '/food-log', label: 'Food Log', icon: <FiList size={24} /> },
    { path: '/stats', label: 'Stats', icon: <FiActivity size={24} /> },
    { path: '/achievements', label: 'Achievements', icon: <FiAward size={24} /> },
    { path: '/profile', label: 'Profile', icon: <FiUser size={24} /> },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Include GamificationNotifier to handle achievements and streaks */}
      <GamificationNotifier />
      
      {/* Main content area */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      
      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-between max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center text-xs p-3 flex-1
                ${isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      
      {/* Achievement unlock modal */}
      {showAchievementModal && lastUnlockedAchievement && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                  <FiAward className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Achievement Unlocked!
                  </h3>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-primary-600">{lastUnlockedAchievement.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{lastUnlockedAchievement.description}</p>
                    <p className="mt-4 text-sm font-medium text-primary-700">+{lastUnlockedAchievement.points} points</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                  onClick={closeAchievementModal}
                >
                  Awesome!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
