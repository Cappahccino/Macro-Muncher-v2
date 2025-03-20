import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheck,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiMinus
} from 'react-icons/fi';
import { useFoodLogStore } from '../stores/foodLogStore';
import { useGamificationStore } from '../stores/gamificationStore';

const FoodDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    getFoodById, 
    selectedFood, 
    isLoading, 
    error, 
    addFoodItem,
    updateFoodItem
  } = useFoodLogStore();
  const { updateAchievementProgress } = useGamificationStore();
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const mealType = queryParams.get('mealType') || '';
  const isEdit = queryParams.get('edit') === 'true';
  const mealId = queryParams.get('mealId') || '';
  const itemId = queryParams.get('itemId') || '';
  
  // State for serving quantity
  const [servingQty, setServingQty] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Fetch food data
  useEffect(() => {
    if (id) {
      getFoodById(id);
    }
  }, [id, getFoodById]);
  
  // Handle quantity changes
  const incrementQty = () => {
    setServingQty(prev => {
      const newVal = Math.min(prev + 0.5, 10);
      setHasChanges(true);
      return newVal;
    });
  };
  
  const decrementQty = () => {
    setServingQty(prev => {
      const newVal = Math.max(prev - 0.5, 0.5);
      setHasChanges(true);
      return newVal;
    });
  };
  
  // Calculate nutrition values based on serving quantity
  const calculateNutrition = (value: number) => {
    return Math.round((value * servingQty) * 10) / 10;
  };
  
  // Handle adding to meal
  const handleAddToMeal = async () => {
    if (!selectedFood || !mealType) return;
    
    try {
      // Find the meal ID for this meal type
      // In a real implementation, you would need to get the actual meal ID
      const mealIdToUse = mealId || 'default-meal-id';
      
      // Prepare food item
      const foodItem = {
        foodId: selectedFood.id,
        name: selectedFood.name,
        servingSize: `${servingQty} ${selectedFood.servingSizeUnit}`,
        servingSizeUnit: selectedFood.servingSizeUnit,
        servingQty: servingQty,
        calories: calculateNutrition(selectedFood.calories),
        protein: calculateNutrition(selectedFood.protein),
        carbs: calculateNutrition(selectedFood.carbs),
        fat: calculateNutrition(selectedFood.fat),
        fiber: selectedFood.fiber ? calculateNutrition(selectedFood.fiber) : undefined,
        sugar: selectedFood.sugar ? calculateNutrition(selectedFood.sugar) : undefined,
        sodium: selectedFood.sodium ? calculateNutrition(selectedFood.sodium) : undefined
      };
      
      if (isEdit && itemId) {
        // Update existing food item
        await updateFoodItem(mealId, itemId, foodItem);
      } else {
        // Add new food item
        await addFoodItem(mealIdToUse, foodItem);
        
        // Update achievement progress
        updateAchievementProgress('first-log', 1);
        
        // Update barcode scan achievement if item has barcode
        if (selectedFood.barcode) {
          updateAchievementProgress('scan-10', 1);
        }
      }
      
      // Navigate back to food log
      navigate('/food-log');
      
    } catch (err) {
      console.error('Error adding/updating food item:', err);
    }
  };
  
  // Handle quantity input change
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.5 && value <= 10) {
      setServingQty(value);
      setHasChanges(true);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (!selectedFood) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <div className="text-center py-8">
          <p className="text-gray-500">Food not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex-1 text-center">
          {isEdit ? 'Edit Food' : 'Food Details'}
        </h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>
      
      {/* Food details card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{selectedFood.name}</h2>
          {selectedFood.brand && (
            <p className="text-gray-600">{selectedFood.brand}</p>
          )}
        </div>
        
        {/* Serving size selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Serving Size
          </label>
          <div className="flex items-center">
            <button
              onClick={decrementQty}
              className="px-2 py-1 border border-gray-300 rounded-l-lg"
            >
              <FiMinus />
            </button>
            <input
              type="number"
              value={servingQty}
              onChange={handleQtyChange}
              min="0.5"
              max="10"
              step="0.5"
              className="w-14 text-center border-t border-b border-gray-300 py-1"
            />
            <button
              onClick={incrementQty}
              className="px-2 py-1 border border-gray-300 rounded-r-lg"
            >
              <FiPlus />
            </button>
            <span className="ml-2 text-gray-600">
              {selectedFood.servingSizeUnit}
            </span>
          </div>
        </div>
        
        {/* Nutrition info */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-medium mb-3">Nutrition Facts</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="font-medium">Calories</span>
              <span>{calculateNutrition(selectedFood.calories)} kcal</span>
            </div>
            
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Protein</span>
              <span>{calculateNutrition(selectedFood.protein)}g</span>
            </div>
            
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Carbohydrates</span>
              <span>{calculateNutrition(selectedFood.carbs)}g</span>
            </div>
            
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Fat</span>
              <span>{calculateNutrition(selectedFood.fat)}g</span>
            </div>
            
            {selectedFood.fiber !== undefined && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="pl-4 text-gray-600">Fiber</span>
                <span>{calculateNutrition(selectedFood.fiber)}g</span>
              </div>
            )}
            
            {selectedFood.sugar !== undefined && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="pl-4 text-gray-600">Sugar</span>
                <span>{calculateNutrition(selectedFood.sugar)}g</span>
              </div>
            )}
            
            {selectedFood.sodium !== undefined && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Sodium</span>
                <span>{calculateNutrition(selectedFood.sodium)}mg</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-4">
        {isEdit ? (
          <>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 px-4 py-3 border border-red-500 text-red-500 rounded-lg flex items-center justify-center"
            >
              <FiTrash2 className="mr-2" /> Delete
            </button>
            <button
              onClick={handleAddToMeal}
              disabled={!hasChanges}
              className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center ${
                hasChanges 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiCheck className="mr-2" /> Save Changes
            </button>
          </>
        ) : (
          <>
            {selectedFood.isUserCreated && (
              <button
                onClick={() => navigate(`/food/edit/${selectedFood.id}`)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center"
              >
                <FiEdit className="mr-2" /> Edit Food
              </button>
            )}
            <button
              onClick={handleAddToMeal}
              className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg flex items-center justify-center"
            >
              <FiPlus className="mr-2" /> Add to {mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : 'Meal'}
            </button>
          </>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete this food item? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle deletion
                  navigate('/food-log');
                }}
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

export default FoodDetail;
