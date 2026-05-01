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
  const profilePanel = useRef(null);
  const [selectedGender, setSelectedGender] = useState("woman");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Sync selectedGender with current path
  useEffect(() => {
    const genderParam = urlParams.get("gender");
    if (genderParam && ["woman", "man", "kid", "baby"].includes(genderParam)) {
      setSelectedGender(genderParam);
    } else {
      const pathKey = pathname === "/" ? "woman" : pathname.replace("/", "");
      if (["woman", "man", "kid", "baby"].includes(pathKey)) {
        setSelectedGender(pathKey);
      }
    }
  }, [pathname, urlParams]);


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
    } else {
      const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
      setWishlist(stored);
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
    if (!token) {
      let stored = JSON.parse(localStorage.getItem("wishlist")) || [];
      stored = stored.filter(p => p.id !== productId);
      localStorage.setItem("wishlist", JSON.stringify(stored));
      window.dispatchEvent(new CustomEvent("wishlistUpdated"));
      return;
    }

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setWishlist([]);
    setCartItems([]);
    navigate("/login");
    profilePanel.current?.hide();
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
        { title: "Áo thun", desc: "Cotton mềm mại", img: "https://im.uniqlo.com/global-cms/spa/resb3e9c2c759d2ba295a13e15c92218be2fr.png" },
        { title: "Áo sơ mi", desc: "Thanh lịch", img: "https://im.uniqlo.com/global-cms/spa/res8360b2663ae753b404d8fae0d9a98a04fr.png" },
        { title: "Áo khoác", desc: "Ấm áp mùa đông", img: "https://im.uniqlo.com/global-cms/spa/res25ac7a37207d4f37b2fd57437b168f91fr.png" },
        { title: "Quần dài", desc: "Dáng chuẩn", img: "https://im.uniqlo.com/global-cms/spa/resbd301f1838d82b5f710f5a14106e620afr.png" },
        { title: "Váy", desc: "Nữ tính", img: "https://im.uniqlo.com/global-cms/spa/res5932d64c74a755e3e0f815d37a0a0232fr.png" },
        { title: "Đồ lót", desc: "Thoải mái", img: "https://im.uniqlo.com/global-cms/spa/resaea75263a8cee7f4b463a5424033e26ffr.png" },
        { title: "Túi xách", desc: "Tiện dụng", img: "https://im.uniqlo.com/global-cms/spa/rese1ac94da4e6f6fa90655960efd53637efr.png" },
        { title: "Đồ tập", desc: "Năng động", img: "https://im.uniqlo.com/global-cms/spa/res0d66981beda5766bc32244efe7658982fr.png" },
        { title: "Heattech", desc: "Giữ nhiệt", img: "https://im.uniqlo.com/global-cms/spa/res2c68013673020cabcdef5c5855c8ae2dfr.png" },
        { title: "Trẻ trung", desc: "Dạo phố", img: "https://im.uniqlo.com/global-cms/spa/resd9c3860c7bb77be9f478ced420903b8ffr.png" },
        { title: "Mới về", desc: "Xu hướng", img: "https://im.uniqlo.com/global-cms/spa/res8bf955a20222e15834552b987e2b4b50fr.png" },
      ]
    },
    man: {
      label: "NAM",
      searchPlaceholder: "Tìm kiếm sản phẩm nam",
      categories: [
        { title: "Áo thun", desc: "Cotton mềm mại", img: "https://im.uniqlo.com/global-cms/spa/res7405a4506da77a4108a0697bd652634efr.png" },
        { title: "Áo sơ mi", desc: "Thanh lịch", img: "https://im.uniqlo.com/global-cms/spa/res8360b2663ae753b404d8fae0d9a98a04fr.png" },
        { title: "Áo khoác", desc: "Ấm áp mùa đông", img: "https://im.uniqlo.com/global-cms/spa/res25ac7a37207d4f37b2fd57437b168f91fr.png" },
        { title: "Quần jean", desc: "Phóng khoáng", img: "https://im.uniqlo.com/global-cms/spa/res2c7bc83d952192fa554de295df2f433afr.png" },
        { title: "Đồ lót", desc: "Khô thoáng", img: "https://im.uniqlo.com/global-cms/spa/res2d9dd548f5817a9ab53ca60577ccfbb2fr.png" },
        { title: "Túi", desc: "Tiện dụng", img: "https://im.uniqlo.com/global-cms/spa/res13113a61a2e4a0a54f8972e35d3a1783fr.png" },
        { title: "Đồ tập", desc: "Dry-Ex", img: "https://im.uniqlo.com/global-cms/spa/res0d66981beda5766bc32244efe7658982fr.png" },
        { title: "Airism", desc: "Tươi mát", img: "https://im.uniqlo.com/global-cms/spa/resc343dd0bad46d2dcb41b4488c0d48885fr.png" },
        { title: "Sơ mi tay ngắn", desc: "Mát mẻ", img: "https://im.uniqlo.com/global-cms/spa/rese9ad37f6048cd6bcc23daf3249cf04c7fr.png" },
      ]
    },
    "kid": {
      label: "TRẺ EM",
      searchPlaceholder: "Tìm kiếm sản phẩm trẻ em",
      categories: [
        { title: "Áo thun UT", desc: "Họa tiết năng động", img: "https://im.uniqlo.com/global-cms/spa/res3d43a7fd61f7ae3615eb67d85467cf0efr.png" },
        { title: "Áo khoác", desc: "Ấm áp đến trường", img: "https://im.uniqlo.com/global-cms/spa/resdd2d5c4ee785273e6c8f6096d5cee954fr.png" },
        { title: "Quần dài", desc: "Co giãn thoải mái", img: "https://im.uniqlo.com/global-cms/spa/rescc78e33b84a6faa69867797afc7c83befr.png" },
        { title: "Quần short", desc: "Cotton thoải mái", img: "https://im.uniqlo.com/global-cms/spa/res694288ec6d2618b771c4246fc31b4043fr.png" },
        { title: "Áo sơ mi", desc: "Thanh lịch cho bé", img: "https://im.uniqlo.com/global-cms/spa/rescc78e33b84a6faa69867797afc7c83befr.png" },
        { title: "Váy & Đầm", desc: "Dễ thương", img: "https://im.uniqlo.com/global-cms/spa/res7fcae243567753e74941442805ac9596fr.png" },
        { title: "Đồ lót", desc: "Thấm hút tốt", img: "https://im.uniqlo.com/global-cms/spa/res50b7df682fc95d450c1cf55d1cccef30fr.png" },
        { title: "Phụ kiện", desc: "Mũ & Tất", img: "https://im.uniqlo.com/global-cms/spa/resae64e7024dd87fc0fa92a691afa1683efr.png" },
        { title: "Airism", desc: "Khô thoáng ngày hè", img: "https://im.uniqlo.com/global-cms/spa/resc343dd0bad46d2dcb41b4488c0d48885fr.png" }
      ]
    },
    "baby": {
      label: "EM BÉ",
      searchPlaceholder: "Tìm kiếm sản phẩm em bé",
      categories: [
        { title: "Đồ sơ sinh", desc: "Cotton 100%", img: "https://im.uniqlo.com/global-cms/spa/resbc2e67d2abd1c042d51454226fd25d41fr.png" },
        { title: "Bodysuit", desc: "Tiện dụng cho bé", img: "https://im.uniqlo.com/global-cms/spa/res83985380220d481a951983f60ff48d99fr.png" },
        { title: "Mới về", desc: "Xu hướng", img: "https://im.uniqlo.com/global-cms/spa/res8bf955a20222e15834552b987e2b4b50fr.png" },
        { title: "Khuyến mãi", desc: "Giá tốt mỗi tuần", img: "https://im.uniqlo.com/global-cms/spa/res13113a61a2e4a0a54f8972e35d3a1783fr.png" },
      ]
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
          <Link to="/" className="no-underline" onClick={() => setIsMenuOpen(false)}>
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
                    className={`bg-transparent border-none no-underline font-light text-lg uppercase transition-all py-2 px-1 relative cursor-pointer ${isHome && !isMenuOpen && !forceLightMode ? "text-white" : "text-black"
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
          <div className="cursor-pointer relative p-2" onClick={(e) => {
            setIsMenuOpen(false);
            wishlistPanel.current?.toggle(e);
          }}>
            <i className="pi pi-heart text-xl" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}></i>
            {wishlist.length > 0 && (
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
                {wishlist.length}
              </span>
            )}
          </div>

          {/* 3. Profile Icon */}
          {user ? (
            <div className="relative group cursor-pointer flex align-items-center gap-2" onClick={(e) => {
              setIsMenuOpen(false);
              navigate("/profile");
            }}>
              <div className="flex align-items-center justify-content-center overflow-hidden border-1 border-200" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <i className="pi pi-user text-sm" style={{ color: isHome && !isMenuOpen && !forceLightMode ? 'white' : 'black' }}></i>
                )}
              </div>
              <span className="text-[10px] font-black hidden md:block uppercase tracking-wider" style={{ textShadow: isHome && !isMenuOpen && !forceLightMode ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}>
                {user.fullname?.split(' ')[0]}
              </span>
            </div>
          ) : (
            <Link to="/login" className="no-underline flex align-items-center" style={{ color: 'inherit' }} onClick={() => setIsMenuOpen(false)}>
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
        <div className="bg-white w-full flex justify-content-center border-bottom-1 border-100" style={{ padding: '40px 0' }}>
          <div className="container-xl w-full px-6">
            <div className="flex align-items-center" style={{ gap: '40px' }}>
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
                  className="bg-black text-white py-4 font-black uppercase border-none cursor-pointer hover:bg-gray-800 transition-all text-xs tracking-[0.2em]"
                  style={{ padding: '0 40px' }}
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </button>
                <button
                  className="bg-white text-black w-3rem h-3rem flex align-items-center justify-content-center border-1 border-200 cursor-pointer hover:border-black transition-all"
                  onClick={() => searchPanel.current?.hide()}
                >
                  <i className="pi pi-times text-xl" />
                </button>
              </div>
            </div>
            <div className="mt-8 flex align-items-center" style={{ gap: '24px' }}>
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
                <p className="text-gray-400 m-0 text-xs font-bold uppercase tracking-widest leading-relaxed">Bạn chưa có sản phẩm nào<br />trong danh sách yêu thích</p>
              </div>
            ) : (
              wishlist.map((p) => (
                <div key={p.id} className="flex gap-4 p-4 border-bottom-1 border-50 hover:bg-gray-50 transition-all group relative cursor-pointer" onClick={() => { navigate(`/product/${p.id}`); wishlistPanel.current?.hide(); }}>
                  <div className="flex-shrink-0 overflow-hidden bg-gray-100 border-round" style={{ width: '80px', height: '96px' }}>
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
                    <div className="flex-shrink-0 overflow-hidden bg-gray-100 border-round" style={{ width: '80px', height: '112px' }}>
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
                className="w-full py-4 font-black uppercase border-none cursor-pointer transition-all text-xs tracking-[0.25em] shadow-lg shadow-black/10"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
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

          <div className="flex flex-column align-items-center justify-content-center border-bottom-1 border-100 flex-shrink-0" style={{ padding: '40px 0 24px 0' }}>
            <div className="p-input-icon-left w-full px-6" style={{ maxWidth: '800px' }}>
              <i className="pi pi-search text-gray-300" style={{ fontSize: '1.4rem', left: '2rem' }} />
              <InputText
                placeholder={(segmentsData[selectedGender]?.searchPlaceholder || "Tìm kiếm sản phẩm").toUpperCase()}
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

          <div className="py-6 px-8 overflow-y-auto" style={{ maxHeight: '65vh' }}>
            <div className="grid m-0">
              {segmentsData[selectedGender]?.categories.map((cat, idx) => (
                <div key={idx} className="col-4 md:col-3 lg:col-2 p-4 hover:surface-50 cursor-pointer transition-colors border-round group flex flex-column align-items-center text-center" onClick={() => {
                  navigate(`/search?gender=${selectedGender}&sub=${encodeURIComponent(cat.title)}`);
                  setIsMenuOpen(false);
                }}>
                  <div className="flex align-items-center justify-content-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500" style={{ width: '88px', height: '88px' }}>
                    <img
                      src={cat.img}
                      alt={cat.title}
                      className="w-full h-full object-contain mix-blend-multiply"
                      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.04))' }}
                      onError={(e) => e.target.src = "/logo.png"}
                    />
                  </div>
                  <div className="flex flex-column gap-1 mt-3">
                    <span className="font-black text-[11px] text-900 uppercase tracking-widest group-hover:text-red-600 transition-colors">{cat.title}</span>
                    <span className="text-[9px] text-500 font-bold uppercase tracking-widest hidden md:block">{cat.desc}</span>
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
