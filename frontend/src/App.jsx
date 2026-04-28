import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import UserProfile from "./pages/UserProfile";
import ProductListPage from "./pages/ProductListPage";
import Header from "./components/Header";
import MainLanding from "./pages/MainLanding";
import { useEffect } from "react";


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
  const location = useLocation();
  const genders = useMemo(() => ["woman", "man", "kid", "baby"], []);
  const currentPath = location.pathname;
  const pathKey = currentPath === "/" ? "woman" : currentPath.replace("/", "");
  const isLandingPage = genders.includes(pathKey) || currentPath === "/";

  if (isLandingPage) {
    return <div style={{ minHeight: '100vh', position: 'relative' }}>{children}</div>;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AnimatePresence initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', overflow: 'visible' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


const HeaderWrapper = () => {
  const location = useLocation();
  const [forceLight, setForceLight] = useState(false);
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleHomeScroll = (e) => {
      const { index, total } = e.detail;
      setForceLight(index === total - 1);
    };
    window.addEventListener('homeSectionChanged', handleHomeScroll);
    return () => window.removeEventListener('homeSectionChanged', handleHomeScroll);
  }, []);

  if (isAdmin) return null;
  return <Header forceLightMode={forceLight} />;
};

function App() {
  return (
    <Router>
      <HeaderWrapper />
      <GestureNavigator>
        <Routes>
          {/* ==================== USER SIDE ==================== */}
          <Route path="/" element={<MainLanding />} />


        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/oauth-success" element={<SocialLogin />} />

        {/* User */}
        <Route path="/profile" element={<UserProfile />} />

        {/* Product */}
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        {/* Product List (Search & Gender) */}
        <Route path="/search" element={<ProductListPage />} />

        {/* Checkout */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/address" element={<AddressPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />


        {/* Gender Landing (Video Slider) - Rút gọn */}
        <Route path="/man" element={<MainLanding />} />
        <Route path="/kid" element={<MainLanding />} />
        <Route path="/baby" element={<MainLanding />} />

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
