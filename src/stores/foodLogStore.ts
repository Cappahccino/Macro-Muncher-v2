import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from './authStore';
import { format } from 'date-fns';

// Types
export interface FoodItem {
  id: string;
  foodId: string;
  name: string;
  servingSize: string;
  servingSizeUnit: string;
  servingQty: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  addedAt: Date;
}

export interface Meal {
  id: string;
  userId: string;
  date: Date;
  mealType: string;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodData {
  id: string;
  name: string;
  brand?: string;
  servingSizeUnit: string;
  servingSize: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  barcode?: string;
  isUserCreated: boolean;
  userId?: string;
  createdAt: Date;
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodLogState {
  meals: Meal[];
  foodItems: FoodData[];
  selectedFood: FoodData | null;
  searchResults: FoodData[];
  dailyTotals: NutritionTotals;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMealsForDate: (date: Date) => Promise<void>;
  addMeal: (mealType: string, date: Date) => Promise<string>;
  updateMeal: (mealId: string, updates: Partial<Meal>) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  addFoodItem: (mealId: string, item: Omit<FoodItem, 'id' | 'addedAt'>) => Promise<void>;
  updateFoodItem: (mealId: string, itemId: string, updates: Partial<FoodItem>) => Promise<void>;
  deleteFoodItem: (itemId: string) => Promise<void>;
  searchFood: (query: string) => Promise<void>;
  getFoodById: (foodId: string) => Promise<void>;
  createCustomFood: (foodData: Omit<FoodData, 'id' | 'isUserCreated' | 'userId' | 'createdAt'>) => Promise<string>;
  calculateDailyTotals: (meals: Meal[]) => void;
  clearError: () => void;
}

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  meals: [],
  foodItems: [],
  selectedFood: null,
  searchResults: [],
  dailyTotals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  },
  isLoading: false,
  error: null,
  
  fetchMealsForDate: async (date: Date) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      set({ isLoading: true, error: null });
      
      // Convert to start and end of day for query
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Query meals for this date range
      const mealsRef = collection(db, 'meals');
      const mealsQuery = query(
        mealsRef,
        where('userId', '==', user.uid),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );
      
      const mealsSnapshot = await getDocs(mealsQuery);
      
      if (mealsSnapshot.empty) {
        // Create default meals if none exist for this date
        const defaultMealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
        const newMeals: Meal[] = [];
        
        for (const mealType of defaultMealTypes) {
          const mealId = await get().addMeal(mealType, date);
          
          // Create meal object for local state
          newMeals.push({
            id: mealId,
            userId: user.uid,
            date: date,
            mealType: mealType,
            foodItems: [],
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        set({ 
          meals: newMeals,
          isLoading: false 
        });
        
        // Calculate daily totals
        get().calculateDailyTotals(newMeals);
        
        return;
      }
      
      // Process meals with their food items
      const meals: Meal[] = [];
      
      for (const mealDoc of mealsSnapshot.docs) {
        const mealData = mealDoc.data();
        
        // Convert Firestore timestamp to Date
        const meal: Meal = {
          id: mealDoc.id,
          userId: mealData.userId,
          date: mealData.date.toDate(),
          mealType: mealData.mealType,
          foodItems: mealData.foodItems.map((item: any) => ({
            ...item,
            addedAt: item.addedAt.toDate()
          })),
          totalCalories: mealData.totalCalories,
          totalProtein: mealData.totalProtein,
          totalCarbs: mealData.totalCarbs,
          totalFat: mealData.totalFat,
          createdAt: mealData.createdAt.toDate(),
          updatedAt: mealData.updatedAt.toDate()
        };
        
        meals.push(meal);
      }
      
      set({ 
        meals: meals.sort((a, b) => {
          // Custom sort order: breakfast, lunch, dinner, snacks
          const mealOrder: Record<string, number> = {
            breakfast: 1,
            lunch: 2, 
            dinner: 3,
            snacks: 4
          };
          
          return (mealOrder[a.mealType] || 99) - (mealOrder[b.mealType] || 99);
        }),
        isLoading: false 
      });
      
      // Calculate daily totals
      get().calculateDailyTotals(meals);
      
    } catch (error) {
      set({ 
        error: (error as Error).message,
        isLoading: false 
      });
    }
  },
  
  addMeal: async (mealType, date) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create the meal document
      const newMeal = {
        userId: user.uid,
        date: Timestamp.fromDate(date),
        mealType: mealType.toLowerCase(),
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const mealRef = await addDoc(collection(db, 'meals'), newMeal);
      return mealRef.id;
      
    } catch (error) {
      set({ error: (error as Error).message });
      return '';
    }
  },
  
