import React, { useState, useRef, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Password } from "primereact/password";
import { Dialog } from "primereact/dialog";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { useNavigate, useLocation } from "react-router-dom"; // Thêm để logout nếu cần
import Footer from "../components/Footer";

// Cấu hình API
const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;

const UserProfile = () => {
    const toast = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("token");

    // --- STATE USER & DATA ---
    const [user, setUser] = useState({
        fullname: "",
        email: "",
        phone: "",
        birthday: "",
        avatar: null,
        loyaltyPoints: 0,
        shippingAddress: []
    });

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- UI STATE ---
    const [activeIndex, setActiveIndex] = useState(0);
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

    // --- State Địa chỉ ---
    const [showAddressDialog, setShowAddressDialog] = useState(false);
    const [addressForm, setAddressForm] = useState({ receiver: "", phone: "", detail: "", province: null, district: null, ward: null });
    const [editingId, setEditingId] = useState(null);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // --- State Đơn hàng ---
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
    const [activeOrderStatus, setActiveOrderStatus] = useState('all');

    // --- 1. LOAD DATA TỪ API ---
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchUserData();
        fetchOrders();
        fetchProvinces();

        // Handle tab from query param
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab !== null) {
            setActiveIndex(parseInt(tab));
        }
    }, [token, location.search]);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`${API_URL}/user/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setUser(prev => ({ ...prev, ...data.data }));
            }
        } catch (err) {
            console.error("Lỗi load user:", err);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/orders`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const mappedOrders = data.orders.map(order => {
                    const subtotal = order.totalAmount || order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    const tax = order.tax || 0;
                    const supportFee = order.supportFee || 0;
                    const shippingFee = order.shippingFee !== undefined ? order.shippingFee : 30000;
                    const finalAmount = order.finalAmount;

                    let calculatedDiscount = (subtotal + tax + shippingFee + supportFee) - finalAmount;
                    if (calculatedDiscount < 0) calculatedDiscount = 0;
                    return {
                        id: order._id,
                        note: order.note || "",
                        date: new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
                        subtotal: subtotal,
                        tax: tax,
                        supportFee: supportFee,
                        shippingFee: shippingFee,
                        discount: calculatedDiscount,
                        total: finalAmount,

                        receiverName: order.shippingAddress?.receiver || "N/A",
                        receiverPhone: order.shippingAddress?.phone || "N/A",
                        shippingAddress: order.shippingAddress?.address || "N/A",
                        paymentMethod: order.payment?.method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán online',
                        status: mapStatus(order.status),
                        items: order.items.map(item => ({
                            name: item.product?.name || "Sản phẩm đã xóa",
                            price: item.price,
                            qty: item.quantity,
                            img: item.product?.images?.[0] ? `${item.product.images[0].replace(/\\/g, "/")}` : null
                        })),
                        history: order.history?.map(h => ({
                            status: mapStatus(h.status, true),
                            time: new Date(h.timestamp || Date.now()).toLocaleString('vi-VN'),
                            note: h.note || getStatusNote(h.status)
                        })) || []
                    };
                });
                setOrders(mappedOrders);
            }
        } catch (err) {
            console.error("Lỗi load orders:", err);
        } finally {
            setLoading(false);
        }
    };
    const handleSetDefaultAddress = async (id) => {
        try {
            const res = await fetch(`${API_URL}/user/me/addresses/${id}/default`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Sắp xếp lại ở client để địa chỉ mặc định lên đầu (tuỳ chọn)
                const sortedAddresses = data.addresses.sort((a, b) => (b.isDefault === true) - (a.isDefault === true));
                
                setUser(prev => ({ ...prev, shippingAddress: sortedAddresses }));
                toast.current.show({ severity: "success", summary: "Thành công", detail: "Đã thay đổi địa chỉ mặc định" });
            } else {
                toast.current.show({ severity: "error", summary: "Lỗi", detail: data.error });
            }
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Lỗi", detail: err.message });
        }
    };
    const mapStatus = (status, toLabel = false) => {
        const s = status ? status.toLowerCase() : '';

        if (toLabel) {
            if (s === 'pending') return 'Đang xử lý';
            if (s === 'processing') return 'Đang xử lý';
            if (s === 'paid') return 'Đang vận chuyển';
            if (s === 'shipping' || s === 'shipped') return 'Đang vận chuyển';
            if (s === 'delivered' || s === 'completed') return 'Giao thành công';
            if (s === 'cancelled') return 'Đã hủy';
            return status;
        } else {
            if (s === 'pending') return 'processing';
            if (s === 'processing') return 'processing';
            if (s === 'paid') return 'shipping';
            if (s === 'shipping' || s === 'shipped') return 'shipping';
            if (s === 'delivered' || s === 'completed') return 'delivered';
            if (s === 'cancelled') return 'cancelled';
            return 'processing';
        }
    };

    const getStatusNote = (status) => {
        const s = status ? status.toLowerCase() : '';
        if (s === 'pending') return 'Đơn hàng đang chờ xác nhận';
        if (s === 'shipped') return 'Đơn hàng đã được giao cho đơn vị vận chuyển';
        if (s === 'completed') return 'Giao hàng thành công';
        if (s === 'cancelled') return 'Đơn hàng đã bị hủy';
        return '';
    };

    // --- API ĐỊA CHÍNH (GIỮ NGUYÊN) ---
    const fetchProvinces = () => {
        fetch("https://provinces.open-api.vn/api/p/").then(res => res.json()).then(setProvinces).catch(console.error);
    };
    useEffect(() => {
        if (addressForm.province) {
            fetch(`https://provinces.open-api.vn/api/p/${addressForm.province.code}?depth=2`).then(res => res.json()).then(data => setDistricts(data.districts || []));
        } else setDistricts([]);
        if (!editingId) setAddressForm(prev => ({ ...prev, district: null, ward: null }));
    }, [addressForm.province]);

    useEffect(() => {
        if (addressForm.district) {
            fetch(`https://provinces.open-api.vn/api/d/${addressForm.district.code}?depth=2`).then(res => res.json()).then(data => setWards(data.wards || []));
        } else setWards([]);
        if (!editingId) setAddressForm(prev => ({ ...prev, ward: null }));
    }, [addressForm.district]);


    // --- HANDLERS LOGIC ---

    // 1. Cập nhật thông tin cá nhân
    const handleUpdateProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/user/me`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullname: user.fullname,
                    phone: user.phone,
                    birthday: user.birthday
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.current.show({ severity: "success", summary: "Thành công", detail: "Cập nhật hồ sơ thành công" });
                localStorage.setItem("user", JSON.stringify(data.data)); // Update local storage
            } else {
                toast.current.show({ severity: "error", summary: "Lỗi", detail: data.error?.message || "Lỗi cập nhật" });
            }
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Lỗi", detail: err.message });
        }
    };

    // 2. Lưu địa chỉ (Thêm/Sửa)
    const handleSaveAddress = async () => {
        if (!addressForm.receiver || !addressForm.phone || !addressForm.province || !addressForm.district || !addressForm.ward) {
            toast.current.show({ severity: "warn", summary: "Thiếu thông tin", detail: "Vui lòng điền đầy đủ" });
            return;
        }

        // Chuẩn bị payload gửi lên server (gửi tên hành chính)
        const payload = {
            receiver: addressForm.receiver,
            phone: addressForm.phone,
            province: addressForm.province.name,
            district: addressForm.district.name,
            ward: addressForm.ward.name,
            addressDetail: addressForm.detail
        };

        try {
            const method = editingId ? "PATCH" : "POST";
            const url = editingId ? `${API_URL}/user/me/addresses/${editingId}` : `${API_URL}/user/me/addresses`;

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setUser(prev => ({ ...prev, shippingAddress: data.addresses })); // Cập nhật state list địa chỉ
                toast.current.show({ severity: "success", summary: "Thành công", detail: editingId ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ mới" });
                setShowAddressDialog(false);
                setAddressForm({ receiver: "", phone: "", detail: "", province: null, district: null, ward: null });
                setEditingId(null);
            } else {
                toast.current.show({ severity: "error", summary: "Lỗi", detail: data.error });
            }
        } catch (err) {
            console.error(err);
            toast.current.show({ severity: "error", summary: "Lỗi", detail: "Không thể lưu địa chỉ" });
        }
    }

    const handleEditAddress = (addr) => {
        // Lưu ý: Logic này đang chỉ set text vào form. Để set đúng Dropdown province/district/ward, 
        // cần logic phức tạp hơn để find object trong mảng provinces. 
        // Ở đây ta set text tạm để hiển thị, user cần chọn lại địa điểm nếu muốn sửa.
        setEditingId(addr._id);
        setAddressForm({
            receiver: addr.receiver,
            phone: addr.phone,
            detail: addr.addressDetail || "", // Backend nên trả về addressDetail riêng
            province: null, // Reset dropdown để user chọn lại (đơn giản hóa)
            district: null,
            ward: null
        });
        setShowAddressDialog(true);
        toast.current.show({ severity: "info", summary: "Chỉnh sửa", detail: "Vui lòng chọn lại Tỉnh/Huyện/Xã để cập nhật chính xác" });
    }

    // 3. Xóa địa chỉ
    const handleDeleteAddress = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
            try {
                const res = await fetch(`${API_URL}/user/me/addresses/${id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setUser(prev => ({ ...prev, shippingAddress: data.addresses }));
                    toast.current.show({ severity: "warn", summary: "Đã xóa", detail: "Xóa địa chỉ thành công" });
                }
            } catch (err) {
                toast.current.show({ severity: "error", summary: "Lỗi", detail: err.message });
            }
        }
    }



    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            toast.current.show({ severity: "warn", summary: "Lỗi", detail: "Mật khẩu xác nhận không khớp" });
            return;
        }
        try {
            const res = await fetch(`${API_URL}/user/me/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new,
                    confirmPassword: passwords.confirm
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.current.show({ severity: "success", summary: "Thành công", detail: "Đổi mật khẩu thành công" });
                setPasswords({ current: "", new: "", confirm: "" });
            } else {
                toast.current.show({ severity: "error", summary: "Thất bại", detail: data.error?.message || "Lỗi đổi mật khẩu" });
            }
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Lỗi", detail: err.message });
        }
    }

    // --- HELPER ĐƠN HÀNG UI ---
    const getStatusSeverity = (status) => {
        switch (status) {
            case 'delivered': return 'success';
            case 'shipping': return 'info';
            case 'processing': return 'warning';
            case 'cancelled': return 'danger';
            default: return null;
        }
    };

    const getStatusLabel = (status) => {
        const map = { delivered: 'Giao thành công', shipping: 'Đang vận chuyển', processing: 'Đang xử lý', cancelled: 'Đã hủy' };
        return map[status] || status;
    };

    // --- LỌC ĐƠN HÀNG ---
    const orderTabs = [
        { label: 'Tất cả', value: 'all' },
        { label: 'Chờ xác nhận', value: 'processing' },
        { label: 'Đang giao', value: 'shipping' },
        { label: 'Hoàn thành', value: 'delivered' },
        { label: 'Đã hủy', value: 'cancelled' }
    ];

    const filteredOrders = orders.filter(order => {
        if (activeOrderStatus === 'all') return true;
        return order.status === activeOrderStatus;
    });

    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDialog(true);
    }

    const onUploadAvatar = (event) => {
        // Chỉ là Frontend preview, chưa có API upload avatar user
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setUser({ ...user, avatar: e.target.result });
            reader.readAsDataURL(file);
            toast.current.show({ severity: 'info', summary: 'Info', detail: 'Chức năng upload avatar chưa có API backend' });
        }
    };

    const menuItems = [
        { label: "Hồ sơ của tôi", icon: "pi pi-user", index: 0 },
        { label: "Địa chỉ nhận hàng", icon: "pi pi-map-marker", index: 1 },
        { label: "Đổi mật khẩu", icon: "pi pi-lock", index: 2 },
        { label: "Đơn mua", icon: "pi pi-shopping-bag", index: 3, badge: orders.length },
        { label: "Đăng xuất", icon: "pi pi-sign-out", index: 4, isLogout: true },
    ];

    return (
        <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", fontFamily: 'Inter, sans-serif', color: '#111' }}>
            <Toast ref={toast} />

            <div className="p-4 md:py-8" style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Header Profile */}
                <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-4 mb-8 pb-6 border-bottom-2 border-900">
                    <div className="flex align-items-center gap-5 w-full md:w-auto">
                        <div className="relative group">
                            <div className="p-1 border-1 border-300 border-circle transition-all group-hover:border-900">
                                <Avatar image={user.avatar} icon={!user.avatar && "pi pi-user"} size="xlarge" shape="circle" style={{ width: '80px', height: '80px', color: '#111', backgroundColor: '#f9f9f9' }} />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-white border-circle p-2 shadow-2 cursor-pointer hover:bg-gray-100 transition-all flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', border: '1px solid #111' }}>
                                <label htmlFor="avatar-upload" className="cursor-pointer flex align-items-center justify-content-center w-full h-full"><i className="pi pi-camera" style={{ fontSize: '14px', color: '#111' }}></i></label>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={onUploadAvatar} style={{ display: 'none' }} />
                            </div>
                        </div>
                        <div className="flex flex-column gap-1">
                            <div className="flex align-items-center gap-2">
                                <h2 className="m-0 text-3xl font-black text-900 tracking-tighter uppercase">{user.fullname || "Khách hàng"}</h2>
                                <Tag value="Thành viên" className="bg-gray-900 text-white text-[10px] uppercase font-black px-2"></Tag>
                            </div>
                            <div className="flex align-items-center gap-3 text-sm text-500 font-bold uppercase tracking-widest mt-1">
                                <span>{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex justify-content-start md:justify-content-end align-items-center gap-4">
                        <div className="flex flex-column align-items-end text-right">
                            <span className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Điểm tích lũy</span>
                            <span className="text-3xl font-black text-900 tracking-tighter">{(user.loyaltyPoints || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="grid align-items-stretch gap-6 md:gap-0">
                    {/* Menu */}
                    <div className="col-12 md:col-3 pr-0 md:pr-6">
                        <div className="h-full flex flex-column">
                            <h4 className="mt-0 mb-5 text-900 uppercase text-sm font-black tracking-widest border-bottom-2 border-900 pb-3">Tài khoản</h4>
                            <div className="flex flex-column">
                                {menuItems.map((item) => {
                                    const isActive = activeIndex === item.index;
                                    return (
                                        <div key={item.index} onClick={() => {
                                            if (item.isLogout) {
                                                if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
                                                    localStorage.removeItem("token");
                                                    localStorage.removeItem("user");
                                                    window.location.href = "/login";
                                                }
                                                return;
                                            }
                                            setActiveIndex(item.index);
                                            navigate(`/profile?tab=${item.index}`, { replace: true });
                                        }} className={`flex align-items-center justify-content-between py-4 border-bottom-1 border-200 cursor-pointer transition-all duration-300 select-none group ${isActive ? 'surface-100' : 'hover:surface-50'}`} style={{ borderLeft: isActive ? '4px solid #111' : '4px solid transparent', paddingLeft: '1rem', paddingRight: '1rem' }}>
                                            <div className="flex align-items-center gap-3">
                                                <i className={`${item.icon} ${isActive ? 'text-900' : 'text-500'} group-hover:text-900 transition-colors`} style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}></i>
                                                <span className={`text-xs uppercase tracking-widest font-bold ${isActive ? 'text-900' : 'text-600 group-hover:text-900'} ${item.isLogout ? 'text-red-600 group-hover:text-red-700' : ''}`}>{item.label}</span>
                                            </div>
                                            {item.badge > 0 && <span className="text-white border-circle flex align-items-center justify-content-center font-bold text-[9px]" style={{ width: '20px', height: '20px', backgroundColor: '#dc2626' }}>{item.badge}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-12 md:col-9">
                        <div className="h-full flex flex-column" style={{ minHeight: '600px' }}>

                            {/* TAB 0: Hồ sơ */}
                            {activeIndex === 0 && (
                                <div className="fadein animation-duration-400 flex-1 flex flex-column">
                                    <div className="border-bottom-2 border-900 pb-3 mb-6"><h3 className="text-xl font-bold text-900 m-0 uppercase tracking-tight">Hồ sơ của tôi</h3><p className="text-600 text-sm m-0 mt-2 font-medium">Quản lý thông tin cá nhân</p></div>
                                    <div className="grid formgrid p-fluid flex-1 align-content-start" style={{ rowGap: '2rem' }}>
                                        <div className="field col-12 md:col-6"><label className="font-bold text-900 uppercase text-xs tracking-widest mb-3 block">Họ và tên</label><InputText value={user.fullname} onChange={(e) => setUser({ ...user, fullname: e.target.value })} className="surface-0 border-1 border-400 text-900 border-noround p-3 focus:border-900 transition-colors shadow-none" placeholder="Nhập họ và tên" /></div>
                                        <div className="field col-12 md:col-6"><label className="font-bold text-900 uppercase text-xs tracking-widest mb-3 block">Email</label><InputText value={user.email} disabled className="surface-100 text-500 border-1 border-200 border-noround p-3 cursor-not-allowed" /></div>
                                    </div>
                                    <div className="mt-8 border-top-1 surface-border pt-6"><Button label="Lưu thay đổi" onClick={handleUpdateProfile} className="border-noround font-bold uppercase tracking-widest px-8 py-3 text-xs transition-colors border-none cursor-pointer" style={{ backgroundColor: '#111', color: '#fff' }} /></div>
                                </div>
                            )}

                            {/* TAB 1: Địa chỉ */}
                            {activeIndex === 1 && (
                                <div className="fadein animation-duration-400 h-full flex flex-column">
                                    <div className="flex justify-content-between align-items-center mb-6 pb-3 border-bottom-2 border-900">
                                        <div><h3 className="text-xl font-bold text-900 m-0 uppercase tracking-tight">Địa chỉ của tôi</h3></div>
                                        <Button label="Thêm địa chỉ" icon="pi pi-plus" size="small" onClick={() => { setEditingId(null); setAddressForm({ receiver: "", phone: "", detail: "", province: null, district: null, ward: null }); setShowAddressDialog(true) }} className="border-noround font-bold uppercase tracking-widest text-xs px-4 py-2 border-none cursor-pointer" style={{ backgroundColor: '#111', color: '#fff' }} />
                                    </div>
                                    <div className="flex flex-column flex-1">
                                        {user.shippingAddress && user.shippingAddress.length > 0 ? 
                                          // Sort: Đưa địa chỉ mặc định lên đầu
                                          [...user.shippingAddress].sort((a, b) => (b.isDefault === true) - (a.isDefault === true)).map((addr) => (
                                            <div key={addr._id} className={`border-bottom-1 py-5 bg-white relative ${addr.isDefault ? 'border-900' : 'surface-border'}`}>
                                                <div className="flex justify-content-between align-items-start">
                                                    <div className="flex-1">
                                                        <div className="flex align-items-center gap-3 mb-2">
                                                            <span className="font-bold text-900 text-base uppercase">{addr.receiver}</span>
                                                            <span className="text-400">|</span>
                                                            <span className="text-700 text-sm font-medium">{addr.phone}</span>
                                                            
                                                            {/* HIỂN THỊ TAG MẶC ĐỊNH */}
                                                            {addr.isDefault && (
                                                                <span className="border-1 border-900 text-900 text-[10px] uppercase font-bold px-2 py-1 ml-2">Mặc định</span>
                                                            )}
                                                        </div>
                                                        <p className="m-0 text-700 text-sm mt-3 line-height-3">{addr.address}</p>
                                                        
                                                        {/* NÚT ĐẶT MẶC ĐỊNH */}
                                                        {!addr.isDefault && (
                                                            <span 
                                                                className="inline-block mt-3 text-xs font-bold text-600 hover:text-900 cursor-pointer uppercase tracking-widest border-bottom-1 border-transparent hover:border-900 transition-colors" 
                                                                onClick={() => handleSetDefaultAddress(addr._id)}
                                                            >
                                                                Đặt làm mặc định
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex gap-4 ml-4">
                                                        <span className="text-xs font-bold text-600 hover:text-900 cursor-pointer uppercase tracking-widest transition-colors" onClick={() => handleEditAddress(addr)}>Sửa</span>
                                                        {!addr.isDefault && (
                                                            <span className="text-xs font-bold text-400 hover:text-red-600 cursor-pointer uppercase tracking-widest transition-colors" onClick={() => handleDeleteAddress(addr._id)}>Xóa</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <div className="text-center py-8"><p className="text-500 font-medium text-sm">Chưa có địa chỉ nào được lưu.</p></div>}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Đổi mật khẩu */}
                            {activeIndex === 2 && (
                                <div className="fadein animation-duration-300 h-full flex flex-column">
                                    <div className="border-bottom-2 border-900 pb-3 mb-6"><h3 className="text-xl font-bold text-900 m-0 uppercase tracking-tight">Đổi mật khẩu</h3><p className="text-600 text-sm m-0 mt-2 font-medium">Bảo mật tài khoản của bạn</p></div>
                                    <div className="flex flex-column gap-5 flex-1" style={{ maxWidth: "400px" }}>
                                        <div className="flex flex-column gap-2"><label className="font-bold text-900 uppercase text-xs tracking-widest block">Mật khẩu hiện tại</label><Password value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} toggleMask feedback={false} inputClassName="w-full surface-0 border-1 border-400 text-900 border-noround p-3 focus:border-900 transition-colors shadow-none" className="w-full" /></div>
                                        <div className="flex flex-column gap-2"><label className="font-bold text-900 uppercase text-xs tracking-widest block">Mật khẩu mới</label><Password value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} toggleMask inputClassName="w-full surface-0 border-1 border-400 text-900 border-noround p-3 focus:border-900 transition-colors shadow-none" className="w-full" /></div>
                                        <div className="flex flex-column gap-2"><label className="font-bold text-900 uppercase text-xs tracking-widest block">Xác nhận mật khẩu mới</label><Password value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} toggleMask feedback={false} inputClassName="w-full surface-0 border-1 border-400 text-900 border-noround p-3 focus:border-900 transition-colors shadow-none" className="w-full" /></div>
                                        <div className="mt-5"><Button label="Cập nhật mật khẩu" onClick={handleChangePassword} className="border-noround font-bold uppercase tracking-widest px-8 py-3 text-xs transition-colors border-none cursor-pointer" style={{ backgroundColor: '#111', color: '#fff' }} /></div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: Đơn mua */}
                            {activeIndex === 3 && (
                                <div className="fadein animation-duration-300 h-full flex flex-column">
                                    <div className="border-bottom-2 border-900 pb-3 mb-4 flex justify-content-between align-items-center">
                                        <div>
                                            <h3 className="text-xl font-bold text-900 m-0 uppercase tracking-tight">Đơn hàng của tôi</h3>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 overflow-x-auto pb-3 mb-5 border-bottom-1 surface-border">
                                        {orderTabs.map((tab) => (
                                            <span
                                                key={tab.value}
                                                onClick={() => setActiveOrderStatus(tab.value)}
                                                className={`cursor-pointer white-space-nowrap font-bold text-xs uppercase tracking-widest transition-colors ${activeOrderStatus === tab.value ? 'text-900 border-bottom-2 border-900 pb-3 -mb-3' : 'text-500 hover:text-900'}`}
                                            >
                                                {tab.label}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex flex-column flex-1 overflow-y-auto pr-2">
                                        {filteredOrders.length === 0 ? (
                                            <div className="text-center py-8">
                                                <i className="pi pi-box text-300 text-5xl mb-3"></i>
                                                <p className="text-500 font-bold uppercase text-xs tracking-widest">{loading ? "Đang tải đơn hàng..." : "Không có đơn hàng nào."}</p>
                                            </div>
                                        ) : (
                                            filteredOrders.map((order) => (
                                                <div key={order.id} className="border-bottom-1 surface-border py-6 bg-white group">
                                                    <div className="flex justify-content-between align-items-center mb-5 pb-3 border-bottom-1 border-100">
                                                        <div className="flex flex-column gap-1">
                                                            <span className="font-bold text-900 uppercase text-sm tracking-tight">Đơn hàng #{order.id.slice(-6).toUpperCase()}</span>
                                                            <span className="text-[10px] text-500 font-bold uppercase tracking-widest">{order.date}</span>
                                                        </div>
                                                        <span className="border-1 border-900 text-900 text-[10px] font-bold uppercase px-2 py-1">{getStatusLabel(order.status)}</span>
                                                    </div>
                                                    <div className="flex flex-column gap-4">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex gap-4 align-items-center">
                                                                <div className="w-16 h-20 border-1 surface-border flex align-items-center justify-content-center p-1 bg-white overflow-hidden">
                                                                    <img src={item.img || "/img/default.png"} alt={item.name} className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="m-0 font-bold text-900 text-sm uppercase tracking-tight truncate mb-1">{item.name}</p>
                                                                    <div className="flex justify-content-between align-items-center mt-2">
                                                                        <span className="text-xs font-medium text-600 uppercase tracking-widest">SL: {item.qty}</span>
                                                                        <span className="text-sm font-bold text-900">{item.price.toLocaleString()}₫</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-content-between align-items-center mt-6 pt-4 border-top-1 border-100">
                                                        <div className="flex flex-column gap-1">
                                                            <span className="text-[10px] text-500 font-bold uppercase tracking-widest">Tổng thanh toán</span>
                                                            <span className="text-xl font-black text-900 tracking-tighter">{order.total.toLocaleString()}₫</span>
                                                        </div>
                                                        <Button label="Xem chi tiết" size="small" className="border-1 border-900 surface-0 text-900 font-bold uppercase tracking-widest text-[10px] px-4 py-2 hover:bg-gray-900 hover:text-white transition-colors" onClick={() => viewOrderDetails(order)} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialog Địa chỉ */}
            <Dialog header={<div className="text-center font-bold text-xl uppercase tracking-widest border-bottom-2 border-900 pb-3">{editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</div>} visible={showAddressDialog} style={{ width: '580px' }} modal onHide={() => setShowAddressDialog(false)}>
                <div className="flex flex-column gap-4 mt-4">
                    <div><label className="block mb-2 font-bold text-900 text-xs uppercase tracking-widest">Họ tên người nhận</label><InputText value={addressForm.receiver} onChange={(e) => setAddressForm({ ...addressForm, receiver: e.target.value })} className="w-full border-noround border-1 border-400 p-3 focus:border-900" placeholder="Ví dụ: Nguyễn Văn A" /></div>
                    <div><label className="block mb-2 font-bold text-900 text-xs uppercase tracking-widest">Số điện thoại</label><InputText value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="w-full border-noround border-1 border-400 p-3 focus:border-900" keyfilter="int" maxLength={10} placeholder="Nhập 10 số điện thoại" /></div>
                    <div className="grid">
                        <div className="col-4"><Dropdown value={addressForm.province} options={provinces} optionLabel="name" onChange={(e) => setAddressForm({ ...addressForm, province: e.value })} placeholder="Tỉnh/Thành" className="w-full border-noround border-1 border-400 focus:border-900" filter /></div>
                        <div className="col-4"><Dropdown value={addressForm.district} options={districts} optionLabel="name" onChange={(e) => setAddressForm({ ...addressForm, district: e.value })} placeholder="Quận/Huyện" className="w-full border-noround border-1 border-400 focus:border-900" disabled={!addressForm.province} filter /></div>
                        <div className="col-4"><Dropdown value={addressForm.ward} options={wards} optionLabel="name" onChange={(e) => setAddressForm({ ...addressForm, ward: e.value })} placeholder="Phường/Xã" className="w-full border-noround border-1 border-400 focus:border-900" disabled={!addressForm.district} filter /></div>
                    </div>
                    <InputText value={addressForm.detail} onChange={(e) => setAddressForm({ ...addressForm, detail: e.target.value })} placeholder="Địa chỉ chi tiết" className="w-full border-noround border-1 border-400 p-3 focus:border-900 mt-2" />
                    <div className="flex justify-content-end gap-3 mt-4">
                        <Button label="Hủy" className="border-noround bg-white text-900 border-1 border-900 px-5 font-bold uppercase tracking-widest text-xs" onClick={() => setShowAddressDialog(false)} />
                        <Button label="Lưu địa chỉ" className="border-noround border-none cursor-pointer px-5 font-bold uppercase tracking-widest text-xs" style={{ backgroundColor: '#111', color: '#fff' }} onClick={handleSaveAddress} />
                    </div>
                </div>
            </Dialog>

            {/* Dialog Chi tiết đơn hàng */}
            <Dialog
                visible={showOrderDialog}
                style={{ width: '800px', maxWidth: '95%' }}
                modal
                onHide={() => setShowOrderDialog(false)}
                header={<div className="font-bold uppercase tracking-widest text-lg">Chi tiết đơn hàng</div>}
                contentStyle={{ backgroundColor: '#ffffff', padding: '1.5rem' }}
                headerStyle={{ borderBottom: '2px solid #111', backgroundColor: '#fff', color: '#111', paddingBottom: '1rem' }}
            >
                {selectedOrder && (
                    <div className="flex flex-column gap-5 mt-4">
                        <div className="bg-white pb-4 border-bottom-1 surface-border flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center">
                            <div className="flex flex-column gap-1">
                                <span className="text-500 text-xs font-bold uppercase tracking-widest">Mã đơn hàng / Thời gian</span>
                                <div className="flex align-items-center gap-2 mt-1">
                                    <span className="text-900 text-2xl font-black">#{selectedOrder.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <span className="text-700 text-sm font-medium">{selectedOrder.date}</span>
                            </div>
                            <div className="mt-3 md:mt-0">
                                <span className="border-1 border-900 text-900 text-xs px-3 py-2 font-bold uppercase">{getStatusLabel(selectedOrder.status)}</span>
                            </div>
                        </div>

                        <div className="grid">
                            <div className="col-12 md:col-7">
                                <div className="bg-white h-full">
                                    <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                                        <span className="font-bold text-900 uppercase text-sm tracking-widest">Địa chỉ nhận hàng</span>
                                    </div>

                                    <div className="flex flex-column gap-1">
                                        <span className="text-900 font-bold text-base uppercase">{selectedOrder.receiverName}</span>
                                        <span className="text-700 font-medium my-1">{selectedOrder.receiverPhone}</span>
                                        <span className="text-700 line-height-3">{selectedOrder.shippingAddress}</span>
                                    </div>
                                </div>
                            </div>
                            {selectedOrder.note && (
                                <div className="mt-3 pt-3 border-top-1 surface-border">
                                    <div className="flex align-items-center gap-2 mb-2">
                                        <span className="font-bold text-900 text-sm uppercase tracking-widest">Ghi chú từ bạn:</span>
                                    </div>
                                    <p className="m-0 text-700 font-italic bg-gray-50 p-3 text-sm">
                                        "{selectedOrder.note}"
                                    </p>
                                </div>
                            )}
                            <div className="col-12 md:col-5">
                                <div className="bg-white h-full">
                                    <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                                        <span className="font-bold text-900 uppercase text-sm tracking-widest">Thanh toán</span>
                                    </div>
                                    <div className="flex flex-column gap-3">
                                        <div>
                                            <span className="block text-500 text-xs mb-1 uppercase tracking-widest font-bold">Phương thức</span>
                                            <span className="text-900 font-bold text-sm uppercase">{selectedOrder.paymentMethod}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden mt-2">
                            <div className="pb-3 border-bottom-1 border-900">
                                <span className="font-bold text-900 uppercase text-sm tracking-widest">Chi tiết sản phẩm</span>
                            </div>

                            <div className="py-4 flex flex-column gap-4">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className={`flex gap-3 align-items-center ${idx !== selectedOrder.items.length - 1 ? 'border-bottom-1 surface-border pb-4' : ''}`}>
                                        <div className="w-4rem h-5rem border-1 surface-border bg-white flex align-items-center justify-content-center flex-shrink-0">
                                            <img src={item.img || "/img/default.png"} alt={item.name} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div className="flex-1 flex justify-content-between align-items-center">
                                            <div>
                                                <p className="m-0 font-bold text-900 text-sm uppercase tracking-tight mb-1">{item.name}</p>
                                            </div>
                                            <div className="text-right ml-3">
                                                <span className="block font-bold text-900 text-sm">{item.price.toLocaleString()}₫</span>
                                                <span className="block text-xs text-500 mt-1 uppercase tracking-widest">SL: {item.qty}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 p-4 mt-2">
                                <div className="flex flex-column gap-3 w-full">
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 font-bold text-xs uppercase tracking-widest">Tổng tiền hàng</span>
                                        <span className="font-bold text-900 text-sm">{selectedOrder.subtotal.toLocaleString()}₫</span>
                                    </div>

                                    {selectedOrder.tax > 0 && (
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 font-bold text-xs uppercase tracking-widest">Thuế VAT</span>
                                            <span className="font-bold text-900 text-sm">{selectedOrder.tax.toLocaleString()}₫</span>
                                        </div>
                                    )}

                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 font-bold text-xs uppercase tracking-widest">Phí vận chuyển</span>
                                        <span className="font-bold text-sm text-900">
                                            {selectedOrder.shippingFee === 0 ? "Miễn phí" : `${selectedOrder.shippingFee.toLocaleString()}₫`}
                                        </span>
                                    </div>

                                    {selectedOrder.supportFee > 0 && (
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 font-bold text-xs uppercase tracking-widest">Phí hỗ trợ</span>
                                            <span className="font-bold text-900 text-sm">{selectedOrder.supportFee.toLocaleString()}₫</span>
                                        </div>
                                    )}

                                    {selectedOrder.discount > 0 && (
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 font-bold text-xs uppercase tracking-widest">Giảm giá</span>
                                            <span className="font-bold text-900 text-sm">-{selectedOrder.discount.toLocaleString()}₫</span>
                                        </div>
                                    )}

                                    <div className="border-top-1 border-900 my-2"></div>

                                    <div className="flex justify-content-between align-items-center mt-2">
                                        <span className="text-900 font-black text-sm uppercase tracking-widest">Tổng thanh toán</span>
                                        <div className="text-right">
                                            <span className="block text-xl text-900 font-black tracking-tighter">{selectedOrder.total.toLocaleString()}₫</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-content-end mt-4">
                            <Button
                                label="Đóng"
                                className="border-noround border-none cursor-pointer px-6 py-3 font-bold uppercase tracking-widest text-xs"
                                style={{ backgroundColor: '#111', color: '#fff' }}
                                onClick={() => setShowOrderDialog(false)}
                            />
                        </div>
                    </div>
                )}
            </Dialog>

            <Footer />
        </div>
    );
};

export default UserProfile;
