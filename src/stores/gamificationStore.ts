import { create } from 'zustand';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  increment, 
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from './authStore';

// Types for achievements, streaks, and challenges
export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'logging' | 'nutrition' | 'consistency' | 'social' | 'special';
  progress: number;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: Date;
  points: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  startDate: Date;
  endDate: Date;
  targetValue: number;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: Date;
  points: number;
}

export interface GamificationProfile {
  userId: string;
  streakDays: number;
  longestStreak: number;
  lastLogDate: Date | null;
  points: number;
  level: number;
  achievements: Achievement[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
}

interface GamificationState {
  profile: GamificationProfile | null;
  loading: boolean;
  error: string | null;
  showAchievementModal: boolean;
  lastUnlockedAchievement: Achievement | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateStreak: () => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  closeAchievementModal: () => void;
  completeAchievement: (achievementId: string) => Promise<void>;
  updateAchievementProgress: (achievementId: string, progressAmount: number) => Promise<void>;
  joinChallenge: (challenge: Omit<Challenge, 'userId' | 'currentProgress' | 'isCompleted'>) => Promise<void>;
  updateChallengeProgress: (challengeId: string, progressAmount: number) => Promise<void>;
  
  // Helper methods
  checkLevelUp: (points: number) => number;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  showAchievementModal: false,
  lastUnlockedAchievement: null,
  
  fetchProfile: async () => {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      set({ loading: true, error: null });
      
      const profileDoc = await getDoc(doc(db, 'gamification', user.uid));
      
      if (profileDoc.exists()) {
        const data = profileDoc.data() as Omit<GamificationProfile, 'lastLogDate'> & { 
          lastLogDate: Timestamp | null;
          achievements: Array<Omit<Achievement, 'completedAt'> & { completedAt?: Timestamp }>;
          activeChallenges: Array<Omit<Challenge, 'startDate' | 'endDate' | 'completedAt'> & { 
            startDate: Timestamp;
            endDate: Timestamp;
            completedAt?: Timestamp;
          }>;
          completedChallenges: Array<Omit<Challenge, 'startDate' | 'endDate' | 'completedAt'> & { 
            startDate: Timestamp;
            endDate: Timestamp;
            completedAt?: Timestamp;
          }>;
        };
        
        // Convert Firestore timestamps to JavaScript Dates
        const profile: GamificationProfile = {
          ...data,
          lastLogDate: data.lastLogDate ? data.lastLogDate.toDate() : null,
          achievements: data.achievements.map(achievement => ({
            ...achievement,
            completedAt: achievement.completedAt ? achievement.completedAt.toDate() : undefined
          })),
          activeChallenges: data.activeChallenges.map(challenge => ({
            ...challenge,
            startDate: challenge.startDate.toDate(),
            endDate: challenge.endDate.toDate(),
            completedAt: challenge.completedAt ? challenge.completedAt.toDate() : undefined
          })),
          completedChallenges: data.completedChallenges.map(challenge => ({
            ...challenge,
            startDate: challenge.startDate.toDate(),
            endDate: challenge.endDate.toDate(),
            completedAt: challenge.completedAt ? challenge.completedAt.toDate() : undefined
          }))
        };
        
        set({ profile, loading: false });
      } else {
        // Create a new profile if none exists
        const newProfile: GamificationProfile = {
          userId: user.uid,
          streakDays: 0,
          longestStreak: 0,
          lastLogDate: null,
          points: 0,
          level: 1,
          achievements: defaultAchievements,
          activeChallenges: [],
          completedChallenges: []
        };
        
        // Save to Firestore
        await setDoc(doc(db, 'gamification', user.uid), newProfile);
        
        set({ profile: newProfile, loading: false });
      }
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },
  
