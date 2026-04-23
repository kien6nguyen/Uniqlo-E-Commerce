import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Rating } from "primereact/rating";
import { InputTextarea } from "primereact/inputtextarea";
import { Carousel } from "primereact/carousel";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useParams, useNavigate } from "react-router-dom";
import { addOrUpdateCartItem, fetchCart } from "../utils/cartUtils";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;

const ProductDetail = () => {
  const toast = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStock, setCurrentStock] = useState(0);
  const [cartQuantity, setCartQuantity] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchProduct();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (product) {
      updateStock();
      loadCartQuantity();
    }
  }, [product, selectedConfig, selectedColor]);

  useEffect(() => {
    const socket = io(API_BASE.replace("/api", ""));

    socket.on("new_review", (data) => {
      if (data.productId === id) {
        setComments((prev) => [data.review, ...prev]);
        if (data.averageRating && product) {
          setProduct((prev) => ({ ...prev, averageRating: data.averageRating }));
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, product]);

  const updateStock = () => {
    if (!product) return;
    if (selectedConfig === "standard") {
      setCurrentStock(product.stock || 0);
    } else if (selectedConfig && product.variants) {
      const variant = product.variants.find(
        v => String(v._id) === String(selectedConfig)
      );
      setCurrentStock(variant ? variant.stock : 0);
    } else {
      setCurrentStock(0);
    }
  };
  const loadCartQuantity = async () => {
    try {
      const cartItems = await fetchCart();
      const item = cartItems.find(i => {
        const itemProduct = i.product._id || i.product;
        const targetVariantId = selectedConfig === "standard" ? null : selectedConfig;
        
        const isSameVariant = String(i.variantId || "") === String(targetVariantId || "");
        
        return String(itemProduct) === String(id) &&
          isSameVariant &&
          String(i.color || "") === String(selectedColor || "");
      });
      setCartQuantity(item ? item.quantity : 0);
    } catch (err) {
      console.error("Error loading cart quantity:", err);
      setCartQuantity(0);
    }
  };

  async function fetchProduct() {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { credentials: "include" });

      if (!res.ok) {
        console.error("Fetch product failed:", res.status);
        setError(`Fetch failed: ${res.status} ${res.statusText}`);
        setProduct(null);
        setRelatedProducts([]);
        setLoading(false);
        return;
      }

      const data = await res.json();

      let productObj = null;
      if (data.success && data.product) {
        productObj = data.product;
      } else if (data._id || data.id) {
        productObj = data;
      } else if (data.data && (data.data._id || data.data.id)) {
        productObj = data.data;
      }

      if (!productObj || (!productObj._id && !productObj.id)) {
        console.error("Product not found in response:", data);
        setError("Product data format invalid");
        setProduct(null);
        setRelatedProducts([]);
        setLoading(false);
        return;
      }

      setProduct(productObj);

      setSelectedConfig("standard");

      if (productObj.variants && productObj.variants.length > 0) {
        const defaultVar = productObj.variants.find(v => v.isDefault) || productObj.variants[0];
        setSelectedConfig(defaultVar._id);
      } else {
        setSelectedConfig(null);
      }

      if (productObj.tags && productObj.tags.length > 0) {
        setSelectedColor(productObj.tags[0]);
      } else {
        setSelectedColor(null);
      }

      if (productObj.category) {
        const q = new URLSearchParams({ category: productObj.category, limit: 10 }).toString();
        const relRes = await fetch(`${API_BASE}/products?${q}`, { credentials: "include" });
        if (relRes.ok) {
          const relData = await relRes.json();
          let list = [];
          if (Array.isArray(relData.products)) list = relData.products;
          else if (Array.isArray(relData)) list = relData;
          else if (Array.isArray(relData.data)) list = relData.data;

          const map = new Map();
          (list || []).forEach(item => {
            const key = String(item._id || item.id || "");
            if (!key) return;
            if (key === String(productObj._id || productObj.id)) return;
            if (!map.has(key)) map.set(key, item);
          });
          setRelatedProducts(Array.from(map.values()).slice(0, 8));
        } else {
          setRelatedProducts([]);
        }
      } else {
        setRelatedProducts([]);
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err.message);
      setProduct(null);
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/products/${id}/reviews`);
      const data = await res.json();
      if (data.success) {
        setComments(data.reviews);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  }

  const handleSubmitReview = async () => {
    if (!newComment.trim() && !rating) {
      toast.current.show({ severity: "warn", summary: "Thông báo", detail: "Vui lòng nhập nội dung hoặc chọn số sao", life: 3000 });
      return;
    }

    const token = localStorage.getItem("token");
    if (rating && !token) {
      toast.current.show({ severity: "error", summary: "Lỗi", detail: "Bạn cần đăng nhập để đánh giá sao", life: 3000 });
      return;
    }

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/reviews/products/${id}/reviews`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          rating: rating || undefined,
          comment: newComment
        }),
        credentials: "include"
      });

      const data = await res.json();

      if (data.success) {
        toast.current.show({ severity: "success", summary: "Thành công", detail: "Đánh giá của bạn đã được gửi", life: 3000 });
        setNewComment("");
        setRating(0);
      } else {
        toast.current.show({ severity: "error", summary: "Lỗi", detail: data.message || "Không thể gửi đánh giá", life: 3000 });
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.current.show({ severity: "error", summary: "Lỗi", detail: "Lỗi kết nối", life: 3000 });
    }
  };

  const averageRating = comments.length > 0
    ? (comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.filter(c => c.rating).length).toFixed(1)
    : (product?.averageRating || 0);

  const calculatePrice = () => {
    if (!product) return 0;

    if (selectedConfig === "standard") {
        let finalPrice = product.price || 0;
        return finalPrice;
    }
    let finalPrice = product.price || 0;

    if (selectedConfig && product.variants) {
      const v = product.variants.find(x => String(x._id) === String(selectedConfig));
      if (v && v.price) finalPrice = v.price;
    }

    return finalPrice;
  };

  const addToCart = async () => {
    if (!product) return;

    if (currentStock <= 0) {
      toast.current.show({ severity: "error", summary: "Hết hàng", detail: "Sản phẩm hiện đã hết hàng", life: 2500 });
      return;
    }

    if (cartQuantity >= currentStock) {
      toast.current.show({
        severity: "warn",
        summary: "Đã đạt giới hạn",
        detail: `Bạn đã có ${cartQuantity} sản phẩm trong giỏ. Kho chỉ còn ${currentStock} sản phẩm`,
        life: 3000
      });
      return;
    }

    try {
      // 1. Xác định variantId để gửi lên server
      // Nếu là 'standard' -> gửi null. Nếu là variant -> gửi _id
      const variantIdToSend = selectedConfig === "standard" ? null : selectedConfig;

      await addOrUpdateCartItem({
        productId: product.id || product._id,
        quantity: 1,
        variantId: variantIdToSend, // Gửi ID chính xác
        color: selectedColor
      });

      setCartQuantity(prev => prev + 1);

      // 2. Xác định tên để hiển thị thông báo (FIX LỖI VARIANT NOT DEFINED Ở ĐÂY)
      let variantLabel = " - Tiêu chuẩn";
      
      // Nếu không phải standard và có danh sách variants -> đi tìm tên
      if (selectedConfig !== "standard" && product.variants) {
          const foundVariant = product.variants.find(item => item._id === selectedConfig);
          if (foundVariant) {
              variantLabel = " - " + foundVariant.name;
          }
      }

      toast.current.show({
        severity: "success",
        summary: "Đã thêm vào giỏ hàng",
        detail: `${product.name}${variantLabel}${selectedColor ? " - " + selectedColor : ""}`,
        life: 2000,
      });
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.current.show({
        severity: "error",
        summary: "Lỗi",
        detail: err.message || "Không thể thêm vào giỏ hàng",
        life: 2500,
      });
    }
  };
  const buyNow = async () => {
    await addToCart();
    setTimeout(() => {
      navigate("/cart");
    }, 500);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-4">Đang tải...</div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="p-4">
          <h3>Không tìm thấy sản phẩm</h3>
          {error && <p className="text-red-500">Chi tiết lỗi: {error}</p>}
          <p>ID: {id}</p>
        </div>
        <Footer />
      </>
    );
  }

  const configOptions = [
    { label: "Tiêu chuẩn", value: "standard" },
    ...(product.variants || []).map(v => ({
      label: v.name,
      value: v._id
    }))
  ];
  const colorOptions = (product.tags || []).map(t => ({ label: t, value: t }));

  const starCounts = [5, 4, 3, 2, 1].map(star => ({ star, count: comments.filter(c => c.rating === star).length }));

  return (
    <>
      <Toast ref={toast} />
      <Header />
      <div className="p-4 md:p-6 surface-ground">
        <div className="grid" style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Ảnh sản phẩm */}
          <div className="col-12 md:col-5">
            <div className="border-round-lg surface-card shadow-2 p-3 h-full flex align-items-center justify-content-center">
              <Carousel
                value={product.images && product.images.length > 0 ? product.images : ["/img/default.png"]}
                numVisible={1}
                numScroll={1}
                showIndicators
                showNavigators
                itemTemplate={(img) => (
                  <img
                    src={img}
                    alt={product.name}
                    className="w-full border-round-lg"
                    style={{ maxHeight: "400px", objectFit: "contain" }}
                  />
                )}
              />
            </div>
          </div>

          {/* Thông tin sản phẩm */}
          <div className="col-12 md:col-7">
            <div className="border-round-lg surface-card shadow-2 p-3 h-full flex flex-column justify-between">
              <div className="flex flex-column gap-3">
                <h2 className="m-0">{product.name}</h2>
                <span className="text-500">Thương hiệu: {product.brand}</span>

                {/* Giá */}
                <div className="flex align-items-center gap-3">
                  <h2 className="m-0" style={{ color: "#0047ab" }}>
                    {calculatePrice().toLocaleString("vi-VN")}₫
                  </h2>
                  {product.oldPrice && (
                    <span className="line-through text-500 text-lg">
                      {Number(product.oldPrice).toLocaleString("vi-VN")}₫
                    </span>
                  )}
                </div>

                {/* Stock info */}
                <div className="flex align-items-center gap-2">
                  <span className={`font-semibold ${currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currentStock > 0 ? `Còn ${currentStock} sản phẩm` : 'Hết hàng'}
                  </span>
                  {cartQuantity > 0 && (
                    <span className="text-500 text-sm">
                      (Đã có {cartQuantity} trong giỏ)
                    </span>
                  )}
                </div>

                {/* Dropdown chọn cấu hình */}
                {configOptions.length > 0 && (
                  <div className="flex flex-column gap-2">
                    <label className="font-bold">Phiên bản:</label>
                    <Dropdown
                      value={selectedConfig}
                      options={configOptions}
                      onChange={(e) => setSelectedConfig(e.value)}
                      placeholder="Chọn phiên bản"
                      className="w-12rem"
                    />
                  </div>
                )}

                {/* Dropdown chọn màu sắc */}
                {colorOptions.length > 0 && (
                  <div className="flex flex-column gap-2">
                    <label className="font-bold">Màu sắc:</label>
                    <Dropdown
                      value={selectedColor}
                      options={colorOptions}
                      onChange={(e) => setSelectedColor(e.value)}
                      placeholder="Chọn màu sắc"
                      className="w-12rem"
                    />
                  </div>
                )}

                <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>
              </div>

              {/* Nút hành động */}
              <div className="flex flex-column md:flex-row gap-3 mt-4">
                <Button
                  label="Thêm vào giỏ"
                  icon="pi pi-shopping-cart"
                  className="flex-1 font-bold py-3 border-round-lg shadow-2"
                  outlined
                  style={{ borderColor: "#0047ab", color: "#0047ab" }}
                  onClick={addToCart}
                  disabled={currentStock <= 0} // Cho phép thêm dù đã có trong giỏ, backend sẽ chặn nếu vượt stock
                />
                <Button
                  label="Mua ngay"
                  icon="pi pi-bolt"
                  className="flex-1 font-bold py-3 border-round-lg shadow-2"
                  style={{ background: "linear-gradient(90deg, #0047ab, #00aaff)", border: "none" }}
                  onClick={buyNow}
                  disabled={currentStock <= 0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Đánh giá & bình luận (Giữ nguyên phần này) */}
        <div className="mt-6" style={{ maxWidth: "1400px", margin: "2rem auto" }}>
          <h3 className="mb-3">Đánh giá & Bình luận</h3>

          <div className="grid mb-4">
            <div className="col-12 md:col-4">
              <div className="surface-card border-round-lg p-4 shadow-2 text-center h-full flex flex-column justify-content-center">
                <div className="text-5xl font-bold mb-2" style={{ color: "#0047ab" }}>
                  {averageRating}
                </div>
                <div className="flex align-items-center justify-content-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFullStar = star <= Math.floor(parseFloat(averageRating));
                    const isHalfStar = !isFullStar && star === Math.ceil(parseFloat(averageRating));

                    return (
                      <div key={star} style={{ position: 'relative', display: 'inline-block' }}>
                        {isHalfStar ? (
                          <>
                            <i className="pi pi-star-fill" style={{ color: '#d1d5db', fontSize: '1.5rem' }}></i>
                            <i className="pi pi-star-fill" style={{ position: 'absolute', top: 0, left: 0, color: '#fbbf24', fontSize: '1.5rem', clipPath: 'inset(0 50% 0 0)' }}></i>
                          </>
                        ) : (
                          <i className="pi pi-star-fill" style={{ color: isFullStar ? '#fbbf24' : '#d1d5db', fontSize: '1.5rem' }}></i>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-600">{comments.length} đánh giá</span>
              </div>
            </div>

            <div className="col-12 md:col-8">
              <div className="surface-card border-round-lg p-4 shadow-2 h-full flex flex-column justify-content-center">
                {starCounts.map(({ star, count }) => (
                  <div key={star} className="flex align-items-center gap-3 mb-2">
                    <div className="flex align-items-center gap-2" style={{ width: "60px" }}>
                      <span className="text-sm font-medium" style={{ width: "12px", textAlign: "center" }}>{star}</span>
                      <i className="pi pi-star-fill" style={{ color: '#fbbf24', fontSize: '1rem' }}></i>
                    </div>
                    <div className="flex-1" style={{ height: "10px", backgroundColor: "#e5e7eb", borderRadius: "5px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${comments.length > 0 ? (count / comments.length) * 100 : 0}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #0047ab, #00aaff)",
                          transition: "width 0.3s ease"
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-600" style={{ width: "60px", textAlign: "right" }}>
                      {count} người
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="surface-card border-round-lg p-4 shadow-2">
            <h4 className="mb-3">Viết đánh giá của bạn</h4>
            <Rating value={rating} onChange={(e) => setRating(e.value)} cancel={false} pt={{ onIcon: { style: { color: "#facc15" } }, offIcon: { style: { color: "#d1d5db" } } }} />
            <div className="mt-3">
              <InputTextarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReview();
                  }
                }}
                rows={3}
                placeholder="Nhập bình luận..."
                className="w-full"
              />
              <Button label="Gửi" icon="pi pi-send" className="mt-2" onClick={handleSubmitReview} style={{ background: "linear-gradient(90deg, #0047ab, #00aaff)", border: "none" }} />
            </div>
          </div>

          <h4 className="mt-5 mb-3">Đánh giá từ khách hàng</h4>
          <div className="flex flex-column gap-3">
            {comments.length === 0 ? (
              <div className="surface-card border-round-lg p-4 shadow-2 text-center">
                <p className="text-600">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
              </div>
            ) : (
              comments.map((c, idx) => (
                <div key={idx} className="border-1 surface-card border-round-lg p-4 shadow-2" style={{ lineHeight: "1.6" }}>
                  <div className="flex justify-content-between">
                    <strong className="block mb-2">{c.user?.fullname || "Người dùng ẩn danh"}</strong>
                    <span className="text-500 text-sm">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <div className="mb-2">
                    <Rating value={c.rating} readOnly stars={5} cancel={false} pt={{ onIcon: { style: { color: "#facc15" } }, offIcon: { style: { color: "#d1d5db" } } }} />
                  </div>
                  <p className="m-0">{c.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div style={{ maxWidth: "1400px", margin: "2rem auto" }}>
          <div className="border-round-lg shadow-2 p-4">
            <div className="surface-0 border-round-lg p-4">
              <div className="flex justify-content-between align-items-center mb-3 pb-2">
                <h3 className="m-0">Sản phẩm liên quan</h3>
              </div>
              <Carousel
                value={relatedProducts}
                numVisible={Math.min(5, relatedProducts.length)}
                numScroll={1}
                showIndicators={false}
                showNavigators
                itemTemplate={(p) => (
                  <div className="p-2 h-full">
                    <ProductCard
                      id={p.id || p._id}
                      brand={p.brand}
                      name={p.name}
                      price={p.price}
                      oldPrice={p.oldPrice}
                      img={(p.images && p.images[0]) || "/img/default.png"}
                      rating={p.averageRating}
                      variants={p.variants || []}
                      colors={p.tags || []}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductDetail;
