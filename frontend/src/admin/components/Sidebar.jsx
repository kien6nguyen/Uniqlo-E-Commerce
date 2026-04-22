import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const menuItems = [
    { name: "Dashboard", icon: "pi pi-th-large", path: "/admin/dashboard" },
    { name: "Dashboard nâng cao", icon: "pi pi-chart-line", path: "/admin/advanced" },
    { name: "Quản lý sản phẩm", icon: "pi pi-box", path: "/admin/products" },
    { name: "Quản lý người dùng", icon: "pi pi-users", path: "/admin/users" },
    { name: "Quản lý đơn hàng", icon: "pi pi-shopping-cart", path: "/admin/orders" },
    { name: "Mã giảm giá", icon: "pi pi-tags", path: "/admin/discounts" },
    { name: "Đăng xuất", icon: "pi pi-sign-out", path: "/login" },
  ];

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Avatar + Info */}
      <div className="flex flex-col items-center mt-8 mb-6">
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="Admin"
          className="w-20 h-20 rounded-full border-2 border-white mb-3"
        />
        <h2 className="text-lg font-semibold">Admin</h2>
        <p className="text-sm opacity-80">Quản trị viên</p>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-2 px-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md transition-all ${
                isActive
                  ? "bg-[#00aaff] shadow text-white"
                  : "hover:bg-[#005fd4] text-gray-100"
              }`
            }
          >
            <i className={item.icon}></i>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="text-center text-xs text-gray-200 py-4 border-t border-blue-600 opacity-80">
        © 2025 Admin Panel
      </div>
    </div>
  );
};

export default Sidebar;
