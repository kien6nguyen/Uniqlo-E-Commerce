import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import Header from "../components/Header";
import Footer from "../components/Footer";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && orderInfo) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, orderInfo, navigate]);

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        credentials: 'include',
        headers
      });

      const data = await response.json();
      
      if (data.success) {
        setOrderInfo(data.order);
      }
    } catch (err) {
      console.error("Fetch order error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleViewOrder = () => {
    if (orderInfo) {
      navigate(`/api/user/me`);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
          <ProgressSpinner />
          <p className="mt-3 text-600">Đang xác nhận thanh toán...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex flex-column align-items-center justify-content-center p-5" style={{ minHeight: "60vh", backgroundColor: "#f9fafb" }}>
        <div className="surface-card border-round-lg shadow-2 p-5 text-center" style={{ maxWidth: "600px", width: "100%" }}>
          {/* Icon thành công */}
          <div className="flex justify-content-center mb-4">
            <div 
              className="flex align-items-center justify-content-center border-circle"
              style={{ 
                width: "100px", 
                height: "100px", 
                backgroundColor: "#10b981", 
                animation: "scaleIn 0.5s ease-out"
              }}
            >
              <i className="pi pi-check" style={{ fontSize: "3rem", color: "white" }}></i>
            </div>
          </div>

          {/* Tiêu đề */}
          <h1 className="text-3xl font-bold text-900 mb-2">Thanh toán thành công!</h1>
          <p className="text-600 mb-4">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
          </p>

          {/* Thông tin đơn hàng */}
          {orderInfo && (
            <div className="surface-100 border-round p-4 mb-4 text-left">
              <div className="flex justify-content-between mb-2">
                <span className="font-semibold text-700">Mã đơn hàng:</span>
                <span className="text-900 font-bold">#{orderInfo._id?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span className="font-semibold text-700">Tổng tiền:</span>
                <span className="text-900 font-bold text-xl text-green-600">
                  {orderInfo.finalAmount?.toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span className="font-semibold text-700">Trạng thái:</span>
                <span className="text-green-600 font-semibold">
                  <i className="pi pi-check-circle mr-1"></i>
                  Đã thanh toán
                </span>
              </div>
              {orderInfo.payment?.transactionId && (
                <div className="flex justify-content-between">
                  <span className="font-semibold text-700">Mã giao dịch:</span>
                  <span className="text-600">{orderInfo.payment.transactionId}</span>
                </div>
              )}
            </div>
          )}

          {/* Thông báo */}
          <div className="surface-50 border-round p-3 mb-4">
            <i className="pi pi-info-circle text-blue-500 mr-2"></i>
            <span className="text-600 text-sm">
              Chúng tôi đã gửi email xác nhận đơn hàng đến địa chỉ email của bạn.
            </span>
          </div>

          {/* Countdown */}
          <div className="mb-4">
            <p className="text-500 text-sm">
              Tự động chuyển về trang chủ sau <span className="font-bold text-blue-600">{countdown}</span> giây
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-content-center flex-wrap">
            <Button
              label="Xem đơn hàng"
              icon="pi pi-shopping-bag"
              onClick={handleViewOrder}
              className="p-button-outlined"
              disabled={!orderInfo}
            />
            <Button
              label="Về trang chủ"
              icon="pi pi-home"
              onClick={handleBackToHome}
              style={{ backgroundColor: "#0d6efd", border: "none" }}
            />
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default PaymentSuccess;
