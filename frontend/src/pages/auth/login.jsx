import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Checkbox } from "primereact/checkbox";

function Login() {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, "/");
      navigate("/");
    }
  }, [navigate]);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError("");
    setEmailError("");
    setPasswordError("");

    let valid = true;

    if (!email.trim()) {
      setEmailError("Vui lòng nhập email");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Email không hợp lệ");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu");
      valid = false;
    }

    if (!valid) return;

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        setError("Sai tên đăng nhập hoặc mật khẩu");
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-column bg-white">
      <Header />
      
      <main className="flex-grow flex align-items-center justify-content-center py-8 px-4">
        <div className="w-full max-w-24rem">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold m-0 mb-1 tracking-tight">ĐĂNG NHẬP</h1>
            <p className="text-500 text-sm font-medium">Chào mừng bạn quay trở lại với UNIQLO</p>
          </div>

          {error && (
            <div className="mb-4">
              <Message severity="error" text={error} className="w-full text-xs" style={{ borderRadius: 0 }} />
            </div>
          )}

          <div className="flex flex-column gap-3">
            {/* Email Field */}
            <div className="flex flex-column gap-1">
              <label htmlFor="email" className="font-bold text-xs uppercase tracking-wider text-700">Email</label>
              <InputText
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Nhập địa chỉ email"
                className={`w-full ${emailError ? "p-invalid" : ""}`}
                style={{ padding: '0.65rem' }}
              />
              {emailError && (
                <small className="p-error text-xs font-semibold">{emailError}</small>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-column gap-1">
              <div className="flex justify-content-between align-items-center">
                <label htmlFor="password" className="font-bold text-xs uppercase tracking-wider text-700">Mật khẩu</label>
                <Link to="/forgotPassword" size="small" className="text-xs font-bold text-black border-bottom-1 border-black hover:opacity-70">
                  Quên mật khẩu?
                </Link>
              </div>
              <InputText
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Nhập mật khẩu"
                className={`w-full ${passwordError ? "p-invalid" : ""}`}
                style={{ padding: '0.65rem' }}
              />
              {passwordError && (
                <small className="p-error text-xs font-semibold">{passwordError}</small>
              )}
              
              <div className="flex align-items-center mt-1">
                <Checkbox
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.checked)}
                  className="mr-2"
                />
                <label htmlFor="showPassword" className="text-xs cursor-pointer select-none text-600 font-medium">
                  Hiển thị mật khẩu
                </label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              label="ĐĂNG NHẬP"
              className="w-full bg-black text-white hover:bg-gray-800 transition-colors border-none py-2 font-bold tracking-widest text-sm"
              style={{ borderRadius: 0, height: '44px' }}
            />

            <div className="relative flex align-items-center justify-content-center my-1">
              <div className="border-top-1 border-200 w-full absolute"></div>
              <span className="bg-white px-3 text-400 text-xs font-bold relative z-1">HOẶC</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black border-1 border-black hover:bg-black hover:text-white transition-all py-2 font-bold tracking-widest text-sm flex align-items-center justify-content-center cursor-pointer"
              style={{ height: '44px' }}
            >
              <i className="pi pi-google mr-2"></i>
              TIẾP TỤC VỚI GOOGLE
            </button>

            <div className="text-center mt-3">
              <span className="text-500 text-xs">Bạn chưa có tài khoản? </span>
              <Link to="/register" className="font-bold text-black border-bottom-1 border-black hover:opacity-70 ml-1 text-xs">
                Tạo tài khoản mới
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Login;