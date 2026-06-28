import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { authApi } from '../../services/api/authApi';
import { resetAuth } from '../../store/authSlice';

const ResetPasswordForm = () => {
  const email = useSelector((state) => state.auth.email);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [alertInfo, setAlertInfo] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!otp) newErrors.otp = 'Vui lòng nhập mã OTP';
    else if (otp.length < 6) newErrors.otp = 'Mã OTP phải có 6 chữ số';

    if (!newPassword) newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (newPassword.length < 6) newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertInfo({ type: '', message: '' });
    
    if (!validate()) return;

    try {
      setIsLoading(true);
      await authApi.resetPassword(email, otp, newPassword);
      setAlertInfo({ type: 'success', message: 'Đặt lại mật khẩu thành công! Tính năng login đang được xây dựng...' });
      
      setTimeout(() => {
        dispatch(resetAuth());
      }, 2000);
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          Mã xác nhận gồm 6 số đã được gửi tới email <br/>
          <strong className="text-gray-900 dark:text-gray-100">{email}</strong>
        </p>
        
        {alertInfo.message && (
          <div className="mb-4">
            <Alert type={alertInfo.type} message={alertInfo.message} />
          </div>
        )}
        
        <Input
          label="Mã OTP"
          type="text"
          placeholder="Nhập 6 số OTP"
          icon={KeyRound}
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
            if (errors.otp) setErrors({ ...errors, otp: '' });
            if (alertInfo.message) setAlertInfo({ type: '', message: '' });
          }}
          error={errors.otp}
          maxLength={6}
          required
        />

        <div className="relative">
          <Input
            label="Mật khẩu mới"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu mới"
            icon={Lock}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
              if (alertInfo.message) setAlertInfo({ type: '', message: '' });
            }}
            error={errors.newPassword}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Input
          label="Xác nhận mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Nhập lại mật khẩu mới"
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            if (alertInfo.message) setAlertInfo({ type: '', message: '' });
          }}
          error={errors.confirmPassword}
          required
        />
      </div>

      <Button type="submit" isLoading={isLoading}>
        Xác nhận đặt lại mật khẩu
      </Button>
      
      <div className="text-center mt-4">
        <button 
          type="button" 
          onClick={() => dispatch(resetAuth())}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors"
        >
          Trở lại nhập email
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
