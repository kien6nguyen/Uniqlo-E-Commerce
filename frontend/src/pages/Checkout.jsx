import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { RadioButton } from "primereact/radiobutton";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
const API_BASE_NOUSER = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
const LOCATION_API = "https://provinces.open-api.vn/api";
const Checkout = () => {
  const navigate = useNavigate();
  navigate;
  const toast = useRef(null);
  const noteTimeoutRef = useRef(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullname: "",
    email: "",
    phone: "",
  });

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [newAddress, setNewAddress] = useState({
    receiver: "",
    phone: "",
    address: "",
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);

  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  const [orderNote, setOrderNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [support, setSupport] = useState(false);

  const [shippingFee, setShippingFee] = useState(30000);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [addrForm, setAddrForm] = useState({
    provinceCode: null,
    districtCode: null,
    wardCode: null,
    addressDetail: ""
  });

  useEffect(() => {
    fetchProvinces();
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const selectedItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];
      setCart(selectedItems);

      const response = await fetch(`${API_BASE_NOUSER}/checkout/info`, {
        credentials: 'include',
        headers
      });

      const data = await response.json();

      if (data.success) {
        if (data.userData) {
          setUserInfo({
            fullname: data.userData.fullname,
            email: data.userData.email,
            phone: data.userData.phone
          });
          let userAddresses = data.userData.addresses || [];
          userAddresses.sort((a, b) => (b.isDefault === true) - (a.isDefault === true));
          setAddresses(userAddresses);
          setLoyaltyPoints(data.userData.loyaltyPoints || 0);

          if (userAddresses && userAddresses.length > 0) {
            setSelectedAddress(userAddresses[0]);
          }
        }
        else if (data.savedAddress) {
          setUserInfo({
            fullname: data.savedAddress.fullname,
            email: "",
            phone: data.savedAddress.phone
          });
          setSelectedAddress({
            receiver: data.savedAddress.fullname,
            phone: data.savedAddress.phone,
            address: data.savedAddress.address
          });
        }

        setAvailableDiscounts(data.discounts || []);

        const cartSummary = await fetch(`${API_BASE_NOUSER}/carts/summary`, {
          credentials: 'include',
          headers
        }).then(r => r.json());
        let currentDiscountsList = data.discounts || [];
        if (cartSummary.discountCode) {
          let appliedDiscountObj = currentDiscountsList.find(
            d => d.code === cartSummary.discountCode
          );

          if (!appliedDiscountObj) {
            const storedDiscount = localStorage.getItem("checkoutDiscount");
            if (storedDiscount) {
              try {
                const parsedDiscount = JSON.parse(storedDiscount);
                if (parsedDiscount.code === cartSummary.discountCode) {
                  appliedDiscountObj = parsedDiscount;

                  currentDiscountsList = [...currentDiscountsList, appliedDiscountObj];
                }
              } catch (e) {
                console.error("Lỗi parse discount từ storage", e);
              }
            }
          }

          setAvailableDiscounts(currentDiscountsList);

          if (appliedDiscountObj) {
            setSelectedDiscount(appliedDiscountObj);

            const subtotalForSelected = selectedItems.reduce((sum, it) => sum + (it.price || 0), 0);
            const discountValue = (subtotalForSelected * appliedDiscountObj.percentage) / 100;

            setDiscountAmount(discountValue);
            setFreeShipping(appliedDiscountObj.freeShipping || false);

            if (appliedDiscountObj.freeShipping) {
              setShippingFee(0);
            }
          }
        } else {
          setAvailableDiscounts(currentDiscountsList);
        }
        setShippingFee(cartSummary.freeShipping ? 0 : (cartSummary.shippingFee || 30000));
        setFreeShipping(cartSummary.freeShipping || false);

        setOrderNote(cartSummary.note || "");
      }
    } catch (err) {
      console.error("Load checkout data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await fetch(`${LOCATION_API}/?depth=1`);
      const data = await res.json();
      setProvinces(data);
    } catch (e) { console.error(e); }
  };

  const fetchDistricts = async (code) => {
    if (!code) return [];
    try {
      const res = await fetch(`${LOCATION_API}/p/${code}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts);
      return data.districts;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const fetchWards = async (code) => {
    if (!code) return [];
    try {
      const res = await fetch(`${LOCATION_API}/d/${code}?depth=2`);
      const data = await res.json();
      setWards(data.wards);
      return data.wards;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // Handler khi thay đổi Dropdown
  const onProvinceChange = (e) => {
    const code = e.value;
    setAddrForm(prev => ({ ...prev, provinceCode: code, districtCode: null, wardCode: null }));
    setDistricts([]);
    setWards([]);
    fetchDistricts(code);
  };

  const onDistrictChange = (e) => {
    const code = e.value;
    setAddrForm(prev => ({ ...prev, districtCode: code, wardCode: null }));
    setWards([]);
    fetchWards(code);
  };
  const calculateDiscount = (discount) => {
    if (!discount) {
      setDiscountAmount(0);
      setFreeShipping(false);
      setShippingFee(30000);
      return;
    }
    const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);

    // Kiểm tra điều kiện đơn hàng tối thiểu
    if (discount.minOrderValue > 0 && subtotal < discount.minOrderValue) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Không đủ điều kiện',
        detail: `Đơn hàng tối thiểu ${discount.minOrderValue.toLocaleString('vi-VN')}₫ để áp dụng mã này`,
        life: 5000
      });
      return;
    }

    const amount = (subtotal * discount.percentage) / 100;
    setDiscountAmount(amount);
    setFreeShipping(discount.freeShipping || false);
    setShippingFee(discount.freeShipping ? 0 : 30000);
  };

  const handleDiscountChange = (discount) => {
    setSelectedDiscount(discount);
    calculateDiscount(discount);
  };

  const handleSaveAddress = async () => {
    if (!newAddress.receiver || !newAddress.phone || !addrForm.provinceCode || !addrForm.districtCode || !addrForm.wardCode) {
      toast.current?.show({ severity: 'warn', summary: 'Chú ý', detail: 'Vui lòng điền đầy đủ thông tin', life: 3000 });
      return;
    }
    const provinceName = provinces.find(p => p.code === addrForm.provinceCode)?.name;
    const districtName = districts.find(d => d.code === addrForm.districtCode)?.name;
    const wardName = wards.find(w => w.code === addrForm.wardCode)?.name;
    const fullAddressStr = `${addrForm.addressDetail}, ${wardName}, ${districtName}, ${provinceName}`;
    const payload = {
      receiver: newAddress.receiver,
      phone: newAddress.phone,
      province: provinceName,
      district: districtName,
      ward: wardName,
      addressDetail: addrForm.addressDetail,
      address: fullAddressStr
    };

    if (isLoggedIn) {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };

        let res;
        if (isEditingAddress && newAddress._id) {
          res = await fetch(`${API_BASE}/user/me/addresses/${newAddress._id}`, { method: "PATCH", headers, body: JSON.stringify(payload) });
        } else {
          res = await fetch(`${API_BASE}/user/me/addresses`, { method: "POST", headers, body: JSON.stringify(payload) });
        }

        const data = await res.json();

        if (data.success) {
          if (isEditingAddress && newAddress._id) {
            const updatedAddress = data.address || {
              _id: newAddress._id,
              receiver: newAddress.receiver,
              phone: newAddress.phone,
              address: newAddress.address
            };

            setAddresses(prev => {
              const updated = prev.map(addr =>
                String(addr._id) === String(newAddress._id)
                  ? updatedAddress
                  : addr
              );
              return updated;
            });

            if (String(selectedAddress?._id) === String(newAddress._id)) {
              setSelectedAddress(updatedAddress);
            }

            toast.current?.show({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã cập nhật địa chỉ',
              life: 2000
            });
          } else {
            const newAddr = data.address || {
              _id: data.addressId || Date.now().toString(),
              receiver: newAddress.receiver,
              phone: newAddress.phone,
              address: newAddress.address
            };

            setAddresses(prev => [...prev, newAddr]);
            setSelectedAddress(newAddr);

            toast.current?.show({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã thêm địa chỉ mới',
              life: 2000
            });
          }

          setShowAddressDialog(false);
          setNewAddress({ receiver: "", phone: "", address: "" });
          setAddrForm({ provinceCode: null, districtCode: null, wardCode: null, addressDetail: "" });
          setIsEditingAddress(false);
        } else {
          toast.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: data.message || 'Không thể lưu địa chỉ',
            life: 3000
          });
        }
      } catch (err) {
        console.error("Save address error:", err);
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Lỗi khi lưu địa chỉ',
          life: 3000
        });
      }
    } else {
      const guestAddress = {
        _id: 'guest-' + Date.now(),
        receiver: payload.receiver,
        phone: payload.phone,
        address: payload.address
      };

      setSelectedAddress(guestAddress);
      setUserInfo({ ...userInfo, fullname: payload.receiver, phone: payload.phone });
      setShowAddressDialog(false);
      setNewAddress({ receiver: "", phone: "", address: "" });
      setAddrForm({ provinceCode: null, districtCode: null, wardCode: null, addressDetail: "" });
      setIsEditingAddress(false);

      toast.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã lưu địa chỉ',
        life: 2000
      });
    }
  };

  const handleAddNewAddress = () => {
    setNewAddress({ receiver: "", phone: "" });
    setAddrForm({ provinceCode: null, districtCode: null, wardCode: null, addressDetail: "" });
    setDistricts([]); setWards([]);
    setIsEditingAddress(false);
    setShowAddressDialog(true);
  };

  const handleEditAddress = async (address) => {
    setNewAddress({
      _id: address._id,
      receiver: address.receiver,
      phone: address.phone
    });
    setIsEditingAddress(true);

    let pCode = null;
    let dCode = null;
    let wCode = null;

    if (provinces.length > 0 && address.province) {
      const foundProvince = provinces.find(p => p.name === address.province);

      if (foundProvince) {
        pCode = foundProvince.code;

        const districtsList = await fetchDistricts(pCode);

        const foundDistrict = districtsList.find(d => d.name === address.district);

        if (foundDistrict) {
          dCode = foundDistrict.code;

          const wardsList = await fetchWards(dCode);

          const foundWard = wardsList.find(w => w.name === address.ward);

          if (foundWard) {
            wCode = foundWard.code;
          }
        }
      }
    }

    setAddrForm({
      provinceCode: pCode,
      districtCode: dCode,
      wardCode: wCode,
      addressDetail: address.addressDetail || ""
    });

    setShowAddressDialog(true);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
  };

  const handleNoteChange = (value) => {
    setOrderNote(value);

    if (noteTimeoutRef.current) {
      clearTimeout(noteTimeoutRef.current);
    }

    noteTimeoutRef.current = setTimeout(async () => {
      await updateNoteToServer(value);
    }, 1000);
  };

  const updateNoteToServer = async (note) => {
    setSavingNote(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/carts/note`, {
        method: "PUT",
        credentials: 'include',
        headers: headers,
        body: JSON.stringify({ note })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

    } catch (err) {
      console.error("Error updating note:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu ghi chú',
        life: 3000
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handlePayment = async () => {
    if (!userInfo.email) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Chú ý',
        detail: 'Vui lòng nhập email để nhận hóa đơn',
        life: 3000
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Chú ý',
        detail: 'Email không hợp lệ',
        life: 3000
      });
      return;
    }

    if (!selectedAddress || !selectedAddress.address) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Chú ý',
        detail: 'Vui lòng chọn địa chỉ giao hàng',
        life: 3000
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const orderItems = cart.map(item => ({
        product: item.product._id || item.product,
        quantity: item.quantity,
        variantId: item.variantId || null,
      }));

      const checkoutData = {
        items: orderItems,
        email: userInfo.email,
        fullname: selectedAddress.receiver || userInfo.fullname,
        phone: selectedAddress.phone || userInfo.phone,
        shippingAddress: selectedAddress.address,
        paymentMethod: paymentMethod,
        loyaltyPointsUsed: usePoints ? pointsToUse : 0,
        supportFee: support,
        note: orderNote,
        addToWishlist: true,
        discountCode: selectedDiscount ? selectedDiscount.code : null
      };

      const orderResponse = await fetch(`${API_BASE_NOUSER}/checkout`, {
        method: "POST",
        credentials: 'include',
        headers,
        body: JSON.stringify(checkoutData)
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: orderData.message || 'Không thể tạo đơn hàng',
          life: 3000
        });
        setLoading(false);
        return;
      }
      if (paymentMethod === 'vnpay') {
        const paymentResponse = await fetch(`${API_BASE}/payments/vnpay/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.order.id
          })
        });

        const paymentData = await paymentResponse.json();

        if (paymentData.success && paymentData.paymentUrl) {
          localStorage.removeItem("checkoutItems");
          window.location.href = paymentData.paymentUrl;
        } else {
          toast.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tạo link thanh toán',
            life: 3000
          });
          setLoading(false);
        }
      } else {
        localStorage.removeItem("checkoutItems");
        localStorage.removeItem("checkoutDiscount");
        setCreatedOrderId(orderData.order.id);
        setLoading(false);
        setShowSuccessDialog(true);
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra khi thanh toán',
        life: 3000
      });
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const tax = subtotal * 0.1;
  const supportFee = support ? 55000 : 0;
  const actualShippingFee = freeShipping ? 0 : shippingFee;
  let pointsDiscount = 0;
  if (usePoints) {
    const value = pointsToUse * 1000;
    const tempTotal = subtotal + tax + actualShippingFee + supportFee - discountAmount;
    pointsDiscount = Math.min(value, tempTotal);
  }

  const total = Math.max(subtotal + tax + actualShippingFee + supportFee - discountAmount - pointsDiscount, 0);
  if (loading) {
    return (
      <>
        <Header />
        <div className="p-5 text-center">Đang tải...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <Header />
      <div className="p-5 bg-gray-50 flex justify-content-center">
        <div style={{ width: "90vw", maxWidth: "1800px", margin: "0 auto", display: "flex", gap: "2rem" }}>

          <div className="surface-card border-round-lg shadow-2 p-4" style={{ flex: 2 }}>
            <h2 className="text-xl font-bold mb-3">Thông tin giao hàng</h2>

            <div className="mb-4">
              <label className="block font-bold mb-2">Email nhận hóa đơn *</label>
              <InputText
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                placeholder="example@email.com"
                className="w-full"
                disabled={isLoggedIn}
              />
            </div>

            {selectedAddress && selectedAddress.address && (
              <div className="p-3 mb-3 border-round-lg" style={{ border: "1px solid #d1d5db", backgroundColor: "#f9fafb" }}>
                <div className="flex justify-content-between align-items-start mb-2">
                  <div style={{ flex: 1 }}>
                    <div className="font-bold">{selectedAddress.receiver}</div>
                    <div className="text-sm text-700">{selectedAddress.phone}</div>
                    <div className="text-sm text-600 mt-1">{selectedAddress.address}</div>
                  </div>
                  <Button
                    label="Sửa"
                    text
                    size="small"
                    onClick={() => handleEditAddress(selectedAddress)}
                  />
                </div>
              </div>
            )}

            {isLoggedIn && addresses.length > 1 && (
              <div className="mb-3">
                <label className="block font-bold mb-2">Chọn địa chỉ khác</label>
                <Dropdown
                  value={selectedAddress}
                  options={addresses}
                  onChange={(e) => handleSelectAddress(e.value)}
                  optionLabel={(option) => `${option.receiver} - ${option.address}`}
                  placeholder="Chọn địa chỉ"
                  className="w-full"
                  itemTemplate={(option) => (
                    <div className="p-2 flex align-items-center justify-content-between">
                      <div>
                        <div className="font-bold flex align-items-center gap-2">
                          {option.receiver}
                          {/* Hiển thị Tag trong dropdown */}
                          {option.isDefault && <span className="bg-green-100 text-green-600 text-xs px-2 py-1 border-round font-normal">
                            Mặc định
                          </span>}
                        </div>
                        <div className="text-sm text-600">{option.phone}</div>
                        <div className="text-xs text-500">{option.address}</div>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            <div
              className="p-3 border-dashed text-center cursor-pointer mb-4 border-round-lg"
              style={{ border: "1px dashed #0d6efd", color: "#0d6efd" }}
              onClick={handleAddNewAddress}
            >
              + Thêm địa chỉ giao hàng mới
            </div>

            <div className="mb-4">
              <div className="flex justify-content-between align-items-center mb-2">
                <label className="block font-bold">Ghi chú đơn hàng</label>
                {savingNote && (
                  <span className="text-xs text-500">
                    <i className="pi pi-spin pi-spinner mr-1"></i>
                    Đang lưu...
                  </span>
                )}
              </div>
              <InputTextarea
                value={orderNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Ghi chú cho người bán (tùy chọn)"
                className="w-full"
                rows={3}
                autoResize
              />
            </div>

            <div className="mb-4">
              <div className="font-bold mb-3 text-lg">Phương thức thanh toán</div>

              <div className="flex flex-column gap-3">
                {/* Option 1: VNPAY */}
                <div
                  className={`p-3 border-round-lg flex align-items-center cursor-pointer ${paymentMethod === 'vnpay' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  style={{ border: paymentMethod === 'vnpay' ? "2px solid #2563eb" : "1px solid #d1d5db" }}
                  onClick={() => setPaymentMethod('vnpay')}
                >
                  <RadioButton
                    inputId="payment_vnpay"
                    name="payment"
                    value="vnpay"
                    onChange={(e) => setPaymentMethod(e.value)}
                    checked={paymentMethod === 'vnpay'}
                  />
                  <label htmlFor="payment_vnpay" className="ml-3 cursor-pointer flex-1">
                    <div className="font-bold text-900">Thanh toán VNPAY</div>
                    <div className="text-sm text-600">Thẻ ATM, Internet Banking, QR Code</div>
                  </label>
                  {paymentMethod === 'vnpay' && <i className="pi pi-check text-blue-600 font-bold"></i>}
                </div>

                {/* Option 2: COD */}
                <div
                  className={`p-3 border-round-lg flex align-items-center cursor-pointer ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  style={{ border: paymentMethod === 'cod' ? "2px solid #2563eb" : "1px solid #d1d5db" }}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <RadioButton
                    inputId="payment_cod"
                    name="payment"
                    value="cod"
                    onChange={(e) => setPaymentMethod(e.value)}
                    checked={paymentMethod === 'cod'}
                  />
                  <label htmlFor="payment_cod" className="ml-3 cursor-pointer flex-1">
                    <div className="font-bold text-900">Thanh toán khi nhận hàng (COD)</div>
                    <div className="text-sm text-600">Thanh toán tiền mặt khi giao hàng</div>
                  </label>
                  {paymentMethod === 'cod' && <i className="pi pi-check text-blue-600 font-bold"></i>}
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card border-round-lg shadow-2 p-4" style={{ flex: 1 }}>
            <h2 className="text-xl font-bold mb-3">Thông tin đơn hàng</h2>

            {cart.map((item) => {
              const product = item.product;
              return (
                <div key={item._id} className="flex align-items-center border-bottom-1 surface-border py-2">
                  <img
                    src={product?.images?.[0] || "/img/default.png"}
                    alt={product?.name}
                    style={{ width: 60, height: 60, objectFit: "contain" }}
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{product?.name}</div>
                    {(item.variantName || item.color) && (
                      <div className="text-xs text-500">
                        {item.variantName ? `Phân loại: ${item.variantName}` : ""}
                        {item.variantName && item.color ? " | " : ""}
                        {item.color ? `Màu: ${item.color}` : ""}
                      </div>
                    )}
                    <div className="text-xs text-500">SL: {item.quantity}</div>
                  </div>
                  <div className="font-bold text-sm">
                    {(item.price || 0).toLocaleString("vi-VN")}₫
                  </div>
                </div>
              );
            })}

            <div className="mt-4">
              <label className="block font-bold mb-2">Mã giảm giá</label>
              <Dropdown
                value={selectedDiscount}
                options={availableDiscounts}
                onChange={(e) => handleDiscountChange(e.value)}
                optionLabel={(option) => `${option.code} - Giảm ${option.percentage}%`}
                placeholder="Chọn mã giảm giá"
                className="w-full"
                showClear
                itemTemplate={(option) => (
                  <div className="p-2">
                    <div className="font-bold">{option.code}</div>
                    <div className="text-sm text-600">{option.description}</div>
                    {option.minOrderValue > 0 && (
                      <div className="text-xs text-orange-600">
                        Đơn tối thiểu: {option.minOrderValue.toLocaleString('vi-VN')}₫
                      </div>
                    )}
                    {option.freeShipping && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 border-round">FREE SHIP</span>
                    )}
                  </div>
                )}
              />
            </div>

            {isLoggedIn && loyaltyPoints > 0 && (
              <div className="mt-4">
                <div className="flex justify-content-between mb-2">
                  <span className="font-bold">Điểm tích lũy</span>
                  <span>{loyaltyPoints.toLocaleString("vi-VN")} điểm</span>
                </div>
                <div className="flex align-items-center">
                  <Checkbox
                    inputId="usePoints"
                    checked={usePoints}
                    onChange={(e) => {
                      setUsePoints(e.checked);
                      if (e.checked) {
                        setPointsToUse(loyaltyPoints);
                      } else {
                        setPointsToUse(0);
                      }
                    }}
                  />
                  <label htmlFor="usePoints" className="ml-2 text-sm">
                    Sử dụng {loyaltyPoints.toLocaleString("vi-VN")} điểm (Quy đổi: {(loyaltyPoints * 1000).toLocaleString("vi-VN")}₫)                  </label>
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="flex align-items-center justify-content-between">
                <div className="flex align-items-center">
                  <Checkbox
                    inputId="support"
                    checked={support}
                    onChange={(e) => setSupport(e.checked)}
                  />
                  <label htmlFor="support" className="ml-2">Hỗ trợ kỹ thuật</label>
                </div>
                <span className="font-bold">{support ? "55,000₫" : "0₫"}</span>
              </div>
            </div>

            <div className="mt-4 border-top-1 surface-border pt-3">
              <div className="flex justify-content-between mb-2">
                <span>Tổng tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span>Thuế (VAT 10%)</span>
                <span>{tax.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span>Phí vận chuyển</span>
                <span className={freeShipping ? 'text-green-600' : ''}>
                  {freeShipping ? 'MIỄN PHÍ' : `${actualShippingFee.toLocaleString("vi-VN")}₫`}
                </span>
              </div>
              {support && (
                <div className="flex justify-content-between mb-2">
                  <span>Hỗ trợ kỹ thuật</span>
                  <span>55,000₫</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-content-between mb-2 text-green-600">
                  <span>Giảm giá</span>
                  <span>-{discountAmount.toLocaleString("vi-VN")}₫</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-content-between mb-2 text-green-600">
                  <span>Điểm tích lũy</span>
                  <span>-{pointsDiscount.toLocaleString("vi-VN")}₫</span>
                </div>
              )}
              <div className="flex justify-content-between mb-3">
                <span className="font-bold text-lg">Thành tiền</span>
                <span className="font-bold text-lg text-red-500">
                  {total.toLocaleString("vi-VN")}₫
                </span>
              </div>

              <Button
                label={paymentMethod === 'vnpay' ? "THANH TOÁN VNPAY" : "ĐẶT HÀNG"} // Đổi label nút bấm
                className="w-full"
                style={{ backgroundColor: "#0d6efd", border: "none", fontWeight: "bold", height: "50px" }}
                onClick={handlePayment}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header={isEditingAddress ? "Sửa địa chỉ giao hàng" : "Thêm địa chỉ giao hàng"}
        visible={showAddressDialog}
        style={{ width: "500px" }}
        onHide={() => setShowAddressDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Hủy"
              text
              onClick={() => {
                setShowAddressDialog(false);
                setNewAddress({ receiver: "", phone: "", address: "" });
                setIsEditingAddress(false);
              }}
            />
            <Button
              label={isEditingAddress ? "Cập nhật" : "Lưu"}
              onClick={handleSaveAddress}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3">
          <div>
            <label className="block mb-1 font-semibold">Tên người nhận *</label>
            <InputText
              value={newAddress.receiver}
              onChange={(e) => setNewAddress({ ...newAddress, receiver: e.target.value })}
              className="w-full"
              placeholder="Họ và tên"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Số điện thoại *</label>
            <InputText
              value={newAddress.phone}
              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              className="w-full"
              placeholder="0xxx xxx xxx"
            />
          </div>
          <div className="flex flex-column gap-2">
            <label className="block font-semibold">Địa chỉ nhận hàng *</label>

            <Dropdown
              value={addrForm.provinceCode}
              options={provinces}
              optionLabel="name"
              optionValue="code"
              onChange={onProvinceChange}
              placeholder="Tỉnh/Thành phố"
              filter
              className="w-full"
            />

            <Dropdown
              value={addrForm.districtCode}
              options={districts}
              optionLabel="name"
              optionValue="code"
              onChange={onDistrictChange}
              placeholder="Quận/Huyện"
              disabled={!addrForm.provinceCode}
              filter
              className="w-full"
            />

            <Dropdown
              value={addrForm.wardCode}
              options={wards}
              optionLabel="name"
              optionValue="code"
              onChange={(e) => setAddrForm({ ...addrForm, wardCode: e.value })}
              placeholder="Xã/Phường"
              disabled={!addrForm.districtCode}
              filter
              className="w-full"
            />

            <InputText
              value={addrForm.addressDetail}
              onChange={(e) => setAddrForm({ ...addrForm, addressDetail: e.target.value })}
              placeholder="Số nhà, tên đường..."
              className="w-full"
            />
          </div>
        </div>
      </Dialog>
      <Dialog
        visible={showSuccessDialog}
        onHide={() => { }} // Không cho đóng bằng cách click ra ngoài để bắt buộc chọn action
        modal
        showHeader={false} // Ẩn header mặc định để tự custom cho đẹp
        style={{ width: '450px', borderRadius: '15px', overflow: 'hidden' }}
        contentStyle={{ padding: 0, borderRadius: '15px' }}
      >
        <div className="flex flex-column align-items-center justify-content-center p-5 text-center">
          <div
            className="flex align-items-center justify-content-center border-circle bg-green-100 mb-4"
            style={{ width: '80px', height: '80px' }}
          >
            <i className="pi pi-check text-green-600 text-5xl"></i>
          </div>

          <h2 className="text-900 font-bold mb-2">Đặt hàng thành công!</h2>
          <p className="text-600 line-height-3 mb-4">
            Cảm ơn bạn đã mua sắm. Đơn hàng
            <strong className="text-900 mx-1">#{createdOrderId?.slice(-6).toUpperCase()}</strong>
            đã được ghi nhận.
            <br />
            Vui lòng kiểm tra email để xem chi tiết.
          </p>

          <div className="flex flex-column gap-2 w-full">
            {isLoggedIn ? (
              <Button
                label="Xem đơn hàng của tôi"
                icon="pi pi-list"
                className="w-full border-round-lg"
                style={{ background: "#0d6efd", border: "none" }}
                onClick={() => navigate("/profile")}
              />
            ) : null}

            <Button
              label="Tiếp tục mua sắm"
              icon="pi pi-shopping-bag"
              className="w-full border-round-lg p-button-outlined p-button-secondary"
              onClick={() => navigate("/")}
            />
          </div>
        </div>
      </Dialog>
      <Footer />
    </>
  );
};
export default Checkout;
