import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Mail } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { authApi } from '../../services/api/authApi';
import { setEmail, setStep } from '../../store/authSlice';

const RequestOtpForm = () => {
  const [localEmail, setLocalEmail] = useState('');
  const [error, setError] = useState('');
  const [alertInfo, setAlertInfo] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAlertInfo({ type: '', message: '' });

    if (!localEmail) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!validateEmail(localEmail)) {
      setError('Email không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.sendOtp(localEmail);
      setAlertInfo({ type: 'success', message: 'Mã xác thực đã được gửi đến email của bạn!' });
      
      // Chờ một chút để user kịp thấy thông báo thành công
      setTimeout(() => {
        dispatch(setEmail(localEmail));
        dispatch(setStep(2));
      }, 1500);
      
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          Nhập địa chỉ email của bạn để nhận mã xác thực đặt lại mật khẩu.
        </p>
        
        {alertInfo.message && (
          <div className="mb-4">
            <Alert type={alertInfo.type} message={alertInfo.message} />
          </div>
        )}
        
        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="mssv@student.hcmute.edu.vn"
          icon={Mail}
          value={localEmail}
          onChange={(e) => {
            setLocalEmail(e.target.value);
            if (error) setError('');
            if (alertInfo.message) setAlertInfo({ type: '', message: '' });
          }}
          error={error}
          required
        />
      </div>

      <Button type="submit" isLoading={isLoading}>
        Gửi mã xác thực
      </Button>
    </form>
  );
};

export default RequestOtpForm;
