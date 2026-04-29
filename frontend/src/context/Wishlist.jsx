import React, { useEffect, useState, useRef } from "react";
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
      <Toast ref={toast} />

      <div className="bg-[#fdfdfd] min-h-screen pb-20">
        <div className="max-w-screen-md mx-auto px-4 pt-10">
          <div className="flex justify-content-between align-items-end mb-8 pb-4 border-bottom-2 border-black">
            <h1 className="m-0 text-2xl font-black uppercase tracking-tighter text-black">Danh sách yêu thích</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{wishlist.length} sản phẩm</span>
          </div>
          
          {loading ? (
            <div className="py-20 text-center">
              <i className="pi pi-spin pi-spinner text-gray-300 text-3xl"></i>
            </div>
          ) : wishlist.length === 0 ? (
            <div className="py-20 text-center bg-white border-round-lg border-1 border-100 shadow-sm">
              <div className="flex justify-content-center mb-6">
                <div className="w-24 h-24 bg-gray-50 border-circle flex align-items-center justify-content-center">
                  <i className="pi pi-heart text-gray-200 text-4xl"></i>
                </div>
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Danh sách yêu thích của bạn đang trống</p>
              <button 
                onClick={() => window.location.href = '/search'}
                className="bg-black text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-none cursor-pointer hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="flex flex-column gap-4">
              {wishlist.map((p) => (
                <div
                  key={p.id}
                  className="p-4 md:p-6 bg-white border-1 border-100 border-round hover:border-gray-300 transition-all flex align-items-center gap-6 group"
                >
                  <div
                    className="w-24 h-32 flex-shrink-0 overflow-hidden bg-gray-50 border-round cursor-pointer"
                    onClick={() => window.location.href = `/product/${p.id}`}
                  >
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-content-between align-items-start mb-2">
                      <span 
                        className="text-sm font-black uppercase tracking-tight text-black cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => window.location.href = `/product/${p.id}`}
                      >
                        {p.name}
                      </span>
                      <button
                        onClick={() => removeItem(p.id)}
                        className="bg-transparent border-none text-gray-300 hover:text-red-500 cursor-pointer transition-colors p-2"
                        title="Xóa khỏi yêu thích"
                      >
                        <i className="pi pi-trash text-sm"></i>
                      </button>
                    </div>
                    <div className="text-lg font-black text-black tracking-tight mb-6">
                      {Number(p.price).toLocaleString("vi-VN")}₫
                    </div>
                    <button 
                      onClick={() => window.location.href = `/product/${p.id}`}
                      className="bg-white text-black border-1 border-black px-6 py-2 text-[9px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-black hover:text-white transition-all"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Wishlist;
