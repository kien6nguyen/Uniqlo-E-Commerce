import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Avatar } from "primereact/avatar";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        navigate("/login");
        return;
      }
      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        navigate("/");
      }
    } catch (e) {
      navigate("/");
    }
  }, [navigate]);

  // Hàm xử lý khi bấm nút "sign out"
  const handleExitToHome = () => {
    // Chỉ điều hướng về trang chủ, KHÔNG xóa token/logout
    navigate("/");
  };

  // Hàm style cho từng Link
  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: "12px",
      color: isActive ? "#ffffff" : "#cbd5e1",
      backgroundColor: isActive ? "rgba(255, 255, 255, 0.15)" : "transparent",
      textDecoration: "none",
      fontWeight: isActive ? "600" : "500",
      transition: "all 0.3s ease",
      borderLeft: isActive ? "4px solid #60a5fa" : "4px solid transparent",
    };
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", overflow: "hidden" }}>

      {/* SIDEBAR */}
      <aside
        style={{
          width: "260px",
          background: "linear-gradient(180deg, #1e3a8a 0%, #172554 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 10px rgba(0,0,0,0.1)",
          zIndex: 10
        }}
      >
        {/* 1. Logo / Header Sidebar */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
              A
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, letterSpacing: '0.5px' }}>Admin Panel</h2>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Quản lý hệ thống</p>
            </div>
          </div>
        </div>

        {/* 2. Menu Links */}
        <div style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>

          <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "bold", paddingLeft: "12px", marginBottom: "4px" }}>Tổng quan</p>

          <Link to="/admin/dashboard" style={getLinkStyle("/admin/dashboard")}>
            <i className="pi pi-th-large" style={{ fontSize: '18px' }}></i>
            <span>Dashboard</span>
          </Link>

          <div style={{ height: "12px" }}></div>

          <p style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "bold", paddingLeft: "12px", marginBottom: "4px" }}>Quản lý</p>

          <Link to="/admin/products" style={getLinkStyle("/admin/products")}>
            <i className="pi pi-box" style={{ fontSize: '18px' }}></i>
            <span>Sản phẩm</span>
          </Link>

          <Link to="/admin/users" style={getLinkStyle("/admin/users")}>
            <i className="pi pi-users" style={{ fontSize: '18px' }}></i>
            <span>Người dùng</span>
          </Link>

          <Link to="/admin/orders" style={getLinkStyle("/admin/orders")}>
            <i className="pi pi-shopping-cart" style={{ fontSize: '18px' }}></i>
            <span>Đơn hàng</span>
          </Link>

          <Link to="/admin/discounts" style={getLinkStyle("/admin/discounts")}>
            <i className="pi pi-ticket" style={{ fontSize: '18px' }}></i>
            <span>Mã giảm giá</span>
          </Link>

          <Link to="/admin/chat" style={getLinkStyle("/admin/chat")}>
            <i className="pi pi-comments" style={{ fontSize: '18px' }}></i>
            <span>Hỗ trợ trực tuyến</span>
          </Link>
        </div>

        {/* 3. Footer Sidebar */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "12px", cursor: "pointer", transition: "0.2s" }}>
            <Avatar label="AD" shape="circle" style={{ backgroundColor: '#f59e0b', color: 'white' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>Admin</p>
            </div>
            {/* 3. Thêm sự kiện onClick vào icon */}
            <i
              className="pi pi-sign-out"
              style={{ color: "#ef4444", cursor: "pointer" }}
              title="Về trang chủ"
              onClick={handleExitToHome}
            ></i>
          </div>
        </div>

      </aside>

      {/* CONTENT AREA */}
      <main style={{ flex: 1, padding: "0", overflowY: "auto", position: "relative" }}>
        <div style={{ padding: "30px" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
