import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCalendar,
  FiBarChart2,
  FiTrendingUp,
  FiTarget,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval, addDays } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { useFoodLogStore } from '../stores/foodLogStore';
import { useGamificationStore } from '../stores/gamificationStore';

// Mock data for visualization (in a real app, this would come from the food log)
interface DailyStats {
  date: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetMet: boolean;
}

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { meals, fetchMealsForDate, dailyTotals } = useFoodLogStore();
  const { profile: gamificationProfile, fetchProfile } = useGamificationStore();
  
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [statsData, setStatsData] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFat: 0,
    daysOnTarget: 0,
    streakDays: 0,
    bestDay: '',
    worstDay: ''
  });
  
  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // In a real app, fetch historical data for the selected time range
        // For this demo, we'll generate mock data
        await fetchProfile();
        const mockData = generateMockData(timeRange);
        setStatsData(mockData);
        calculateSummaryStats(mockData);
      } catch (error) {
        console.error('Error loading statistical data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [timeRange, fetchProfile]);
  
  // Generate mock data for visualization
  const generateMockData = (range: 'week' | 'month'): DailyStats[] => {
    const today = new Date();
    const startDate = range === 'week' 
      ? startOfWeek(today) 
      : startOfMonth(today);
    
    const dates = eachDayOfInterval({
      start: startDate,
      end: today
    });
    
    // Generate random but realistic-looking data
    return dates.map(date => {
      const targetCalories = profile?.calorieTarget || 2000;
      const baseCalories = targetCalories * (0.85 + Math.random() * 0.3); // Random between 85-115% of target
      const calories = Math.round(baseCalories);
      
      // Calculate macros based on a somewhat realistic distribution
      const protein = Math.round((calories * (0.25 + Math.random() * 0.1)) / 4); // ~25-35% protein
      const fat = Math.round((calories * (0.25 + Math.random() * 0.1)) / 9); // ~25-35% fat
      const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4); // Remaining calories from carbs
      
      // Determine if targets were met
      const targetMet = Math.abs(calories - targetCalories) / targetCalories < 0.1; // Within 10% of target
      
      return {
        date,
        calories,
        protein,
        carbs,
        fat,
        targetMet
      };
    });
  };
  
  // Calculate summary statistics
  const calculateSummaryStats = (data: DailyStats[]) => {
    if (data.length === 0) return;
    
    const totalCalories = data.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = data.reduce((sum, day) => sum + day.protein, 0);
    const totalCarbs = data.reduce((sum, day) => sum + day.carbs, 0);
    const totalFat = data.reduce((sum, day) => sum + day.fat, 0);
    const daysOnTarget = data.filter(day => day.targetMet).length;
    
    // Find best (closest to target) and worst days
    const target = profile?.calorieTarget || 2000;
    let bestDayIndex = 0;
    let worstDayIndex = 0;
    let bestDiff = Math.abs(data[0].calories - target);
    let worstDiff = bestDiff;
    
    data.forEach((day, index) => {
      const diff = Math.abs(day.calories - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestDayIndex = index;
      }
      if (diff > worstDiff) {
        worstDiff = diff;
        worstDayIndex = index;
      }
    });
    
    setSummaryStats({
      avgCalories: Math.round(totalCalories / data.length),
      avgProtein: Math.round(totalProtein / data.length),
      avgCarbs: Math.round(totalCarbs / data.length),
      avgFat: Math.round(totalFat / data.length),
      daysOnTarget,
      streakDays: gamificationProfile?.streakDays || 0,
      bestDay: format(data[bestDayIndex].date, 'MMM d'),
      worstDay: format(data[worstDayIndex].date, 'MMM d')
    });
  };
  
  // Calculate the height for bar visualization based on percentage of max value
  const getBarHeight = (value: number, maxValue: number) => {
    const percentage = Math.min(value / maxValue, 1);
    return `${Math.max(percentage * 100, 5)}%`; // Min 5% height for visibility
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'd');
  };
  
  // Get color based on target comparison
  const getComparisonColor = (actual: number, target: number) => {
    const ratio = actual / target;
    if (ratio > 1.1) return 'text-red-500'; // Over by more than 10%
    if (ratio < 0.9) return 'text-yellow-500'; // Under by more than 10%
    return 'text-green-500'; // Within 10% of target
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
        <h1 className="text-2xl font-bold text-gray-800">Statistics</h1>
      </div>
      
      {/* Time range selector */}
      <div className="bg-white rounded-lg shadow mb-6 p-2">
        <div className="flex">
          <button
            onClick={() => setTimeRange('week')}
            className={`flex-1 py-2 text-center rounded-lg text-sm font-medium ${
              timeRange === 'week' 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiCalendar className="inline mr-1" /> This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`flex-1 py-2 text-center rounded-lg text-sm font-medium ${
              timeRange === 'month' 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiCalendar className="inline mr-1" /> This Month
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Calorie trend chart */}
          <div className="bg-white rounded-lg shadow p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium flex items-center">
                <FiBarChart2 className="text-primary-600 mr-2" />
                Calorie Trend
              </h2>
              <div className="text-sm text-gray-600">
                Target: {profile?.calorieTarget || 2000} kcal
              </div>
            </div>
            
            <div className="h-52 flex items-end space-x-1">
              {statsData.map((day, index) => (
                <div 
                  key={index}
                  className="flex-1 flex flex-col items-center"
                >
                  <div className="w-full relative flex justify-center mb-1">
                    <div 
                      className={`w-full ${
                        day.targetMet ? 'bg-primary-500' : 'bg-gray-300'
                      }`}
                      style={{ 
                        height: getBarHeight(day.calories, (profile?.calorieTarget || 2000) * 1.5)
                      }}
                    ></div>
                    
                    {/* Target line */}
                    {index === statsData.length - 1 && (
                      <div 
                        className="absolute border-t-2 border-dashed border-red-400 w-full left-0"
                        style={{ 
                          bottom: getBarHeight(profile?.calorieTarget || 2000, (profile?.calorieTarget || 2000) * 1.5)
                        }}
                      ></div>
                    )}
                  </div>
                  <div className="text-xs mt-1 text-gray-600">
                    {formatDate(day.date)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-600">Average: </span>
                  <span className={getComparisonColor(summaryStats.avgCalories, profile?.calorieTarget || 2000)}>
                    {summaryStats.avgCalories} kcal
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">On target: </span>
                  <span className="text-primary-600 font-medium">
                    {summaryStats.daysOnTarget} days
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Macro distribution chart */}
          <div className="bg-white rounded-lg shadow p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium flex items-center">
                <FiTarget className="text-primary-600 mr-2" />
                Macro Averages
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Protein */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Protein</span>
                  <div>
                    <span className={getComparisonColor(summaryStats.avgProtein, profile?.proteinTarget || 120)}>
                      {summaryStats.avgProtein}g
                    </span>
                    <span className="text-gray-500 ml-1">
                      / {profile?.proteinTarget || 120}g
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min((summaryStats.avgProtein / (profile?.proteinTarget || 120)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Carbs */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Carbs</span>
                  <div>
                    <span className={getComparisonColor(summaryStats.avgCarbs, profile?.carbTarget || 200)}>
                      {summaryStats.avgCarbs}g
                    </span>
                    <span className="text-gray-500 ml-1">
                      / {profile?.carbTarget || 200}g
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min((summaryStats.avgCarbs / (profile?.carbTarget || 200)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Fat */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Fat</span>
                  <div>
                    <span className={getComparisonColor(summaryStats.avgFat, profile?.fatTarget || 65)}>
                      {summaryStats.avgFat}g
                    </span>
                    <span className="text-gray-500 ml-1">
                      / {profile?.fatTarget || 65}g
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min((summaryStats.avgFat / (profile?.fatTarget || 65)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-5 text-sm text-gray-500">
              <div>
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                <span>Protein</span>
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                <span>Carbs</span>
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
                <span>Fat</span>
              </div>
            </div>
          </div>
          
          {/* Summary insights */}
          <div className="bg-white rounded-lg shadow p-5 mb-6">
            <h2 className="text-lg font-medium flex items-center mb-4">
              <FiTrendingUp className="text-primary-600 mr-2" />
              Insights
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FiCalendar className="text-blue-600" />
                  </div>
                  <span>Current streak</span>
                </div>
                <span className="font-medium text-primary-600">
                  {summaryStats.streakDays} days
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <FiCheck className="text-green-600" />
                  </div>
                  <span>Best day</span>
                </div>
                <span className="font-medium">
                  {summaryStats.bestDay}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="bg-red-100 p-2 rounded-full mr-3">
                    <FiX className="text-red-600" />
                  </div>
                  <span>Needs improvement</span>
                </div>
                <span className="font-medium">
                  {summaryStats.worstDay}
                </span>
              </div>
            </div>
          </div>
          
          {/* Recommendations based on stats */}
          <div className="bg-white rounded-lg shadow p-5 mb-6">
            <h2 className="text-lg font-medium mb-4">Recommendations</h2>
            
            <div className="space-y-3 text-sm text-gray-700">
              {summaryStats.avgCalories < (profile?.calorieTarget || 2000) * 0.9 && (
                <p>
                  <span className="font-medium text-yellow-600">Increase your calorie intake:</span> You're consistently eating below your target. Try adding more nutrient-dense foods to your meals.
                </p>
              )}
              
              {summaryStats.avgCalories > (profile?.calorieTarget || 2000) * 1.1 && (
                <p>
                  <span className="font-medium text-yellow-600">Monitor your portions:</span> You're regularly exceeding your calorie target. Try measuring portion sizes more carefully.
                </p>
              )}
              
              {summaryStats.avgProtein < (profile?.proteinTarget || 120) * 0.9 && (
                <p>
                  <span className="font-medium text-blue-600">Increase protein intake:</span> Add more lean protein sources like chicken, fish, tofu, or legumes to your meals.
                </p>
              )}
              
              {summaryStats.daysOnTarget < statsData.length * 0.3 && (
                <p>
                  <span className="font-medium text-primary-600">Consistency is key:</span> Try to plan your meals ahead to hit your targets more consistently.
                </p>
              )}
              
              {summaryStats.daysOnTarget > statsData.length * 0.7 && (
                <p>
                  <span className="font-medium text-green-600">Great consistency!</span> You're doing an excellent job of hitting your targets regularly. Keep it up!
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;
