import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Paginator } from "primereact/paginator";
import { Slider } from "primereact/slider";
import { Checkbox } from "primereact/checkbox";
import { Rating } from "primereact/rating";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from 'primereact/progressspinner';
import { Chip } from 'primereact/chip'; // <--- IMPORT MỚI
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import Footer from "../components/Footer";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/products`;

const ProductListPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useRef(null);

  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter Data (Load từ DB)
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [maxPriceLimit, setMaxPriceLimit] = useState(100000000);

  // Active Filters State
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(12);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState(null);
  
  // Các state bộ lọc
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]); // Tags đang chọn
  const [minRating, setMinRating] = useState(0);

  const sortOptions = [
    { label: "Mới nhất", value: "newest" },
    { label: "Giá thấp đến cao", value: "price_asc" },
    { label: "Giá cao đến thấp", value: "price_desc" },
    { label: "Tên A - Z", value: "name_asc" },
    { label: "Tên Z - A", value: "name_desc" },
    { label: "Đánh giá cao", value: "rating_desc" },
  ];

  // 1. Load Filter Attributes (Brands/Tags) từ API
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/filters`);
        const data = await res.json();
        if (data.success) {
          setAvailableBrands(data.brands);
          setAvailableTags(data.tags);
          if (data.priceRange?.max) {
             const max = data.priceRange.max;
             setMaxPriceLimit(max);
             setPriceRange([0, max]);
          }
        }
      } catch (err) {
        console.error("Lỗi load filters:", err);
      }
    };
    fetchFilters();
  }, []);

  // 2. Sync URL params
  useEffect(() => {
    setFirst(0);
    setPage(1);
  }, [location.search]);

  // 3. Fetch Products
  useEffect(() => {
    fetchProducts();
    // Scroll top thì tùy chọn, bỏ đi nếu thấy giật
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, rows, sortOrder, priceRange, selectedBrands, selectedTags, minRating, location.search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
        const queryParams = new URLSearchParams(location.search);
        const categoryParam = queryParams.get("category");
        const keywordParam = queryParams.get("q");

        const apiParams = new URLSearchParams();
        apiParams.append("page", page);
        apiParams.append("limit", rows);

        if (categoryParam) {
            switch (categoryParam) {
                case 'new-arrival': apiParams.append("isNewProduct", "true"); break;
                case 'best-seller': 
                    apiParams.append("sort", "rating_desc"); 
                    if (!sortOrder) setSortOrder("rating_desc");
                    break;
                case 'hot-deal': apiParams.append("isHotDeal", "true"); break;
                default: if (categoryParam !== 'All') apiParams.append("category", categoryParam);
            }
        }

        if (keywordParam) apiParams.append("search", keywordParam);
        if (selectedBrands.length > 0) apiParams.append("brand", selectedBrands.join(","));
        if (selectedTags.length > 0) apiParams.append("tags", selectedTags.join(","));
        
        apiParams.append("minPrice", priceRange[0]);
        if (priceRange[1] < maxPriceLimit) apiParams.append("maxPrice", priceRange[1]);
        if (minRating > 0) apiParams.append("minRating", minRating);
        if (sortOrder) apiParams.set("sort", sortOrder);

        const response = await fetch(`${API_BASE_URL}?${apiParams.toString()}`);
        const data = await response.json();

        if (data.products) {
            setProducts(data.products);
            setTotalRecords(data.total);
        } else {
            setProducts([]);
            setTotalRecords(0);
        }
    } catch (error) {
        console.error("Lỗi:", error);
    } finally {
        setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ REMOVE FILTER (Cho phần hiển thị Tag) ---
  const removeBrand = (brand) => {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
      setFirst(0); setPage(1);
  };

  const removeTag = (tag) => {
      setSelectedTags(selectedTags.filter(t => t !== tag));
      setFirst(0); setPage(1);
  };

  const removePriceFilter = () => {
      setPriceRange([0, maxPriceLimit]);
      setFirst(0); setPage(1);
  };

  const removeRatingFilter = () => {
      setMinRating(0);
      setFirst(0); setPage(1);
  };

  const resetAllFilters = () => {
    setPriceRange([0, maxPriceLimit]);
    setSelectedBrands([]);
    setSelectedTags([]);
    setMinRating(0);
    setSortOrder(null);
    setFirst(0);
    setPage(1);
    navigate(location.pathname);
  };

  // Logic Add to Cart (Giữ nguyên)
  const handleAddToCart = (product) => {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItemIndex = cart.findIndex(item => item.product._id === product._id || item.product.id === product._id);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
    } else {
        cart.push({ product: product, quantity: 1, price: product.price });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    toast.current.show({ severity: 'success', summary: 'Thành công', detail: `Đã thêm ${product.name} vào giỏ hàng`, life: 3000 });
  };
  
  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
    setPage(event.page + 1);
  };

  const getImageUrl = (img) => {
      if (!img) return "/img/default.png";
      if (img.startsWith("http")) return img;
      return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/${img.replace(/\\/g, "/")}`;
  };

  // --- RENDER PHẦN ACTIVE FILTERS ---
  const renderActiveFilters = () => {
      const hasPriceChange = priceRange[0] > 0 || priceRange[1] < maxPriceLimit;
      const hasAnyFilter = selectedBrands.length > 0 || selectedTags.length > 0 || minRating > 0 || hasPriceChange;

      if (!hasAnyFilter) return null;

      return (
          <div className="flex flex-wrap gap-2 mb-3 align-items-center">
              <span className="text-sm font-semibold text-700 mr-2">Đang lọc:</span>
              
              {/* Chips cho Brands */}
              {selectedBrands.map(brand => (
                  <Chip key={brand} label={brand} removable onRemove={() => removeBrand(brand)} className="bg-blue-100 text-blue-900 font-medium text-sm" />
              ))}

              {/* Chips cho Tags */}
              {selectedTags.map(tag => (
                  <Chip key={tag} label={tag} removable onRemove={() => removeTag(tag)} className="bg-purple-100 text-purple-900 font-medium text-sm" />
              ))}

              {/* Chip cho Price */}
              {hasPriceChange && (
                  <Chip 
                    label={`${priceRange[0].toLocaleString()}đ - ${priceRange[1] >= maxPriceLimit ? 'Max' : priceRange[1].toLocaleString() + 'đ'}`} 
                    removable 
                    onRemove={removePriceFilter} 
                    className="bg-green-100 text-green-900 font-medium text-sm" 
                  />
              )}

              {/* Chip cho Rating */}
              {minRating > 0 && (
                  <Chip 
                    label={`> ${minRating} Sao`} 
                    removable 
                    onRemove={removeRatingFilter} 
                    className="bg-orange-100 text-orange-900 font-medium text-sm" 
                    icon="pi pi-star-fill"
                  />
              )}

              <Button label="Xóa tất cả" link size="small" onClick={resetAllFilters} className="text-red-500 p-0 ml-2" />
          </div>
      );
  };

  return (
    <>
      <Header />
      <Toast ref={toast} />
      
      <div style={{ backgroundColor: "#f8f9fa", minHeight: '90vh' }} className="px-4 py-5 md:px-6 lg:px-8">
        <div className="grid align-items-start">
          
          {/* SIDEBAR */}
          <div className="col-12 md:col-3">
            <div className="bg-white p-4 shadow-1 border-round-xl sticky top-0" style={{top: '1rem'}}>
              {/* Giữ nguyên phần Sidebar như cũ, chỉ thay đổi phần Tags bên dưới */}
              
              <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 border-200 pb-3">
                  <h4 className="m-0 font-bold text-xl text-800">Bộ lọc</h4>
                  <Button icon="pi pi-filter-slash" className="p-button-text p-button-rounded p-button-sm" onClick={resetAllFilters} tooltip="Xóa bộ lọc"/>
              </div>

              {/* 1. Price */}
              <div className="mb-5">
                <label className="block mb-3 font-semibold text-lg text-700">Khoảng giá</label>
                <Slider value={priceRange} onChange={(e) => setPriceRange(e.value)} range min={0} max={maxPriceLimit} step={500000} className="w-full" />
                <div className="flex justify-content-between mt-3 font-medium text-primary text-sm">
                  <span>{priceRange[0].toLocaleString()}đ</span>
                  <span>{priceRange[1] >= maxPriceLimit ? "Tối đa" : priceRange[1].toLocaleString() + "đ"}</span>
                </div>
              </div>

              {/* 2. Brands */}
              <div className="mb-5">
                <label className="block mb-3 font-semibold text-lg text-700">Thương hiệu</label>
                <div className="flex flex-column gap-2 max-h-15rem overflow-y-auto">
                    {availableBrands.map((brand) => (
                      <div key={brand} className="flex align-items-center">
                        <Checkbox inputId={brand} value={brand} onChange={(e) => {
                            let _brands = [...selectedBrands];
                            if (e.checked) _brands.push(e.value); else _brands.splice(_brands.indexOf(e.value), 1);
                            setSelectedBrands(_brands); setFirst(0); setPage(1);
                          }} checked={selectedBrands.includes(brand)} />
                        <label htmlFor={brand} className="ml-2 cursor-pointer text-700">{brand}</label>
                      </div>
                    ))}
                </div>
              </div>

              {/* 3. Tags (SỬA LẠI UI ĐỂ DỄ NHÌN HƠN) */}
              <div className="mb-5">
                <label className="block mb-3 font-semibold text-lg text-700">Tags / Nhu cầu</label>
                <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <div 
                              key={tag} 
                              onClick={() => {
                                  // Logic toggle: Nếu có rồi thì bỏ, chưa có thì thêm
                                  let _tags = [...selectedTags];
                                  if (isSelected) _tags = _tags.filter(t => t !== tag);
                                  else _tags.push(tag);
                                  setSelectedTags(_tags); setFirst(0); setPage(1);
                              }}
                              // Style: Nếu chọn thì màu đậm (Primary), chưa chọn thì xám
                              className={`cursor-pointer px-3 py-1 border-round-2xl text-sm transition-all border-1 
                                ${isSelected 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2' // Đã chọn
                                    : 'bg-gray-50 text-700 border-gray-300 hover:bg-gray-200' // Chưa chọn
                                }`}
                          >
                              {tag} {isSelected && <i className="pi pi-check text-xs ml-1"></i>}
                          </div>
                        )
                    })}
                </div>
              </div>

              {/* 4. Rating */}
              <div className="mb-5">
                 {/* ... Giữ nguyên ... */}
                 <Rating value={minRating} onChange={(e) => { setMinRating(e.value); setFirst(0); setPage(1); }} cancel={false} stars={5} />
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="col-12 md:col-9 flex flex-column h-full">
            {/* Header List */}
            <div className="bg-white p-4 shadow-1 border-round-xl mb-3 flex flex-column md:flex-row justify-content-between align-items-center gap-3">
              <span className="text-800 font-medium text-lg">
                Tìm thấy <span className="text-primary font-bold">{totalRecords}</span> sản phẩm
              </span>
              <Dropdown value={sortOrder} options={sortOptions} onChange={(e) => { setSortOrder(e.value); setFirst(0); setPage(1); }} placeholder="Sắp xếp" className="w-12rem" />
            </div>

            {/* --- KHU VỰC HIỂN THỊ CÁC TAG ĐÃ CHỌN (MỚI) --- */}
            {renderActiveFilters()}

            {/* Grid Sản phẩm */}
            {loading ? (
                 <div className="flex justify-content-center align-items-center h-20rem bg-white border-round-xl shadow-1"><ProgressSpinner /></div>
            ) : (
                <div className="grid">
                    {products.length > 0 ? products.map((product) => (
                        <div key={product._id} className="col-12 sm:col-6 lg:col-4 xl:col-3"> 
                            <ProductCard 
                                id={product._id}
                                name={product.name}
                                price={product.price}
                                oldPrice={product.isHotDeal ? product.price * 1.2 : null}
                                img={getImageUrl(product.images?.[0])}
                                brand={product.brand}
                                rating={product.averageRating}
                                onAddToCart={() => handleAddToCart(product)}
                            />
                        </div>
                    )) : (
                        <div className="col-12"><div className="bg-white p-5 text-center border-round-xl shadow-1"><p>Không tìm thấy sản phẩm.</p></div></div>
                    )}
                </div>
            )}

            {totalRecords > 0 && (
                <div className="bg-white border-round-xl mt-4 shadow-1 p-2">
                     <Paginator first={first} rows={rows} totalRecords={totalRecords} onPageChange={onPageChange} />
                </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductListPage;
