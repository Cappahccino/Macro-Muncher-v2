import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  onboarded: boolean;
  goal?: 'maintain' | 'burn' | 'build';
  calorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  checkingAuth: boolean;
  error: string | null;
  
  // Actions
  registerUser: (email: string, password: string) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  checkingAuth: true,
  error: null,
  
  registerUser: async (email, password) => {
    try {
      set({ error: null });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create initial user profile
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        onboarded: false,
        createdAt: new Date(),
      };
      
      // Save profile to Firestore
      await setDoc(doc(db, 'users', user.uid), newProfile);
      
      set({ 
        user,
        profile: newProfile,
        isAuthenticated: true 
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  loginUser: async (email, password) => {
    try {
      set({ error: null });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user profile
      const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
      
      if (profileSnapshot.exists()) {
        const profileData = profileSnapshot.data() as UserProfile;
        set({ 
          user,
          profile: profileData,
          isAuthenticated: true 
        });
      } else {
        // If profile doesn't exist, create a basic one
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          onboarded: false,
          createdAt: new Date(),
        };
        
        await setDoc(doc(db, 'users', user.uid), newProfile);
        
        set({ 
          user,
          profile: newProfile,
          isAuthenticated: true 
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  logoutUser: async () => {
    try {
      await signOut(auth);
      set({ 
        user: null,
        profile: null,
        isAuthenticated: false 
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  checkAuth: async () => {
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            // Fetch user profile
            const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
            
            if (profileSnapshot.exists()) {
              const profileData = profileSnapshot.data() as UserProfile;
              set({ 
                user,
                profile: profileData,
                isAuthenticated: true,
                checkingAuth: false 
              });
            } else {
              // If no profile exists, create a basic one
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                onboarded: false,
                createdAt: new Date(),
              };
              
              await setDoc(doc(db, 'users', user.uid), newProfile);
              
              set({ 
                user,
                profile: newProfile,
                isAuthenticated: true,
                checkingAuth: false 
              });
            }
          } catch (error) {
            set({ 
              checkingAuth: false,
              error: (error as Error).message 
            });
          }
        } else {
          set({
            user: null,
            profile: null, 
            isAuthenticated: false,
            checkingAuth: false 
          });
        }
        unsubscribe();
        resolve();
      });
    });
  },
  
  updateProfile: async (data) => {
    try {
      const { user, profile } = get();
      
      if (!user || !profile) {
        throw new Error('User not authenticated');
      }
      
      const updatedProfile = {
        ...profile,
        ...data,
      };
      
      // Update profile in Firestore
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      
      set({ profile: updatedProfile });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  clearError: () => set({ error: null }),
}));

export type { UserProfile };
