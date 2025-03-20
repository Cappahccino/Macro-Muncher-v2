import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiBarChart2, 
  FiCalendar
} from 'react-icons/fi';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { useFoodLogStore } from '../stores/foodLogStore';
import { useGamificationStore } from '../stores/gamificationStore';

const FoodLog: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { 
    meals, 
    fetchMealsForDate, 
    deleteMeal, 
    deleteFoodItem, 
    dailyTotals 
  } = useFoodLogStore();
  const { updateStreak, updateAchievementProgress } = useGamificationStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'meal' | 'food' } | null>(null);
  
  // Fetch meals when date changes
  useEffect(() => {
    const loadMeals = async () => {
      setIsLoading(true);
      await fetchMealsForDate(selectedDate);
      setIsLoading(false);
    };
    
    loadMeals();
  }, [fetchMealsForDate, selectedDate]);
  
  // Update streak when component mounts (only if there are meals logged)
  useEffect(() => {
    if (meals.length > 0 && selectedDate.toDateString() === new Date().toDateString()) {
      updateStreak();
      updateAchievementProgress('first-log', 1);
    }
  }, [meals, selectedDate, updateStreak, updateAchievementProgress]);
  
  // Handle date navigation
  const changeDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1)
    );
  };
  
  // Navigate to food search for adding items
  const navigateToSearch = (mealType?: string) => {
    if (mealType) {
      navigate(`/food-search?mealType=${mealType}`);
    } else {
      navigate('/food-search');
    }
  };
  
  // Delete confirmation
  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'meal') {
      deleteMeal(itemToDelete.id);
    } else {
      deleteFoodItem(itemToDelete.id);
    }
    
    setShowDeleteModal(false);
    setItemToDelete(null);
  };
  
  // Calculate progress percentages for macros
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
  
  // Render meal sections
  const renderMeals = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }
    
    if (meals.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No meals logged for this day</p>
          <button
            onClick={() => navigateToSearch()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center mx-auto"
          >
            <FiPlus className="mr-2" /> Add Food
          </button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {meals.map(meal => (
          <div key={meal.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-lg capitalize">{meal.mealType}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateToSearch(meal.mealType)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-full"
                >
                  <FiPlus size={18} />
                </button>
                <button
                  onClick={() => {
                    setItemToDelete({ id: meal.id, type: 'meal' });
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
            
            {/* List of food items */}
            <div className="space-y-2">
              {meal.foodItems.length === 0 ? (
                <p className="text-gray-400 text-sm">No food items added to this meal</p>
              ) : (
                meal.foodItems.map(food => (
                  <div 
                    key={food.id} 
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{food.name}</p>
                      <p className="text-sm text-gray-500">
                        {food.servingSize} ({food.calories} kcal)
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => navigate(`/food/${food.foodId}?edit=true&mealId=${meal.id}&itemId=${food.id}`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ id: food.id, type: 'food' });
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Meal totals */}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total:</span>
                <span>{meal.totalCalories} kcal</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>P: {meal.totalProtein}g</span>
                <span>C: {meal.totalCarbs}g</span>
                <span>F: {meal.totalFat}g</span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Quick add meal button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigateToSearch()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center"
          >
            <FiPlus className="mr-2" /> Add Food
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Food Log</h1>
      
      {/* Date selector */}
      <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow p-3">
        <button
          onClick={() => changeDate('prev')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          &larr;
        </button>
        <div className="flex items-center">
          <FiCalendar className="text-primary-500 mr-2" />
          <span className="font-medium">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
        <button
          onClick={() => changeDate('next')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          disabled={selectedDate >= new Date()}
        >
          &rarr;
        </button>
      </div>
      
      {/* Nutrition summary */}
      {profile && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-medium mb-3 flex items-center">
            <FiBarChart2 className="text-primary-500 mr-2" />
            Daily Summary
          </h2>
          
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
            
            {/* Protein */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Protein</span>
                <span>{dailyTotals.protein} / {profile.proteinTarget || 120} g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress('protein')}%` }}
                ></div>
              </div>
            </div>
            
            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Carbs</span>
                <span>{dailyTotals.carbs} / {profile.carbTarget || 200} g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress('carbs')}%` }}
                ></div>
              </div>
            </div>
            
            {/* Fat */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Fat</span>
                <span>{dailyTotals.fat} / {profile.fatTarget || 65} g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-yellow-500 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress('fat')}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-4 text-sm text-gray-500">
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
      )}
      
      {/* Meals list */}
      {renderMeals()}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete this {itemToDelete?.type === 'meal' ? 'meal' : 'food item'}? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodLog;
