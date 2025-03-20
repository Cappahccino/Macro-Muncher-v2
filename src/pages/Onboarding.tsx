import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiTarget, FiActivity, FiCheckCircle, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, UserProfile } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';


// Onboarding steps
type OnboardingStep = 'profile' | 'goal' | 'activity' | 'macros';


const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { updateProfile } = useAuthStore();
  const { completeAchievement } = useGamificationStore();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [userData, setUserData] = useState({
    displayName: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    goal: '' as 'maintain' | 'burn' | 'build' | '',
    activityLevel: '' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '',
    calorieTarget: 0,
    proteinTarget: 0,
    carbTarget: 0,
    fatTarget: 0,
  });
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };
  
  // Next step handler
  const handleNextStep = () => {
    if (currentStep === 'profile') {
      setCurrentStep('goal');
    } else if (currentStep === 'goal') {
      setCurrentStep('activity');
    } else if (currentStep === 'activity') {
      // Calculate recommended calorie and macro targets based on user input
      const calculatedTargets = calculateNutritionTargets(userData);
      setUserData({
        ...userData,
        ...calculatedTargets
      });
      setCurrentStep('macros');
    } else if (currentStep === 'macros') {
      handleSubmit();
    }
  };
  
  // Previous step handler
  const handlePrevStep = () => {
    if (currentStep === 'goal') {
      setCurrentStep('profile');
    } else if (currentStep === 'activity') {
      setCurrentStep('goal');
    } else if (currentStep === 'macros') {
      setCurrentStep('activity');
    }
  };
  
  // Calculate nutrition targets based on user data
  const calculateNutritionTargets = (data: typeof userData) => {
    // Parse string inputs to numbers
    const age = parseInt(data.age) || 30;
    const weight = parseFloat(data.weight) || 70; // kg
    const height = parseFloat(data.height) || 170; // cm
    const isMale = data.gender === 'male';
    
    // Base metabolic rate using Mifflin-St Jeor Equation
    let bmr;
    if (isMale) {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // Activity multiplier
    let activityMultiplier;
    switch (data.activityLevel) {
      case 'sedentary':
        activityMultiplier = 1.2;
        break;
      case 'light':
        activityMultiplier = 1.375;
        break;
      case 'moderate':
        activityMultiplier = 1.55;
        break;
      case 'active':
        activityMultiplier = 1.725;
        break;
      case 'very_active':
        activityMultiplier = 1.9;
        break;
      default:
        activityMultiplier = 1.375;
    }
    
    // Maintenance calories
    let maintenanceCalories = Math.round(bmr * activityMultiplier);
    
    // Adjust based on goal
    let calorieTarget;
    switch (data.goal) {
      case 'burn':
        calorieTarget = Math.round(maintenanceCalories * 0.8); // 20% deficit
        break;
      case 'maintain':
        calorieTarget = maintenanceCalories;
        break;
      case 'build':
        calorieTarget = Math.round(maintenanceCalories * 1.15); // 15% surplus
        break;
      default:
        calorieTarget = maintenanceCalories;
    }
    
    // Macro targets based on goal
    let proteinMultiplier, carbMultiplier, fatMultiplier;
    
    if (data.goal === 'burn') {
      // Higher protein, moderate fat, lower carbs for fat loss
      proteinMultiplier = 2.0; // g/kg of body weight
      fatMultiplier = 0.8; // g/kg of body weight
      // Remaining calories from carbs
      const proteinCalories = weight * proteinMultiplier * 4;
      const fatCalories = weight * fatMultiplier * 9;
      const carbCalories = calorieTarget - proteinCalories - fatCalories;
      const carbTarget = Math.max(Math.round(carbCalories / 4), 50); // Minimum 50g of carbs
      
      return {
        calorieTarget,
        proteinTarget: Math.round(weight * proteinMultiplier),
        carbTarget,
        fatTarget: Math.round(weight * fatMultiplier)
      };
    } else if (data.goal === 'build') {
      // Higher protein and carbs, moderate fat for muscle gain
      proteinMultiplier = 1.8; // g/kg of body weight
      carbMultiplier = 4.5; // g/kg of body weight
      fatMultiplier = 0.8; // g/kg of body weight
      
      return {
        calorieTarget,
        proteinTarget: Math.round(weight * proteinMultiplier),
        carbTarget: Math.round(weight * carbMultiplier),
        fatTarget: Math.round(weight * fatMultiplier)
      };
    } else {
      // Balanced macros for maintenance
      proteinMultiplier = 1.6; // g/kg of body weight
      fatMultiplier = 1.0; // g/kg of body weight
      // Remaining calories from carbs
      const proteinCalories = weight * proteinMultiplier * 4;
      const fatCalories = weight * fatMultiplier * 9;
      const carbCalories = calorieTarget - proteinCalories - fatCalories;
      const carbTarget = Math.max(Math.round(carbCalories / 4), 130); // Recommended minimum carbs
      
      return {
        calorieTarget,
        proteinTarget: Math.round(weight * proteinMultiplier),
        carbTarget,
        fatTarget: Math.round(weight * fatMultiplier)
      };
    }
  };
  
  // Form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const profile: Partial<UserProfile> = {
        displayName: userData.displayName,
        onboarded: true,
        goal: userData.goal as 'maintain' | 'burn' | 'build',
        calorieTarget: userData.calorieTarget,
        proteinTarget: userData.proteinTarget,
        carbTarget: userData.carbTarget,
        fatTarget: userData.fatTarget,
      };
      
      await updateProfile(profile);
      
      // Complete the profile achievement
      await completeAchievement('complete-profile');
      
      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Calculate progress percentage
  const getStepProgress = () => {
    switch (currentStep) {
      case 'profile': return 25;
      case 'goal': return 50;
      case 'activity': return 75;
      case 'macros': return 100;
      default: return 0;
    }
  };
  
  // Validate current step for enabling the Next button
  const isCurrentStepValid = () => {
    if (currentStep === 'profile') {
      return !!userData.displayName && !!userData.age && !!userData.gender && !!userData.weight && !!userData.height;
    } else if (currentStep === 'goal') {
      return !!userData.goal;
    } else if (currentStep === 'activity') {
      return !!userData.activityLevel;
    } else if (currentStep === 'macros') {
      return true; // Always valid since we calculate the values
    }
    return false;
  };
  
  // Slide transitions for form steps
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800">Welcome to Macro Muncher</h1>
          <p className="text-primary-600 mt-2">Let's set up your profile to get started</p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200">
                  Setup Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-primary-600">
                  {getStepProgress()}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200">
              <motion.div
                style={{ width: `${getStepProgress()}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                initial={{ width: 0 }}
                animate={{ width: `${getStepProgress()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          <div 
            className={`flex flex-col items-center ${
              currentStep === 'profile' ? 'text-primary-600' : 
              getStepProgress() >= 25 ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <div className={`rounded-full p-2 ${
              currentStep === 'profile' ? 'bg-primary-100 text-primary-600' : 
              getStepProgress() >= 25 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {getStepProgress() >= 50 ? <FiCheckCircle size={24} /> : <FiUser size={24} />}
            </div>
            <span className="text-xs mt-1">Profile</span>
          </div>
          
          <div 
            className={`flex flex-col items-center ${
              currentStep === 'goal' ? 'text-primary-600' : 
              getStepProgress() >= 50 ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <div className={`rounded-full p-2 ${
              currentStep === 'goal' ? 'bg-primary-100 text-primary-600' : 
              getStepProgress() >= 50 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {getStepProgress() >= 75 ? <FiCheckCircle size={24} /> : <FiTarget size={24} />}
            </div>
            <span className="text-xs mt-1">Goal</span>
          </div>
          
          <div 
            className={`flex flex-col items-center ${
              currentStep === 'activity' ? 'text-primary-600' : 
              getStepProgress() >= 75 ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <div className={`rounded-full p-2 ${
              currentStep === 'activity' ? 'bg-primary-100 text-primary-600' : 
              getStepProgress() >= 75 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {getStepProgress() >= 100 ? <FiCheckCircle size={24} /> : <FiActivity size={24} />}
            </div>
            <span className="text-xs mt-1">Activity</span>
          </div>
          
          <div 
            className={`flex flex-col items-center ${
              currentStep === 'macros' ? 'text-primary-600' : 
              getStepProgress() >= 100 ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <div className={`rounded-full p-2 ${
              currentStep === 'macros' ? 'bg-primary-100 text-primary-600' : 
              getStepProgress() >= 100 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              <FiCheckCircle size={24} />
            </div>
            <span className="text-xs mt-1">Macros</span>
          </div>
        </div>
        
        {/* Form Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 relative overflow-hidden" style={{ minHeight: '360px' }}>
          {/* Profile Step */}
          {currentStep === 'profile' && (
            <motion.div
              key="profile-step"
              initial="enter"
              animate="center"
              exit="exit"
              variants={slideVariants}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Tell us about yourself</h2>
              
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={userData.displayName}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={userData.age}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <div className="mt-1 flex">
                  <label className="inline-flex items-center mr-6">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={userData.gender === 'male'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2">Male</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={userData.gender === 'female'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2">Female</span>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={userData.weight}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="Weight in kg"
                    step="0.1"
                    min="30"
                    max="300"
                  />
                </div>
                
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={userData.height}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="Height in cm"
                    step="1"
                    min="100"
                    max="250"
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Goal Step */}
          {currentStep === 'goal' && (
            <motion.div
              key="goal-step"
              initial="enter"
              animate="center"
              exit="exit"
              variants={slideVariants}
              transition={{ duration: 0.3 }}
              custom={1}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">What's your fitness goal?</h2>
              
              <div className="space-y-4">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userData.goal === 'burn' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setUserData({ ...userData, goal: 'burn' })}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      userData.goal === 'burn' 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {userData.goal === 'burn' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Burn Fat</h3>
                      <p className="text-sm text-gray-500">Reduce body fat while preserving muscle mass</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userData.goal === 'maintain' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setUserData({ ...userData, goal: 'maintain' })}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      userData.goal === 'maintain' 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {userData.goal === 'maintain' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Maintain Weight</h3>
                      <p className="text-sm text-gray-500">Keep your current weight and focus on overall health</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userData.goal === 'build' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setUserData({ ...userData, goal: 'build' })}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      userData.goal === 'build' 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {userData.goal === 'build' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Build Muscle</h3>
                      <p className="text-sm text-gray-500">Gain muscle mass with a calorie surplus</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Activity Level Step */}
          {currentStep === 'activity' && (
            <motion.div
              key="activity-step"
              initial="enter"
              animate="center"
              exit="exit"
              variants={slideVariants}
              transition={{ duration: 0.3 }}
              custom={1}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">What's your activity level?</h2>
              
              <div className="space-y-4">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userData.activityLevel === 'sedentary' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setUserData({ ...userData, activityLevel: 'sedentary' })}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      userData.activityLevel === 'sedentary' 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {userData.activityLevel === 'sedentary' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Sedentary</h3>
                      <p className="text-sm text-gray-500">Desk job, little to no exercise</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userData.activityLevel === 'light' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setUserData({ ...userData, activityLevel: 'light' })}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      userData.activityLevel === 'light' 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {userData.activityLevel === 'light' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Lightly Active</h3>
                      <p className="text-sm text-gray-500">Light exercise 1-3 days/week</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userData.activityLevel === 'moderate' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setUserData({ ...userData, activityLevel: 'moderate' })}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      userData.activityLevel === 'moderate' 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {userData.activityLevel === 'moderate' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Moderately Active</h3>
                      <p className="text-sm text-gray-500">Moderate exercise 3-5 days/week</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userData.activityLevel === 'active' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setUserData({ ...userData, activityLevel: 'active' })}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      userData.activityLevel === 'active' 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {userData.activityLevel === 'active' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Very Active</h3>
                      <p className="text-sm text-gray-500">Hard exercise 6-7 days/week</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userData.activityLevel === 'very_active' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setUserData({ ...userData, activityLevel: 'very_active' })}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      userData.activityLevel === 'very_active' 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {userData.activityLevel === 'very_active' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Extremely Active</h3>
                      <p className="text-sm text-gray-500">Very hard exercise & physical job or training twice daily</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Macros Step */}
          {currentStep === 'macros' && (
            <motion.div
              key="macros-step"
              initial="enter"
              animate="center"
              exit="exit"
              variants={slideVariants}
              transition={{ duration: 0.3 }}
              custom={1}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Recommended Targets</h2>
              <p className="text-sm text-gray-500 mb-4">Based on your information, we've calculated the following targets:</p>
              
              <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Daily Calories</h3>
                  <div className="text-xl font-bold text-primary-700">{userData.calorieTarget} kcal</div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Protein</span>
                      <span>{userData.proteinTarget}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(userData.proteinTarget * 4 / userData.calorieTarget) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Carbs</span>
                      <span>{userData.carbTarget}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(userData.carbTarget * 4 / userData.calorieTarget) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fat</span>
                      <span>{userData.fatTarget}g</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(userData.fatTarget * 9 / userData.calorieTarget) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-primary-200">
                  <h4 className="font-medium mb-2">Macro Distribution:</h4>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                      <span>Protein: {Math.round((userData.proteinTarget * 4 / userData.calorieTarget) * 100)}%</span>
                    </div>
                    <div>
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                      <span>Carbs: {Math.round((userData.carbTarget * 4 / userData.calorieTarget) * 100)}%</span>
                    </div>
                    <div>
                      <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
                      <span>Fat: {Math.round((userData.fatTarget * 9 / userData.calorieTarget) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium mb-2">Macro Targets Explanation</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {userData.goal === 'burn' && 'Your macro targets are optimized for fat loss with higher protein to preserve muscle mass.'}
                  {userData.goal === 'maintain' && 'Your macro targets are balanced for maintaining your current weight and supporting overall health.'}
                  {userData.goal === 'build' && 'Your macro targets include higher carbs and adequate protein to support muscle growth.'}
                </p>
                <p className="text-sm text-gray-600">
                  These targets will be used to track your daily progress in the app. You can adjust them later in your profile settings.
                </p>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 'profile'}
            className={`flex items-center px-4 py-2 rounded-lg ${
              currentStep === 'profile'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-primary-600 shadow hover:bg-gray-50'
            }`}
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          
          <button
            type="button"
            onClick={handleNextStep}
            disabled={!isCurrentStepValid() || isSubmitting}
            className={`flex items-center px-6 py-2 rounded-lg shadow ${
              !isCurrentStepValid() || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                {currentStep === 'macros' ? 'Complete Setup' : 'Next'}
                {currentStep !== 'macros' && <FiArrowRight className="ml-2" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;