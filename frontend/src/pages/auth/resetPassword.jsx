import React, { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../utils/axiosInstance";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";

function ResetPassword() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Link reset không hợp lệ hoặc hết hạn");
      return;
    }
    try {
      const res = await api.post("/resetPassword", { token, newPassword });
      if (res.data.error) {
        setError(res.data.error);
        setMessage("");
      } else {
        setMessage(res.data.message || "Đổi mật khẩu thành công!");
        setError("");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi kết nối server!");
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-column bg-white">
      <Header />
      
      <main className="flex-grow flex align-items-center justify-content-center py-8 px-4">
        <div className="w-full max-w-24rem">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold m-0 mb-1 tracking-tight uppercase">Đặt lại mật khẩu</h1>
            <p className="text-500 text-sm font-medium">Nhập mật khẩu mới cho tài khoản của bạn</p>
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
              <label htmlFor="password" className="font-bold text-xs uppercase tracking-wider text-700">Mật khẩu mới</label>
              <Password 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Nhập mật khẩu mới" 
                feedback={false} 
                toggleMask 
                className="w-full" 
                inputClassName="w-full" 
                inputStyle={{ padding: '0.65rem', height: '44px', borderRadius: 0 }}
                style={{ borderRadius: 0 }}
                required 
              />
            </div>

            <Button
              type="submit"
              label="ĐỔI MẬT KHẨU"
              className="w-full bg-black text-white hover:bg-gray-800 transition-colors border-none py-2 font-bold tracking-widest text-sm"
              style={{ borderRadius: 0, height: '44px' }}
            />

            <div className="text-center mt-3">
              <Link to="/login" className="font-bold text-black border-bottom-1 border-black hover:opacity-70 text-xs text-xs">
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

export default ResetPassword;