  updateStreak: async () => {
    try {
      const { user } = useAuthStore.getState();
      const { profile } = get();
      
      if (!user || !profile) {
        throw new Error('User not authenticated or profile not loaded');
      }
      
      set({ loading: true, error: null });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let newStreakDays = profile.streakDays;
      let newLongestStreak = profile.longestStreak;
      let streakBroken = false;
      
      // If this is the first log ever
      if (!profile.lastLogDate) {
        newStreakDays = 1;
      } else {
        const lastLog = new Date(profile.lastLogDate);
        lastLog.setHours(0, 0, 0, 0);
        
        // Check if last log was yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLog.getTime() === yesterday.getTime()) {
          // Streak continues
          newStreakDays += 1;
        } else if (lastLog.getTime() === today.getTime()) {
          // Already logged today, don't increment streak
        } else {
          // Streak broken
          newStreakDays = 1;
          streakBroken = true;
        }
      }
      
      // Update longest streak if needed
      if (newStreakDays > newLongestStreak) {
        newLongestStreak = newStreakDays;
      }
      
      // Update Firestore
      await updateDoc(doc(db, 'gamification', user.uid), {
        streakDays: newStreakDays,
        longestStreak: newLongestStreak,
        lastLogDate: today
      });
      
      // Update local state
      set(state => ({
        profile: state.profile ? {
          ...state.profile,
          streakDays: newStreakDays,
          longestStreak: newLongestStreak,
          lastLogDate: today
        } : null,
        loading: false
      }));
      
      // Check if any streak-based achievements were unlocked
      if (profile.achievements) {
        profile.achievements.forEach(achievement => {
          if (achievement.category === 'consistency' && !achievement.isCompleted) {
            if (achievement.id === 'streak-7' && newStreakDays >= 7) {
              get().completeAchievement('streak-7');
            } else if (achievement.id === 'streak-30' && newStreakDays >= 30) {
              get().completeAchievement('streak-30');
            } else if (achievement.id === 'streak-100' && newStreakDays >= 100) {
              get().completeAchievement('streak-100');
            }
          }
        });
      }
      
      // Award points for maintaining streak
      if (!streakBroken && newStreakDays > 1) {
        // Bonus points for streak milestones
        let streakPoints = 5; // Base points for continuing streak
        
        if (newStreakDays === 7) streakPoints = 25;
        else if (newStreakDays === 30) streakPoints = 100;
        else if (newStreakDays === 100) streakPoints = 300;
        else if (newStreakDays % 10 === 0) streakPoints = 50;
        
        get().addPoints(streakPoints);
      }
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },
  
