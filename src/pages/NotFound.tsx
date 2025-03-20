import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <FiAlertTriangle size={32} className="text-red-600" />
            </div>
          </div>
          
          <h1 className="mt-4 text-3xl font-bold text-gray-800">
            404 - Page Not Found
          </h1>
          
          <p className="mt-2 text-gray-600">
            Oops! The page you're looking for doesn't exist.
          </p>
          
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiHome className="mr-2" /> Back to Home
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Looking for something else?</p>
            <div className="mt-3 space-x-4">
              <Link to="/food-log" className="text-primary-600 hover:text-primary-800">
                Food Log
              </Link>
              <Link to="/achievements" className="text-primary-600 hover:text-primary-800">
                Achievements
              </Link>
              <Link to="/profile" className="text-primary-600 hover:text-primary-800">
                Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
