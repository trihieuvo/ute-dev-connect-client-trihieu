import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../store/authSlice";
import Input from "../common/Input";
import Button from "../common/Button";
import Alert from "../common/Alert";
import { User, Mail, IdCard, Lock, Eye, EyeOff } from 'lucide-react';

const initialFormData = {
  name: "",
  email: "",
  studentId: "",
  password: "",
  confirmPassword: "",
};

function RegisterForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { registerLoading, registerSuccess, registerMessage, registerError } =
    useSelector((state) => state.auth);

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập họ và tên.";
    }

    if (!formData.email.trim()) {
      errors.email = "Vui lòng nhập email.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Email không đúng định dạng.";
    }

    if (!formData.studentId.trim()) {
      errors.studentId = "Vui lòng nhập mã số sinh viên.";
    }

    if (!formData.password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    } else if (formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    const resultAction = await dispatch(registerUser(formData));

    if (registerUser.fulfilled.match(resultAction)) {
      // Đợi 1 chút để user thấy Alert success rồi mới chuyển trang
      setTimeout(() => {
        navigate("/verify-otp", {
          state: {
            email: formData.email,
          },
        });
      }, 1500);
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-3">
        {registerSuccess && <Alert type="success" message={registerMessage} />}
        {registerError && <Alert type="error" message={registerError} />}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Họ và tên"
          name="name"
          icon={User}
          value={formData.name}
          onChange={handleChange}
          placeholder="Ví dụ: Huỳnh Ngọc Tài"
          error={formErrors.name}
          autoComplete="name"
        />

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
          label="Mã số sinh viên"
          name="studentId"
          icon={IdCard}
          value={formData.studentId}
          onChange={handleChange}
          placeholder="Ví dụ: 22110333"
          error={formErrors.studentId}
        />

        <div className="relative">
          <Input
            label="Mật khẩu"
            name="password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            error={formErrors.password}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Input
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Nhập lại mật khẩu"
          error={formErrors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" isLoading={registerLoading} className="mt-6">
          Đăng ký
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

export default RegisterForm;