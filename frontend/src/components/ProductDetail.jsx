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
                  <span className="text-[11px] font-black text-yellow-800">{product.averageRating || 4.8}</span>
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

              <p className="text-gray-600 text-sm leading-relaxed mb-10 border-left-3 border-gray-100 pl-5 italic font-medium">
                {product.description}
              </p>

              {/* Color Selection */}
              {product.tags?.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-content-between align-items-center mb-3">
                    <span className="text-[11px] font-black text-[#111] tracking-widest uppercase">Màu sắc: <span className="text-gray-400 ml-1">{selectedColor}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.tags.map(color => (
                      <div 
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-12 h-12 rounded-sm cursor-pointer border-2 transition-all p-1 flex align-items-center justify-content-center ${selectedColor === color ? 'border-black shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
                      >
                        <div className="w-full h-full rounded-sm shadow-inner" style={{ backgroundColor: color.toLowerCase(), border: '1px solid rgba(0,0,0,0.05)' }}></div>
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
                  <div className="grid grid-nogutter gap-2">
                    {product.variants.map(v => (
                      <div key={v._id} className="col">
                        <button 
                          onClick={() => setSelectedConfig(v._id)}
                          className={`w-full py-4 text-xs font-black border-2 transition-all rounded-sm uppercase tracking-widest ${selectedConfig === v._id ? 'bg-black text-white border-black shadow-lg translate-y-[-2px]' : 'bg-white text-black border-gray-200 hover:bg-gray-100'}`}
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
              <div className="flex flex-column gap-3 mb-10">
                <button 
                  disabled={currentStock <= 0}
                  onClick={addToCart}
                  className={`w-full py-5 text-sm font-black uppercase tracking-[0.25em] transition-all border-none active:scale-95 shadow-xl shadow-black/5 ${currentStock > 0 ? 'bg-black text-white cursor-pointer hover:bg-gray-800' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                >
                  Thêm vào túi đồ
                </button>
                <div className="flex gap-3">
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
                    className="flex-1 py-4 text-[10px] font-black border-1 border-black rounded-sm uppercase bg-white text-black hover:bg-gray-50 transition-all flex align-items-center justify-content-center gap-2 tracking-[0.2em] cursor-pointer"
                  >
                    <i className="pi pi-heart"></i> Yêu thích
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
                    className="flex-1 py-4 text-[10px] font-black border-1 border-gray-200 rounded-sm uppercase bg-white text-gray-400 hover:text-black hover:border-black transition-all flex align-items-center justify-content-center gap-2 tracking-[0.2em] cursor-pointer"
                  >
                    <i className="pi pi-share-alt"></i> Chia sẻ
                  </button>
                </div>
              </div>

              {/* Extra Info */}
              <div className="border-top-1 border-gray-100 pt-6 flex flex-column gap-4">
                <div className="flex align-items-start gap-4">
                  <div className="w-8 h-8 bg-gray-50 border-circle flex align-items-center justify-content-center flex-shrink-0">
                    <i className="pi pi-truck text-black text-xs"></i>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] font-black uppercase text-[#111] mb-1 tracking-widest">Giao hàng miễn phí</p>
                    <p className="m-0 text-[11px] text-gray-400 leading-normal font-bold">Miễn phí cho đơn hàng trên 999.000₫</p>
                  </div>
                </div>
                <div className="flex align-items-start gap-4">
                  <div className="w-8 h-8 bg-gray-50 border-circle flex align-items-center justify-content-center flex-shrink-0">
                    <i className="pi pi-refresh text-black text-xs"></i>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] font-black uppercase text-[#111] mb-1 tracking-widest">Đổi trả trong 30 ngày</p>
                    <p className="m-0 text-[11px] text-gray-400 leading-normal font-bold">An tâm mua sắm với chính sách đổi trả</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reviews Section */}
      <section className="bg-white py-24 border-top-1 border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-content-between align-items-end mb-12 pb-4 border-bottom-2 border-black">
            <h2 className="m-0 text-2xl font-black uppercase tracking-tighter">Đánh giá thực tế</h2>
            <div className="flex align-items-center gap-2 text-gray-400">
                <span className="text-[10px] font-black uppercase tracking-widest">{comments.length} đánh giá</span>
            </div>
          </div>
          
          <div className="grid">
            <div className="col-12 md:col-4 mb-12 md:mb-0 pr-0 md:pr-12">
              <div className="bg-gray-50 p-8 rounded-2xl text-center">
                <div className="text-7xl font-black text-black mb-2 tracking-tighter">{product.averageRating || 5.0}</div>
                <div className="flex justify-content-center mb-4">
                   <Rating value={Math.round(product.averageRating || 5)} readOnly stars={5} cancel={false} pt={{ onIcon: { className: 'text-yellow-400 text-xl' }, offIcon: { className: 'text-gray-200 text-xl' } }} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Đánh giá trung bình</p>
                <button className="w-full bg-white border-1 border-black py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all cursor-pointer">Viết đánh giá của bạn</button>
              </div>
            </div>
            
            <div className="col-12 md:col-8">
              {comments.length > 0 ? (
                <div className="flex flex-column gap-8">
                  {comments.map((c, i) => (
                    <div key={i} className="pb-8 border-bottom-1 border-gray-100 last:border-none">
                      <div className="flex justify-content-between align-items-center mb-4">
                        <div className="flex align-items-center gap-3">
                            <div className="w-10 h-10 bg-black text-white border-circle flex align-items-center justify-content-center font-black text-xs">
                                {c.user?.fullname?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-column">
                                <span className="font-black text-[11px] uppercase tracking-wider">{c.user?.fullname || "Khách hàng Uniqlo"}</span>
                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{new Date(c.createdAt || Date.now()).toLocaleDateString("vi-VN")}</span>
                            </div>
                        </div>
                        <Rating value={c.rating} readOnly stars={5} cancel={false} pt={{ onIcon: { className: 'text-yellow-400 text-[10px]' }, offIcon: { className: 'text-gray-200 text-[10px]' } }} />
                      </div>
                      <p className="m-0 text-sm text-gray-700 leading-relaxed font-bold">"{c.comment}"</p>
                      <div className="mt-4 flex gap-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 cursor-pointer hover:text-black">Hữu ích (0)</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 cursor-pointer hover:text-black">Báo cáo</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 border-round-xl">
                  <i className="pi pi-comments text-gray-200 text-5xl mb-4"></i>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Hãy là người đầu tiên đánh giá sản phẩm này</p>
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

