import React, { useState, useEffect, createContext, useContext } from 'react';
import { FiX, FiAward, FiStar, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

// Types
type NotificationType = 'success' | 'error' | 'info' | 'achievement' | 'streak';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  points?: number;
  duration?: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

// Create context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Hook for components to access the notification system
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const duration = notification.duration || getDefaultDuration(notification.type);
    
    setNotifications(prev => [...prev, { ...notification, id, duration }]);
  };
  
  // Remove a notification by id
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Automatically remove notifications after their duration
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const timers = notifications.map(notification => {
      return setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);
  
  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Helper to determine default duration based on notification type
const getDefaultDuration = (type: NotificationType): number => {
  switch (type) {
    case 'achievement':
    case 'streak':
      return 5000; // Longer duration for achievements/streaks
    case 'error':
      return 8000; // Errors stay longer to ensure they're seen
    default:
      return 3000;
  }
};

// Component that displays the notifications
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="fixed top-0 right-0 z-50 p-4 max-w-sm w-full pointer-events-none">
      <div className="space-y-2">
        {notifications.map(notification => (
          <Notification 
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Individual notification component
const Notification: React.FC<{ 
  notification: Notification; 
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const { type, title, message, points } = notification;
  
  // Get appropriate background color based on type
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-200';
      case 'error':
        return 'bg-red-100 border-red-200';
      case 'achievement':
        return 'bg-primary-100 border-primary-200';
      case 'streak':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };
  
  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-green-600" size={20} />;
      case 'error':
        return <FiAlertTriangle className="text-red-600" size={20} />;
      case 'achievement':
        return <FiAward className="text-primary-600" size={20} />;
      case 'streak':
        return <FiStar className="text-blue-600" size={20} />;
      default:
        return <FiInfo className="text-gray-600" size={20} />;
    }
  };
  
  return (
    <div 
      className={`transform transition-all duration-500 ease-in-out translate-y-0 opacity-100 pointer-events-auto rounded-lg border p-4 shadow-lg ${getBgColor()}`}
    >
      <div className="flex justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="font-medium text-gray-800">{title}</p>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
            
            {points !== undefined && (
              <p className="mt-1 text-sm font-medium text-primary-600">
                +{points} points
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <span className="sr-only">Close</span>
            <FiX size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationProvider;
