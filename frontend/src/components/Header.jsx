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
    
    // Close menu on navigation
    setIsMenuOpen(false);
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pathname]);

  // ALWAYS RENDER FULL HEADER
  return (
    <header
      className={`${isHome ? "absolute" : "sticky"} top-0 left-0 w-full`}
      style={{
        borderBottom: 'none',
        backgroundColor: isHome && !isMenuOpen && !forceLightMode ? 'transparent' : 'white',
        zIndex: 500,
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
                      const targetPath = it.gender === "woman" ? "/" : `/${it.gender}`;
                      if (selectedGender === it.gender && isMenuOpen) {
                        setIsMenuOpen(false);
                      } else {
                        navigate(targetPath);
                        setSelectedGender(it.gender);
                        setIsMenuOpen(true);
                      }
                    }}
                    className={`bg-transparent border-none no-underline font-light text-lg uppercase transition-all py-2 px-1 relative cursor-pointer ${
                      isHome && !isMenuOpen && !forceLightMode ? "text-white" : "text-black"
                    } ${isActive || isRouteActive ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
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
        <div className={`flex-1 flex justify-content-end align-items-center gap-4 ${isHome && !isMenuOpen && !forceLightMode ? "text-white" : "text-black"}`}>

          {/* 1. Search Icon */}
          <div className="cursor-pointer" onClick={(e) => {
            setIsMenuOpen(false);
            searchPanel.current?.toggle(e);
          }}>
            <i className="pi pi-search text-xl" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}></i>
          </div>

          {/* 2. Wishlist Icon */}
          <div className="cursor-pointer relative" onClick={(e) => {
            setIsMenuOpen(false);
            wishlistPanel.current?.toggle(e);
          }}>
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
          <div className="cursor-pointer relative p-2" onClick={(e) => {
            setIsMenuOpen(false);
            cartPanel.current?.toggle(e);
          }}>
            <i className="pi pi-shopping-cart text-xl" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}></i>
            {totalCartCount > 0 && (
              <span className="absolute border-circle flex align-items-center justify-content-center font-black transition-all"
                style={{ 
                  top: '0', 
                  right: '0', 
                  width: '16px', 
                  height: '16px', 
                  fontSize: '9px',
                  lineHeight: '1',
                  zIndex: 50,
                  backgroundColor: isHome && !isMenuOpen && !forceLightMode ? 'white' : 'black',
                  color: isHome && !isMenuOpen && !forceLightMode ? 'black' : 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: 'none'
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
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          borderRadius: '0',
          padding: '0',
          zIndex: 2100
        }}
        className="uq-search-panel"
      >
        <div className="bg-white w-full py-10 flex justify-content-center border-bottom-1 border-100">
          <div className="container-xl w-full px-6">
            <div className="flex align-items-center gap-6">
              <div className="flex-1 relative">
                <i className="pi pi-search text-gray-300" style={{ fontSize: '1.8rem', position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)' }} />
                <InputText
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="BẠN ĐANG TÌM KIẾM ĐIỀU GÌ?"
                  className="w-full border-none border-bottom-2 border-100 border-noround text-3xl uppercase py-4 pl-10 bg-transparent focus:border-black transition-all duration-300 font-black outline-none"
                  style={{ letterSpacing: '0.05em' }}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  className="bg-black text-white px-10 py-4 font-black uppercase border-none cursor-pointer hover:bg-gray-800 transition-all text-xs tracking-[0.2em]"
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </button>
                <button
                  className="bg-white text-black w-12 h-12 flex align-items-center justify-content-center border-1 border-200 cursor-pointer hover:border-black transition-all"
                  onClick={() => searchPanel.current?.hide()}
                >
                  <i className="pi pi-times text-xl" />
                </button>
              </div>
            </div>
            <div className="mt-8 flex align-items-center gap-6">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">Tìm kiếm phổ biến:</span>
              <div className="flex gap-5 text-[11px] uppercase text-gray-800 font-bold tracking-wider">
                {["Áo thun", "Jeans", "Heattech", "Airism", "UV Cut"].map(term => (
                  <span key={term} className="cursor-pointer hover:text-red-600 transition-colors border-bottom-1 border-transparent hover:border-red-600 pb-1" onClick={() => handleSearch(term)}>{term}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </OverlayPanel>

      {/* WISHLIST OVERLAY */}
      <OverlayPanel 
        ref={wishlistPanel} 
        dismissable 
        style={{ 
          width: '380px', 
          borderRadius: '8px', 
          border: '1px solid #eee', 
          boxShadow: '0 15px 50px rgba(0,0,0,0.12)',
          padding: '0',
          overflow: 'hidden',
          zIndex: 2000
        }}
      >
        <div className="flex flex-column">
          <div className="p-4 border-bottom-1 border-100 flex justify-content-between align-items-center bg-gray-50/50">
            <h4 className="m-0 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500">Yêu thích ({wishlist.length})</h4>
            <Link to="/wishlist" className="text-[10px] font-black text-black uppercase no-underline hover:underline tracking-widest" onClick={() => wishlistPanel.current?.hide()}>Xem tất cả</Link>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {wishlist.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-column align-items-center gap-3">
                <i className="pi pi-heart text-gray-100 text-6xl"></i>
                <p className="text-gray-400 m-0 text-xs font-bold uppercase tracking-widest leading-relaxed">Bạn chưa có sản phẩm nào<br/>trong danh sách yêu thích</p>
              </div>
            ) : (
              wishlist.map((p) => (
                <div key={p.id} className="flex gap-4 p-4 border-bottom-1 border-50 hover:bg-gray-50 transition-all group relative cursor-pointer" onClick={() => { navigate(`/product/${p.id}`); wishlistPanel.current?.hide(); }}>
                  <div className="w-20 h-24 flex-shrink-0 overflow-hidden bg-gray-100 border-round">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-column justify-content-between flex-1 min-w-0 py-1">
                    <div>
                      <span className="font-black text-xs uppercase block truncate pr-6 tracking-tight text-gray-800">{p.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 block mt-1 uppercase tracking-widest">{p.brand}</span>
                    </div>
                    <span className="text-black font-black text-sm">{(p.price || 0).toLocaleString("vi-VN")}₫</span>
                  </div>
                  <button
                    className="absolute top-2 right-2 p-2 text-gray-200 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100"
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
      <OverlayPanel 
        ref={cartPanel} 
        dismissable 
        style={{ 
          width: '400px', 
          borderRadius: '8px', 
          border: '1px solid #eee', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          padding: '0',
          overflow: 'hidden',
          zIndex: 2000
        }}
      >
        <div className="flex flex-column">
          <div className="p-4 border-bottom-1 border-100 flex justify-content-between align-items-center bg-gray-50/50">
            <h4 className="m-0 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500">Giỏ hàng ({totalCartCount})</h4>
            <Link to="/cart" className="text-[10px] font-black text-black uppercase no-underline hover:underline tracking-widest" onClick={() => cartPanel.current?.hide()}>Xem giỏ hàng</Link>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-column align-items-center gap-3">
                <i className="pi pi-shopping-cart text-gray-100 text-6xl"></i>
                <p className="text-gray-400 m-0 text-xs font-bold uppercase tracking-widest">Giỏ hàng của bạn đang trống</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const product = item.product;
                if (!product) return null;
                const productId = product._id || product.id || product;
                const variantName = item.variantName || (product.variants?.find(v => v._id === item.variantId)?.name);

                return (
                  <div key={item._id || `${productId}-${item.variantId}-${item.color}`} className="flex gap-4 p-4 border-bottom-1 border-50 hover:bg-gray-50 transition-all group relative cursor-pointer" onClick={() => { navigate(`/product/${productId}`); cartPanel.current?.hide(); }}>
                    <div className="w-20 h-28 flex-shrink-0 overflow-hidden bg-gray-100 border-round">
                      <img src={product.images?.[0] || "/img/default.png"} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-column justify-content-between flex-1 min-w-0 py-1">
                      <div>
                        <span className="font-black text-xs uppercase block truncate pr-6 tracking-tight text-gray-800">{product.name}</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          {variantName && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Size: {variantName}</span>}
                          {item.color && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Color: {item.color}</span>}
                        </div>
                      </div>
                      <div className="flex justify-content-between align-items-end">
                        <div className="flex align-items-center gap-2 bg-gray-100 px-2 py-1 border-round text-[10px] font-black">
                          QTY: {item.quantity}
                        </div>
                        <span className="text-black font-black text-sm">{(item.price || product.price || 0).toLocaleString("vi-VN")}₫</span>
                      </div>
                    </div>
                    <button
                      className="absolute top-2 right-2 p-2 text-gray-200 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100"
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
            <div className="p-5 bg-white border-top-1 border-100">
              <div className="flex justify-content-between align-items-center mb-5">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Tổng cộng:</span>
                <span className="text-black font-black text-2xl tracking-tighter">{totalCartPrice.toLocaleString("vi-VN")}₫</span>
              </div>
              <button
                className="w-full bg-black text-white py-4 font-black uppercase border-none cursor-pointer hover:bg-gray-800 transition-all text-xs tracking-[0.25em] shadow-lg shadow-black/10"
                onClick={() => { navigate("/checkout"); cartPanel.current?.hide(); }}
              >
                Thanh toán ngay
              </button>
            </div>
          )}
        </div>
      </OverlayPanel>

      {/* CUSTOM MEGA MENU */}
      <div
        ref={menuRef}
        className={`fixed left-0 w-full bg-white shadow-8 overflow-hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          top: '90px',
          zIndex: 1000,
          maxHeight: isMenuOpen ? '75vh' : '0',
          transform: isMenuOpen ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="bg-white relative flex flex-column h-full" style={{ maxHeight: '75vh' }}>
          <button
            className="absolute top-2 right-4 p-4 border-none bg-transparent cursor-pointer hover:text-red-600 transition-colors z-20"
            onClick={() => setIsMenuOpen(false)}
          >
            <i className="pi pi-times text-2xl"></i>
          </button>

          <div className="flex flex-column align-items-center justify-content-center pt-10 pb-6 border-bottom-1 border-100 flex-shrink-0">
            <div className="p-input-icon-left w-full px-6" style={{ maxWidth: '800px' }}>
              <i className="pi pi-search text-gray-300" style={{ fontSize: '1.4rem', left: '2rem' }} />
              <InputText
                placeholder={segmentsData[selectedGender]?.searchPlaceholder?.toUpperCase()}
                className="w-full border-none border-bottom-2 border-100 border-noround text-2xl bg-transparent py-4 pl-12 uppercase font-black focus:border-black transition-all outline-none"
                style={{ letterSpacing: '0.02em' }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/search?gender=${selectedGender}&q=${encodeURIComponent(e.target.value)}`);
                    setIsMenuOpen(false);
                  }
                }}
              />
            </div>
            <div className="flex gap-4 mt-6">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">Xu hướng:</span>
              {["Áo Polo", "Smart Pants", "Airism Inner", "LifeWear", "Collab"].map(tag => (
                <span key={tag} className="text-[10px] font-black cursor-pointer hover:text-red-600 transition-colors uppercase tracking-widest text-gray-600" onClick={() => handleSearch(tag)}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="p-8 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <div className="grid m-0">
              {segmentsData[selectedGender]?.categories.map((cat, idx) => (
                <div key={idx} className="col-3 p-4 hover:bg-gray-50 cursor-pointer transition-all border-round group" onClick={() => {
                  navigate(`/search?gender=${selectedGender}&sub=${encodeURIComponent(cat.title)}`);
                  setIsMenuOpen(false);
                }}>
                  <div className="flex align-items-center gap-5">
                    <div className="w-24 h-24 overflow-hidden bg-gray-100 flex-shrink-0 border-round transition-transform group-hover:scale-105 duration-500">
                      <img
                        src={cat.img}
                        alt={cat.title}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = "/logo.png"}
                      />
                    </div>
                    <div className="flex flex-column gap-1">
                      <span className="font-black text-xs text-black uppercase tracking-tight group-hover:text-red-600 transition-colors">{cat.title}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{cat.desc}</span>
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
