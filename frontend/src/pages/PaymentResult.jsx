import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
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
  }, [navigate]);

  return (
    <>
      <Header />
      <div className="flex align-items-center justify-content-center" style={{ minHeight: "60vh", background: "#f9fafb" }}>
        <div className="surface-card p-6 shadow-2 border-round-lg text-center" style={{ maxWidth: "500px" }}>
          <div className="mb-4">
            <i className="pi pi-check-circle text-green-500" style={{ fontSize: "5rem" }}></i>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-3">Thanh toán thành công!</h1>
          <p className="text-lg text-700 mb-2">Cảm ơn bạn đã đặt hàng</p>
          {orderId && (
            <p className="text-sm text-600 mb-4">
              Mã đơn hàng: <span className="font-bold">{orderId}</span>
            </p>
          )}
          <p className="text-sm text-500 mb-4">
            Thông tin đơn hàng và hóa đơn đã được gửi đến email của bạn.
          </p>
          <div className="mb-4">
            <p className="text-sm text-600">
              Tự động chuyển về trang chủ sau <span className="font-bold text-xl">{countdown}</span> giây
            </p>
          </div>
          <div className="flex gap-2 justify-content-center">
            <Button
              label="Về trang chủ"
              icon="pi pi-home"
              onClick={() => navigate("/")}
              style={{ backgroundColor: "#0d6efd" }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const errorCode = searchParams.get("code");
  const message = searchParams.get("message");

  const getErrorMessage = () => {
    if (message) return message;
    
    const errorMessages = {
      "07": "Giao dịch bị nghi ngờ gian lận",
      "09": "Thẻ chưa đăng ký Internet Banking",
      "10": "Xác thực thông tin không thành công quá 3 lần",
      "11": "Đã hết hạn chờ thanh toán",
      "12": "Thẻ bị khóa",
      "13": "Nhập sai mật khẩu xác thực giao dịch",
      "24": "Hủy giao dịch",
      "51": "Tài khoản không đủ số dư",
      "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày",
      "75": "Ngân hàng thanh toán đang bảo trì",
      "79": "Nhập sai mật khẩu thanh toán quá số lần quy định"
    };

    return errorMessages[errorCode] || "Có lỗi xảy ra trong quá trình thanh toán";
  };

  return (
    <>
      <Header />
      <div className="flex align-items-center justify-content-center" style={{ minHeight: "60vh", background: "#f9fafb" }}>
        <div className="surface-card p-6 shadow-2 border-round-lg text-center" style={{ maxWidth: "500px" }}>
          <div className="mb-4">
            <i className="pi pi-times-circle text-red-500" style={{ fontSize: "5rem" }}></i>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-3">Thanh toán thất bại</h1>
          <p className="text-lg text-700 mb-4">{getErrorMessage()}</p>
          {orderId && (
            <p className="text-sm text-600 mb-4">
              Mã đơn hàng: <span className="font-bold">{orderId}</span>
            </p>
          )}
          {errorCode && (
            <p className="text-xs text-500 mb-4">Mã lỗi: {errorCode}</p>
          )}
          <p className="text-sm text-600 mb-4">
            Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
          </p>
          <div className="flex gap-2 justify-content-center">
            <Button
              label="Về trang chủ"
              icon="pi pi-home"
              onClick={() => navigate("/")}
              severity="secondary"
            />
            <Button
              label="Thử lại"
              icon="pi pi-refresh"
              onClick={() => navigate("/checkout")}
              style={{ backgroundColor: "#0d6efd" }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export { PaymentSuccess, PaymentFailed };