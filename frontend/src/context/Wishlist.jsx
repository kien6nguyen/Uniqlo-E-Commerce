import React, { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`; // Đảm bảo đúng port server của bạn

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      fetchWishlistFromServer();
    } else {
      loadWishlistFromLocal();
    }
  }, [token]);

  const loadWishlistFromLocal = () => {
    const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(stored);
    setLoading(false);
  };

  const fetchWishlistFromServer = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        const mappedList = data.data.wishlist.map((product) => ({
          id: product._id,
          name: product.name,
          price: product.price,
          img: product.images && product.images.length > 0 
            ? product.images[0].startsWith('http') ? product.images[0] : product.images[0] 
            : "/img/default.png",
        }));
        setWishlist(mappedList);
      }
    } catch (err) {
      console.error("Lỗi tải wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/user/me/wishlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: id }),
        });
        const data = await res.json();

        if (data.success) {
            const mappedList = data.wishlist.map((product) => ({
                id: product._id,
                name: product.name,
                price: product.price,
                img: product.images && product.images.length > 0 
                  ? product.images[0] 
                  : "/img/default.png",
              }));
          setWishlist(mappedList);
          window.dispatchEvent(new Event("wishlistUpdated"));
          
          toast.current.show({
            severity: "success",
            summary: "Thành công",
            detail: "Đã xóa khỏi yêu thích",
            life: 3000,
          });
        }
      } catch (err) {
        console.error("Lỗi xóa sản phẩm khỏi wishlist:", err);
        toast.current.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể xóa sản phẩm",
            life: 3000,
          });
      }
    } else {
      const newList = wishlist.filter((p) => p.id !== id);
      setWishlist(newList);
      localStorage.setItem("wishlist", JSON.stringify(newList));
      window.dispatchEvent(new Event("wishlistUpdated"));
      
      toast.current.show({
        severity: "info",
        summary: "Đã xóa",
        detail: "Đã xóa khỏi bộ nhớ tạm",
        life: 3000,
      });
    }
  };

  return (
    <>
      <Header />
      <Toast ref={toast} />
      <div className="p-4" style={{ maxWidth: "900px", margin: "0 auto", minHeight: "60vh" }}>
        <h2 className="mb-4 text-2xl font-bold border-bottom-1 border-300 pb-3">
            Sản phẩm yêu thích ({wishlist.length})
        </h2>
        
        {loading ? (
            <p className="text-center">Đang tải...</p>
        ) : wishlist.length === 0 ? (
          <div className="text-center p-5 surface-50 border-round">
            <i className="pi pi-heart text-500 text-4xl mb-3"></i>
            <p className="text-700 text-lg">Chưa có sản phẩm yêu thích nào.</p>
            <Button label="Tiếp tục mua sắm" text onClick={() => window.location.href = '/'} />
          </div>
        ) : (
          <div className="flex flex-column gap-3">
            {wishlist.map((p) => (
              <div
                key={p.id}
                className="flex gap-3 align-items-center border-1 surface-border border-round p-3 shadow-1 bg-white hover:shadow-2 transition-duration-200"
              >
                {/* ảnh */}
                <div
                  className="flex align-items-center justify-content-center border-1 surface-border border-round overflow-hidden"
                  style={{ width: 100, height: 100, minWidth: 100 }}
                >
                  <img
                    src={p.img}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>

                {/* thông tin */}
                <div className="flex flex-column flex-1 overflow-hidden gap-1">
                  <span className="font-bold text-900 text-lg white-space-nowrap overflow-hidden text-overflow-ellipsis">
                    {p.name}
                  </span>
                  <span className="text-red-600 font-bold text-xl">
                    {Number(p.price).toLocaleString("vi-VN")}₫
                  </span>
                </div>

                {/* nút xóa */}
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  rounded
                  aria-label="Delete"
                  tooltip="Bỏ thích"
                  onClick={() => removeItem(p.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Wishlist;
