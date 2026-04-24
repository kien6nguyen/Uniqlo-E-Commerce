import React, { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
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
      const headers = {
        "Content-Type": "application/json"
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
        <Header />
        <div className="p-5 text-center">Đang tải giỏ hàng...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <Header />
      <div className="p-5 bg-gray-50 flex justify-content-center">
        <div
          style={{
            width: "90vw",
            maxWidth: "1800px",
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-start",
            gap: "2rem",
          }}
        >
          <div
            className="surface-card border-round-lg shadow-2 transition-all transition-duration-200 hover:shadow-4"
            style={{
              background: "#fff",
              flex: 2,
              border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              padding: "20px 24px 24px 24px",
            }}
          >
            <div className="flex justify-content-between align-items-center mb-4">
              <h2 className="m-0 text-xl font-bold" style={{ paddingTop: "2px" }}>
                Giỏ hàng ({cart.length})
              </h2>
              {cart.length > 0 && (
                <Button
                  label="Xóa tất cả"
                  text
                  severity="danger"
                  onClick={() => setShowConfirm(true)}
                />
              )}
            </div>

            {cart.length === 0 ? (
              <p>🛒 Giỏ hàng trống</p>
            ) : (
              <>
                <div className="flex align-items-center border-bottom-1 surface-border font-bold text-sm pb-2 mb-2">
                  <Checkbox
                    checked={
                      selectedItems.length === cart.length && cart.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="mr-3"
                  />
                  <span className="flex-1">TẤT CẢ SẢN PHẨM</span>
                  <div className="w-7rem text-center">Đơn giá</div>
                  <div className="w-10rem text-center">Số lượng</div>
                  <div className="w-8rem text-center">Thành tiền</div>
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
                      className="flex align-items-center border-bottom-1 surface-border py-3 text-sm"
                    >
                      <Checkbox
                        checked={selectedItems.includes(item._id)}
                        onChange={() => toggleSelect(item._id)}
                        className="mr-3"
                      />
                      <div
                        className="flex align-items-center justify-content-center border-1 surface-border border-round-lg mr-3"
                        style={{
                          width: 80,
                          height: 80,
                          backgroundColor: "#fff",
                        }}
                      >
                        <img
                          src={productImg}
                          alt={productName}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                      <div className="flex flex-column flex-1">
                        {/* Tên sản phẩm có Link */}
                        <Link to={`/api/products/${product._id || product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <span className="font-medium hover:text-primary cursor-pointer transition-colors transition-duration-200">
                                {productName}
                            </span>
                        </Link>

                        {/* Chỉ hiển thị dòng phân loại NẾU có variantName hoặc color */}
                        {(item.variantName || item.color) && (
                          <span className="text-xs text-500 mt-1">
                            {item.variantName}
                            {(item.variantName && item.color) ? " - " : ""}
                            {item.color}
                          </span>
                        )}
                      </div>
                      <div className="w-7rem text-center font-bold">
                        {pricePerUnit.toLocaleString("vi-VN")}₫
                      </div>
                      <div className="w-10rem flex flex-column align-items-center gap-1">
                        <div className="flex align-items-center border-1 surface-border border-round-lg px-2">
                          <Button
                            icon="pi pi-minus"
                            text
                            size="small"
                            onClick={() => changeQty(item, -1)}
                          />
                          <span className="px-2">{item.quantity}</span>
                          <Button
                            icon="pi pi-plus"
                            text
                            size="small"
                            onClick={() => changeQty(item, 1)}
                          />
                        </div>
                        <Button
                          label="Xóa"
                          text
                          size="small"
                          className="p-0 text-sm text-red-500"
                          onClick={() => removeItem(item)}
                        />
                      </div>
                      <div className="w-8rem text-center font-bold text-red-500">
                        {totalItemPrice.toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div
            className="surface-card border-round-lg shadow-2 transition-all transition-duration-200 hover:shadow-4"
            style={{
              background: "#fff",
              flex: 1,
              border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              padding: "16px 24px 24px 24px",
            }}
          >
            <div>
              <h3
                className="font-bold mb-3"
                style={{
                  fontSize: "1.4rem",
                  lineHeight: "1.2",
                  margin: 0,
                  paddingTop: "4px",
                }}
              >
                Thanh toán
              </h3>

              <div className="mb-3 p-3 surface-50 border-round">
                <label className="block text-sm font-medium mb-2">Mã giảm giá</label>
                {appliedDiscount ? (
                  <div className="flex align-items-center justify-content-between gap-2 p-2 bg-green-50 border-round">
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-check-circle text-green-600"></i>
                      <span className="font-bold text-green-700">{appliedDiscount}</span>
                    </div>
                    <Button
                      icon="pi pi-times"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      onClick={handleRemoveDiscount}
                      tooltip="Xóa mã"
                    />
                  </div>
                ) : (
                  <Button
                    label="Chọn mã giảm giá"
                    icon="pi pi-tag"
                    outlined
                    className="w-full"
                    disabled={selectedItems.length === 0}
                    onClick={() => setShowDiscountDialog(true)}
                    tooltip={selectedItems.length === 0 ? "Vui lòng chọn sản phẩm trước" : ""}
                  />
                )}
              </div>

              <div className="flex justify-content-between mb-2">
                <span className="text-700 font-medium">Tổng tạm tính</span>
                <span className="font-bold text-700">
                  {selectedSubtotal.toLocaleString("vi-VN")}₫
                </span>
              </div>

              <div className="flex justify-content-between mb-2">
                <span className="text-700 font-medium">Thuế (VAT 10%)</span>
                <span className="font-bold text-700">
                  {selectedTax.toLocaleString("vi-VN")}₫
                </span>
              </div>

              <div className="flex justify-content-between mb-2">
                <span className="text-700 font-medium">Phí vận chuyển</span>
                <span className={`font-bold ${cartSummary.freeShipping ? 'text-green-600 line-through' : 'text-700'}`}>
                  {selectedShippingFee === 0 ? 'MIỄN PHÍ' : `${selectedShippingFee.toLocaleString("vi-VN")}₫`}
                </span>
              </div>

              {selectedDiscount > 0 && (
                <div className="flex justify-content-between mb-2">
                  <span className="text-700 font-medium">Giảm giá</span>
                  <span className="font-bold text-green-600">
                    -{selectedDiscount.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              )}

              <div className="flex justify-content-between mb-2">
                <span className="text-700 font-medium">Thành tiền</span>
                <span className="font-bold text-lg text-red-500">
                  {selectedTotal.toLocaleString("vi-VN")}₫
                </span>
              </div>

              <Button
                label="TIẾP TỤC"
                className="w-full mt-4"
                style={{
                  backgroundColor: "#0d6efd",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  height: "45px",
                  fontSize: "1rem",
                  letterSpacing: "0.3px",
                }}
                onClick={() => {
                  const selectedProducts = cart.filter((item) =>
                    selectedItems.includes(item._id)
                  );
                  if (selectedProducts.length === 0) {
                    toast.current?.show({
                      severity: 'warn',
                      summary: 'Chú ý',
                      detail: 'Vui lòng chọn ít nhất 1 sản phẩm để tiếp tục!',
                      life: 3000
                    });
                    return;
                  }
                  if (appliedDiscount) {
                    const discountFullObj = availableDiscounts.find(d => d.code === appliedDiscount);
                    if (discountFullObj) {
                      localStorage.setItem(
                        "checkoutDiscount",
                        JSON.stringify(discountFullObj)
                      );
                    }
                  } else {
                    localStorage.removeItem("checkoutDiscount");
                  }
                  localStorage.setItem(
                    "checkoutItems",
                    JSON.stringify(selectedProducts)
                  );
                  navigate("/checkout");
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header="Chú ý"
        visible={showConfirm}
        style={{ width: "400px" }}
        modal
        onHide={() => setShowConfirm(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Hủy bỏ" text onClick={() => setShowConfirm(false)} />
            <Button
              label="Đồng ý"
              severity="danger"
              onClick={() => {
                removeAll();
                setShowConfirm(false);
              }}
            />
          </div>
        }
      >
        <p>Bạn muốn xóa tất cả sản phẩm ra khỏi giỏ hàng?</p>
      </Dialog>

      <Dialog
        header="Chọn mã giảm giá"
        visible={showDiscountDialog}
        style={{ width: "450px" }}
        onHide={() => setShowDiscountDialog(false)}
      >
        <div className="flex flex-column gap-2">
          {availableDiscounts.length === 0 ? (
            <p className="text-center text-500">Không có mã giảm giá khả dụng</p>
          ) : (
            availableDiscounts.map((discount) => (
              <div
                key={discount._id}
                className="p-3 border-1 surface-border border-round cursor-pointer hover:surface-hover"
                onClick={() => handleApplyDiscount(discount)}
              >
                <div className="flex justify-content-between align-items-center">
                  <div>
                    <div className="font-bold text-lg">{discount.code}</div>
                    <div className="text-sm text-600">{discount.description}</div>
                    {discount.minOrderValue > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        Đơn tối thiểu: {discount.minOrderValue.toLocaleString('vi-VN')}₫
                      </div>
                    )}
                    {discount.freeShipping && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 border-round inline-block mt-1">
                        FREE SHIP
                      </div>
                    )}
                    <div className="text-sm text-500 mt-1">
                      Đã dùng: {discount.usedCount}/{discount.usageLimit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-red-500">
                      -{discount.percentage}%
                    </div>
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
