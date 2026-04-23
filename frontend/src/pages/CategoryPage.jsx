import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Slider } from "primereact/slider";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { Paginator } from "primereact/paginator";
import { Button } from "primereact/button";
import { Rating } from "primereact/rating";
import ProductCard from "../components/ProductCard";

const CategoryPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(12);

  // --- State cho bộ lọc ---
  const [priceRange, setPriceRange] = useState([0, 50000000]); // 0 - 50 triệu
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [sortKey, setSortKey] = useState(null);

  // Mock Brands (Thương hiệu giả lập)
  const brands = [
    { name: "Apple", key: "A" },
    { name: "Samsung", key: "S" },
    { name: "MSI", key: "M" },
    { name: "Dell", key: "D" },
    { name: "Sony", key: "SO" },
    { name: "LG", key: "L" },
  ];

  // Mock Sort Options
  const sortOptions = [
    { label: "Giá: Thấp đến Cao", value: "price_asc" },
    { label: "Giá: Cao đến Thấp", value: "price_desc" },
    { label: "Tên: A - Z", value: "name_asc" },
    { label: "Mới nhất", value: "newest" },
  ];

  useEffect(() => {
    // ✅ Giả lập dữ liệu sản phẩm (Mock Data lớn hơn để test phân trang)
    const generateProducts = () => {
      const list = [];
      for (let i = 1; i <= 50; i++) {
        list.push({
          id: i,
          brand: brands[Math.floor(Math.random() * brands.length)].name,
          n: `Sản phẩm Demo ${category} ${i}`,
          p: Math.floor(Math.random() * (40000000 - 1000000) + 1000000), // Giá ngẫu nhiên
          o: Math.floor(Math.random() * (45000000 - 41000000) + 41000000),
          i: `/img/product0${(i % 6) + 1}.png`,
          rating: (Math.random() * (5 - 3) + 3).toFixed(1),
          type: category ? category.toLowerCase() : "all",
        });
      }
      return list;
    };

    // Logic Lọc & Sắp xếp (Frontend Simulation)
    let data = generateProducts();

    // 1. Lọc theo Brand
    if (selectedBrands.length > 0) {
      data = data.filter((p) => selectedBrands.includes(p.brand));
    }

    // 2. Lọc theo Giá
    data = data.filter((p) => p.p >= priceRange[0] && p.p <= priceRange[1]);

    // 3. Sắp xếp
    if (sortKey === "price_asc") data.sort((a, b) => a.p - b.p);
    else if (sortKey === "price_desc") data.sort((a, b) => b.p - a.p);
    else if (sortKey === "name_asc") data.sort((a, b) => a.n.localeCompare(b.n));

    setTotalRecords(data.length);
    // Cắt dữ liệu cho phân trang
    setProducts(data.slice(first, first + rows));

  }, [category, first, rows, selectedBrands, priceRange, sortKey]);

  const onBrandChange = (e) => {
    let _selectedBrands = [...selectedBrands];
    if (e.checked) _selectedBrands.push(e.value);
    else _selectedBrands = _selectedBrands.filter((brand) => brand !== e.value);
    setSelectedBrands(_selectedBrands);
    setFirst(0); // Reset về trang 1 khi lọc
  };

  const formatCurrency = (value) => {
    return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Breadcrumb đơn giản */}
      <div className="surface-0 py-3 border-bottom-1 border-200">
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
          <span className="text-500">Trang chủ / </span>
          <span className="font-bold text-primary capitalize">{category.replace("-", " ")}</span>
        </div>
      </div>

      <main className="p-4" style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div className="grid">
          
          {/* --- CỘT TRÁI: BỘ LỌC (SIDEBAR) --- */}
          <div className="col-12 md:col-3 lg:col-2">
            <div className="bg-white p-4 border-round-xl shadow-1 h-full">
              <h3 className="text-lg font-bold mb-4 text-900 flex align-items-center gap-2">
                <i className="pi pi-filter text-primary"></i> Bộ Lọc
              </h3>

              {/* Lọc theo Giá */}
              <div className="mb-5">
                <h4 className="text-base font-semibold mb-3">Khoảng giá</h4>
                <Slider 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(e.value)} 
                  range 
                  min={0} 
                  max={50000000} 
                  step={500000}
                  className="w-full" 
                />
                <div className="flex justify-content-between mt-3 text-sm font-medium text-700">
                  <span>{formatCurrency(priceRange[0])}</span>
                  <span>{formatCurrency(priceRange[1])}</span>
                </div>
              </div>

              {/* Lọc theo Thương hiệu */}
              <div className="mb-5">
                <h4 className="text-base font-semibold mb-3">Thương hiệu</h4>
                <div className="flex flex-column gap-3">
                  {brands.map((brand) => (
                    <div key={brand.key} className="flex align-items-center">
                      <Checkbox
                        inputId={brand.key}
                        name="brand"
                        value={brand.name}
                        onChange={onBrandChange}
                        checked={selectedBrands.includes(brand.name)}
                      />
                      <label htmlFor={brand.key} className="ml-2 text-sm cursor-pointer text-700">
                        {brand.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nút Reset */}
              <Button 
                label="Xóa bộ lọc" 
                icon="pi pi-refresh" 
                outlined 
                className="w-full p-button-sm"
                onClick={() => {
                  setPriceRange([0, 50000000]);
                  setSelectedBrands([]);
                  setSortKey(null);
                }}
              />
            </div>
          </div>

          {/* --- CỘT PHẢI: DANH SÁCH SẢN PHẨM --- */}
          <div className="col-12 md:col-9 lg:col-10">
            
            {/* Toolbar Sắp xếp */}
            <div className="bg-white p-3 border-round-xl shadow-1 mb-4 flex flex-wrap justify-content-between align-items-center gap-3">
              <h2 className="text-xl font-bold m-0 text-900 uppercase">
                {category.replace("-", " ")} 
                <span className="text-500 text-base font-normal ml-2">({totalRecords} sản phẩm)</span>
              </h2>
              
              <div className="flex align-items-center gap-2">
                <span className="text-sm font-medium text-700 hidden sm:block">Sắp xếp theo:</span>
                <Dropdown
                  value={sortKey}
                  options={sortOptions}
                  onChange={(e) => setSortKey(e.value)}
                  placeholder="Mặc định"
                  className="w-12rem p-inputtext-sm"
                />
              </div>
            </div>

            {/* Lưới sản phẩm */}
            {products.length > 0 ? (
              <>
                <div
                  className="grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {products.map((p) => (
                    <ProductCard 
                        key={p.id} 
                        id={p.id}
                        brand={p.brand}
                        name={p.n}
                        price={p.p}
                        oldPrice={p.o}
                        img={p.i}
                        rating={p.rating}
                    />
                  ))}
                </div>

                {/* Phân trang */}
                <div className="mt-5 surface-0 border-round-xl shadow-1">
                  <Paginator
                    first={first}
                    rows={rows}
                    totalRecords={totalRecords}
                    rowsPerPageOptions={[12, 24, 36]}
                    onPageChange={(e) => {
                      setFirst(e.first);
                      setRows(e.rows);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                  />
                </div>
              </>
            ) : (
              <div className="bg-white p-5 text-center border-round-xl shadow-1">
                <i className="pi pi-search text-5xl text-gray-300 mb-3"></i>
                <p className="text-xl text-700 font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
                <Button label="Xem tất cả sản phẩm" text onClick={() => {
                   setPriceRange([0, 50000000]);
                   setSelectedBrands([]);
                }} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CategoryPage;
