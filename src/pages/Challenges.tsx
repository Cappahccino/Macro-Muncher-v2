import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiPlus,
  FiTrendingUp,
  FiCoffee,
  FiTarget,
  FiActivity,
  FiFastForward,
  FiCalendar
} from 'react-icons/fi';
import { useGamificationStore, Challenge } from '../stores/gamificationStore';
import { format, intervalToDuration, differenceInDays } from 'date-fns';

// Icon mapping for challenge types
const iconMap: Record<string, React.ElementType> = {
  consistency: FiCalendar,
  nutrition: FiTarget,
  activity: FiActivity,
  streak: FiTrendingUp,
  beginner: FiCoffee,
  advanced: FiFastForward
};

// Available challenges that users can join
const availableChallenges = [
  {
    id: 'protein-week',
    title: 'Protein Powerhouse',
    description: 'Hit your protein target every day for 7 days straight',
    iconName: 'nutrition',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    targetValue: 7,
    points: 50
  },
  {
    id: 'balanced-three',
    title: 'Perfect Balance',
    description: 'Hit all three macro targets on the same day, 3 times',
    iconName: 'nutrition',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    targetValue: 3,
    points: 75
  },
  {
    id: 'log-streak-14',
    title: 'Two-Week Warrior',
    description: 'Log your food every day for 14 days in a row',
    iconName: 'streak',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    targetValue: 14,
    points: 100
  },
  {
    id: 'morning-entries',
    title: 'Early Bird',
    description: 'Log breakfast before 9am for 5 days',
    iconName: 'consistency',
    startDate: new Date(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    targetValue: 5,
    points: 40
  }
];

const Challenges: React.FC = () => {
  const navigate = useNavigate();
  const { 
    profile, 
    fetchProfile, 
    isLoading, 
    joinChallenge,
    updateChallengeProgress 
  } = useGamificationStore();
  
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'completed'>('active');
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  
  // Fetch gamification profile
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Get challenges that aren't already active or completed
  const getAvailableChallenges = () => {
    if (!profile) return [];
    
    const existingChallengeIds = [
      ...profile.activeChallenges.map(c => c.id),
      ...profile.completedChallenges.map(c => c.id)
    ];
    
    return availableChallenges.filter(c => !existingChallengeIds.includes(c.id));
  };
  
  // Format time remaining for a challenge
  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const daysRemaining = differenceInDays(endDate, now);
    
    if (daysRemaining <= 0) {
      return 'Ending today';
    } else if (daysRemaining === 1) {
      return '1 day left';
    } else {
      return `${daysRemaining} days left`;
    }
  };
  
  // Join a challenge
  const handleJoinChallenge = async (challenge: typeof availableChallenges[0]) => {
    try {
      setJoinLoading(challenge.id);
      await joinChallenge(challenge);
      await fetchProfile(); // Refresh profile to update active challenges
      setActiveTab('active'); // Switch to active tab
    } catch (error) {
      console.error('Failed to join challenge:', error);
    } finally {
      setJoinLoading(null);
    }
  };
  
  // Render challenge icon
  const renderIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || FiAward;
    return <Icon size={24} />;
  };
  
  // Render challenge card based on type (active, available, completed)
  const renderChallengeCard = (
    challenge: Challenge | typeof availableChallenges[0], 
    type: 'active' | 'available' | 'completed'
  ) => {
    return (
      <div 
        key={challenge.id}
        className={`bg-white rounded-lg shadow p-4 ${
          type === 'completed' ? 'border-l-4 border-primary-500' : ''
        }`}
      >
        <div className="flex mb-3">
          <div className={`rounded-full p-3 mr-3 ${
            type === 'completed' 
              ? 'bg-primary-100 text-primary-600' 
              : type === 'active'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
          }`}>
            {renderIcon(challenge.iconName)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{challenge.title}</h3>
            <p className="text-sm text-gray-600">{challenge.description}</p>
            
            <div className="flex justify-between items-center mt-2 text-xs">
              <div className="flex items-center text-gray-500">
                <FiClock className="mr-1" size={12} />
                <span>
                  {type === 'completed' 
                    ? `Completed on ${format(
                        'completedAt' in challenge && challenge.completedAt 
                          ? challenge.completedAt 
                          : new Date(), 
                        'MMM d, yyyy'
                      )}`
                    : formatTimeRemaining(challenge.endDate)
                  }
                </span>
              </div>
              <div className="text-primary-600 font-medium">
                {challenge.points} pts
              </div>
            </div>
          </div>
        </div>
        
        {type === 'active' && 'currentProgress' in challenge && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{challenge.currentProgress} / {challenge.targetValue}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min((challenge.currentProgress / challenge.targetValue) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {type === 'completed' && (
          <div className="mt-2 flex items-center text-primary-600 text-sm">
            <FiCheckCircle className="mr-1" />
            <span>Challenge completed!</span>
          </div>
        )}
        
        {type === 'available' && (
          <button
            onClick={() => handleJoinChallenge(challenge)}
            disabled={!!joinLoading}
            className="w-full mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center justify-center text-sm"
          >
            {joinLoading === challenge.id ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Joining...
              </>
            ) : (
              <>
                <FiPlus className="mr-2" />
                Join Challenge
              </>
            )}
          </button>
        )}
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-800">Challenges</h1>
      </div>
      
      {/* Challenge progress overview */}
      {profile && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiAward className="text-primary-600 mr-2" size={20} />
              <span className="font-medium">My Challenges</span>
            </div>
            <div className="text-gray-600 text-sm">
              {profile.completedChallenges.length} completed
            </div>
          </div>
          
          <div className="flex justify-between mt-4 text-center">
            <div>
              <div className="font-medium text-lg text-primary-700">
                {profile.activeChallenges.length}
              </div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div>
              <div className="font-medium text-lg text-green-700">
                {profile.completedChallenges.length}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div>
              <div className="font-medium text-lg text-blue-700">
                {getAvailableChallenges().length}
              </div>
              <div className="text-xs text-gray-600">Available</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'active'
              ? 'text-primary-600 border-b-2 border-primary-500'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'available'
              ? 'text-primary-600 border-b-2 border-primary-500'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'completed'
              ? 'text-primary-600 border-b-2 border-primary-500'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          Completed
        </button>
      </div>
      
      {/* Challenges list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'active' && profile && (
            profile.activeChallenges.length > 0 ? (
              profile.activeChallenges.map(challenge => renderChallengeCard(challenge, 'active'))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No active challenges</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center mx-auto"
                >
                  <FiPlus className="mr-2" /> Join a Challenge
                </button>
              </div>
            )
          )}
          
          {activeTab === 'available' && profile && (
            getAvailableChallenges().length > 0 ? (
              getAvailableChallenges().map(challenge => renderChallengeCard(challenge, 'available'))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No available challenges</p>
                <p className="text-sm text-gray-500 mt-2">Check back later for new challenges!</p>
              </div>
            )
          )}
          
          {activeTab === 'completed' && profile && (
            profile.completedChallenges.length > 0 ? (
              profile.completedChallenges.map(challenge => renderChallengeCard(challenge, 'completed'))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No completed challenges yet</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center mx-auto"
                >
                  <FiPlus className="mr-2" /> Join a Challenge
                </button>
              </div>
            )
          )}
        </div>
      )}
      
      {/* For demo purposes, add a way to update progress on active challenges */}
      {activeTab === 'active' && profile && profile.activeChallenges.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="container mx-auto max-w-lg">
            <p className="text-sm text-gray-600 mb-2 text-center">Demo: Update challenge progress</p>
            <div className="flex justify-center space-x-2">
              {profile.activeChallenges.map(challenge => (
                <button
                  key={challenge.id}
                  onClick={() => updateChallengeProgress(challenge.id, 1)}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded"
                >
                  +1 {challenge.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenges;
