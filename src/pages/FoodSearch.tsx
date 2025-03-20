import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiSearch, 
  FiPlus, 
  FiArrowLeft, 
  FiBarChart2, 
  FiCamera,
  FiPackage
} from 'react-icons/fi';
import { useFoodLogStore, FoodData } from '../stores/foodLogStore';

const FoodSearch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchFood, searchResults, isLoading, error } = useFoodLogStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  // Parse meal type from URL query params if present
  const queryParams = new URLSearchParams(location.search);
  const mealType = queryParams.get('mealType') || '';
  
  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchFood(searchQuery);
    }
  };
  
  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchFood(searchQuery);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchFood]);
  
  // Handle food item selection
  const handleSelectFood = (food: FoodData) => {
    if (mealType) {
      navigate(`/food/${food.id}?mealType=${mealType}`);
    } else {
      navigate(`/food/${food.id}`);
    }
  };
  
  // Toggle barcode scanner
  const toggleScanner = () => {
    setShowScanner(!showScanner);
  };
  
  // Handle barcode scan result
  const handleScanResult = (barcode: string) => {
    // In a real implementation, this would search for the food by barcode
    setSearchQuery(barcode);
    setShowScanner(false);
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
        <h1 className="text-2xl font-bold text-gray-800">
          {mealType ? `Add to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}` : 'Search Food'}
        </h1>
      </div>
      
      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-l-lg border border-gray-300 pl-10 pr-4 py-3 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search food..."
            />
          </div>
          <button
            type="button"
            onClick={toggleScanner}
            className="px-4 py-3 bg-primary-500 text-white rounded-r-lg"
          >
            <FiCamera size={20} />
          </button>
        </div>
      </form>
      
      {/* Barcode scanner modal (simplified placeholder) */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Scan Barcode</h3>
            <div className="bg-gray-200 h-48 flex items-center justify-center mb-4 rounded">
              <p className="text-gray-500">Camera view would go here</p>
            </div>
            
            {/* Placeholder for demo/testing */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter barcode (for testing)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="e.g. 737628064502"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleScanResult((e.target as HTMLInputElement).value);
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowScanner(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleScanResult('737628064502')}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg"
              >
                Test Scan
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Search results */}
      <div>
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        )}
        
        {!isLoading && error && (
          <div className="text-center py-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        
        {!isLoading && !error && searchQuery.length > 0 && searchResults.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No results found for "{searchQuery}"</p>
            <button
              onClick={() => navigate('/food/create')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center mx-auto"
            >
              <FiPlus className="mr-2" /> Create Custom Food
            </button>
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-3">Results</h2>
            <div className="space-y-2">
              {searchResults.map((food) => (
                <div
                  key={food.id}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelectFood(food)}
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{food.name}</h3>
                      {food.brand && (
                        <p className="text-sm text-gray-500">{food.brand}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {food.servingSize} {food.servingSizeUnit}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-primary-600 font-medium">
                        {food.calories} kcal
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                      </div>
                    </div>
                  </div>
                  
                  {food.isUserCreated && (
                    <div className="flex items-center mt-2 text-xs text-primary-600">
                      <FiPackage className="mr-1" size={12} />
                      <span>Custom food</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Quick actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="container mx-auto max-w-lg flex justify-center">
            <button
              onClick={() => navigate('/food/create')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center"
            >
              <FiPlus className="mr-2" /> Create Custom Food
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodSearch;
