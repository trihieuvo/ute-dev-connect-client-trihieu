import React from 'react';
import { useSelector } from 'react-redux';
import RequestOtpForm from '../../components/auth/RequestOtpForm';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const step = useSelector((state) => state.auth.step);

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
          Quên mật khẩu?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Đừng lo, chúng tôi sẽ giúp bạn lấy lại quyền truy cập.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-2xl shadow-blue-900/5 dark:shadow-blue-900/20 sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          {/* Progress Indicators */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors duration-300 ${step >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                1
              </div>
              <div className={`w-12 h-1 transition-colors duration-300 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors duration-300 ${step >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                2
              </div>
            </div>
          </div>

          <div className="transition-all duration-300 ease-in-out">
            {step === 1 ? <RequestOtpForm /> : <ResetPasswordForm />}
          </div>
        </div>

        {/* Quay lại đăng nhập */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nhớ mật khẩu rồi?{' '}
            <Link to="/auth/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
