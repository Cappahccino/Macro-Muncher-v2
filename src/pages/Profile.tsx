import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiTarget,
  FiSliders,
  FiLogOut,
  FiEdit2,
  FiSave,
  FiX,
  FiActivity,
  FiAward
} from 'react-icons/fi';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, logoutUser } = useAuthStore();
  const { profile: gamificationProfile } = useGamificationStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    displayName: '',
    weight: '',
    height: '',
    goal: '' as 'burn' | 'maintain' | 'build' | '',
    calorieTarget: 0,
    proteinTarget: 0,
    carbTarget: 0,
    fatTarget: 0
  });
  
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Initialize edited profile when profile data loads
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        displayName: profile.displayName || '',
        weight: profile.weight || '',
        height: profile.height || '',
        goal: profile.goal || 'maintain',
        calorieTarget: profile.calorieTarget || 2000,
        proteinTarget: profile.proteinTarget || 120,
        carbTarget: profile.carbTarget || 200,
        fatTarget: profile.fatTarget || 65
      });
    }
  }, [profile]);
  
  // Handle changes to edited profile
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setEditedProfile(prev => ({
      ...prev,
      [name]: name === 'calorieTarget' || name === 'proteinTarget' || 
               name === 'carbTarget' || name === 'fatTarget' 
                ? parseInt(value) || 0 
                : value
    }));
    
    setIsDirty(true);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!isDirty) return;
    
    try {
      setIsSubmitting(true);
      
      await updateProfile({
        ...editedProfile,
        weight: editedProfile.weight,
        height: editedProfile.height,
      });
      
      setIsEditing(false);
      setIsDirty(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Format macro percentages
  const formatMacroPercent = (macroGrams: number, macroCalories: number) => {
    if (!profile || !profile.calorieTarget) return 0;
    return Math.round((macroCalories / profile.calorieTarget) * 100);
  };
  
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
      </div>
      
      {/* Profile header */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-full mr-4">
              <FiUser className="text-primary-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-medium">{profile.displayName || 'User'}</h2>
              <p className="text-gray-600 text-sm">
                {profile.email}
              </p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <FiEdit2 size={20} />
            </button>
          )}
        </div>
        
        {gamificationProfile && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
            <div className="text-center">
              <div className="text-sm text-gray-600">Level</div>
              <div className="font-medium text-primary-600">{gamificationProfile.level}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Points</div>
              <div className="font-medium">{gamificationProfile.points}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Streak</div>
              <div className="font-medium text-blue-600">{gamificationProfile.streakDays} days</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Achievements</div>
              <div className="font-medium text-green-600">
                {gamificationProfile.achievements.filter(a => a.isCompleted).length} / {gamificationProfile.achievements.length}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Profile details / edit form */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-center mb-4">
          <FiSliders className="text-primary-600 mr-2" />
          <h2 className="text-lg font-medium">Personal Details</h2>
        </div>
        
        {isEditing ? (
          /* Edit form */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={editedProfile.displayName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={editedProfile.weight}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={editedProfile.height}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fitness Goal
              </label>
              <select
                name="goal"
                value={editedProfile.goal}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="burn">Burn Fat</option>
                <option value="maintain">Maintain Weight</option>
                <option value="build">Build Muscle</option>
              </select>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium mb-3">Nutrition Targets</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Calories (kcal)
                  </label>
                  <input
                    type="number"
                    name="calorieTarget"
                    value={editedProfile.calorieTarget}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    name="proteinTarget"
                    value={editedProfile.proteinTarget}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    name="carbTarget"
                    value={editedProfile.carbTarget}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    name="fatTarget"
                    value={editedProfile.fatTarget}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setIsDirty(false);
                  
                  // Reset to original values
                  if (profile) {
                    setEditedProfile({
                      displayName: profile.displayName || '',
                      weight: profile.weight || '',
                      height: profile.height || '',
                      goal: profile.goal || 'maintain',
                      calorieTarget: profile.calorieTarget || 2000,
                      proteinTarget: profile.proteinTarget || 120,
                      carbTarget: profile.carbTarget || 200,
                      fatTarget: profile.fatTarget || 65
                    });
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                <FiX className="inline mr-1" /> Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isDirty || isSubmitting}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  !isDirty || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Weight</div>
                <div>{profile.weight || '-'} kg</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Height</div>
                <div>{profile.height || '-'} cm</div>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-1">Fitness Goal</div>
              <div className="flex items-center">
                <FiTarget className="text-primary-600 mr-2" />
                <span>
                  {profile.goal === 'burn' 
                    ? 'Burn Fat' 
                    : profile.goal === 'build' 
                      ? 'Build Muscle' 
                      : 'Maintain Weight'}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium mb-3">Nutrition Targets</h3>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Daily Calories</span>
                  <span>{profile.calorieTarget || 2000} kcal</span>
                </div>
              </div>
              
              <div className="mt-3 space-y-3">
                {/* Protein */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Protein</span>
                    <div>
                      <span>{profile.proteinTarget || 120}g</span>
                      <span className="text-gray-500 ml-1">
                        ({formatMacroPercent(
                          profile.proteinTarget || 120, 
                          (profile.proteinTarget || 120) * 4
                        )}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${formatMacroPercent(
                          profile.proteinTarget || 120, 
                          (profile.proteinTarget || 120) * 4
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Carbs */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Carbs</span>
                    <div>
                      <span>{profile.carbTarget || 200}g</span>
                      <span className="text-gray-500 ml-1">
                        ({formatMacroPercent(
                          profile.carbTarget || 200, 
                          (profile.carbTarget || 200) * 4
                        )}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${formatMacroPercent(
                          profile.carbTarget || 200, 
                          (profile.carbTarget || 200) * 4
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Fat */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fat</span>
                    <div>
                      <span>{profile.fatTarget || 65}g</span>
                      <span className="text-gray-500 ml-1">
                        ({formatMacroPercent(
                          profile.fatTarget || 65, 
                          (profile.fatTarget || 65) * 9
                        )}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${formatMacroPercent(
                          profile.fatTarget || 65, 
                          (profile.fatTarget || 65) * 9
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* App section */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-center mb-4">
          <FiActivity className="text-primary-600 mr-2" />
          <h2 className="text-lg font-medium">App</h2>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => navigate('/achievements')}
            className="w-full flex justify-between items-center py-3 px-4 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <FiAward className="text-gray-600 mr-3" />
              <span>Achievements</span>
            </div>
            <div className="text-gray-400">→</div>
          </button>
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <FiLogOut className="mr-3" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
      
      {/* Version info */}
      <div className="text-center text-gray-500 text-xs mt-8">
        <p>Macro Muncher v2.0</p>
        <p className="mt-1">© 2025 Macro Muncher Team</p>
      </div>
      
      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Logout</h3>
            <p className="mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
