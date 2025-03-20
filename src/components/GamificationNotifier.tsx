import React, { useEffect, useRef } from 'react';
import { useGamificationStore } from '../stores/gamificationStore';
import { useNotification } from './NotificationSystem';

/**
 * Component that monitors gamification events and dispatches notifications
 * This component doesn't render anything but acts as a bridge between
 * the gamification store and notification system
 */
const GamificationNotifier: React.FC = () => {
  const { 
    profile, 
    lastUnlockedAchievement,
    showAchievementModal,
    closeAchievementModal
  } = useGamificationStore();
  const { addNotification } = useNotification();
  
  // Keep track of previous streak
  const prevStreakRef = useRef<number>(0);
  
  // Show notification for achievement unlocks
  useEffect(() => {
    if (lastUnlockedAchievement && showAchievementModal) {
      // Add notification for achievements
      addNotification({
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: lastUnlockedAchievement.title,
        points: lastUnlockedAchievement.points,
        duration: 6000 // Show for longer
      });
      
      // Auto-close the modal after a delay to prevent UI clutter
      const timer = setTimeout(() => {
        closeAchievementModal();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [lastUnlockedAchievement, showAchievementModal, addNotification, closeAchievementModal]);
  
  // Track streak changes and show notifications
  useEffect(() => {
    if (!profile) {
      // Initialize previous streak when profile first loads
      if (prevStreakRef.current === 0) {
        prevStreakRef.current = profile?.streakDays || 0;
      }
      return;
    }
    
    const currentStreak = profile.streakDays;
    const prevStreak = prevStreakRef.current;
    
    // Detect streak increases for notification
    if (currentStreak > prevStreak) {
      // Only show notification if we're not just initializing
      if (prevStreak > 0) {
        // Milestone streak notifications
        if (currentStreak === 3) {
          addNotification({
            type: 'streak',
            title: '3-Day Streak!',
            message: 'You\'re on a roll! Keep logging to maintain your streak.',
            duration: 5000
          });
        } else if (currentStreak === 7) {
          addNotification({
            type: 'streak',
            title: 'One Week Streak!',
            message: 'You\'ve logged for 7 days in a row. Great consistency!',
            points: 25,
            duration: 5000
          });
        } else if (currentStreak === 30) {
          addNotification({
            type: 'streak',
            title: 'Monthly Master!',
            message: 'Amazing! You\'ve logged for 30 days straight.',
            points: 100,
            duration: 7000
          });
        } else if (currentStreak % 10 === 0) {
          // Notify every 10 days
          addNotification({
            type: 'streak',
            title: `${currentStreak}-Day Streak!`,
            message: 'Your consistency is paying off. Keep it up!',
            points: 50,
            duration: 5000
          });
        } else {
          // Regular streak increase notification
          addNotification({
            type: 'streak',
            title: `${currentStreak}-Day Streak!`,
            message: 'Keep tracking to maintain your streak',
            duration: 3000
          });
        }
      }
    } 
    // Detect streak resets
    else if (currentStreak === 1 && prevStreak > 1) {
      addNotification({
        type: 'info',
        title: 'Streak Reset',
        message: `Your previous streak of ${prevStreak} days has reset. Let's start a new one!`,
        duration: 5000
      });
    }
    
    // Update reference for next comparison
    prevStreakRef.current = currentStreak;
  }, [profile, addNotification]);
  
  // This component doesn't render anything
  return null;
};

export default GamificationNotifier;
