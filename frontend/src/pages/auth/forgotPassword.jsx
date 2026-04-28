import React, { useState } from "react";
import Footer from "../../components/Footer";
import api from "../../utils/axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";

function ForgotPassword() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Vui lòng nhập email");
      return;
    } else if (!validateEmail(email)) {
      setEmailError("Email không hợp lệ");
      return;
    }

    try {
      const res = await api.post("/forgotPassword", { email });
      if (res.data.error) {
        setError(res.data.error);
        setMessage("");
      } else {
        setMessage(res.data.message || "Một link reset đã được gửi đến email của bạn.");
        setTimeout(() => {
          navigate("/login", { state: { email } });
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi kết nối server!");
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-column bg-white">

      
      <main className="flex-grow flex align-items-center justify-content-center py-8 px-4">
        <div className="w-full max-w-24rem">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold m-0 mb-1 tracking-tight uppercase">Quên mật khẩu?</h1>
            <p className="text-500 text-sm font-medium">Nhập email của bạn để khôi phục mật khẩu</p>
          </div>

          {error && (
            <div className="mb-4">
              <Message severity="error" text={error} className="w-full text-xs" style={{ borderRadius: 0 }} />
            </div>
          )}
          {message && (
            <div className="mb-4">
              <Message severity="success" text={message} className="w-full text-xs" style={{ borderRadius: 0 }} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-column gap-3">
            <div className="flex flex-column gap-1">
              <label htmlFor="email" className="font-bold text-xs uppercase tracking-wider text-700">Email</label>
              <InputText
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="Nhập địa chỉ email"
                className={`w-full ${emailError ? "p-invalid" : ""}`}
                style={{ padding: '0.65rem' }}
              />
              {emailError && (
                <small className="p-error text-xs font-semibold">{emailError}</small>
              )}
            </div>

            <Button
              type="submit"
              label="GỬI YÊU CẦU"
              className="w-full bg-black text-white hover:bg-gray-800 transition-colors border-none py-2 font-bold tracking-widest text-sm"
              style={{ borderRadius: 0, height: '44px' }}
            />

            <div className="text-center mt-3">
              <Link to="/login" className="font-bold text-black border-bottom-1 border-black hover:opacity-70 text-xs">
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ForgotPassword;

