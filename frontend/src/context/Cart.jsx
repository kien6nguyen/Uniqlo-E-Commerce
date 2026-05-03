import React, { useEffect, useState, useRef } from "react";
import Footer from "../components/Footer";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  applyDiscountCode,
  removeDiscountCode
} from "../utils/cartUtils";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/carts`;
const API_CHECKOUT = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/checkout`;

const Cart = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    tax: 0,
    shippingFee: 30000,
    freeShipping: false,
    discount: 0,
    total: 0
  });
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);

  const isUpdatingRef = useRef(false);

  const recalcSummaryFromItems = (items, existing = {}) => {
    const subtotal = items.reduce((s, it) => s + Number(it.price || (it.priceSnapshot || 0) * (it.quantity || 1)), 0);
    const tax = existing.tax ?? +(subtotal * 0.1);
    const shippingFee = existing.freeShipping ? 0 : (existing.shippingFee ?? 30000);
    const discount = existing.discount ?? 0;
    const total = subtotal + tax + shippingFee - discount;
    return { subtotal, tax, shippingFee, freeShipping: existing.freeShipping ?? false, discount, total };
  };

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        sessionId = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("sessionId", sessionId);
      }
      
      const headers = {
        "Content-Type": "application/json",
        "x-session-id": sessionId
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/summary`, {
        credentials: 'include',
        headers: headers
      });
      const data = await response.json();

      setCart(data.items || []);
      setCartSummary({
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        shippingFee: data.shippingFee || 30000,
        freeShipping: data.freeShipping || false,
        discount: data.discount || 0,
        total: data.total || 0
      });
      setAppliedDiscount(data.discountCode || null);

      const discountResponse = await fetch(`${API_CHECKOUT}/info`, {
        credentials: 'include',
        headers: headers
      });
      const discountData = await discountResponse.json();

      if (discountData.success && discountData.discounts) {
        setAvailableDiscounts(discountData.discounts);
      }
    } catch (err) {
      console.error("Error loading cart:", err);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleCartUpdate = (event) => {
      // Kiểm tra nếu đang update optimistic hoặc là discount operation
      if (isUpdatingRef.current) {
        isUpdatingRef.current = false;
        return;
      }

      // Kiểm tra nếu event detail có flag skipReload
      if (event?.detail?.skipReload) {
        return;
      }

      loadCart();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  const toggleSelect = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cart.length) setSelectedItems([]);
    else setSelectedItems(cart.map((item) => item._id));
  };

  const removeItem = async (item) => {
    const prevCart = cart;
    const newCart = cart.filter(i => i._id !== item._id);
    setCart(newCart);
    setSelectedItems(prev => prev.filter(id => id !== item._id));
    setCartSummary(recalcSummaryFromItems(newCart, cartSummary));
    isUpdatingRef.current = true;

    try {
      await removeCartItem(
        item.product._id || item.product,
        item.variantId,
        item.color
      );
    } catch (err) {
      console.error("Error removing item:", err);
      setCart(prevCart);
      setCartSummary(recalcSummaryFromItems(prevCart, cartSummary));
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi khi xóa sản phẩm!',
        life: 3000
      });
      isUpdatingRef.current = false;
    }
  };

  const removeAll = async () => {
    const prevCart = cart;
    setCart([]);
    setSelectedItems([]);
    setCartSummary({ subtotal: 0, tax: 0, shippingFee: 30000, freeShipping: false, discount: 0, total: 0 });
    isUpdatingRef.current = true;

    try {
      await clearCart();
    } catch (err) {
      console.error("Error clearing cart:", err);
      setCart(prevCart);
      setCartSummary(recalcSummaryFromItems(prevCart));
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi khi xóa giỏ hàng!',
        life: 3000
      });
      isUpdatingRef.current = false;
    }
  };

  const changeQty = async (item, delta) => {
    const newQty = item.quantity + delta;

    if (newQty < 1) {
      await removeItem(item);
      return;
    }

    const newCart = cart.map(i => {
      if (i._id === item._id) {
        const updated = { ...i, quantity: newQty };
        const unit = i.priceSnapshot ?? (i.price / (i.quantity || 1) || 0);
        updated.price = unit * newQty;
        return updated;
      }
      return i;
    });

    setCart(newCart);
    setCartSummary(recalcSummaryFromItems(newCart, cartSummary));
    isUpdatingRef.current = true;

    try {
      await updateCartItemQuantity({
        productId: item.product._id || item.product,
        quantity: newQty,
        variantId: item.variantId,
        color: item.color
      });
    } catch (err) {
      console.error("Error updating quantity:", err);
      await loadCart();
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: err.message || 'Có lỗi khi cập nhật số lượng!',
        life: 3000
      });
      isUpdatingRef.current = false;
    }
  };

  const handleApplyDiscount = async (discount) => {
    try {
      const result = await applyDiscountCode(discount.code);

      // Cập nhật local state ngay lập tức không reload
      const discountAmount = (cartSummary.subtotal * discount.percentage) / 100;
      const newShippingFee = discount.freeShipping ? 0 : cartSummary.shippingFee;

      setAppliedDiscount(discount.code);
      setCartSummary(prev => ({
        ...prev,
        discount: discountAmount,
        freeShipping: discount.freeShipping,
        shippingFee: newShippingFee,
        total: prev.subtotal + prev.tax + newShippingFee - discountAmount
      }));

      setShowDiscountDialog(false);

      let message = result.message || `Áp dụng mã ${discount.code} thành công!`;
      toast.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: message,
        life: 4000
      });
    } catch (err) {
      // Hiển thị thông báo lỗi nếu không đủ điều kiện
      toast.current?.show({
        severity: 'warn',
        summary: 'Không thể áp dụng',
        detail: err.message || 'Không thể áp dụng mã giảm giá',
        life: 5000
      });
    }
  };

  const handleRemoveDiscount = async () => {
    try {
      await removeDiscountCode();

      // Cập nhật local state
      setAppliedDiscount(null);
      setCartSummary(prev => ({
        ...prev,
        discount: 0,
        freeShipping: false,
        shippingFee: 30000,
        total: prev.subtotal + prev.tax + 30000
      }));

      toast.current?.show({
        severity: 'info',
        summary: 'Đã xóa',
        detail: 'Đã xóa mã giảm giá',
        life: 3000
      });
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: err.message || 'Không thể xóa mã giảm giá',
        life: 3000
      });
    }
  };

  const selectedSubtotal = cart
    .filter((item) => selectedItems.includes(item._id))
    .reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const selectedTax = selectedSubtotal * 0.1;
  const selectedDiscount = selectedItems.length === cart.length ? cartSummary.discount : 0;
  const selectedShippingFee = selectedItems.length === cart.length ? (cartSummary.freeShipping ? 0 : cartSummary.shippingFee) : 30000;
  const selectedTotal = selectedSubtotal + selectedTax + selectedShippingFee - selectedDiscount;

  if (loading) {
    return (
      <>
        <div className="p-5 text-center">Đang tải giỏ hàng...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Toast ref={toast} />

      <div className="bg-[#fdfdfd] min-h-screen pb-20">
        <div className="max-w-screen-xl mx-auto px-4 pt-10">
          <div className="flex justify-content-between align-items-end mb-8 pb-4 border-bottom-2 border-black">
            <h1 className="m-0 text-2xl font-black uppercase tracking-tighter text-black">Giỏ hàng của bạn</h1>
            {cart.length > 0 && (
              <button 
                onClick={() => setShowConfirm(true)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-red-600 transition-colors"
              >
                Xóa tất cả sản phẩm
              </button>
            )}
          </div>

          <div className="grid">
            {/* Left: Cart Items */}
            <div className="col-12 lg:col-8 pr-0 lg:pr-6">
              {cart.length === 0 ? (
                <div className="py-20 text-center bg-white border-1 border-black">
                  <i className="pi pi-shopping-cart text-black text-6xl mb-4"></i>
                  <p className="text-black text-xs font-bold uppercase tracking-widest mb-6">Giỏ hàng của bạn đang trống</p>
                  <Link to="/search" className="inline-block bg-black text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] no-underline hover:bg-gray-800 transition-all">Mua sắm ngay</Link>
                </div>
              ) : (
                <div className="flex flex-column gap-4">
                  <div className="flex align-items-center px-4 py-3 bg-gray-100 border-bottom-1 border-black text-[10px] font-black uppercase tracking-[0.1em] text-black">
                    <div className="flex align-items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedItems.length === cart.length && cart.length > 0}
                        onChange={toggleSelectAll}
                        pt={{
                          box: ({ props }) => ({
                            className: props.checked ? 'bg-black border-black' : 'border-gray-300'
                          })
                        }}
                      />
                      <span>Tất cả sản phẩm ({cart.length})</span>
                    </div>
                    <div className="hidden md:flex align-items-center">
                      <span className="text-center" style={{ width: '100px' }}>Đơn giá</span>
                      <span className="text-center" style={{ width: '120px', margin: '0 2rem' }}>Số lượng</span>
                      <span className="text-right" style={{ width: '120px' }}>Tổng cộng</span>
                    </div>
                  </div>

                  {cart.map((item) => {
                    const product = item.product;
                    const productName = product?.name || "Sản phẩm";
                    const productImg = product?.images?.[0] || "/img/default.png";
                    const pricePerUnit = item.priceSnapshot || 0;
                    const totalItemPrice = item.price || 0;

                    return (
                      <div
                        key={item._id}
                        className="py-4 px-3 md:py-5 md:px-4 bg-white border-bottom-1 border-gray-200 hover:surface-50 transition-all flex align-items-center gap-3 md:gap-4 relative group"
                      >
                        <Checkbox
                          checked={selectedItems.includes(item._id)}
                          onChange={() => toggleSelect(item._id)}
                          pt={{
                            box: ({ props }) => ({
                              className: props.checked ? 'bg-black border-black' : 'border-gray-300'
                            })
                          }}
                        />
                        
                        <Link to={`/product/${product._id || product.id}`} className="flex-shrink-0 overflow-hidden bg-gray-50 border-1 border-gray-200 transition-transform hover:scale-105 duration-500" style={{ width: '80px', height: '106px' }}>
                          <img src={productImg} alt={productName} className="w-full h-full object-cover" />
                        </Link>

                        <div className="flex-1 flex flex-column md:flex-row align-items-start md:align-items-center gap-4">
                          <div className="flex-1">
                            <Link to={`/product/${product._id || product.id}`} className="block text-sm font-black uppercase tracking-tight text-black no-underline hover:text-red-600 transition-colors mb-1">
                              {productName}
                            </Link>
                            {(item.variantName || item.color) && (
                              <div className="flex gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {item.variantName && <span>Size: {item.variantName}</span>}
                                {item.color && <span>Color: {item.color}</span>}
                              </div>
                            )}
                            <button 
                              onClick={() => removeItem(item)}
                              className="mt-2 bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-red-600 transition-colors p-0 border-bottom-1 border-transparent hover:border-red-600 pb-1"
                            >
                              Xóa khỏi túi
                            </button>
                          </div>

                          <div className="flex align-items-center justify-content-between w-full md:w-auto mt-4 md:mt-0">
                            <div className="hidden md:block text-center text-sm font-bold text-500" style={{ width: '100px' }}>
                              {pricePerUnit.toLocaleString("vi-VN")}₫
                            </div>

                            <div className="flex align-items-stretch border-1 border-300 bg-white" style={{ width: '120px', height: '36px', margin: '0 2rem' }}>
                              <button 
                                onClick={() => changeQty(item, -1)}
                                className="bg-transparent border-none border-right-1 border-300 text-600 hover:text-900 hover:surface-100 cursor-pointer transition-colors flex align-items-center justify-content-center m-0 p-0"
                                style={{ width: '36px' }}
                              >
                                <i className="pi pi-minus text-[10px]"></i>
                              </button>
                              <span className="flex-1 flex align-items-center justify-content-center text-sm font-bold text-900">{item.quantity}</span>
                              <button 
                                onClick={() => changeQty(item, 1)}
                                className="bg-transparent border-none border-left-1 border-300 text-600 hover:text-900 hover:surface-100 cursor-pointer transition-colors flex align-items-center justify-content-center m-0 p-0"
                                style={{ width: '36px' }}
                              >
                                <i className="pi pi-plus text-[10px]"></i>
                              </button>
                            </div>

                            <div className="text-right text-sm font-bold text-900" style={{ width: '120px' }}>
                              {totalItemPrice.toLocaleString("vi-VN")}₫
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <div className="col-12 lg:col-4 mt-10 lg:mt-0">
              <div className="bg-white border-1 border-black sticky" style={{ top: '120px', padding: '32px' }}>
                <h2 className="m-0 text-xl font-black uppercase tracking-tight mb-8 pb-4 border-bottom-1 border-gray-200 text-black">Tóm tắt đơn hàng</h2>
                
                <div className="mb-8">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Mã giảm giá</label>
                  {appliedDiscount ? (
                    <div className="flex align-items-center justify-content-between p-4 border-1 group" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <div className="flex align-items-center gap-3">
                        <i className="pi pi-check-circle" style={{ color: '#16a34a' }}></i>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#16a34a' }}>{appliedDiscount}</span>
                      </div>
                      <button 
                        onClick={handleRemoveDiscount}
                        className="bg-transparent border-none text-gray-400 cursor-pointer transition-colors m-0 p-0 hover:text-900"
                      >
                        <i className="pi pi-times"></i>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDiscountDialog(true)}
                      disabled={selectedItems.length === 0}
                      className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] border-1 border-dashed transition-all ${selectedItems.length > 0 ? 'bg-white text-black border-black cursor-pointer hover:bg-gray-50' : 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed'}`}
                    >
                      <i className="pi pi-tag mr-2"></i> Chọn mã giảm giá
                    </button>
                  )}
                </div>

                <div className="flex flex-column gap-4 mb-8">
                  <div className="flex justify-content-between align-items-center">
                    <span className="text-[11px] font-bold text-500 uppercase tracking-widest">Tạm tính</span>
                    <span className="text-sm font-black text-900">{selectedSubtotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span className="text-[11px] font-bold text-500 uppercase tracking-widest">Thuế (10%)</span>
                    <span className="text-sm font-black text-900">{selectedTax.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span className="text-[11px] font-bold text-500 uppercase tracking-widest">Phí vận chuyển</span>
                    <span className="text-sm font-black" style={{ color: selectedShippingFee === 0 ? '#16a34a' : '#212529' }}>
                      {selectedShippingFee === 0 ? 'MIỄN PHÍ' : `${selectedShippingFee.toLocaleString("vi-VN")}₫`}
                    </span>
                  </div>
                  {selectedDiscount > 0 && (
                    <div className="flex justify-content-between align-items-center" style={{ color: '#16a34a' }}>
                      <span className="text-[11px] font-bold uppercase tracking-widest">Giảm giá</span>
                      <span className="text-sm font-black">-{selectedDiscount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-top-1 border-gray-300 mb-8 flex justify-content-between align-items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-900">Tổng thanh toán</span>
                  <span className="text-3xl font-black tracking-tighter leading-none" style={{ color: '#dc2626' }}>{selectedTotal.toLocaleString("vi-VN")}₫</span>
                </div>

                <button
                  onClick={() => {
                    const selectedProducts = cart.filter((item) => selectedItems.includes(item._id));
                    if (selectedProducts.length === 0) {
                      toast.current?.show({ severity: 'warn', summary: 'Chú ý', detail: 'Vui lòng chọn sản phẩm!', life: 3000 });
                      return;
                    }
                    if (appliedDiscount) {
                      const discountFullObj = availableDiscounts.find(d => d.code === appliedDiscount);
                      if (discountFullObj) localStorage.setItem("checkoutDiscount", JSON.stringify(discountFullObj));
                    } else localStorage.removeItem("checkoutDiscount");
                    localStorage.setItem("checkoutItems", JSON.stringify(selectedProducts));
                    navigate("/checkout");
                  }}
                  className={`w-full text-sm font-black uppercase tracking-[0.2em] border-1 transition-all cursor-pointer m-0`}
                  style={{ 
                    padding: '20px 0', 
                    backgroundColor: selectedItems.length > 0 ? '#000' : '#f5f5f5', 
                    color: selectedItems.length > 0 ? '#fff' : '#a3a3a3',
                    borderColor: selectedItems.length > 0 ? '#000' : '#e5e5e5'
                  }}
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header={<span className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Xác nhận xóa</span>}
        visible={showConfirm}
        style={{ width: "400px", borderRadius: '0' }}
        modal
        onHide={() => setShowConfirm(false)}
        footer={
          <div className="flex justify-content-end gap-3 p-4">
            <button onClick={() => setShowConfirm(false)} className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer">Quay lại</button>
            <button 
              onClick={() => { removeAll(); setShowConfirm(false); }}
              className="bg-red-600 text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-none cursor-pointer hover:bg-red-700 transition-all"
            >
              Xóa tất cả
            </button>
          </div>
        }
      >
        <p className="text-sm font-medium text-gray-600 leading-relaxed text-center py-4">Bạn có chắc chắn muốn xóa toàn bộ sản phẩm<br/>ra khỏi giỏ hàng của mình không?</p>
      </Dialog>

      <Dialog
        header={<span className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Chọn mã giảm giá</span>}
        visible={showDiscountDialog}
        style={{ width: "480px", borderRadius: '0' }}
        onHide={() => setShowDiscountDialog(false)}
      >
        <div className="flex flex-column gap-4 p-2">
          {availableDiscounts.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest">Không có mã giảm giá khả dụng</p>
            </div>
          ) : (
            availableDiscounts.map((discount) => (
              <div
                key={discount._id}
                className="p-5 border-1 border-200 cursor-pointer hover:border-black transition-all group"
                onClick={() => handleApplyDiscount(discount)}
              >
                <div className="flex justify-content-between align-items-center">
                  <div>
                    <div className="font-black text-lg text-black uppercase tracking-tighter mb-1 group-hover:text-red-600 transition-colors">{discount.code}</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{discount.description}</div>
                    <div className="flex gap-2">
                      {discount.minOrderValue > 0 && (
                        <span className="text-[8px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 uppercase tracking-widest border-1 border-orange-100">
                          Min: {discount.minOrderValue.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                      {discount.freeShipping && (
                        <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 uppercase tracking-widest border-1 border-blue-100">
                          FREE SHIP
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-black tracking-tighter leading-none">-{discount.percentage}%</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Dialog>
      <Footer />
    </>
  );
};

export default Cart;
