import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useFoodLogStore } from '../stores/foodLogStore';
import { useNotification } from './NotificationSystem';
import { useGamificationStore } from '../stores/gamificationStore';

/**
 * Component that monitors nutrition progress and provides feedback
 * This component doesn't render anything visible, but watches for changes
 * in nutrition data and sends notifications based on achievements
 */
const NutritionProgressMonitor: React.FC = () => {
  const { profile } = useAuthStore();
  const { dailyTotals } = useFoodLogStore();
  const { updateAchievementProgress } = useGamificationStore();
  const { addNotification } = useNotification();
  
  // Store previous totals to detect changes
  const prevTotalsRef = useRef({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  // Store targets hit flags to prevent duplicate notifications
  const targetsHitRef = useRef({
    calories: false,
    protein: false,
    carbs: false,
    fat: false,
    allMacros: false
  });
  
  // Check progress and send notifications when totals change
  useEffect(() => {
    if (!profile) return;
    
    const calorieTarget = profile.calorieTarget || 2000;
    const proteinTarget = profile.proteinTarget || 120;
    const carbTarget = profile.carbTarget || 200;
    const fatTarget = profile.fatTarget || 65;
    
    // Only proceed if there's been a significant change in totals
    const prevCalories = prevTotalsRef.current.calories;
    if (Math.abs(dailyTotals.calories - prevCalories) < 10) {
      return;
    }
    
    // Update previous totals for next comparison
    prevTotalsRef.current = { ...dailyTotals };
    
    // Check for significant milestones (halfway, target reached)
    const calorieProgress = dailyTotals.calories / calorieTarget;
    const proteinProgress = dailyTotals.protein / proteinTarget;
    const carbProgress = dailyTotals.carbs / carbTarget;
    const fatProgress = dailyTotals.fat / fatTarget;
    
    // Check for halfway milestone
    if (calorieProgress >= 0.5 && calorieProgress < 0.6 && !targetsHitRef.current.calories) {
      addNotification({
        type: 'info',
        title: 'Halfway There!',
        message: `You've reached 50% of your daily calorie target.`,
        duration: 3000
      });
    }
    
    // Check for target reached
    if (calorieProgress >= 0.95 && calorieProgress <= 1.05 && !targetsHitRef.current.calories) {
      addNotification({
        type: 'success',
        title: 'Calorie Target Met!',
        message: 'You\'ve hit your daily calorie target perfectly!',
        duration: 4000
      });
      targetsHitRef.current.calories = true;
    }
    
    // Check for macro targets individually
    if (proteinProgress >= 0.95 && proteinProgress <= 1.05 && !targetsHitRef.current.protein) {
      addNotification({
        type: 'success',
        title: 'Protein Target Met!',
        message: `Great job hitting your protein goal of ${proteinTarget}g!`,
        duration: 3000
      });
      targetsHitRef.current.protein = true;
    }
    
    if (carbProgress >= 0.95 && carbProgress <= 1.05 && !targetsHitRef.current.carbs) {
      addNotification({
        type: 'success',
        title: 'Carb Target Met!',
        message: `You've hit your carbohydrate goal of ${carbTarget}g!`,
        duration: 3000
      });
      targetsHitRef.current.carbs = true;
    }
    
    if (fatProgress >= 0.95 && fatProgress <= 1.05 && !targetsHitRef.current.fat) {
      addNotification({
        type: 'success',
        title: 'Fat Target Met!',
        message: `You've hit your fat goal of ${fatTarget}g!`,
        duration: 3000
      });
      targetsHitRef.current.fat = true;
    }
    
    // Check if all macros are within target range (perfect balance achievement)
    if (
      proteinProgress >= 0.95 && proteinProgress <= 1.05 &&
      carbProgress >= 0.95 && carbProgress <= 1.05 &&
      fatProgress >= 0.95 && fatProgress <= 1.05 &&
      !targetsHitRef.current.allMacros
    ) {
      addNotification({
        type: 'achievement',
        title: 'Perfect Macro Balance!',
        message: 'You\'ve hit all three macro targets perfectly. Amazing balance!',
        points: 20,
        duration: 5000
      });
      targetsHitRef.current.allMacros = true;
      
      // Update the macro balance achievement
      updateAchievementProgress('macro-balance', 1);
    }
    
    // Reset flags at midnight
    const handleDayChange = () => {
      targetsHitRef.current = {
        calories: false,
        protein: false,
        carbs: false,
        fat: false,
        allMacros: false
      };
    };
    
    // Get time until midnight for auto-reset
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set timeout to reset flags at midnight
    const timer = setTimeout(handleDayChange, timeUntilMidnight);
    
    return () => clearTimeout(timer);
  }, [dailyTotals, profile, addNotification, updateAchievementProgress]);
  
  // This component doesn't render anything
  return null;
};

export default NutritionProgressMonitor;
