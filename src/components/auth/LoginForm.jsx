import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearLoginState } from "../../store/authSlice";
import Input from "../common/Input";
import Button from "../common/Button";
import Alert from "../common/Alert";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

const initialFormData = {
  email: "",
  password: "",
};

function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loginLoading, loginSuccess, loginMessage, loginError } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [sessionExpiredError, setSessionExpiredError] = useState("");

  // Clear login state khi component mount
  useEffect(() => {
    dispatch(clearLoginState());
    if (localStorage.getItem("session_expired") === "true") {
      setSessionExpiredError("Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.");
      localStorage.removeItem("session_expired");
    }
  }, [dispatch]);

  // Chuyển trang khi đăng nhập thành công
  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, navigate]);

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

    if (!formData.password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    dispatch(loginUser(formData));
  };

  return (
    <div>
      <div className="mb-6 space-y-3">
        {sessionExpiredError && <Alert type="error" message={sessionExpiredError} />}
        {loginSuccess && <Alert type="success" message={loginMessage} />}
        {loginError && <Alert type="error" message={loginError} />}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
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
          id="login-email"
        />

        <div className="relative">
          <Input
            label="Mật khẩu"
            name="password"
            type={showPassword ? "text" : "password"}
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            error={formErrors.password}
            autoComplete="current-password"
            id="login-password"
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            id="toggle-password"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group" id="remember-me-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
              id="remember-me"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
            id="forgot-password-link"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" isLoading={loginLoading} className="mt-6" id="login-submit">
          <LogIn className="w-4 h-4 mr-2" />
          Đăng nhập
        </Button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Chưa có tài khoản?</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/register"
            className="w-full flex justify-center items-center py-2.5 px-4 border-2 border-blue-100 rounded-md text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out"
            id="register-link"
          >
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
