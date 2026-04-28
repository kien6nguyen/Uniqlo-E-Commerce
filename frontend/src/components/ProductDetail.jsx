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
        <div className="max-w-screen-xl mx-auto flex align-items-center gap-2 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
          <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate("/")}>Trang chủ</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate(`/gender/${product.gender}`)}>{product.gender}</span>
          <span>/</span>
          <span className="text-black">{product.name}</span>
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
                <span className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase">{product.brand || "Uniqlo LifeWear"}</span>
                <div className="flex align-items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                  <i className="pi pi-star-fill text-yellow-500 text-[10px]"></i>
                  <span className="text-[11px] font-bold text-yellow-700">{product.averageRating || 4.8}</span>
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

              <p className="text-gray-500 text-sm leading-relaxed mb-8 border-left-3 border-gray-100 pl-4">
                {product.description}
              </p>

              {/* Color Selection */}
              {product.tags?.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-content-between align-items-center mb-3">
                    <span className="text-[11px] font-black text-[#111] tracking-widest uppercase">Màu sắc: <span className="text-gray-400 ml-1">{selectedColor}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(color => (
                      <div 
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full cursor-pointer border-2 transition-all p-0.5 flex align-items-center justify-content-center ${selectedColor === color ? 'border-black' : 'border-transparent'}`}
                      >
                        <div className="w-full h-full rounded-full border-1 border-gray-100" style={{ backgroundColor: color.toLowerCase(), background: `linear-gradient(45deg, ${color.toLowerCase()}, #eee)` }}></div>
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
                          className={`w-full py-3 text-xs font-black border-2 transition-all rounded-md uppercase tracking-widest ${selectedConfig === v._id ? 'bg-[#111] text-white border-black shadow-lg translate-y-[-2px]' : 'bg-white text-[#111] border-gray-100 hover:border-black'}`}
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
                  className={`w-full py-4 text-sm font-black uppercase tracking-[0.2em] rounded-md transition-all shadow-xl active:scale-95 ${currentStock > 0 ? 'bg-[#ee1c23] text-white hover:bg-[#d0191f]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  Thêm vào túi đồ
                </button>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 text-[11px] font-black border-2 border-gray-900 rounded-md uppercase hover:bg-gray-900 hover:text-white transition-all flex align-items-center justify-content-center gap-2 tracking-widest">
                    <i className="pi pi-heart"></i> Yêu thích
                  </button>
                  <button className="flex-1 py-3 text-[11px] font-black border-2 border-gray-100 rounded-md uppercase hover:bg-gray-50 transition-all flex align-items-center justify-content-center gap-2 tracking-widest">
                    <i className="pi pi-share-alt"></i> Chia sẻ
                  </button>
                </div>
              </div>

              {/* Extra Info */}
              <div className="border-top-1 border-gray-100 pt-6 flex flex-column gap-4">
                <div className="flex align-items-start gap-3">
                  <i className="pi pi-truck text-gray-400 mt-1"></i>
                  <div>
                    <p className="m-0 text-xs font-bold uppercase text-[#111] mb-1">Giao hàng miễn phí</p>
                    <p className="m-0 text-[11px] text-gray-400 leading-normal">Miễn phí giao hàng cho đơn hàng trên 999.000₫</p>
                  </div>
                </div>
                <div className="flex align-items-start gap-3">
                  <i className="pi pi-refresh text-gray-400 mt-1"></i>
                  <div>
                    <p className="m-0 text-xs font-bold uppercase text-[#111] mb-1">Đổi trả trong 30 ngày</p>
                    <p className="m-0 text-[11px] text-gray-400 leading-normal">An tâm mua sắm với chính sách đổi trả dễ dàng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reviews Section */}
      <section className="bg-[#fdfdfd] py-20 border-top-1 border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-content-between align-items-end mb-10 pb-4 border-bottom-2 border-black">
            <h2 className="m-0 text-2xl font-black uppercase tracking-tighter">Đánh giá khách hàng</h2>
            <button className="bg-transparent border-none text-xs font-bold text-blue-600 cursor-pointer hover:underline uppercase tracking-wider">Viết đánh giá</button>
          </div>
          
          <div className="grid">
            <div className="col-12 md:col-4 mb-8 md:mb-0 pr-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center border-1 border-gray-50">
                <div className="text-6xl font-black text-[#111] mb-2">{product.averageRating || 5.0}</div>
                <div className="flex justify-content-center mb-3">
                   <Rating value={Math.round(product.averageRating || 5)} readOnly stars={5} cancel={false} pt={{ onIcon: { className: 'text-yellow-400' } }} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dựa trên {comments.length} đánh giá</p>
              </div>
            </div>
            
            <div className="col-12 md:col-8">
              {comments.length > 0 ? (
                <div className="flex flex-column gap-6">
                  {comments.map((c, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border-1 border-gray-50 transition-transform hover:translate-x-2">
                      <div className="flex justify-content-between mb-3">
                        <span className="font-black text-sm uppercase">{c.user?.fullname || "Người dùng Uniqlo"}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{new Date().toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="mb-3">
                         <Rating value={c.rating} readOnly stars={5} cancel={false} pt={{ onIcon: { className: 'text-yellow-400 text-xs' } }} />
                      </div>
                      <p className="m-0 text-sm text-gray-600 leading-relaxed font-medium">"{c.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-xl border-dashed border-2 border-gray-100">
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Chưa có đánh giá nào cho sản phẩm này</p>
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