  updateMeal: async (mealId, updates) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get current meal data
      const meal = get().meals.find(m => m.id === mealId);
      
      if (!meal) {
        throw new Error('Meal not found');
      }
      
      // Prepare updates for Firestore
      const firestoreUpdates: Record<string, any> = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Convert dates to timestamps
      if (updates.date) {
        firestoreUpdates.date = Timestamp.fromDate(updates.date);
      }
      
      // Update in Firestore
      await updateDoc(doc(db, 'meals', mealId), firestoreUpdates);
      
      // Update local state
      set(state => ({
        meals: state.meals.map(m => 
          m.id === mealId ? { ...m, ...updates, updatedAt: new Date() } : m
        )
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  deleteMeal: async (mealId) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'meals', mealId));
      
      // Update local state
      const updatedMeals = get().meals.filter(m => m.id !== mealId);
      set({ meals: updatedMeals });
      
      // Recalculate daily totals
      get().calculateDailyTotals(updatedMeals);
      
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  addFoodItem: async (mealId, item) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create a new food item with ID
      const foodItem: FoodItem = {
        ...item,
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        addedAt: new Date()
      };
      
      // Get current meal data
      const meal = get().meals.find(m => m.id === mealId);
      
      if (!meal) {
        throw new Error('Meal not found');
      }
      
      // Calculate new meal totals
      const newTotalCalories = meal.totalCalories + foodItem.calories;
      const newTotalProtein = meal.totalProtein + foodItem.protein;
      const newTotalCarbs = meal.totalCarbs + foodItem.carbs;
      const newTotalFat = meal.totalFat + foodItem.fat;
      
      // Update Firestore - convert Date to Firestore Timestamp
      const firestoreItem = {
        ...foodItem,
        addedAt: Timestamp.fromDate(foodItem.addedAt)
      };
      
      await updateDoc(doc(db, 'meals', mealId), {
        foodItems: arrayUnion(firestoreItem),
        totalCalories: newTotalCalories,
        totalProtein: newTotalProtein,
        totalCarbs: newTotalCarbs,
        totalFat: newTotalFat,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        meals: state.meals.map(m => 
          m.id === mealId 
            ? {
                ...m,
                foodItems: [...m.foodItems, foodItem],
                totalCalories: newTotalCalories,
                totalProtein: newTotalProtein,
                totalCarbs: newTotalCarbs,
                totalFat: newTotalFat,
                updatedAt: new Date()
              } 
            : m
        )
      }));
      
      // Update daily totals
      const updatedMeals = get().meals.map(m => 
        m.id === mealId 
          ? {
              ...m,
              foodItems: [...m.foodItems, foodItem],
              totalCalories: newTotalCalories,
              totalProtein: newTotalProtein,
              totalCarbs: newTotalCarbs,
              totalFat: newTotalFat,
              updatedAt: new Date()
            } 
          : m
      );
      get().calculateDailyTotals(updatedMeals);
      
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  updateFoodItem: async (mealId, itemId, updates) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get current meal data
      const meal = get().meals.find(m => m.id === mealId);
      
      if (!meal) {
        throw new Error('Meal not found');
      }
      
      // Find the food item
      const foodItem = meal.foodItems.find(f => f.id === itemId);
      
      if (!foodItem) {
        throw new Error('Food item not found');
      }
      
      // Create the updated food item
      const updatedItem = { ...foodItem, ...updates };
      
      // Calculate the differences in nutrition values
      const caloriesDiff = updatedItem.calories - foodItem.calories;
      const proteinDiff = updatedItem.protein - foodItem.protein;
      const carbsDiff = updatedItem.carbs - foodItem.carbs;
      const fatDiff = updatedItem.fat - foodItem.fat;
      
      // Calculate new meal totals
      const newTotalCalories = meal.totalCalories + caloriesDiff;
      const newTotalProtein = meal.totalProtein + proteinDiff;
      const newTotalCarbs = meal.totalCarbs + carbsDiff;
      const newTotalFat = meal.totalFat + fatDiff;
      
      // Need to update the entire foodItems array since arrayRemove/arrayUnion doesn't work well for updates
      const updatedFoodItems = meal.foodItems.map(f => 
        f.id === itemId ? updatedItem : f
      );
      
