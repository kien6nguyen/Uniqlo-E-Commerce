import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import Header from "../components/Header";
import Footer from "../components/Footer";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const orderId = searchParams.get("orderId");
  const responseCode = searchParams.get("code");
  const message = searchParams.get("message");

  useEffect(() => {
    // Xác định thông báo lỗi dựa trên response code
    if (message) {
      switch (message) {
        case "InvalidSignature":
          setErrorMessage("Chữ ký không hợp lệ. Vui lòng thử lại.");
          break;
        case "OrderNotFound":
          setErrorMessage("Không tìm thấy đơn hàng. Vui lòng kiểm tra lại.");
          break;
        case "InvalidInput":
          setErrorMessage("Thông tin không hợp lệ. Vui lòng thử lại.");
          break;
        case "ServerError":
          setErrorMessage("Lỗi server. Vui lòng thử lại sau.");
          break;
        default:
          setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } else if (responseCode) {
      switch (responseCode) {
        case "24":
          setErrorMessage("Giao dịch bị hủy bởi người dùng.");
          break;
        case "11":
          setErrorMessage("Giao dịch đã hết hạn thanh toán.");
          break;
        case "12":
          setErrorMessage("Thẻ/Tài khoản bị khóa.");
          break;
        case "13":
          setErrorMessage("Sai mật khẩu xác thực giao dịch (OTP).");
          break;
        case "51":
          setErrorMessage("Tài khoản không đủ số dư để thanh toán.");
          break;
        case "65":
          setErrorMessage("Vượt quá số lần nhập OTP.");
          break;
        case "75":
          setErrorMessage("Ngân hàng thanh toán đang bảo trì.");
          break;
        default:
          setErrorMessage("Thanh toán không thành công. Vui lòng thử lại.");
      }
    } else {
      setErrorMessage("Thanh toán không thành công. Vui lòng thử lại.");
    }
  }, [message, responseCode]);

  const handleRetry = () => {
    navigate("/checkout");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleViewCart = () => {
    navigate("/cart");
  };

  return (
    <>
      <Header />
      <div className="flex flex-column align-items-center justify-content-center p-5" style={{ minHeight: "60vh", backgroundColor: "#f9fafb" }}>
        <div className="surface-card border-round-lg shadow-2 p-5 text-center" style={{ maxWidth: "600px", width: "100%" }}>
          {/* Icon thất bại */}
          <div className="flex justify-content-center mb-4">
            <div 
              className="flex align-items-center justify-content-center border-circle"
              style={{ 
                width: "100px", 
                height: "100px", 
                backgroundColor: "#ef4444",
                animation: "shake 0.5s ease-out"
              }}
            >
              <i className="pi pi-times" style={{ fontSize: "3rem", color: "white" }}></i>
            </div>
          </div>

          {/* Tiêu đề */}
          <h1 className="text-3xl font-bold text-900 mb-2">Thanh toán thất bại</h1>
          <p className="text-600 mb-4">
            {errorMessage}
          </p>

          {/* Thông tin đơn hàng nếu có */}
          {orderId && (
            <div className="surface-100 border-round p-4 mb-4">
              <div className="flex justify-content-between mb-2">
                <span className="font-semibold text-700">Mã đơn hàng:</span>
                <span className="text-900 font-bold">#{orderId.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-content-between">
                <span className="font-semibold text-700">Trạng thái:</span>
                <span className="text-red-600 font-semibold">
                  <i className="pi pi-times-circle mr-1"></i>
                  Đã hủy
                </span>
              </div>
            </div>
          )}

          {/* Gợi ý */}
          <div className="surface-50 border-round p-3 mb-4 text-left">
            <h3 className="text-900 font-semibold mb-2">
              <i className="pi pi-lightbulb text-yellow-500 mr-2"></i>
              Gợi ý
            </h3>
            <ul className="text-600 text-sm m-0 pl-4">
              <li className="mb-1">Kiểm tra lại thông tin thẻ/tài khoản</li>
              <li className="mb-1">Đảm bảo tài khoản có đủ số dư</li>
              <li className="mb-1">Liên hệ ngân hàng nếu thẻ bị khóa</li>
              <li>Thử lại sau vài phút nếu ngân hàng đang bảo trì</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-content-center flex-wrap">
            <Button
              label="Thử lại"
              icon="pi pi-refresh"
              onClick={handleRetry}
              style={{ backgroundColor: "#0d6efd", border: "none" }}
            />
            <Button
              label="Xem giỏ hàng"
              icon="pi pi-shopping-cart"
              onClick={handleViewCart}
              className="p-button-outlined"
            />
            <Button
              label="Về trang chủ"
              icon="pi pi-home"
              onClick={handleBackToHome}
              className="p-button-text"
            />
          </div>

          {/* Hỗ trợ */}
          <div className="mt-4 pt-3 border-top-1 surface-border">
            <p className="text-500 text-sm">
              Cần hỗ trợ? Liên hệ:{" "}
              <a href="mailto:support@example.com" className="text-blue-600 no-underline">
                support@example.com
              </a>
              {" "}hoặc hotline:{" "}
              <a href="tel:1900000000" className="text-blue-600 no-underline">
                1900 000 000
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </>
  );
};

export default PaymentFailed;