  addPoints: async (points) => {
    try {
      const { user } = useAuthStore.getState();
      const { profile } = get();
      
      if (!user || !profile) {
        throw new Error('User not authenticated or profile not loaded');
      }
      
      set({ loading: true, error: null });
      
      const currentLevel = profile.level;
      const currentPoints = profile.points;
      const newPoints = currentPoints + points;
      
      // Check if user leveled up
      const newLevel = get().checkLevelUp(newPoints);
      const didLevelUp = newLevel > currentLevel;
      
      // Update Firestore
      await updateDoc(doc(db, 'gamification', user.uid), {
        points: newPoints,
        level: newLevel
      });
      
      // Update local state
      set(state => ({
        profile: state.profile ? {
          ...state.profile,
          points: newPoints,
          level: newLevel
        } : null,
        loading: false
      }));
      
      // TODO: Show level up animation if leveled up
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },
  
  closeAchievementModal: () => {
    set({ showAchievementModal: false });
  },
  
  completeAchievement: async (achievementId) => {
    try {
      const { user } = useAuthStore.getState();
      const { profile } = get();
      
      if (!user || !profile) {
        throw new Error('User not authenticated or profile not loaded');
      }
      
      // Find the achievement
      const achievement = profile.achievements.find(a => a.id === achievementId);
      
      if (!achievement || achievement.isCompleted) {
        return; // Achievement not found or already completed
      }
      
      const completedAt = new Date();
      
      // Update achievement in Firestore
      const userDocRef = doc(db, 'gamification', user.uid);
      
      // Update the specific achievement in the array
      await updateDoc(userDocRef, {
        achievements: profile.achievements.map(a => 
          a.id === achievementId 
            ? {
                ...a, 
                isCompleted: true, 
                progress: a.targetValue,
                completedAt
              } 
            : a
        )
      });
      
      // Update local state
      const updatedAchievements = profile.achievements.map(a => 
        a.id === achievementId 
          ? {
              ...a, 
              isCompleted: true,
              progress: a.targetValue,
              completedAt
            } 
          : a
      );
      
      set(state => ({
        profile: state.profile ? {
          ...state.profile,
          achievements: updatedAchievements
        } : null,
        showAchievementModal: true,
        lastUnlockedAchievement: updatedAchievements.find(a => a.id === achievementId) || null
      }));
      
      // Award points for completing achievement
      await get().addPoints(achievement.points);
    } catch (error) {
      set({ 
        error: (error as Error).message
      });
    }
  },
  
  updateAchievementProgress: async (achievementId, progressAmount) => {
    try {
      const { user } = useAuthStore.getState();
      const { profile } = get();
      
      if (!user || !profile) {
        throw new Error('User not authenticated or profile not loaded');
      }
      
      // Find the achievement
      const achievement = profile.achievements.find(a => a.id === achievementId);
      
      if (!achievement || achievement.isCompleted) {
        return; // Achievement not found or already completed
      }
      
      const newProgress = Math.min(achievement.progress + progressAmount, achievement.targetValue);
      const isNowCompleted = newProgress >= achievement.targetValue;
      
      // Update achievement in Firestore
      const userDocRef = doc(db, 'gamification', user.uid);
      
      // Update the specific achievement in the array
      await updateDoc(userDocRef, {
        achievements: profile.achievements.map(a => 
          a.id === achievementId 
            ? {
                ...a, 
                progress: newProgress,
                isCompleted: isNowCompleted,
                completedAt: isNowCompleted ? new Date() : undefined
              } 
            : a
        )
      });
      
      // Update local state
      const updatedAchievements = profile.achievements.map(a => 
        a.id === achievementId 
          ? {
              ...a, 
              progress: newProgress,
              isCompleted: isNowCompleted,
              completedAt: isNowCompleted ? new Date() : undefined
            } 
          : a
      );
      
      set(state => ({
        profile: state.profile ? {
          ...state.profile,
          achievements: updatedAchievements
        } : null
      }));
      
      // If achievement is now completed, show modal and award points
      if (isNowCompleted) {
        set({
          showAchievementModal: true,
          lastUnlockedAchievement: updatedAchievements.find(a => a.id === achievementId) || null
        });
        
        await get().addPoints(achievement.points);
      }
    } catch (error) {
      set({ 
        error: (error as Error).message
      });
    }
  },
  
  joinChallenge: async (challenge) => {
    try {
      const { user } = useAuthStore.getState();
      const { profile } = get();
      
      if (!user || !profile) {
        throw new Error('User not authenticated or profile not loaded');
      }
      
      set({ loading: true, error: null });
      
      // Create challenge object with initial progress
      const newChallenge: Challenge = {
        ...challenge,
        currentProgress: 0,
        isCompleted: false
      };
      
      // Add to Firestore
      await updateDoc(doc(db, 'gamification', user.uid), {
        activeChallenges: arrayUnion(newChallenge)
      });
      
      // Update local state
      set(state => ({
        profile: state.profile ? {
          ...state.profile,
          activeChallenges: [...state.profile.activeChallenges, newChallenge]
        } : null,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },
  
  updateChallengeProgress: async (challengeId, progressAmount) => {
    try {
      const { user } = useAuthStore.getState();
      const { profile } = get();
      
      if (!user || !profile) {
        throw new Error('User not authenticated or profile not loaded');
      }
      
      // Find the challenge
      const challenge = profile.activeChallenges.find(c => c.id === challengeId);
      
      if (!challenge || challenge.isCompleted) {
        return; // Challenge not found or already completed
      }
      
      const newProgress = Math.min(challenge.currentProgress + progressAmount, challenge.targetValue);
      const isNowCompleted = newProgress >= challenge.targetValue;
      const completedAt = isNowCompleted ? new Date() : undefined;
      
      // Update Firestore
      const userDocRef = doc(db, 'gamification', user.uid);
      
      if (isNowCompleted) {
        // Remove from active challenges and add to completed challenges
        const updatedActiveChallenge = {
          ...challenge,
          currentProgress: newProgress,
          isCompleted: true,
          completedAt
        };
        
        await updateDoc(userDocRef, {
          activeChallenges: profile.activeChallenges.filter(c => c.id !== challengeId),
          completedChallenges: arrayUnion(updatedActiveChallenge)
        });
        
        // Update local state
        set(state => ({
          profile: state.profile ? {
            ...state.profile,
            activeChallenges: state.profile.activeChallenges.filter(c => c.id !== challengeId),
            completedChallenges: [...state.profile.completedChallenges, updatedActiveChallenge]
          } : null
        }));
        
        // Award points for completing challenge
        await get().addPoints(challenge.points);
      } else {
        // Just update the progress
        await updateDoc(userDocRef, {
          activeChallenges: profile.activeChallenges.map(c => 
            c.id === challengeId 
              ? {
                  ...c, 
                  currentProgress: newProgress
                } 
              : c
          )
        });
        
        // Update local state
        set(state => ({
          profile: state.profile ? {
            ...state.profile,
            activeChallenges: state.profile.activeChallenges.map(c => 
              c.id === challengeId 
                ? {
                    ...c, 
                    currentProgress: newProgress
                  } 
                : c
            )
          } : null
        }));
      }
    } catch (error) {
      set({ 
        error: (error as Error).message
      });
    }
  },
  
  checkLevelUp: (points) => {
    // Level formula: Each level requires more points
    // Level 1: 0-100, Level 2: 101-250, Level 3: 251-450, etc.
    const levelThresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250];
    
    for (let level = levelThresholds.length - 1; level >= 0; level--) {
      if (points >= levelThresholds[level]) {
        return level + 1;
      }
    }
    
    return 1; // Default to level 1
  }
}));

// Default achievements
const defaultAchievements: Achievement[] = [
  {
    id: 'first-log',
    title: 'First Bite',
    description: 'Log your first food item',
    iconName: 'FiBookOpen',
    category: 'logging',
    progress: 0,
    targetValue: 1,
    isCompleted: false,
    points: 10
  },
  {
    id: 'week-streak',
    title: 'Week Warrior',
    description: 'Log food for 7 consecutive days',
    iconName: 'FiCalendar',
    category: 'consistency',
    progress: 0,
    targetValue: 7,
    isCompleted: false,
    points: 25
  },
  {
    id: 'month-streak',
    title: 'Monthly Master',
    description: 'Log food for 30 consecutive days',
    iconName: 'FiCalendar',
    category: 'consistency',
    progress: 0,
    targetValue: 30,
    isCompleted: false,
    points: 100
  },
  {
    id: 'macro-balance',
    title: 'Macro Maestro',
    description: 'Hit your macro targets perfectly for a day',
    iconName: 'FiTarget',
    category: 'nutrition',
    progress: 0,
    targetValue: 1,
    isCompleted: false,
    points: 20
  },
  {
    id: 'scan-10',
    title: 'Barcode Buff',
    description: 'Scan 10 different food items',
    iconName: 'FiCamera',
    category: 'logging',
    progress: 0,
    targetValue: 10,
    isCompleted: false,
    points: 15
  },
  {
    id: 'complete-profile',
    title: 'Identity Established',
    description: 'Complete your user profile',
    iconName: 'FiUser',
    category: 'special',
    progress: 0,
    targetValue: 1,
    isCompleted: false,
    points: 5
  }
];