      // Convert to Firestore format
      const firestoreFoodItems = updatedFoodItems.map(f => ({
        ...f,
        addedAt: Timestamp.fromDate(f.addedAt)
      }));
      
      // Update in Firestore
      await updateDoc(doc(db, 'meals', mealId), {
        foodItems: firestoreFoodItems,
        totalCalories: newTotalCalories,
        totalProtein: newTotalProtein,
        totalCarbs: newTotalCarbs,
        totalFat: newTotalFat,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        meals: state.meals.map(m => 
          m.id === mealId 
            ? {
                ...m,
                foodItems: updatedFoodItems,
                totalCalories: newTotalCalories,
                totalProtein: newTotalProtein,
                totalCarbs: newTotalCarbs,
                totalFat: newTotalFat,
                updatedAt: new Date()
              } 
            : m
        )
      }));
      
      // Update daily totals
      const updatedMeals = get().meals.map(m => 
        m.id === mealId 
          ? {
              ...m,
              foodItems: updatedFoodItems,
              totalCalories: newTotalCalories,
              totalProtein: newTotalProtein,
              totalCarbs: newTotalCarbs,
              totalFat: newTotalFat,
              updatedAt: new Date()
            } 
          : m
      );
      get().calculateDailyTotals(updatedMeals);
      
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  deleteFoodItem: async (itemId) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Find which meal contains this food item
      const meal = get().meals.find(m => 
        m.foodItems.some(f => f.id === itemId)
      );
      
      if (!meal) {
        throw new Error('Food item not found in any meal');
      }
      
      // Find the food item
      const foodItem = meal.foodItems.find(f => f.id === itemId);
      
      if (!foodItem) {
        throw new Error('Food item not found');
      }
      
      // Calculate new meal totals
      const newTotalCalories = meal.totalCalories - foodItem.calories;
      const newTotalProtein = meal.totalProtein - foodItem.protein;
      const newTotalCarbs = meal.totalCarbs - foodItem.carbs;
      const newTotalFat = meal.totalFat - foodItem.fat;
      
      // Convert to Firestore format for arrayRemove
      const firestoreItem = {
        ...foodItem,
        addedAt: Timestamp.fromDate(foodItem.addedAt)
      };
      
      // Need to update the entire foodItems array since arrayRemove has limitations with complex objects
      const updatedFoodItems = meal.foodItems.filter(f => f.id !== itemId);
      
      // Convert to Firestore format
      const firestoreFoodItems = updatedFoodItems.map(f => ({
        ...f,
        addedAt: Timestamp.fromDate(f.addedAt)
      }));
      
      // Update in Firestore
      await updateDoc(doc(db, 'meals', meal.id), {
        foodItems: firestoreFoodItems,
        totalCalories: newTotalCalories,
        totalProtein: newTotalProtein,
        totalCarbs: newTotalCarbs,
        totalFat: newTotalFat,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set(state => ({
        meals: state.meals.map(m => 
          m.id === meal.id 
            ? {
                ...m,
                foodItems: updatedFoodItems,
                totalCalories: newTotalCalories,
                totalProtein: newTotalProtein,
                totalCarbs: newTotalCarbs,
                totalFat: newTotalFat,
                updatedAt: new Date()
              } 
            : m
        )
      }));
      
      // Update daily totals
      const updatedMeals = get().meals.map(m => 
        m.id === meal.id 
          ? {
              ...m,
              foodItems: updatedFoodItems,
              totalCalories: newTotalCalories,
              totalProtein: newTotalProtein,
              totalCarbs: newTotalCarbs,
              totalFat: newTotalFat,
              updatedAt: new Date()
            } 
          : m
      );
      get().calculateDailyTotals(updatedMeals);
      
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  searchFood: async (query) => {
    try {
      if (!query || query.length < 2) {
        set({ searchResults: [] });
        return;
      }
      
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      set({ isLoading: true, error: null });
      
      // Query for foods that match the search term
      const foodsRef = collection(db, 'foods');
      const queryLower = query.toLowerCase();
      
      // Search in public food database
      const publicFoodsQuery = query(
        foodsRef,
        where('nameSearchTokens', 'array-contains', queryLower)
      );
      
      // Search in user's custom foods
      const userFoodsQuery = query(
        foodsRef,
        where('userId', '==', user.uid),
        where('nameSearchTokens', 'array-contains', queryLower)
      );
      
      const [publicFoodsSnapshot, userFoodsSnapshot] = await Promise.all([
        getDocs(publicFoodsQuery),
        getDocs(userFoodsQuery)
      ]);
      
      const results: FoodData[] = [];
      
      // Process public foods
      publicFoodsSnapshot.forEach(doc => {
        const data = doc.data();
        results.push({
          id: doc.id,
          name: data.name,
          brand: data.brand,
          servingSizeUnit: data.servingSizeUnit,
          servingSize: data.servingSize,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          fiber: data.fiber,
          sugar: data.sugar,
          sodium: data.sodium,
          barcode: data.barcode,
          isUserCreated: false,
          createdAt: data.createdAt.toDate()
        });
      });
      
      // Process user's custom foods
      userFoodsSnapshot.forEach(doc => {
        const data = doc.data();
        results.push({
          id: doc.id,
          name: data.name,
          brand: data.brand,
          servingSizeUnit: data.servingSizeUnit,
          servingSize: data.servingSize,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          fiber: data.fiber,
          sugar: data.sugar,
          sodium: data.sodium,
          barcode: data.barcode,
          isUserCreated: true,
          userId: data.userId,
          createdAt: data.createdAt.toDate()
        });
      });
      
      // Sort results by name
      results.sort((a, b) => a.name.localeCompare(b.name));
      
      set({ 
        searchResults: results,
        isLoading: false 
      });
      
    } catch (error) {
      set({ 
        error: (error as Error).message,
        isLoading: false 
      });
    }
  },
  
  getFoodById: async (foodId) => {
    try {
      set({ isLoading: true, error: null });
      
      const foodDoc = await getDoc(doc(db, 'foods', foodId));
      
      if (!foodDoc.exists()) {
        throw new Error('Food not found');
      }
      
      const data = foodDoc.data();
      
      const food: FoodData = {
        id: foodDoc.id,
        name: data.name,
        brand: data.brand,
        servingSizeUnit: data.servingSizeUnit,
        servingSize: data.servingSize,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber,
        sugar: data.sugar,
        sodium: data.sodium,
        barcode: data.barcode,
        isUserCreated: data.userId ? true : false,
        userId: data.userId,
        createdAt: data.createdAt.toDate()
      };
      
      set({ 
        selectedFood: food,
        isLoading: false 
      });
      
    } catch (error) {
      set({ 
        error: (error as Error).message,
        isLoading: false 
      });
    }
  },
  
  createCustomFood: async (foodData) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      set({ isLoading: true, error: null });
      
      // Generate search tokens for the food name (for easier searching)
      const nameSearchTokens = generateSearchTokens(foodData.name);
      if (foodData.brand) {
        generateSearchTokens(foodData.brand).forEach(token => {
          if (!nameSearchTokens.includes(token)) {
            nameSearchTokens.push(token);
          }
        });
      }
      
      // Create the new food
      const newFood = {
        ...foodData,
        userId: user.uid,
        nameSearchTokens,
        isUserCreated: true,
        createdAt: serverTimestamp()
      };
      
      const foodRef = await addDoc(collection(db, 'foods'), newFood);
      
      set({ isLoading: false });
      
      return foodRef.id;
      
    } catch (error) {
      set({ 
        error: (error as Error).message,
        isLoading: false 
      });
      return '';
    }
  },
  
  calculateDailyTotals: (meals) => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
    
    meals.forEach(meal => {
      totals.calories += meal.totalCalories;
      totals.protein += meal.totalProtein;
      totals.carbs += meal.totalCarbs;
      totals.fat += meal.totalFat;
    });
    
    // Round values to 1 decimal place
    totals.calories = Math.round(totals.calories);
    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.carbs = Math.round(totals.carbs * 10) / 10;
    totals.fat = Math.round(totals.fat * 10) / 10;
    
    set({ dailyTotals: totals });
  },
  
  clearError: () => set({ error: null })
}));

// Helper function to generate search tokens from a food name
function generateSearchTokens(text: string): string[] {
  if (!text) return [];
  
  // Lowercase and remove special characters
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  
  // Split by spaces and filter out empty strings and words shorter than 2 chars
  const words = normalizedText.split(' ').filter(word => word.length >= 2);
  
  // Add the full text as a token
  const tokens = [normalizedText];
  
  // Add individual words as tokens
  words.forEach(word => {
    if (!tokens.includes(word)) {
      tokens.push(word);
    }
  });
  
  return tokens;
}
