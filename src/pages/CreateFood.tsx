import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSave,
  FiAlertCircle
} from 'react-icons/fi';
import { useFoodLogStore } from '../stores/foodLogStore';

const CreateFood: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createCustomFood, selectedFood, isLoading, error } = useFoodLogStore();
  
  const [foodData, setFoodData] = useState({
    name: '',
    brand: '',
    servingSizeUnit: 'g',
    servingSize: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFoodData(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'brand' || name === 'servingSizeUnit' 
        ? value 
        : parseFloat(value) || 0
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!foodData.name) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const foodId = await createCustomFood(foodData);
      if (foodId) {
        navigate(`/food/${foodId}`);
      }
    } catch (error) {
      console.error('Error creating food:', error);
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-800">Create Custom Food</h1>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-4">
          {/* Basic food info */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Food Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={foodData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. Homemade Granola"
            />
          </div>
          
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              Brand (optional)
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={foodData.brand}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. Homemade"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="servingSize" className="block text-sm font-medium text-gray-700 mb-1">
                Serving Size *
              </label>
              <input
                type="number"
                id="servingSize"
                name="servingSize"
                value={foodData.servingSize}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label htmlFor="servingSizeUnit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                id="servingSizeUnit"
                name="servingSizeUnit"
                value={foodData.servingSizeUnit}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="g">grams (g)</option>
                <option value="ml">milliliters (ml)</option>
                <option value="oz">ounces (oz)</option>
                <option value="tbsp">tablespoons (tbsp)</option>
                <option value="tsp">teaspoons (tsp)</option>
                <option value="cup">cup</option>
                <option value="piece">piece</option>
                <option value="serving">serving</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium mb-3">Nutrition Facts (per serving)</h3>
            
            <div>
              <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
                Calories (kcal) *
              </label>
              <input
                type="number"
                id="calories"
                name="calories"
                value={foodData.calories}
                onChange={handleChange}
                required
                min="0"
                step="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">
                  Protein (g) *
                </label>
                <input
                  type="number"
                  id="protein"
                  name="protein"
                  value={foodData.protein}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 mb-1">
                  Carbs (g) *
                </label>
                <input
                  type="number"
                  id="carbs"
                  name="carbs"
                  value={foodData.carbs}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-1">
                  Fat (g) *
                </label>
                <input
                  type="number"
                  id="fat"
                  name="fat"
                  value={foodData.fat}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="fiber" className="block text-sm font-medium text-gray-700 mb-1">
                  Fiber (g)
                </label>
                <input
                  type="number"
                  id="fiber"
                  name="fiber"
                  value={foodData.fiber}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="sugar" className="block text-sm font-medium text-gray-700 mb-1">
                  Sugar (g)
                </label>
                <input
                  type="number"
                  id="sugar"
                  name="sugar"
                  value={foodData.sugar}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="sodium" className="block text-sm font-medium text-gray-700 mb-1">
                  Sodium (mg)
                </label>
                <input
                  type="number"
                  id="sodium"
                  name="sodium"
                  value={foodData.sodium}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !foodData.name}
              className={`px-4 py-2 rounded-lg flex items-center ${
                isSubmitting || !foodData.name
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" /> Save Food
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      
      <div className="text-center text-sm text-gray-500 mt-6">
        <p>* Required fields</p>
        <p className="mt-1">Custom foods are only visible to your account</p>
      </div>
    </div>
  );
};

export default CreateFood;
