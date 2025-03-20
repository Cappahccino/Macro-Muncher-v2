import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAward,
  FiArrowLeft,
  FiCalendar,
  FiBookOpen,
  FiTarget,
  FiCamera,
  FiUser,
  FiTrendingUp,
  FiStar
} from 'react-icons/fi';
import { useGamificationStore, Achievement } from '../stores/gamificationStore';
import { format } from 'date-fns';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  FiAward: FiAward,
  FiCalendar: FiCalendar,
  FiBookOpen: FiBookOpen,
  FiTarget: FiTarget,
  FiCamera: FiCamera,
  FiUser: FiUser,
  FiStar: FiStar
};

const Achievements: React.FC = () => {
  const navigate = useNavigate();
  const { profile, fetchProfile, isLoading } = useGamificationStore();
  
  const [categories, setCategories] = useState<Record<string, Achievement[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Fetch achievements data
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Organize achievements by category
  useEffect(() => {
    if (profile && profile.achievements) {
      const grouped: Record<string, Achievement[]> = {
        all: []
      };
      
      profile.achievements.forEach(achievement => {
        // Add to the specific category
        if (!grouped[achievement.category]) {
          grouped[achievement.category] = [];
        }
        grouped[achievement.category].push(achievement);
        
        // Also add to "all" category
        grouped.all.push(achievement);
      });
      
      // Sort achievements by completion status and progress
      Object.keys(grouped).forEach(category => {
        grouped[category].sort((a, b) => {
          // Sort completed achievements first
          if (a.isCompleted && !b.isCompleted) return -1;
          if (!a.isCompleted && b.isCompleted) return 1;
          
          // Then sort by progress percentage
          const aProgress = a.progress / a.targetValue;
          const bProgress = b.progress / b.targetValue;
          return bProgress - aProgress;
        });
      });
      
      setCategories(grouped);
    }
  }, [profile]);
  
  // Category labels
  const categoryLabels: Record<string, string> = {
    all: 'All Achievements',
    logging: 'Food Logging',
    nutrition: 'Nutrition',
    consistency: 'Consistency',
    special: 'Special',
    social: 'Social'
  };
  
  // Render achievement icon
  const renderIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || FiAward;
    return <Icon size={24} />;
  };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Achievements</h1>
      </div>
      
      {/* User stats summary */}
      {profile && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <FiTrendingUp className="text-primary-600 mr-2" size={20} />
              <span className="font-medium">Level {profile.level}</span>
            </div>
            <div>
              <span className="text-gray-600">{profile.points} points</span>
            </div>
          </div>
          
          {/* Achievement progress */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Achievement Progress</span>
              <span>
                {profile.achievements.filter(a => a.isCompleted).length} / {profile.achievements.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-500 h-2.5 rounded-full" 
                style={{ 
                  width: `${(profile.achievements.filter(a => a.isCompleted).length / profile.achievements.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <FiCalendar className="mr-1" size={14} />
              <span>Streak: {profile.streakDays} days</span>
            </div>
            <div className="flex items-center">
              <FiStar className="mr-1" size={14} />
              <span>Best: {profile.longestStreak} days</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Category tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {Object.keys(categories).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${
                activeCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryLabels[category] || category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Achievements list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : categories[activeCategory]?.length ? (
        <div className="space-y-4">
          {categories[activeCategory].map(achievement => (
            <div 
              key={achievement.id}
              className={`bg-white rounded-lg shadow p-4 ${
                achievement.isCompleted ? 'border-l-4 border-primary-500' : ''
              }`}
            >
              <div className="flex mb-3">
                <div className={`rounded-full p-3 mr-3 ${
                  achievement.isCompleted 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {renderIcon(achievement.iconName)}
                </div>
                <div>
                  <h3 className="font-medium">{achievement.title}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  
                  {achievement.isCompleted && achievement.completedAt && (
                    <div className="text-xs text-primary-600 mt-1">
                      Unlocked on {format(achievement.completedAt, 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>
                    {achievement.progress} / {achievement.targetValue}
                    {achievement.isCompleted && ' • +' + achievement.points + ' pts'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      achievement.isCompleted ? 'bg-primary-500' : 'bg-gray-400'
                    }`} 
                    style={{ width: `${Math.min((achievement.progress / achievement.targetValue) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No achievements in this category</p>
        </div>
      )}
    </div>
  );
};

export default Achievements;
