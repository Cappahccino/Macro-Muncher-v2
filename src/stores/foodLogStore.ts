import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from './authStore';

// Types for food items and logs
export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  barcode?: string;
  nutrients?: Nutrient[];
  imageUrl?: string;
}

export interface FoodLogEntry {
  id: string;
  foodItem: FoodItem;
  userId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  createdAt: Date;
}

interface FoodLogState {
  entries: FoodLogEntry[];
  loading: boolean;
  error: string | null;
  currentDate: Date;
  
  // Actions
  fetchEntries: (date?: Date) => Promise<void>;
  addEntry: (entry: Omit<FoodLogEntry, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateEntry: (id: string, data: Partial<FoodLogEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setCurrentDate: (date: Date) => void;
  clearError: () => void;
  
  // Derived data
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealTotals: {
    breakfast: { calories: number; protein: number; carbs: number; fat: number };
    lunch: { calories: number; protein: number; carbs: number; fat: number };
    dinner: { calories: number; protein: number; carbs: number; fat: number };
    snack: { calories: number; protein: number; carbs: number; fat: number };
  };
}

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  currentDate: new Date(),
  
  fetchEntries: async (date) => {
    try {
      const targetDate = date || get().currentDate;
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      set({ loading: true, error: null });
      
      // Create date range for the query (start and end of the day)
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Query food log entries for the user within the date range
      const entriesQuery = query(
        collection(db, 'foodLogs'),
        where('userId', '==', user.uid),
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(entriesQuery);
      
      const fetchedEntries: FoodLogEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<FoodLogEntry, 'id' | 'date' | 'createdAt'> & { 
          date: Timestamp;
          createdAt: Timestamp;
        };
        
        fetchedEntries.push({
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
        });
      });
      
      set({ 
        entries: fetchedEntries,
        loading: false,
        currentDate: targetDate
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },
  
  addEntry: async (entry) => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      set({ loading: true, error: null });
      
      // Calculate nutritional totals based on quantity
      const calories = entry.foodItem.calories * entry.quantity;
      const protein = entry.foodItem.protein * entry.quantity;
      const carbs = entry.foodItem.carbs * entry.quantity;
      const fat = entry.foodItem.fat * entry.quantity;
      
      // Create the entry document
      const entryData = {
        ...entry,
        userId: user.uid,
        calories,
        protein,
        carbs,
        fat,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'foodLogs'), entryData);
      
      // Add to local state
      const newEntry: FoodLogEntry = {
        id: docRef.id,
        ...entry,
        userId: user.uid,
        calories,
        protein,
        carbs,
        fat,
        createdAt: new Date(),
      };
      
      set(state => ({ 
        entries: [...state.entries, newEntry],
        loading: false 
      }));
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },
  
  updateEntry: async (id, data) => {
    try {
      set({ loading: true, error: null });
      
      await updateDoc(doc(db, 'foodLogs', id), data);
      
      set(state => ({
        entries: state.entries.map(entry => 
          entry.id === id 
            ? { ...entry, ...data }
            : entry
        ),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },
  
  deleteEntry: async (id) => {
    try {
      set({ loading: true, error: null });
      
      await deleteDoc(doc(db, 'foodLogs', id));
      
      set(state => ({
        entries: state.entries.filter(entry => entry.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },
  
  setCurrentDate: (date) => {
    set({ currentDate: date });
    get().fetchEntries(date);
  },
  
  clearError: () => set({ error: null }),
  
  // Computed values (derived state)
  get totalCalories() {
    return get().entries.reduce((sum, entry) => sum + entry.calories, 0);
  },
  
  get totalProtein() {
    return get().entries.reduce((sum, entry) => sum + entry.protein, 0);
  },
  
  get totalCarbs() {
    return get().entries.reduce((sum, entry) => sum + entry.carbs, 0);
  },
  
  get totalFat() {
    return get().entries.reduce((sum, entry) => sum + entry.fat, 0);
  },
  
  get mealTotals() {
    const initialTotals = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    };
    
    return get().entries.reduce((totals, entry) => {
      const mealType = entry.mealType;
      totals[mealType].calories += entry.calories;
      totals[mealType].protein += entry.protein;
      totals[mealType].carbs += entry.carbs;
      totals[mealType].fat += entry.fat;
      return totals;
    }, initialTotals);
  }
}));
