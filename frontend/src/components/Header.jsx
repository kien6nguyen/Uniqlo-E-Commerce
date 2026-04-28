import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Badge } from "primereact/badge";
import { OverlayPanel } from "primereact/overlaypanel";
import { fetchCart } from "../utils/cartUtils";

function Header({ forceLightMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  // Các trang sử dụng giao diện video slider
  const videoPaths = ["/", "/woman", "/man", "/kid", "/baby"];
  const isVideoPage = videoPaths.includes(pathname);
  const isHome = isVideoPage;
  const [user, setUser] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  const wishlistPanel = useRef(null);
  const cartPanel = useRef(null);
  const searchPanel = useRef(null);
  const [selectedGender, setSelectedGender] = useState("woman");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Sync selectedGender with current path
  useEffect(() => {
    const pathKey = pathname === "/" ? "woman" : pathname.replace("/", "");
    if (["woman", "man", "kid", "baby"].includes(pathKey)) {
      setSelectedGender(pathKey);
    }
  }, [pathname]);


  const processWishlistData = (wishlistData) => {
    if (wishlistData && Array.isArray(wishlistData)) {
      return wishlistData.map((item) => {
        if (typeof item === "object" && item !== null) {
          return {
            id: item._id || item.id,
            name: item.name,
            price: item.price,
            img: item.img || (item.images && item.images[0]) || "/img/default.png",
            brand: item.brand,
          };
        }
        return null;
      }).filter(Boolean);
    }
    return [];
  };

  const loadUserData = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/user/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
          setWishlist(processWishlistData(data.data.wishlist));
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    }
  };

  const loadCart = async () => {
    try {
      const items = await fetchCart();
      setCartItems(items);
    } catch (err) {
      console.error("Error loading cart:", err);
    }
  };

  useEffect(() => {
    loadUserData();
    loadCart();

    const handleEvents = () => {
      loadUserData();
      loadCart();
    };

    window.addEventListener("wishlistUpdated", handleEvents);
    window.addEventListener("cartUpdated", handleEvents);
    return () => {
      window.removeEventListener("wishlistUpdated", handleEvents);
      window.removeEventListener("cartUpdated", handleEvents);
    };
  }, []);

  const handleSearch = (query) => {
    const searchTerm = (typeof query === 'string' ? query : keyword).trim();
    if (searchTerm) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      searchPanel.current?.hide();
      setKeyword(searchTerm);
    }
  };

  const handleRemoveFromWishlist = async (e, productId) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/user/me/wishlist`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new CustomEvent("wishlistUpdated"));
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    }
  };

  const handleRemoveFromCart = async (e, productId, variantId, color) => {
    e.stopPropagation();
    try {
      const { removeCartItem } = await import("../utils/cartUtils");
      await removeCartItem(productId, variantId, color);
      // Event cartUpdated will be emitted by removeCartItem
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };


  const menuItems = useMemo(
    () => [
      { label: "NỮ", gender: "woman" },
      { label: "NAM", gender: "man" },
      { label: "TRẺ EM", gender: "kid" },
      { label: "EM BÉ", gender: "baby" },
    ],
    []
  );


  const segmentsData = {
    woman: {
      label: "NỮ",
      searchPlaceholder: "Tìm kiếm sản phẩm",
      categories: [
        { title: "Áo thun", desc: "Cotton mềm mại", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-ut.jpg" },
        { title: "Áo sơ mi", desc: "Thanh lịch", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-shirt.jpg" },
        { title: "Áo khoác", desc: "Ấm áp mùa đông", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-outer.jpg" },
        { title: "Quần dài", desc: "Dáng chuẩn", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-bottoms.jpg" },
        { title: "Váy", desc: "Nữ tính", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-skirt.jpg" },
        { title: "Đồ lót", desc: "Thoải mái", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-inner.jpg" },
        { title: "Đồ ngủ", desc: "Dễ chịu", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-loungewear.jpg" },
        { title: "Phụ kiện", desc: "Thời trang", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-accessories.jpg" },
        { title: "Túi xách", desc: "Tiện dụng", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-bags.jpg" },
        { title: "Giày", desc: "Êm ái", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-shoes.jpg" },
        { title: "Đồ tập", desc: "Năng động", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-sport.jpg" },
        { title: "Heattech", desc: "Giữ nhiệt", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-heattech.jpg" },
        { title: "Airism", desc: "Thanh mát", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-airism.jpg" },
        { title: "UV Cut", desc: "Chống nắng", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-uvcut.jpg" },
        { title: "Sale", desc: "Ưu đãi lớn", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-sale.jpg" },
        { title: "Mới về", desc: "Xu hướng", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-new.jpg" },
        { title: "Bán chạy", desc: "Yêu thích", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-best.jpg" },
        { title: "Trẻ trung", desc: "Phong cách", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-style.jpg" },
        { title: "Cơ bản", desc: "Cần thiết", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-basic.jpg" },
        { title: "Đặc biệt", desc: "Giới hạn", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-woman-special.jpg" },
      ]
    },
    man: {
      label: "NAM",
      searchPlaceholder: "Tìm kiếm sản phẩm nam",
      categories: [
        { title: "Áo thun", desc: "Năng động", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-ut.jpg" },
        { title: "Sơ mi", desc: "Lịch lãm", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-shirt.jpg" },
        { title: "Áo khoác", desc: "Chất lượng cao", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-outer.jpg" },
        { title: "Quần dài", desc: "Thoải mái", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-bottoms.jpg" },
        { title: "Quần short", desc: "Phóng khoáng", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-shorts.jpg" },
        { title: "Đồ lót", desc: "Khô thoáng", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-inner.jpg" },
        { title: "Đồ ngủ", desc: "Thư giãn", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-loungewear.jpg" },
        { title: "Phụ kiện", desc: "Nam tính", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-accessories.jpg" },
        { title: "Túi", desc: "Tiện dụng", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-bags.jpg" },
        { title: "Giày", desc: "Bền bỉ", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-shoes.jpg" },
        { title: "Đồ tập", desc: "Dry-Ex", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-sport.jpg" },
        { title: "Heattech", desc: "Siêu ấm", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-heattech.jpg" },
        { title: "Airism", desc: "Tươi mát", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-airism.jpg" },
        { title: "UV Cut", desc: "Bảo vệ da", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-uvcut.jpg" },
        { title: "Sale", desc: "Giá tốt", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-sale.jpg" },
        { title: "Mới về", desc: "Trình làng", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-new.jpg" },
        { title: "K-IDS", desc: "Phối đồ", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-style.jpg" },
        { title: "Blazer", desc: "Công sở", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-blazer.jpg" },
        { title: "Polo", desc: "Cổ điển", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-polo.jpg" },
        { title: "Jeans", desc: "Chắc chắn", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-jeans.jpg" },
      ]
    },
    "kid": {
      label: "TRẺ EM",
      searchPlaceholder: "Tìm kiếm sản phẩm trẻ em",
      categories: Array(20).fill({ title: "Đồ Trẻ Em", desc: "Chất lượng an toàn", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-kids.jpg" })
    },
    "baby": {
      label: "EM BÉ",
      searchPlaceholder: "Tìm kiếm sản phẩm em bé",
      categories: Array(20).fill({ title: "Đồ Em Bé", desc: "Siêu mềm mại", img: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-baby.jpg" })
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalCartPrice = cartItems.reduce((sum, item) => sum + (item.price || item.product?.price || 0) * (item.quantity || 1), 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('nav')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ALWAYS RENDER FULL HEADER
  return (
    <header
      className={`${isHome ? "absolute" : "sticky"} top-0 left-0 w-full`}
      style={{
        borderBottom: 'none',
        backgroundColor: isHome && !isMenuOpen && !forceLightMode ? 'transparent' : 'white',
        zIndex: 3000,
        transition: 'all 0.3s ease',
        height: '90px'
      }}
    >
      <div className="container-xl flex justify-content-between align-items-center h-full px-6">

        {/* LEFT: LOGO */}
        <div className="flex-1">
          <Link to="/" className="no-underline">
            <img src="/logo2.png" alt="Logo" style={{ height: '50px' }} />
          </Link>
        </div>


        {/* CENTER: CATEGORIES */}
        <nav className="flex-2 hidden lg:block z-5">
          <ul className="flex list-none p-0 m-0 gap-5 justify-content-center">
            {menuItems.map((it) => {
              const isActive = selectedGender === it.gender && isMenuOpen;
              const isRouteActive = urlParams.get("gender") === it.gender;

              return (
                <li key={it.gender}>
                  <button
                    onClick={() => {
                      if (selectedGender === it.gender) {
                        setIsMenuOpen(!isMenuOpen);
                      } else {
                        setSelectedGender(it.gender);
                        setIsMenuOpen(true);
                      }
                    }}
                    className={`bg-transparent border-none no-underline font-light text-lg uppercase transition-all py-2 px-1 relative cursor-pointer ${isHome && !isMenuOpen && !forceLightMode ? "text-white" : "text-900"
                      } ${isActive || isRouteActive ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                    style={{
                      textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                      borderBottom: (isActive || isRouteActive) ? (isHome && !isMenuOpen && !forceLightMode ? '2px solid white' : '2px solid black') : '2px solid transparent'
                    }}
                  >
                    {it.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* RIGHT: ICONS */}
        <div className={`flex-1 flex justify-content-end align-items-center gap-4 ${isHome && !isMenuOpen && !forceLightMode ? "text-white" : "text-900"}`}>

          {/* 1. Search Icon */}
          <div className="cursor-pointer" onClick={(e) => searchPanel.current?.toggle(e)}>
            <i className="pi pi-search text-xl" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}></i>
          </div>

          {/* 2. Wishlist Icon */}
          <div className="cursor-pointer relative" onClick={(e) => wishlistPanel.current?.toggle(e)}>
            <i className="pi pi-heart text-xl" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}></i>
            {wishlist.length > 0 && <Badge value={wishlist.length} severity="danger" className="absolute -top-2 -right-2" />}
          </div>

          {/* 3. Profile Icon */}
          {user ? (
            <div className="relative group cursor-pointer flex align-items-center gap-2" onClick={() => navigate("/profile")}>
              <i className="pi pi-user text-xl" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}></i>
              <span className="text-xs font-normal hidden md:block uppercase" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}>{user.fullname?.split(' ')[0]}</span>
            </div>
          ) : (
            <Link to="/login" className="no-underline flex align-items-center" style={{ color: 'inherit' }}>
              <i className="pi pi-user text-xl" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}></i>
            </Link>
          )}

          {/* 4. Cart Icon */}
          <div className="cursor-pointer relative p-2" onClick={(e) => cartPanel.current?.toggle(e)}>
            <i className="pi pi-shopping-cart text-xl" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}></i>
            {totalCartCount > 0 && (
              <span className={`absolute border-circle flex align-items-center justify-content-center font-bold transition-all shadow-1 ${isHome && !isMenuOpen && !forceLightMode ? 'bg-white text-900' : 'bg-900 text-white'}`}
                style={{ 
                  top: '0', 
                  right: '0', 
                  width: '14px', 
                  height: '14px', 
                  fontSize: '8px',
                  lineHeight: '1',
                  zIndex: 10,
                  border: isHome && !isMenuOpen && !forceLightMode ? '1px solid white' : '1px solid black'
                }}>
                {totalCartCount}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* SEARCH POPUP (Overlay) */}
      <OverlayPanel
        ref={searchPanel}
        dismissable
        style={{
          width: '100vw',
          left: '0',
          top: '90px',
          border: 'none',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          borderRadius: '0',
          padding: '0'
        }}
        className="uq-search-panel"
      >
        <div className="bg-white w-full py-6 flex justify-content-center">
          <div className="container-xl w-full">
            <div className="flex align-items-center gap-4 px-4">
              <div className="p-input-icon-left flex-1 relative">
                <i className="pi pi-search text-900" style={{ fontSize: '1.4rem', left: '0' }} />
                <InputText
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="BẠN ĐANG TÌM KIẾM ĐIỀU GÌ?"
                  className="w-full border-none border-bottom-1 border-200 border-noround text-2xl uppercase p-3 pl-6 bg-transparent focus:border-900 transition-all duration-300 font-light"
                  style={{ letterSpacing: '2px' }}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-black text-white px-8 py-3 font-bold uppercase border-none cursor-pointer hover:bg-gray-800 transition-all text-sm"
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </button>
                <button
                  className="bg-white text-900 px-4 border-none cursor-pointer hover:text-red-500 transition-all"
                  onClick={() => searchPanel.current?.hide()}
                >
                  <i className="pi pi-times text-xl" />
                </button>
              </div>
            </div>
            <div className="px-4 mt-4 flex gap-4">
              <span className="text-xs text-500 uppercase font-bold">Gợi ý:</span>
              <div className="flex gap-3 text-xs uppercase text-700 font-medium">
                <span className="cursor-pointer hover:underline" onClick={() => handleSearch("Áo thun")}>Áo thun</span>
                <span className="cursor-pointer hover:underline" onClick={() => handleSearch("Jeans")}>Jeans</span>
                <span className="cursor-pointer hover:underline" onClick={() => handleSearch("Heattech")}>Heattech</span>
                <span className="cursor-pointer hover:underline" onClick={() => handleSearch("Airism")}>Airism</span>
              </div>
            </div>
          </div>
        </div>
      </OverlayPanel>

      {/* WISHLIST OVERLAY */}
      <OverlayPanel ref={wishlistPanel} dismissable style={{ width: '320px', borderRadius: '0', border: '1px solid #eee' }}>
        <div className="p-0">
          <div className="p-3 border-bottom-1 border-100 flex justify-content-between align-items-center">
            <h4 className="m-0 font-bold uppercase text-xs tracking-wider">Danh sách yêu thích ({wishlist.length})</h4>
            <Link to="/wishlist" className="text-xs font-bold text-blue-600 no-underline hover:underline" onClick={() => wishlistPanel.current?.hide()}>Xem tất cả</Link>
          </div>
          <div className="max-h-24rem overflow-y-auto">
            {wishlist.length === 0 ? (
              <div className="p-5 text-center flex flex-column align-items-center gap-2">
                <i className="pi pi-heart text-200 text-4xl"></i>
                <p className="text-500 m-0 text-xs uppercase tracking-tight">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              wishlist.map((p) => (
                <div key={p.id} className="flex gap-3 p-3 border-bottom-1 border-50 hover:bg-gray-50 transition-all group relative cursor-pointer" onClick={() => { navigate(`/products/${p.id}`); wishlistPanel.current?.hide(); }}>
                  <div className="w-4rem h-4rem flex-shrink-0 overflow-hidden border-round-sm border-1 border-50">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-column justify-content-between flex-1 min-w-0">
                    <div className="pr-4">
                      <span className="font-bold text-xs uppercase block text-overflow-ellipsis overflow-hidden white-space-nowrap">{p.name}</span>
                      <span className="text-500 text-xs block mt-1">{p.brand}</span>
                    </div>
                    <span className="text-900 font-bold text-sm">{(p.price || 0).toLocaleString("vi-VN")}₫</span>
                  </div>
                  <button
                    className="absolute top-0 right-0 p-3 text-300 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleRemoveFromWishlist(e, p.id)}
                  >
                    <i className="pi pi-trash text-sm"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </OverlayPanel>


      {/* CART OVERLAY */}
      <OverlayPanel ref={cartPanel} dismissable style={{ width: '350px', borderRadius: '0', border: '1px solid #eee' }}>
        <div className="p-0">
          <div className="p-3 border-bottom-1 border-100 flex justify-content-between align-items-center">
            <h4 className="m-0 font-bold uppercase text-xs tracking-wider">Giỏ hàng ({totalCartCount})</h4>
            <Link to="/cart" className="text-xs font-bold text-blue-600 no-underline hover:underline" onClick={() => cartPanel.current?.hide()}>Chi tiết giỏ hàng</Link>
          </div>
          <div className="max-h-24rem overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="p-5 text-center flex flex-column align-items-center gap-2">
                <i className="pi pi-shopping-cart text-200 text-4xl"></i>
                <p className="text-500 m-0 text-xs uppercase tracking-tight">Giỏ hàng trống</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const product = item.product;
                if (!product) return null;
                const productId = product._id || product.id || product;
                const variantName = item.variantName || (product.variants?.find(v => v._id === item.variantId)?.name);

                return (
                  <div key={item._id || productId} className="flex gap-3 p-3 border-bottom-1 border-50 hover:bg-gray-50 transition-all group relative cursor-pointer" onClick={() => { navigate(`/products/${productId}`); cartPanel.current?.hide(); }}>
                    <div className="w-4rem h-5rem flex-shrink-0 overflow-hidden border-round-sm border-1 border-50">
                      <img src={product.images?.[0] || "/img/default.png"} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-column justify-content-between flex-1 min-w-0">
                      <div>
                        <span className="font-bold text-xs uppercase block text-overflow-ellipsis overflow-hidden white-space-nowrap pr-4">{product.name}</span>
                        <div className="flex gap-2 mt-1 text-xs text-500">
                          {variantName && <span>Size: {variantName}</span>}
                          {item.color && <span>Màu: {item.color}</span>}
                        </div>
                      </div>
                      <div className="flex justify-content-between align-items-center mt-2">
                        <span className="text-xs font-medium text-600">Số lượng: {item.quantity}</span>
                        <span className="text-900 font-bold text-sm">{(item.price || product.price || 0).toLocaleString("vi-VN")}₫</span>
                      </div>
                    </div>
                    <button
                      className="absolute top-0 right-0 p-3 text-300 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleRemoveFromCart(e, productId, item.variantId, item.color)}
                    >
                      <i className="pi pi-trash text-sm"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="p-3 bg-gray-50">
              <div className="flex justify-content-between mb-3">
                <span className="text-xs font-bold uppercase text-600">Tổng cộng:</span>
                <span className="text-900 font-bold text-lg">{totalCartPrice.toLocaleString("vi-VN")}₫</span>
              </div>
              <button
                className="w-full bg-black text-white py-3 font-bold uppercase border-none cursor-pointer hover:bg-gray-800 transition-all text-sm tracking-widest"
                onClick={() => { navigate("/checkout"); cartPanel.current?.hide(); }}
              >
                Thanh toán
              </button>
            </div>
          )}
        </div>
      </OverlayPanel>

      {/* CUSTOM MEGA MENU */}
      <div
        ref={menuRef}
        className={`fixed left-0 w-full bg-white shadow-8 overflow-hidden transition-all duration-800 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          top: '90px',
          zIndex: 1000,
          maxHeight: isMenuOpen ? '65vh' : '0',
          transform: isMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="bg-white relative flex flex-column" style={{ maxHeight: '65vh' }}>
          <button
            className="absolute top-0 right-0 p-4 border-none bg-transparent cursor-pointer hover:text-red-600 transition-colors z-10"
            onClick={() => setIsMenuOpen(false)}
          >
            <i className="pi pi-times text-2xl"></i>
          </button>

          <div className="flex flex-column align-items-center justify-content-center p-4 border-bottom-1 border-100 bg-gray-50 flex-shrink-0">
            <div className="p-input-icon-left w-full" style={{ maxWidth: '700px' }}>
              <i className="pi pi-search text-900" style={{ fontSize: '1.2rem', left: '0' }} />
              <InputText
                placeholder={segmentsData[selectedGender]?.searchPlaceholder?.toUpperCase()}
                className="w-full border-none border-bottom-1 border-400 border-noround text-xl bg-transparent p-3 pl-6 uppercase font-light focus:border-900 transition-all font-bold"
                style={{ letterSpacing: '1px' }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/search?gender=${selectedGender}&q=${encodeURIComponent(e.target.value)}`);
                    setIsMenuOpen(false);
                  }
                }}
              />
            </div>
            <div className="flex gap-3 mt-3">
              <span className="text-xs text-500 uppercase">Tìm kiếm phổ biến:</span>
              <span className="text-xs font-bold cursor-pointer hover:text-red-600" onClick={() => handleSearch("Áo Polo")}>Áo Polo</span>
              <span className="text-xs font-bold cursor-pointer hover:text-red-600" onClick={() => handleSearch("Quần Smart Pants")}>Quần Smart Pants</span>
              <span className="text-xs font-bold cursor-pointer hover:text-red-600" onClick={() => handleSearch("Đồ lót Airism")}>Đồ lót Airism</span>
            </div>
          </div>

          <div className="p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <div className="grid m-0">
              {segmentsData[selectedGender]?.categories.map((cat, idx) => (
                <div key={idx} className="col-3 p-3 hover:bg-gray-100 cursor-pointer transition-colors border-round" onClick={() => {
                  navigate(`/search?gender=${selectedGender}&sub=${encodeURIComponent(cat.title)}`);
                  setIsMenuOpen(false);
                }}>
                  <div className="flex align-items-center gap-3">
                    <div className="w-5rem h-5rem overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={cat.img}
                        alt={cat.title}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = "/logo.png"}
                      />
                    </div>
                    <div className="flex flex-column">
                      <span className="font-bold text-sm text-900 uppercase">{cat.title}</span>
                      <span className="text-xs text-500">{cat.desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background Dimming Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black-alpha-40"
          style={{ top: '90px', zIndex: 900 }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}

export default Header;
