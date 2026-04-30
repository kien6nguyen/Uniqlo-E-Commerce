import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Paginator } from "primereact/paginator";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:3000" : "")}/api/products`;

const GENDER_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Nữ", value: "woman" },
  { label: "Nam", value: "man" },
  { label: "Trẻ em", value: "kid" },
  { label: "Em bé", value: "baby" },
];

const GENDER_LABELS = { woman: "Nữ", man: "Nam", kid: "Trẻ em", baby: "Em bé" };

const CATEGORY_LABELS = {
  tops: "Áo", bottoms: "Quần", outerwear: "Áo khoác", innerwear: "Đồ lót",
  heattech: "Heattech", activewear: "Đồ thể thao", loungewear: "Đồ mặc nhà",
  socks: "Tất", accessories: "Phụ kiện",
};

const SORT_OPTIONS = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá thấp → cao", value: "price_asc" },
  { label: "Giá cao → thấp", value: "price_desc" },
  { label: "Tên A → Z", value: "name_asc" },
  { label: "Đánh giá cao", value: "rating_desc" },
];

const ProductListPage = () => {
  const { gender: routeGender } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useRef(null);

  const [products, setProducts] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Filter attributes
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableProductLines, setAvailableProductLines] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [maxPriceLimit, setMaxPriceLimit] = useState(5000000);

  // Active filters
  const [first, setFirst] = useState(0);
  const [rows] = useState(12);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedProductLines, setSelectedProductLines] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const keyword = urlParams.get("q");
  const subCategory = urlParams.get("sub");

  // Sync state with URL params
  useEffect(() => {
    const genderFromQuery = urlParams.get("gender");
    const genderFromRoute = routeGender && Object.keys(GENDER_LABELS).includes(routeGender) ? routeGender : null;
    
    // Prioritize query param, then route param, then default "all"
    const finalGender = genderFromQuery || genderFromRoute || "all";
    setSelectedGender(finalGender);

    // If sub param exists, use it as a category
    if (subCategory) {
      setSelectedCategories([subCategory]);
    } else if (routeGender && !Object.keys(GENDER_LABELS).includes(routeGender)) {
      setSelectedCategories([routeGender]);
    } else {
      setSelectedCategories([]);
    }

    setFirst(0);
    setPage(1);
  }, [routeGender, location.search]); // location.search includes sub and gender query params

  // Load filters metadata
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const genderParam = selectedGender !== "all" ? `?gender=${selectedGender}` : "";
        const res = await fetch(`${API_BASE_URL}/filters${genderParam}`);
        const data = await res.json();
        if (data.success) {
          setAvailableBrands(data.brands || []);
          setAvailableTags(data.tags || []);
          setAvailableProductLines(data.productLines || []);
          setAvailableCategories(data.categories || []);
          const max = data.priceRange?.max || 5000000;
          setMaxPriceLimit(max);
          setPriceRange([0, max]);
        }
      } catch (err) {
        console.error("Error loading filters:", err);
      }
    };
    fetchFilters();
  }, [selectedGender]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [page, sortOrder, priceRange, selectedGender, selectedProductLines, selectedCategories, selectedBrands, selectedTags, minRating, location.search, routeGender]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const api = new URLSearchParams();
      api.append("page", page);
      api.append("limit", rows);
      api.append("sort", sortOrder);

      if (selectedGender && selectedGender !== "all") api.append("gender", selectedGender);
      if (selectedProductLines.length > 0) api.append("productLine", selectedProductLines.join(","));
      
      // Use selected categories or subCategory from URL
      const categoryToFilter = selectedCategories.length > 0 ? selectedCategories[0] : (subCategory || null);
      if (categoryToFilter) {
        switch (categoryToFilter) {
          case "new-arrival": api.append("isNewProduct", "true"); break;
          case "best-seller": api.set("sort", "rating_desc"); break;
          case "hot-deal": api.append("isHotDeal", "true"); break;
          default: 
            if (CATEGORY_LABELS[categoryToFilter]) {
              api.append("category", categoryToFilter);
            } else {
              api.append("search", categoryToFilter);
            }
        }
      }

      if (keyword) api.append("search", keyword);
      if (selectedBrands.length > 0) api.append("brand", selectedBrands.join(","));
      if (selectedTags.length > 0) api.append("tags", selectedTags.join(","));
      api.append("minPrice", priceRange[0]);
      if (priceRange[1] < maxPriceLimit) api.append("maxPrice", priceRange[1]);
      if (minRating > 0) api.append("minRating", minRating);

      const res = await fetch(`${API_BASE_URL}?${api.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        setTotalRecords(data.total);
      } else {
        setProducts([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    setFirst(0); setPage(1);
  };

  const resetAllFilters = () => {
    setSelectedGender("all");
    setSelectedProductLines([]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedTags([]);
    setPriceRange([0, maxPriceLimit]);
    setMinRating(0);
    setSortOrder("newest");
    setFirst(0); setPage(1);
    navigate("/search");
  };

  const activeFilterCount = [
    selectedGender !== "all" ? 1 : 0,
    selectedProductLines.length,
    selectedCategories.length,
    selectedBrands.length,
    selectedTags.length,
    minRating > 0 ? 1 : 0,
    (priceRange[0] > 0 || priceRange[1] < maxPriceLimit) ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const getImageUrl = (img) => {
    if (!img) return "/img/default.png";
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL || ""}/${img.replace(/\\/g, "/")}`;
  };

  const getPageTitle = () => {
    if (keyword) return `Kết quả cho: "${keyword}"`;
    if (selectedCategories.length > 0) return CATEGORY_LABELS[selectedCategories[0]] || selectedCategories[0];
    if (selectedGender && GENDER_LABELS[selectedGender]) return `Thời trang ${GENDER_LABELS[selectedGender]}`;
    return "Tất cả sản phẩm";
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <Toast ref={toast} />

      {/* Header Info */}
      <div className="bg-white border-bottom-1 border-gray-100 pb-4" style={{ paddingTop: '120px' }}>
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex align-items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">
            <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate("/")}>Trang chủ</span>
            <span>/</span>
            <span className="text-black uppercase">{routeGender ? "Danh mục" : "Tìm kiếm"}</span>
          </div>
          <h1 className="text-3xl font-black text-[#111] m-0 uppercase tracking-tighter">
            {getPageTitle()}
          </h1>
          <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">
            Tìm thấy {totalRecords} sản phẩm
          </p>
        </div>
      </div>

      {/* Horizontal Filter Bar */}
      <div 
        ref={dropdownRef} 
        className="sticky-filter-bar"
        style={{ 
          position: 'sticky', 
          top: '90px', 
          zIndex: 999, 
          backgroundColor: '#fff', 
          borderBottom: '1px solid #eee', 
          overflow: 'visible',
          padding: '12px 0'
        }}
      >
        <div className="max-w-screen-xl mx-auto px-4" style={{ overflow: 'visible' }}>
          <div className="flex align-items-center justify-content-between" style={{ overflow: 'visible' }}>
            
            <div className="flex align-items-center gap-4">
              {/* Gender Filter */}
              <div className="filter-group">
                <button 
                  onClick={() => setActiveDropdown(activeDropdown === 'gender' ? null : 'gender')}
                  className={`filter-trigger ${selectedGender !== 'all' ? 'active' : ''}`}
                >
                  <span className="label">Giới tính</span>
                  {selectedGender !== 'all' && <span className="badge">{GENDER_LABELS[selectedGender]?.charAt(0)}</span>}
                  <i className={`pi pi-angle-${activeDropdown === 'gender' ? 'up' : 'down'}`}></i>
                </button>
                {activeDropdown === 'gender' && (
                  <div className="dropdown-menu">
                    {GENDER_OPTIONS.map(g => (
                      <div 
                        key={g.value}
                        onClick={() => { setSelectedGender(g.value); setActiveDropdown(null); setPage(1); }}
                        className={`dropdown-item ${selectedGender === g.value ? 'selected' : ''}`}
                      >
                        {g.label}
                        {selectedGender === g.value && <i className="pi pi-check"></i>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Line Filter */}
              {availableProductLines.length > 0 && (
                <div className="filter-group">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'line' ? null : 'line')}
                    className={`filter-trigger ${selectedProductLines.length > 0 ? 'active' : ''}`}
                  >
                    <span className="label">Dòng sản phẩm</span>
                    {selectedProductLines.length > 0 && <span className="badge">{selectedProductLines.length}</span>}
                    <i className={`pi pi-angle-${activeDropdown === 'line' ? 'up' : 'down'}`}></i>
                  </button>
                  {activeDropdown === 'line' && (
                    <div className="dropdown-menu wide">
                      <div className="dropdown-scroll">
                        {availableProductLines.map(line => (
                          <div 
                            key={line}
                            onClick={() => toggleFilter(selectedProductLines, setSelectedProductLines, line)}
                            className={`dropdown-item checkbox-item ${selectedProductLines.includes(line) ? 'selected' : ''}`}
                          >
                            <div className={`checkbox ${selectedProductLines.includes(line) ? 'checked' : ''}`}>
                              {selectedProductLines.includes(line) && <i className="pi pi-check"></i>}
                            </div>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Price Filter */}
              <div className="filter-group">
                <button 
                  onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                  className={`filter-trigger ${priceRange[1] < maxPriceLimit ? 'active' : ''}`}
                >
                  <span className="label">Khoảng giá</span>
                  {priceRange[1] < maxPriceLimit && <span className="badge">1</span>}
                  <i className={`pi pi-angle-${activeDropdown === 'price' ? 'up' : 'down'}`}></i>
                </button>
                {activeDropdown === 'price' && (
                  <div className="dropdown-menu price-menu">
                    <p className="menu-title">Chọn giá tối đa</p>
                    <input 
                      type="range" 
                      min="0" 
                      max={maxPriceLimit} 
                      step="100000" 
                      value={priceRange[1]} 
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="price-slider"
                    />
                    <div className="price-display">
                       <span className="text-gray-500">Dưới:</span>
                       <span className="price-value">{priceRange[1].toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating Filter */}
              <div className="filter-group">
                <button 
                  onClick={() => setActiveDropdown(activeDropdown === 'rating' ? null : 'rating')}
                  className={`filter-trigger ${minRating > 0 ? 'active' : ''}`}
                >
                  <span className="label">Đánh giá</span>
                  {minRating > 0 && <span className="badge">{minRating}</span>}
                  <i className={`pi pi-angle-${activeDropdown === 'rating' ? 'up' : 'down'}`}></i>
                </button>
                {activeDropdown === 'rating' && (
                  <div className="dropdown-menu">
                    {[0, 5, 4, 3, 2, 1].map(star => (
                      <div 
                        key={star}
                        onClick={() => { setMinRating(star); setActiveDropdown(null); setPage(1); }}
                        className={`dropdown-item ${minRating === star ? 'selected' : ''}`}
                      >
                        {star === 0 ? (
                          <span className="text-sm">Tất cả đánh giá</span>
                        ) : (
                          <div className="flex align-items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <i key={i} className={`pi pi-star-fill star-icon ${i <= star ? 'active' : ''}`}></i>
                            ))}
                            <span className="star-count">({star}+ Sao)</span>
                          </div>
                        )}
                        {minRating === star && <i className="pi pi-check"></i>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activeFilterCount > 0 && (
                <button onClick={resetAllFilters} className="clear-filters-btn">
                  Xóa lọc ({activeFilterCount})
                </button>
              )}
            </div>

            <div className="flex align-items-center">
              <div className="filter-group">
                <button 
                  onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                  className="filter-trigger sort-trigger"
                >
                  <span className="sort-label">Sắp xếp:</span>
                  <span className="current-sort">{SORT_OPTIONS.find(o => o.value === sortOrder)?.label}</span>
                  <i className={`pi pi-angle-${activeDropdown === 'sort' ? 'up' : 'down'}`}></i>
                </button>
                {activeDropdown === 'sort' && (
                  <div className="dropdown-menu right-aligned">
                    {SORT_OPTIONS.map(opt => (
                      <div 
                        key={opt.value}
                        onClick={() => { setSortOrder(opt.value); setActiveDropdown(null); setPage(1); }}
                        className={`dropdown-item ${sortOrder === opt.value ? 'selected' : ''}`}
                      >
                        {opt.label}
                        {sortOrder === opt.value && <i className="pi pi-check"></i>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-12" style={{ position: 'relative', zIndex: 1 }}>
        <div className="grid">
          <div className="col-12">
            {loading ? (
              <div className="grid">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="col-6 md:col-4 lg:col-3 mb-8">
                    <Skeleton width="100%" height="320px" className="mb-3" />
                    <Skeleton width="60%" height="15px" className="mb-2" />
                    <Skeleton width="40%" height="20px" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid">
                  {products.map(product => (
                    <div key={product._id} className="col-6 md:col-4 lg:col-3 mb-8">
                      <ProductCard
                        id={product._id}
                        name={product.name}
                        price={product.price}
                        oldPrice={product.isHotDeal ? Math.round(product.price * 1.25) : null}
                        img={getImageUrl(product.images?.[0])}
                        brand={product.brand}
                        rating={product.averageRating}
                        variants={product.variants || []}
                        colors={product.tags || []}
                      />
                    </div>
                  ))}
                </div>

                {totalRecords > rows && (
                  <div className="mt-16 pagination-container">
                    <Paginator
                      first={first}
                      rows={rows}
                      totalRecords={totalRecords}
                      onPageChange={e => { 
                        setFirst(e.first); 
                        setPage(e.page + 1); 
                        window.scrollTo({ top: 0, behavior: "smooth" }); 
                      }}
                      className="p-paginator-custom"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="no-products-container">
                <i className="pi pi-search empty-icon"></i>
                <h3 className="empty-title">Không tìm thấy sản phẩm</h3>
                <p className="empty-subtitle">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
                <button onClick={resetAllFilters} className="reset-btn">
                  Xem tất cả sản phẩm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Footer />
      </div>

      <style>{`
        .sticky-filter-bar {
          transition: transform 0.3s ease;
        }
        .filter-group {
          position: relative;
        }
        .filter-trigger {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 4px;
          transition: all 0.2s;
          color: #666;
          font-family: inherit;
        }
        .filter-trigger:hover {
          background-color: #f8f8f8;
          color: #000;
        }
        .filter-trigger.active {
          color: #000;
          font-weight: bold;
        }
        .filter-trigger .label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .filter-trigger .badge {
          background: #000;
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .filter-trigger i {
          font-size: 10px;
          color: #ccc;
        }
        .sort-trigger {
          padding-right: 0;
        }
        .sort-trigger:hover {
          background: none;
        }
        .sort-label {
          font-size: 9px;
          font-weight: 900;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }
        .current-sort {
          font-size: 11px;
          font-weight: 900;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: #fff;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          border: 1px solid #eee;
          border-radius: 8px;
          min-width: 200px;
          z-index: 1000;
          padding: 8px;
          animation: dropDownIn 0.2s ease-out;
        }
        .dropdown-menu.right-aligned {
          left: auto;
          right: 0;
        }
        .dropdown-menu.wide {
          min-width: 280px;
        }
        .dropdown-scroll {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 4px;
        }
        @keyframes dropDownIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-item {
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s;
        }
        .dropdown-item:hover {
          background-color: #f5f5f5;
          color: #000;
        }
        .dropdown-item.selected {
          background-color: #f9f9f9;
          color: #000;
          font-weight: 900;
        }
        .checkbox-item {
          justify-content: flex-start;
          gap: 12px;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #ddd;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .checkbox.checked {
          background: #000;
          border-color: #000;
        }
        .checkbox i {
          font-size: 9px;
          color: #fff;
        }
        .price-menu {
          padding: 24px;
          min-width: 320px;
        }
        .menu-title {
          margin: 0 0 20px 0;
          font-size: 10px;
          font-weight: 900;
          color: #bbb;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }
        .price-slider {
          width: 100%;
          accent-color: #000;
          height: 4px;
          background: #eee;
          border-radius: 2px;
          margin-bottom: 24px;
          cursor: pointer;
        }
        .price-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fdfdfd;
          padding: 12px 20px;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }
        .price-value {
          font-size: 18px;
          font-weight: 900;
          color: #000;
          letter-spacing: -0.02em;
        }
        .star-icon {
          font-size: 12px;
          color: #eee;
        }
        .star-icon.active {
          color: #f59e0b;
        }
        .star-count {
          font-size: 11px;
          font-weight: 700;
          color: #999;
          margin-left: 6px;
        }
        .clear-filters-btn {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 4px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .clear-filters-btn:hover {
          background: #fff1f2;
          text-decoration: underline;
        }
        .no-products-container {
          text-align: center;
          padding: 80px 0;
          background: #fff;
          border-radius: 24px;
          border: 1px solid #f0f0f0;
        }
        .empty-icon {
          font-size: 60px;
          color: #f0f0f0;
          margin-bottom: 32px;
        }
        .empty-title {
          font-size: 24px;
          font-weight: 900;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }
        .empty-subtitle {
          color: #888;
          font-size: 14px;
          margin-bottom: 40px;
        }
        .reset-btn {
          background: #000;
          color: #fff;
          border: none;
          padding: 14px 40px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
        }
        .reset-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .pagination-container {
          background: #fff;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #f0f0f0;
        }
        .p-paginator-custom {
          border: none !important;
          background: transparent !important;
        }
        .p-paginator-custom .p-paginator-page {
          border-radius: 8px !important;
          font-weight: 800 !important;
          font-size: 13px !important;
          min-width: 40px !important;
          height: 40px !important;
          color: #666 !important;
          transition: all 0.2s !important;
        }
        .p-paginator-custom .p-paginator-page:hover {
          background: #f5f5f5 !important;
          color: #000 !important;
        }
        .p-paginator-custom .p-paginator-page.p-highlight {
          background: #000 !important;
          color: #fff !important;
        }
        .p-paginator-custom .p-link {
          color: #999 !important;
        }
        .p-paginator-custom .p-link:hover {
          background: #f5f5f5 !important;
          color: #000 !important;
        }
      `}</style>
    </div>
  );
};

export default ProductListPage;
