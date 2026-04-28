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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              // If it's a specific term like "Áo thun", treat it as a search keyword
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

  // Determine Title
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

      {/* Filter Bar */}
      <div className="sticky top-[90px] z-[100] bg-white border-bottom-1 border-gray-100 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-content-between align-items-center">
          <div className="flex gap-4 align-items-center">
             <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex align-items-center gap-2 bg-black text-white px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-[0.2em] border-none cursor-pointer hover:bg-gray-800 transition-all shadow-md"
             >
               <i className="pi pi-filter"></i> Bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}
             </button>
             
             <div className="hidden lg:flex gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button 
                    key={opt.value}
                    onClick={() => setSortOrder(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-1 transition-all ${sortOrder === opt.value ? 'bg-[#111] text-white border-black' : 'bg-transparent text-gray-400 border-gray-100 hover:border-gray-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex align-items-center gap-3">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:block">Hiển thị:</span>
             <select 
               className="border-none bg-transparent text-xs font-black uppercase tracking-widest cursor-pointer outline-none"
               value={rows}
               disabled
             >
               <option value="12">12 mỗi trang</option>
             </select>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid">
          {/* Sidebar Filters */}
          {sidebarOpen && (
            <div className="col-12 lg:col-3 mb-6 lg:mb-0">
               <div className="bg-white p-6 rounded-xl border-1 border-gray-50 shadow-sm sticky top-48">
                  <div className="flex justify-content-between align-items-center mb-6">
                    <h3 className="m-0 text-xs font-black uppercase tracking-[0.2em]">Lọc sản phẩm</h3>
                    <button onClick={resetAllFilters} className="bg-transparent border-none text-[10px] font-black text-red-500 cursor-pointer hover:underline uppercase tracking-widest">Xóa hết</button>
                  </div>

                  <FilterSection title="Giới tính">
                    <div className="flex flex-column gap-2">
                      {GENDER_OPTIONS.map(g => (
                        <label key={g.value} className="flex align-items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="gender" 
                            checked={selectedGender === g.value} 
                            onChange={() => setSelectedGender(g.value)}
                            className="w-4 h-4 accent-black"
                          />
                          <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${selectedGender === g.value ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Khoảng giá">
                    <input 
                      type="range" 
                      min="0" 
                      max={maxPriceLimit} 
                      step="100000" 
                      value={priceRange[1]} 
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full accent-black mb-2"
                    />
                    <div className="flex justify-content-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>0₫</span>
                      <span className="text-black">{priceRange[1].toLocaleString()}₫</span>
                    </div>
                  </FilterSection>

                  {availableCategories.length > 0 && (
                    <FilterSection title="Danh mục">
                       <div className="flex flex-wrap gap-2">
                          {availableCategories.map(cat => (
                            <button 
                              key={cat}
                              onClick={() => toggleFilter(selectedCategories, setSelectedCategories, cat)}
                              className={`px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest border-1 transition-all ${selectedCategories.includes(cat) ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
                            >
                              {CATEGORY_LABELS[cat] || cat}
                            </button>
                          ))}
                       </div>
                    </FilterSection>
                  )}

                  {availableBrands.length > 0 && (
                    <FilterSection title="Thương hiệu">
                       <div className="flex flex-column gap-2">
                          {availableBrands.map(brand => (
                            <label key={brand} className="flex align-items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={selectedBrands.includes(brand)} 
                                onChange={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                                className="w-4 h-4 accent-black"
                              />
                              <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${selectedBrands.includes(brand) ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>{brand}</span>
                            </label>
                          ))}
                       </div>
                    </FilterSection>
                  )}
               </div>
            </div>
          )}

          {/* Product Grid */}
          <div className={`col-12 ${sidebarOpen ? 'lg:col-9' : 'lg:col-12'}`}>
            {loading ? (
              <div className="grid">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="col-6 md:col-4 lg:col-3 mb-6">
                    <Skeleton width="100%" height="300px" className="mb-2" />
                    <Skeleton width="60%" height="15px" className="mb-2" />
                    <Skeleton width="40%" height="20px" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid">
                  {products.map(product => (
                    <div key={product._id} className="col-6 md:col-4 lg:col-3 mb-6">
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
                  <div className="mt-12 bg-white rounded-xl shadow-sm border-1 border-gray-50 overflow-hidden">
                    <Paginator
                      first={first}
                      rows={rows}
                      totalRecords={totalRecords}
                      onPageChange={e => { 
                        setFirst(e.first); 
                        setPage(e.page + 1); 
                        window.scrollTo({ top: 0, behavior: "smooth" }); 
                      }}
                      className="border-none py-4"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-column align-items-center justify-content-center py-20 bg-white rounded-3xl border-dashed border-2 border-gray-100">
                <i className="pi pi-search text-6xl text-gray-100 mb-6"></i>
                <h3 className="m-0 text-xl font-black uppercase tracking-tight mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-400 text-sm font-medium mb-8">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
                <button 
                  onClick={resetAllFilters}
                  className="bg-black text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] border-none cursor-pointer hover:scale-105 transition-transform"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Footer />
      </div>
    </div>
  );
};

const FilterSection = ({ title, children }) => (
  <div className="mb-8 last:mb-0">
    <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">{title}</h4>
    {children}
  </div>
);

export default ProductListPage;
