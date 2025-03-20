import React from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';

interface ErrorAlertProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Optional title for the error
   * @default "Error"
   */
  title?: string;
  
  /**
   * Whether the error can be dismissed
   * @default true
   */
  dismissible?: boolean;
  
  /**
   * Function to call when error is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Optional action button text
   */
  actionText?: string;
  
  /**
   * Function to call when action button is clicked
   */
  onAction?: () => void;
}

/**
 * A reusable error alert component to display error messages
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  title = 'Error',
  dismissible = true,
  onDismiss,
  actionText,
  onAction
}) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-1 text-sm text-red-700">
            <p>{message}</p>
          </div>
          
          {actionText && onAction && (
            <div className="mt-2">
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {actionText}
              </button>
            </div>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <FiX className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
