import React from 'react';

interface LoadingSpinnerProps {
  /**
   * Size of the spinner (small, medium, large)
   * @default "medium"
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Color of the spinner
   * @default "primary"
   */
  color?: 'primary' | 'gray' | 'white';
  
  /**
   * Whether to center the spinner in its container
   * @default false
   */
  centered?: boolean;
  
  /**
   * Optional text to display below the spinner
   */
  text?: string;
}

/**
 * A reusable loading spinner component
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  centered = false,
  text
}) => {
  // Define sizes for different options
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-16 w-16 border-4'
  };
  
  // Define color classes
  const colorClasses = {
    primary: 'border-t-primary-500 border-r-primary-300 border-b-primary-200 border-l-primary-300',
    gray: 'border-t-gray-600 border-r-gray-300 border-b-gray-200 border-l-gray-300',
    white: 'border-t-white border-r-gray-200 border-b-gray-100 border-l-gray-200'
  };
  
  // Combine classes
  const spinnerClasses = `
    animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}
  `;
  
  // Wrapper for centered spinner
  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className={spinnerClasses}></div>
        {text && <p className="mt-2 text-gray-600">{text}</p>}
      </div>
    );
  }
  
  // Basic spinner
  return (
    <div className="inline-block">
      <div className={spinnerClasses}></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
