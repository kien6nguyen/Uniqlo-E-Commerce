import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import ForgotPassword from "./pages/auth/forgotPassword";
import ResetPassword from "./pages/auth/resetPassword";
import Profile from "./pages/users/profile";
import SocialLogin from "./pages/auth/socailLogin";
import ProductDetail from "./components/ProductDetail";
import Cart from "./context/Cart";
import Wishlist from "./context/Wishlist";
import Checkout from "./pages/Checkout";
import AddressPage from "./pages/AddressPage";
import CategoryPage from "./pages/CategoryPage";
import UserProfile from "./pages/UserProfile";
import ProductListPage from "./pages/ProductListPage";

// ===== ADMIN SIDE =====
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";

import ProductManagement from "./admin/pages/ProductManagement";
import UserManagement from "./admin/pages/UserManagement";
import OrderManagement from "./admin/pages/OrderManagement";
import DiscountManagement from "./admin/pages/DiscountManagement";
import { PaymentSuccess, PaymentFailed } from "./pages/PaymentResult";
import ChatManagement from "./admin/pages/ChatManagement";


import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";

const GestureNavigator = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dragStart, setDragStart] = useState(null);
  const [direction, setDirection] = useState(0); // 1: sang trái, -1: sang phải

  const genders = useMemo(() => ["woman", "man", "kids", "baby"], []);
  const currentPath = location.pathname;
  
  // Ánh xạ pathname sang gender key
  const pathKey = currentPath === "/" ? "woman" : currentPath.replace("/", "");
  
  const handleGenderSwipe = (dir) => {
    // Chỉ swipe ở các Landing Page chính
    const currentIndex = genders.indexOf(pathKey);
    if (currentIndex === -1) return; 
    
    let nextIndex = currentIndex + dir;
    if (nextIndex < 0) nextIndex = genders.length - 1;
    if (nextIndex >= genders.length) nextIndex = 0;
    
    const targetGender = genders[nextIndex];
    const targetPath = targetGender === "woman" ? "/" : `/${targetGender}`;
    
    setDirection(dir); // Lưu lại hướng để làm animation
    navigate(targetPath);
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div 
      onMouseDown={(e) => setDragStart(e.clientX)}
      onMouseUp={(e) => {
        if (dragStart === null) return;
        const dist = e.clientX - dragStart;
        if (Math.abs(dist) > 70) handleGenderSwipe(dist > 0 ? -1 : 1);
        setDragStart(null);
      }}
      onTouchStart={(e) => setDragStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (dragStart === null) return;
        const dist = e.changedTouches[0].clientX - dragStart;
        if (Math.abs(dist) > 70) handleGenderSwipe(dist > 0 ? -1 : 1);
        setDragStart(null);
      }}
      style={{ minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          style={{ width: '100%' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <Router>
      <GestureNavigator>
        <Routes>
          {/* ==================== USER SIDE ==================== */}
          <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/oauth-success" element={<SocialLogin />} />

        {/* User */}
        <Route path="/profile" element={<UserProfile />} />

        {/* Product */}
        <Route path="/api/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/search" element={<ProductListPage />} />

        {/* Checkout */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/address" element={<AddressPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />


        {/* Gender Landing (Video Slider) - Rút gọn */}
        <Route path="/man" element={<Home gender="man" />} />
        <Route path="/kids" element={<Home gender="kids" />} />
        <Route path="/baby" element={<Home gender="baby" />} />

        {/* Product List theo Gender */}
        <Route path="/gender/:gender" element={<CategoryPage />} />

        {/* ==================== ADMIN SIDE ==================== */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="discounts" element={<DiscountManagement />} />
          <Route path="chat" element={<ChatManagement />} />
        </Route>
        </Routes>
      </GestureNavigator>
    </Router>
  );
}

export default App;
