import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiActivity, 
  FiTarget, 
  FiAward, 
  FiTrendingUp, 
  FiCalendar, 
  FiCheckCircle 
} from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { useFoodLogStore } from '../stores/foodLogStore';
import { useGamificationStore } from '../stores/gamificationStore';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { 
    fetchMealsForDate, 
    meals, 
    dailyTotals, 
    isLoading: isFoodLoading 
  } = useFoodLogStore();
  const { 
    profile: gamificationProfile, 
    fetchProfile,
    isLoading: isGamificationLoading 
  } = useGamificationStore();

  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [streakMessage, setStreakMessage] = useState('');
  
  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      // Fetch today's meals
      await fetchMealsForDate(new Date());
      // Fetch gamification profile
      await fetchProfile();
    };
    
    loadData();
  }, [fetchMealsForDate, fetchProfile]);
  
  // Update recent achievements and streak message
  useEffect(() => {
    if (gamificationProfile) {
      // Get recent achievements (last 3 completed)
      const completed = gamificationProfile.achievements
        .filter(a => a.isCompleted)
        .sort((a, b) => {
          if (!a.completedAt || !b.completedAt) return 0;
          return b.completedAt.getTime() - a.completedAt.getTime();
        })
        .slice(0, 3);
      
      setRecentAchievements(completed);
      
      // Set streak message
      if (gamificationProfile.streakDays === 0) {
        setStreakMessage('Start your streak today!');
      } else if (gamificationProfile.streakDays === 1) {
        setStreakMessage('1 day streak! Keep it going!');
      } else {
        setStreakMessage(`${gamificationProfile.streakDays} day streak! 🔥`);
      }
    }
  }, [gamificationProfile]);
  
  // Calculate progress percentages
  const calculateProgress = (macro: 'calories' | 'protein' | 'carbs' | 'fat') => {
    if (!profile) return 0;
    
    const targets = {
      calories: profile.calorieTarget || 2000,
      protein: profile.proteinTarget || 120,
      carbs: profile.carbTarget || 200,
      fat: profile.fatTarget || 65
    };
    
    const consumed = {
      calories: dailyTotals.calories,
      protein: dailyTotals.protein,
      carbs: dailyTotals.carbs,
      fat: dailyTotals.fat
    };
    
    const percentage = Math.min(Math.round((consumed[macro] / targets[macro]) * 100), 100);
    return percentage;
  };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-600">
          {format(new Date(), 'EEEE, MMMM d')}
        </div>
      </div>
      
      {/* User Summary Card */}
      {profile && gamificationProfile && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">{profile.displayName || 'User'}</h2>
            <div className="flex items-center bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
              <FiActivity className="mr-1" />
              <span>Level {gamificationProfile.level}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center text-sm text-gray-600">
              <FiTarget className="mr-1" />
              <span>Goal: {profile.goal === 'burn' ? 'Burn Fat' : profile.goal === 'build' ? 'Build Muscle' : 'Maintain Weight'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FiCalendar className="mr-1" />
              <span>{streakMessage}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Today's Progress */}
      {profile && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Today's Progress</h2>
            <button
              onClick={() => navigate('/food-log')}
              className="text-primary-600 text-sm"
            >
              View Details
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Calories */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Calories</span>
                <span>{dailyTotals.calories} / {profile.calorieTarget || 2000} kcal</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-500 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress('calories')}%` }}
                ></div>
              </div>
            </div>
            
            {/* Macros progress bars */}
            <div className="grid grid-cols-3 gap-2">
              {/* Protein */}
              <div>
                <div className="text-xs text-center mb-1">
                  <div>Protein</div>
                  <div className="font-medium">{dailyTotals.protein}g</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${calculateProgress('protein')}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Carbs */}
              <div>
                <div className="text-xs text-center mb-1">
                  <div>Carbs</div>
                  <div className="font-medium">{dailyTotals.carbs}g</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${calculateProgress('carbs')}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Fat */}
              <div>
                <div className="text-xs text-center mb-1">
                  <div>Fat</div>
                  <div className="font-medium">{dailyTotals.fat}g</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${calculateProgress('fat')}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick action buttons */}
          <div className="mt-5 flex space-x-2">
            <button
              onClick={() => navigate('/food-log')}
              className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg flex items-center justify-center text-sm"
            >
              <FiPlus className="mr-1" />
              Add Food
            </button>
            <button
              onClick={() => navigate('/stats')}
              className="flex-1 px-3 py-2 border border-primary-500 text-primary-600 rounded-lg flex items-center justify-center text-sm"
            >
              <FiTrendingUp className="mr-1" />
              View Stats
            </button>
          </div>
        </div>
      )}
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
        
        {isFoodLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">No meals logged today</p>
            <button
              onClick={() => navigate('/food-log')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm"
            >
              Add Your First Meal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.slice(0, 3).map(meal => (
              <div 
                key={meal.id}
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <div className="font-medium capitalize">{meal.mealType}</div>
                  <div className="text-xs text-gray-500">
                    {meal.foodItems.length} {meal.foodItems.length === 1 ? 'item' : 'items'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary-600">{meal.totalCalories} kcal</div>
                  <div className="text-xs text-gray-500">
                    P: {meal.totalProtein}g • C: {meal.totalCarbs}g • F: {meal.totalFat}g
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Recent Achievements */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Achievements</h2>
          <button
            onClick={() => navigate('/achievements')}
            className="text-primary-600 text-sm"
          >
            View All
          </button>
        </div>
        
        {isGamificationLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : recentAchievements.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No achievements unlocked yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAchievements.map(achievement => (
              <div 
                key={achievement.id}
                className="flex items-center py-2"
              >
                <div className="bg-primary-100 rounded-full p-2 mr-3">
                  <FiAward className="text-primary-600" size={18} />
                </div>
                <div>
                  <div className="font-medium">{achievement.title}</div>
                  <div className="text-xs text-gray-500">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Active Challenges */}
      {gamificationProfile && gamificationProfile.activeChallenges.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Active Challenges</h2>
            <button
              onClick={() => navigate('/challenges')}
              className="text-primary-600 text-sm"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {gamificationProfile.activeChallenges.slice(0, 2).map(challenge => (
              <div key={challenge.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <FiCheckCircle className="text-primary-600 mr-2" />
                  <div className="font-medium">{challenge.title}</div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-primary-500 h-2 rounded-full" 
                    style={{ width: `${(challenge.currentProgress / challenge.targetValue) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-right text-gray-500">
                  {challenge.currentProgress} / {challenge.targetValue}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
