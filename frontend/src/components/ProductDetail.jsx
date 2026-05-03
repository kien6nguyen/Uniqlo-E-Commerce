import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Rating } from "primereact/rating";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useParams, useNavigate } from "react-router-dom";
import { addOrUpdateCartItem, fetchCart } from "../utils/cartUtils";

const API_BASE = import.meta.env.VITE_API_BASE || `${import.meta.env.VITE_API_URL || ""}/api`;

const ProductDetail = () => {
  const toast = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStock, setCurrentStock] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProduct();
    fetchReviews();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (product) {
      updateStock();
    }
  }, [product, selectedConfig, selectedColor]);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateStock = () => {
    if (!product) return;
    if (selectedConfig === "standard") {
      setCurrentStock(product.stock || 0);
    } else if (selectedConfig && product.variants) {
      const variant = product.variants.find(v => String(v._id) === String(selectedConfig));
      setCurrentStock(variant ? variant.stock : 0);
    }
  };

  async function fetchProduct() {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();
      const productObj = data.product || data;
      
      setProduct(productObj);
      setSelectedConfig(productObj.variants?.length > 0 ? productObj.variants[0]._id : "standard");
      setSelectedColor(productObj.tags?.length > 0 ? productObj.tags[0] : null);

      // Fetch related
      if (productObj.gender) {
        const relRes = await fetch(`${API_BASE}/products?gender=${productObj.gender}&limit=8`, { credentials: "include" });
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelatedProducts(relData.products?.filter(p => p._id !== id) || []);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/products/${id}/reviews`);
      const data = await res.json();
      if (data.success) setComments(data.reviews);
    } catch (err) { console.error(err); }
  }

  const addToCart = async () => {
    if (!product || currentStock <= 0) return;
    try {
      await addOrUpdateCartItem({
        productId: product.id || product._id,
        quantity: 1,
        variantId: selectedConfig === "standard" ? null : selectedConfig,
        color: selectedColor
      });
      toast.current.show({ severity: "success", summary: "Thành công", detail: "Đã thêm vào giỏ hàng", life: 2000 });
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) { console.error(err); }
  };

  const submitReview = async () => {
    if (!newReview.comment.trim()) {
      toast.current.show({ severity: "warn", summary: "Chú ý", detail: "Vui lòng nhập nội dung đánh giá", life: 2000 });
      return;
    }
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reviews/products/${id}/reviews`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newReview)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.current.show({ severity: "success", summary: "Thành công", detail: "Đã gửi đánh giá", life: 2000 });
        setShowReviewForm(false);
        setNewReview({ rating: 5, comment: "" });
        fetchReviews();
        fetchProduct();
      } else {
        toast.current.show({ severity: "error", summary: "Lỗi", detail: data.message || "Không thể gửi đánh giá", life: 2000 });
      }
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Lỗi", detail: "Có lỗi xảy ra", life: 2000 });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null; 
    e.target.src = "https://placehold.co/600x800?text=Uniqlo+Product";
  };

  const getImg = img => {
    if (!img) return "/img/default.png";
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL || ""}/${img.replace(/\\/g, "/")}`;
  };

  if (loading) return (
    <div className="flex justify-content-center align-items-center" style={{ height: '80vh' }}>
      <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
    </div>
  );

  if (error || !product) return (
    <div className="text-center p-8">
      <h2 className="text-2xl font-bold text-gray-400">Sản phẩm không tồn tại</h2>
      <Button label="Quay lại trang chủ" className="mt-4 p-button-text text-black font-bold" onClick={() => navigate("/")} />
    </div>
  );

  const images = product.images?.length > 0 ? product.images : ["/img/default.png"];
  const currentPrice = selectedConfig === "standard" ? product.price : (product.variants?.find(v => v._id === selectedConfig)?.price || product.price);
  const oldPrice = product.isHotDeal ? Math.round(currentPrice * 1.25) : null;
  const computedRating = comments.length > 0
    ? (comments.reduce((sum, c) => sum + c.rating, 0) / comments.length).toFixed(1)
    : (product.averageRating ? parseFloat(product.averageRating).toFixed(1) : "5.0");

  return (
    <div className="bg-white min-h-screen">
      <Toast ref={toast} />
      
      {/* Breadcrumb */}
      <nav className="px-4 py-3 bg-[#fdfdfd] border-bottom-1 border-gray-100">
        <div className="max-w-screen-xl mx-auto flex align-items-center gap-3 text-[10px] font-black tracking-[0.15em] text-gray-500 uppercase">
          <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate("/")}>Trang chủ</span>
          <i className="pi pi-angle-right text-[8px] text-gray-300"></i>
          <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate(`/gender/${product.gender}`)}>{product.gender}</span>
          <i className="pi pi-angle-right text-[8px] text-gray-300"></i>
          <span className="text-black font-black">{product.name}</span>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid">
          {/* LEFT: Image Gallery */}
          <div className="col-12 lg:col-7 mb-6 lg:mb-0">
            <div className="grid">
              {/* Thumbnails (Side) */}
              <div className="hidden md:flex flex-column gap-2 col-2">
                {images.map((img, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square cursor-pointer border-1 transition-all p-1 rounded-sm ${activeImg === i ? 'border-black' : 'border-gray-200'}`}
                    onMouseEnter={() => setActiveImg(i)}
                  >
                    <img src={getImg(img)} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                  </div>
                ))}
              </div>
              {/* Main Image */}
              <div className="col-12 md:col-10">
                <div className="relative aspect-[3/4] bg-[#f9f9f9] rounded-lg overflow-hidden group">
                    <img 
                      src={getImg(images[activeImg])} 
                      alt={product.name} 
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                      onError={handleImageError}
                    />
                  {product.isHotDeal && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                      Giảm giá sốc
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="col-12 lg:col-5 lg:pl-6">
            <div className="sticky top-24">
              <div className="flex justify-content-between align-items-start mb-2">
                <span className="text-[11px] font-black text-gray-600 tracking-[0.2em] uppercase">{product.brand || "Uniqlo LifeWear"}</span>
                <div className="flex align-items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                  <i className="pi pi-star-fill text-yellow-500 text-[10px]"></i>
                  <span className="text-[11px] font-black text-yellow-800">{computedRating}</span>
                </div>
              </div>

              <h1 className="text-3xl font-black text-[#111] mb-4 leading-tight uppercase tracking-tight">{product.name}</h1>
              
              <div className="flex align-items-baseline gap-3 mb-6">
                <span className="text-3xl font-black text-red-600">
                  {currentPrice?.toLocaleString("vi-VN")}₫
                </span>
                {oldPrice && (
                  <span className="text-lg text-gray-300 line-through font-bold">
                    {oldPrice.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>

              <p className="text-gray-500 text-sm leading-relaxed mb-10 border-left-2 border-gray-100 pl-6 font-medium">
                {product.description || "Một sản phẩm chất lượng cao từ Uniqlo LifeWear, mang lại sự thoải mái và phong cách vượt trội cho người mặc."}
              </p>

              {/* Color Selection */}
              {product.tags?.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-content-between align-items-center mb-3">
                    <span className="text-[11px] font-black text-[#111] tracking-widest uppercase">Màu sắc: <span className="text-gray-400 ml-1">{selectedColor}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {product.tags.map(color => (
                      <div 
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`border-circle cursor-pointer border-2 transition-all duration-300 p-1 flex align-items-center justify-content-center ${selectedColor === color ? 'border-900 shadow-4' : 'border-300 hover:border-600'}`}
                        style={{ width: '48px', height: '48px', transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)' }}
                      >
                        <div className="w-full h-full border-circle" style={{ backgroundColor: color.toLowerCase(), border: '1px solid rgba(0,0,0,0.1)', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)' }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.variants?.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-content-between align-items-center mb-3">
                    <span className="text-[11px] font-black text-[#111] tracking-widest uppercase">Kích thước</span>
                    <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline uppercase">Hướng dẫn chọn size</span>
                  </div>
                  <div className="grid grid-nogutter" style={{ gap: '12px' }}>
                    {product.variants.map(v => (
                      <div key={v._id} className="col">
                        <button 
                          onClick={() => setSelectedConfig(v._id)}
                          className="w-full p-3 text-xs font-bold border-1 transition-all border-round uppercase cursor-pointer"
                          style={{
                            backgroundColor: selectedConfig === v._id ? '#111' : '#fff',
                            color: selectedConfig === v._id ? '#fff' : '#111',
                            borderColor: selectedConfig === v._id ? '#111' : '#e5e7eb',
                            letterSpacing: '0.1em'
                          }}
                        >
                          {v.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory Info */}
              <div className={`mb-8 p-3 rounded-lg flex align-items-center gap-3 ${currentStock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <div className={`w-2 h-2 rounded-full ${currentStock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {currentStock > 0 ? `Hiện còn ${currentStock} sản phẩm tại kho` : "Tạm hết hàng"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-column gap-4 mb-10">
                <button 
                  disabled={currentStock <= 0}
                  onClick={addToCart}
                  className={`w-full p-4 text-sm font-bold uppercase transition-all border-none rounded shadow-md`}
                  style={{ 
                    letterSpacing: '0.2em', 
                    backgroundColor: currentStock > 0 ? '#000000' : '#e5e7eb', 
                    color: currentStock > 0 ? '#ffffff' : '#6b7280',
                    cursor: currentStock > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  {currentStock > 0 ? "Thêm vào túi đồ" : "Hết hàng"}
                </button>
                <div className="flex gap-4">
                  <button 
                    onClick={async () => {
                      if (!product) return;
                      try {
                        const token = localStorage.getItem("token");
                        if (!token) {
                          // Handle local wishlist
                          const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
                          if (!stored.find(p => p.id === (product._id || product.id))) {
                            stored.push({
                              id: product._id || product.id,
                              name: product.name,
                              price: product.price,
                              img: product.images?.[0]
                            });
                            localStorage.setItem("wishlist", JSON.stringify(stored));
                          }
                        } else {
                          // Handle server wishlist
                          await fetch(`${API_BASE}/user/me/wishlist`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ productId: product._id || product.id })
                          });
                        }
                        window.dispatchEvent(new Event("wishlistUpdated"));
                        toast.current.show({ severity: "success", summary: "Thành công", detail: "Đã thêm vào yêu thích", life: 2000 });
                      } catch (err) { console.error(err); }
                    }}
                    className="flex-1 p-3 font-bold border-1 border-300 border-round uppercase surface-0 text-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all flex align-items-center justify-content-center gap-2 cursor-pointer"
                    style={{ fontSize: '10px', letterSpacing: '0.2em' }}
                  >
                    <i className="pi pi-heart-fill"></i> Yêu thích
                  </button>
                  <button 
                    onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: product.name, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.current.show({ severity: "info", summary: "Copy", detail: "Đã copy link sản phẩm", life: 2000 });
                        }
                    }}
                    className="flex-1 p-3 font-bold border-1 border-300 border-round uppercase surface-0 text-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex align-items-center justify-content-center gap-2 cursor-pointer"
                    style={{ fontSize: '10px', letterSpacing: '0.2em' }}
                  >
                    <i className="pi pi-share-alt"></i> Chia sẻ
                  </button>
                </div>
              </div>

              {/* Extra Info */}
              <div className="border-top-1 surface-border pt-5 flex flex-column gap-4">
                <div className="flex align-items-center gap-4">
                  <div className="surface-100 border-circle flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                    <i className="pi pi-truck text-gray-800 text-xl"></i>
                  </div>
                  <div>
                    <p className="m-0 text-xs font-bold uppercase text-gray-900 mb-1" style={{ letterSpacing: '0.1em' }}>Giao hàng miễn phí</p>
                    <p className="m-0 text-xs text-gray-600 font-medium">Miễn phí cho đơn hàng trên 999.000₫</p>
                  </div>
                </div>
                <div className="flex align-items-center gap-4">
                  <div className="surface-100 border-circle flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                    <i className="pi pi-refresh text-gray-800 text-xl"></i>
                  </div>
                  <div>
                    <p className="m-0 text-xs font-bold uppercase text-gray-900 mb-1" style={{ letterSpacing: '0.1em' }}>Đổi trả trong 30 ngày</p>
                    <p className="m-0 text-xs text-gray-600 font-medium">An tâm mua sắm với chính sách đổi trả</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reviews Section */}
      <section className="bg-white py-8 border-top-1 surface-border">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-content-between align-items-end mb-6 pb-4 border-bottom-2 border-900">
            <h2 className="m-0 text-2xl font-bold uppercase tracking-tight text-900">Đánh giá từ khách hàng</h2>
            <div className="flex align-items-center gap-2 text-600">
                <span className="text-xs font-bold uppercase tracking-widest">{comments.length} đánh giá</span>
            </div>
          </div>
          
          <div className="grid">
            <div className="col-12 md:col-4 mb-6 md:mb-0 pr-0 md:pr-6">
              <div className="surface-50 p-5 border-round-xl text-center">
                <div className="text-6xl font-black text-900 mb-2">{computedRating}</div>
                <div className="flex justify-content-center mb-3">
                   <Rating value={Math.round(parseFloat(computedRating))} readOnly stars={5} cancel={false} pt={{ onIcon: { className: 'text-yellow-500 text-lg' }, offIcon: { className: 'text-300 text-lg' } }} />
                </div>
                <p className="text-xs font-bold text-600 uppercase mb-5" style={{ letterSpacing: '0.1em' }}>Đánh giá trung bình</p>
                {showReviewForm ? (
                  <div className="mt-4 text-left">
                    <div className="mb-3">
                      <label className="block text-xs font-bold uppercase mb-2">Đánh giá của bạn</label>
                      <Rating value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: e.value})} stars={5} cancel={false} pt={{ onIcon: { className: 'text-yellow-500 text-xl' }, offIcon: { className: 'text-300 text-xl' } }} />
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-bold uppercase mb-2">Nội dung</label>
                      <textarea 
                        className="w-full p-2 border-1 border-300 border-round text-sm outline-none focus:border-900 transition-colors" 
                        rows={3} 
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={submitReview} disabled={submittingReview} className="flex-1 bg-black text-white border border-black p-2 text-xs font-bold uppercase cursor-pointer hover:bg-gray-800 transition-colors">
                        {submittingReview ? "Đang gửi..." : "Gửi"}
                      </button>
                      <button onClick={() => setShowReviewForm(false)} className="flex-1 bg-white text-black border border-black p-2 text-xs font-bold uppercase cursor-pointer hover:bg-gray-100 transition-colors">
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                        const token = localStorage.getItem("token");
                        if (!token) {
                            toast.current.show({ severity: "warn", summary: "Chú ý", detail: "Bạn cần đăng nhập để đánh giá", life: 2000 });
                            return;
                        }
                        setShowReviewForm(true);
                    }}
                    className="w-full bg-white text-black border border-black p-3 text-xs font-bold uppercase transition-all cursor-pointer hover:bg-black hover:text-white" style={{ letterSpacing: '0.1em' }}
                  >
                    Viết đánh giá
                  </button>
                )}
              </div>
            </div>
            
            <div className="col-12 md:col-8">
              {comments.length > 0 ? (
                <div className="flex flex-column">
                  {comments.map((c, i) => (
                    <div key={i} className="py-5 border-bottom-1 surface-border last:border-none">
                      <div className="flex justify-content-between align-items-start mb-3">
                        <div className="flex align-items-center gap-3">
                            <div className="surface-200 text-700 border-circle flex align-items-center justify-content-center font-bold text-sm" style={{ width: '40px', height: '40px' }}>
                                {c.user?.fullname?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-column gap-1">
                                <span className="font-bold text-sm text-900">{c.user?.fullname || "Khách hàng Uniqlo"}</span>
                                <span className="text-xs text-500">{new Date(c.createdAt || Date.now()).toLocaleDateString("vi-VN")}</span>
                            </div>
                        </div>
                        <Rating value={c.rating} readOnly stars={5} cancel={false} pt={{ onIcon: { className: 'text-yellow-500 text-sm' }, offIcon: { className: 'text-300 text-sm' } }} />
                      </div>
                      <p className="m-0 text-sm text-800 line-height-3">"{c.comment}"</p>
                      <div className="mt-4 flex gap-4">
                        <span className="text-xs font-medium text-500 cursor-pointer hover:text-900 transition-colors flex align-items-center gap-2">
                          <i className="pi pi-thumbs-up"></i> Hữu ích (0)
                        </span>
                        <span className="text-xs font-medium text-500 cursor-pointer hover:text-900 transition-colors flex align-items-center gap-2">
                          <i className="pi pi-flag"></i> Báo cáo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 surface-50 border-round-xl">
                  <i className="pi pi-comments text-300 text-5xl mb-3"></i>
                  <p className="text-500 text-sm font-medium">Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-screen-xl mx-auto px-4">
            <h2 className="m-0 text-2xl font-black uppercase tracking-tighter mb-10 pb-4 border-bottom-2 border-black">Sản phẩm tương tự</h2>
            <div className="grid">
              {relatedProducts.map(p => (
                <div key={p._id} className="col-6 md:col-4 lg:col-3">
                  <ProductCard 
                    id={p._id} 
                    name={p.name} 
                    price={p.price} 
                    img={getImg(p.images?.[0])} 
                    brand={p.brand} 
                    rating={p.averageRating} 
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;

