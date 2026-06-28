import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { verifyOtp } from "../../store/authSlice";
import Input from "../common/Input";
import Button from "../common/Button";
import Alert from "../common/Alert";
import { Mail, KeyRound } from "lucide-react";

function VerifyOtpForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultEmail = location.state?.email || "";

  const { verifyOtpLoading, verifyOtpSuccess, verifyOtpMessage, verifyOtpError } =
    useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: defaultEmail,
    otp: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (verifyOtpSuccess) {
      const timerId = setTimeout(() => {
        navigate("/login");
      }, 1500);

      return () => clearTimeout(timerId);
    }
  }, [verifyOtpSuccess, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "Vui lòng nhập email.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Email không đúng định dạng.";
    }

    if (!formData.otp.trim()) {
      errors.otp = "Vui lòng nhập mã OTP.";
    } else if (formData.otp.trim().length < 4) {
      errors.otp = "Mã OTP không hợp lệ.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    await dispatch(
      verifyOtp({
        email: formData.email,
        otp: formData.otp.trim(),
      })
    );
  };

  return (
    <div>
      <div className="mb-6 space-y-3">
        {verifyOtpSuccess && <Alert type="success" message={verifyOtpMessage} />}
        {verifyOtpError && <Alert type="error" message={verifyOtpError} />}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          placeholder="tai@student.hcmute.edu.vn"
          error={formErrors.email}
          autoComplete="email"
        />

        <Input
          label="Mã OTP"
          name="otp"
          icon={KeyRound}
          value={formData.otp}
          onChange={handleChange}
          placeholder="Nhập mã OTP"
          error={formErrors.otp}
        />

        <Button type="submit" isLoading={verifyOtpLoading} className="mt-6">
          Xác thực OTP
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Chưa nhận được mã?{" "}
        <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors">
          Đăng ký lại
        </Link>
      </p>
    </div>
  );
}

export default VerifyOtpForm;