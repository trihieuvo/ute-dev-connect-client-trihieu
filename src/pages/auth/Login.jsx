import React from 'react';
import LoginForm from '../../components/auth/LoginForm';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-white font-bold text-2xl tracking-tighter">UTE</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          Đăng nhập
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Chào mừng bạn quay trở lại! Đăng nhập để tiếp tục.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-2xl shadow-blue-900/5 dark:shadow-blue-900/20 sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
