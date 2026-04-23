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
import { useNavigate } from "react-router-dom"; // Thêm để logout nếu cần
import Header from "../components/Header";
import Footer from "../components/Footer";

// Cấu hình API
const API_URL = "http://localhost:3000/api";

const UserProfile = () => {
    const toast = useRef(null);
    const navigate = useNavigate();
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
    }, [token]);

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
    ];

    return (
        <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: 'Inter, sans-serif', color: '#374151' }}>
            <Header />
            <Toast ref={toast} />

            <div className="p-4 md:p-6" style={{ maxWidth: "1100px", margin: "0 auto" }}>
                {/* Header Profile */}
                <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-4 mb-4 bg-white p-4 border-round-2xl shadow-1">
                    <div className="flex align-items-center gap-4 w-full md:w-auto">
                        <div className="relative">
                            <Avatar image={user.avatar} icon={!user.avatar && "pi pi-user"} size="xlarge" shape="circle" style={{ width: '70px', height: '70px', border: '3px solid #eef2ff', color: '#0047ab', backgroundColor: '#e0e7ff' }} />
                            <div className="absolute bottom-0 right-0 bg-white border-circle p-1 shadow-1 cursor-pointer hover:bg-gray-100 transition-colors flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                                <label htmlFor="avatar-upload" className="cursor-pointer flex align-items-center justify-content-center w-full h-full"><i className="pi pi-camera" style={{ fontSize: '14px', color: '#0047ab' }}></i></label>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={onUploadAvatar} style={{ display: 'none' }} />
                            </div>
                        </div>
                        <div className="flex flex-column gap-1">
                            <h2 className="m-0 text-xl font-bold text-800">{user.fullname || "User"}</h2>
                            <div className="flex align-items-center gap-3 text-sm text-500">
                                <span><i className="pi pi-envelope mr-1"></i>{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex justify-content-start md:justify-content-end align-items-center gap-2">
                        <span className="text-gray-500 font-medium text-base">Điểm tích lũy:</span>
                        <span className="text-2xl font-bold text-yellow-600">{(user.loyaltyPoints || 0).toLocaleString()}</span>
                    </div>
                </div>

                <div className="grid align-items-stretch">
                    {/* Menu */}
                    <div className="col-12 md:col-3">
                        <div className="bg-white border-round-2xl shadow-1 p-4 h-full flex flex-column">
                            <h4 className="mt-0 mb-3 text-gray-500 uppercase text-xs font-bold tracking-wider pl-2">Tài khoản</h4>
                            <div className="flex flex-column gap-2">
                                {menuItems.map((item) => {
                                    const isActive = activeIndex === item.index;
                                    return (
                                        <div key={item.index} onClick={() => setActiveIndex(item.index)} className={`flex align-items-center justify-content-between p-3 border-round-xl cursor-pointer transition-all duration-200 select-none ${isActive ? 'bg-blue-50 text-blue-800 shadow-none' : 'text-600 hover:bg-gray-50 hover:text-800'}`}>
                                            <div className="flex align-items-center gap-3"><i className={`${item.icon} ${activeIndex === item.index ? 'text-blue-600' : 'text-400'}`} style={{ fontSize: '1.2rem' }}></i><span className={`text-sm ${activeIndex === item.index ? 'font-bold' : 'font-medium'}`}>{item.label}</span></div>
                                            {item.badge > 0 && <Badge value={item.badge} severity="danger" style={{ minWidth: '1.2rem', height: '1.2rem', lineHeight: '1.2rem' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-12 md:col-9">
                        <div className="bg-white border-round-2xl shadow-1 p-5 h-full flex flex-column" style={{ minHeight: '550px' }}>

                            {/* TAB 0: Hồ sơ */}
                            {activeIndex === 0 && (
                                <div className="fadein animation-duration-300 flex-1 flex flex-column">
                                    <div className="border-bottom-1 border-100 pb-3 mb-5"><h3 className="text-lg font-bold text-800 m-0">Hồ sơ của tôi</h3><p className="text-500 text-sm m-0 mt-1">Quản lý thông tin hồ sơ</p></div>
                                    <div className="grid formgrid p-fluid flex-1 align-content-start" style={{ rowGap: '1.5rem' }}>
                                        <div className="field col-12 md:col-6"><label className="font-medium text-700 mb-2 block text-sm">Họ và tên</label><InputText value={user.fullname} onChange={(e) => setUser({ ...user, fullname: e.target.value })} className="bg-gray-50 border-200 text-800" /></div>
                                        <div className="field col-12 md:col-6"><label className="font-medium text-700 mb-2 block text-sm">Email</label><InputText value={user.email} disabled className="bg-gray-100 text-500 border-200" /></div>
                                    </div>
                                    <div className="mt-3"><Button label="Lưu thay đổi" onClick={handleUpdateProfile} className="border-round-lg font-bold px-5 py-3 text-base shadow-none hover:shadow-2" style={{ background: "#0047ab", border: "none", minWidth: '160px' }} /></div>
                                </div>
                            )}

                            {/* TAB 1: Địa chỉ */}
                            {activeIndex === 1 && (
                                <div className="fadein animation-duration-300 h-full flex flex-column">
                                    <div className="flex justify-content-between align-items-center mb-5 pb-3 border-bottom-1 border-100">
                                        <div><h3 className="text-lg font-bold text-800 m-0">Địa chỉ của tôi</h3><p className="text-500 text-sm m-0 mt-1">Quản lý nơi nhận hàng</p></div>
                                        <Button label="Thêm địa chỉ" icon="pi pi-plus" size="small" onClick={() => { setEditingId(null); setAddressForm({ receiver: "", phone: "", detail: "", province: null, district: null, ward: null }); setShowAddressDialog(true) }} className="border-round-lg shadow-1" style={{ background: "#0047ab", border: "none" }} />
                                    </div>
                                    <div className="flex flex-column gap-3 flex-1">
                                        {user.shippingAddress && user.shippingAddress.length > 0 ? 
                                          // Sort: Đưa địa chỉ mặc định lên đầu
                                          [...user.shippingAddress].sort((a, b) => (b.isDefault === true) - (a.isDefault === true)).map((addr) => (
                                            <div key={addr._id} className={`border-1 border-round-xl p-4 transition-all bg-white relative ${addr.isDefault ? 'border-blue-500 shadow-2' : 'border-200 hover:bg-blue-50'}`}>
                                                <div className="flex justify-content-between align-items-start">
                                                    <div className="flex-1">
                                                        <div className="flex align-items-center gap-2 mb-2">
                                                            <span className="font-bold text-800 text-base">{addr.receiver}</span>
                                                            <span className="text-300 mx-1">|</span>
                                                            <span className="text-600 text-sm">{addr.phone}</span>
                                                            
                                                            {/* HIỂN THỊ TAG MẶC ĐỊNH */}
                                                            {addr.isDefault && (
                                                                <Tag value="Mặc định" severity="success" className="ml-2" style={{ fontSize: '0.75rem' }}></Tag>
                                                            )}
                                                        </div>
                                                        <p className="m-0 text-600 text-sm mt-2 line-height-3">{addr.address}</p>
                                                        
                                                        {/* NÚT ĐẶT MẶC ĐỊNH */}
                                                        {!addr.isDefault && (
                                                            <Button 
                                                                label="Đặt làm mặc định" 
                                                                link 
                                                                className="p-0 mt-2 text-sm text-blue-600 hover:text-blue-800" 
                                                                onClick={() => handleSetDefaultAddress(addr._id)}
                                                            />
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex gap-2 ml-3">
                                                        <Button icon="pi pi-pencil" rounded text severity="info" aria-label="Edit" onClick={() => handleEditAddress(addr)} />
                                                        {/* Không cho xóa địa chỉ đang là mặc định để tránh lỗi logic, hoặc phải xử lý backend chuyển mặc định */}
                                                        <Button 
                                                            icon="pi pi-trash" 
                                                            rounded 
                                                            text 
                                                            severity="danger" 
                                                            aria-label="Delete" 
                                                            disabled={addr.isDefault} 
                                                            tooltip={addr.isDefault ? "Không thể xóa địa chỉ mặc định" : "Xóa"}
                                                            onClick={() => handleDeleteAddress(addr._id)} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <p className="text-center text-500">Chưa có địa chỉ nào</p>}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Đổi mật khẩu */}
                            {activeIndex === 2 && (
                                <div className="fadein animation-duration-300 h-full flex flex-column">
                                    <div className="border-bottom-1 border-100 pb-3 mb-5"><h3 className="text-lg font-bold text-800 m-0">Đổi mật khẩu</h3><p className="text-500 text-sm m-0 mt-1">Bảo mật tài khoản của bạn</p></div>
                                    <div className="flex flex-column gap-4 flex-1" style={{ maxWidth: "450px" }}>
                                        <div className="flex flex-column gap-2"><label className="font-medium text-700 text-sm">Mật khẩu hiện tại</label><Password value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} toggleMask feedback={false} inputClassName="w-full bg-gray-50 border-200 text-800 border-round-lg" className="w-full" /></div>
                                        <div className="flex flex-column gap-2"><label className="font-medium text-700 text-sm">Mật khẩu mới</label><Password value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} toggleMask inputClassName="w-full bg-gray-50 border-200 text-800 border-round-lg" className="w-full" /></div>
                                        <div className="flex flex-column gap-2"><label className="font-medium text-700 text-sm">Xác nhận mật khẩu mới</label><Password value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} toggleMask feedback={false} inputClassName="w-full bg-gray-50 border-200 text-800 border-round-lg" className="w-full" /></div>
                                        <div className="mt-4"><Button label="Cập nhật mật khẩu" onClick={handleChangePassword} className="border-round-lg font-bold px-5 py-3 shadow-none hover:shadow-2 transition-all" style={{ background: "#0047ab", border: "none" }} /></div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: Đơn mua */}
                            {activeIndex === 3 && (
                                <div className="fadein animation-duration-300 h-full flex flex-column">
                                    <div className="border-bottom-1 border-100 pb-3 mb-4 flex justify-content-between align-items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-800 m-0">Đơn hàng của tôi</h3>
                                            <p className="text-500 text-sm m-0 mt-1">Quản lý và theo dõi đơn hàng</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                                        {orderTabs.map((tab) => (
                                            <Button
                                                key={tab.value}
                                                label={tab.label}
                                                onClick={() => setActiveOrderStatus(tab.value)}
                                                className={`p-button-sm white-space-nowrap ${activeOrderStatus === tab.value ? 'p-button-primary' : 'p-button-text text-600'}`}
                                                style={activeOrderStatus === tab.value ? { background: "#0047ab", borderColor: "#0047ab" } : {}}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex flex-column gap-4 flex-1 overflow-y-auto pr-2" style={{ maxHeight: '600px' }}>
                                        {filteredOrders.length === 0 ? (
                                            <div className="text-center py-5 bg-gray-50 border-round">
                                                <p className="text-600">{loading ? "Đang tải đơn hàng..." : "Không có đơn hàng nào."}</p>
                                            </div>
                                        ) : (
                                            filteredOrders.map((order) => (
                                                <div key={order.id} className="border-1 border-200 border-round-xl p-4 bg-white hover:shadow-1 transition-all">
                                                    <div className="flex justify-content-between align-items-center mb-3 pb-3 border-bottom-1 border-100">
                                                        <div><span className="font-mono text-800 block">#{order.id.slice(-6).toUpperCase()}</span><span className="text-sm text-500">{order.date}</span></div>
                                                        <Tag severity={getStatusSeverity(order.status)} value={getStatusLabel(order.status).toUpperCase()} rounded />
                                                    </div>
                                                    <div className="flex flex-column gap-3">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex gap-3 align-items-center">
                                                                <div className="w-4rem h-4rem border-1 border-200 border-round flex align-items-center justify-content-center p-1"><img src={item.img || "/img/default.png"} alt={item.name} className="max-w-full max-h-full object-contain" /></div>
                                                                <div className="flex-1"><p className="m-0 font-medium text-700 text-sm line-height-2">{item.name}</p><div className="flex justify-content-between mt-1"><span className="text-xs text-500">x{item.qty}</span><span className="text-sm font-bold text-800">{item.price.toLocaleString()}₫</span></div></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-content-between align-items-center mt-4 pt-3 border-top-1 border-100">
                                                        <div><span className="text-sm text-600 mr-2">Tổng tiền:</span><span className="text-xl font-bold" style={{ color: "#0047ab" }}>{order.total.toLocaleString()}₫</span></div>
                                                        <Button label="Xem chi tiết" icon="pi pi-eye" size="small" outlined onClick={() => viewOrderDetails(order)} />
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
            <Dialog header={<div style={{ textAlign: "center", fontWeight: "700", fontSize: "1.2rem", color: "#374151", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>{editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</div>} visible={showAddressDialog} style={{ width: '580px' }} modal onHide={() => setShowAddressDialog(false)}>
                <div className="flex flex-column gap-4 mt-3">
                    <div><label style={{ display: "block", marginBottom: "6px", color: "#374151", fontWeight: "500" }}>Họ tên người nhận</label><InputText value={addressForm.receiver} onChange={(e) => setAddressForm({ ...addressForm, receiver: e.target.value })} className="w-full border-round-lg" placeholder="Ví dụ: Nguyễn Văn A" /></div>
                    <div><label style={{ display: "block", marginBottom: "6px", color: "#374151", fontWeight: "500" }}>Số điện thoại</label><InputText value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="w-full border-round-lg" keyfilter="int" maxLength={10} placeholder="Nhập 10 số điện thoại" /></div>
                    <div className="grid">
                        <div className="col-4"><Dropdown value={addressForm.province} options={provinces} optionLabel="name" onChange={(e) => setAddressForm({ ...addressForm, province: e.value })} placeholder="Tỉnh/Thành" className="w-full" filter /></div>
                        <div className="col-4"><Dropdown value={addressForm.district} options={districts} optionLabel="name" onChange={(e) => setAddressForm({ ...addressForm, district: e.value })} placeholder="Quận/Huyện" className="w-full" disabled={!addressForm.province} filter /></div>
                        <div className="col-4"><Dropdown value={addressForm.ward} options={wards} optionLabel="name" onChange={(e) => setAddressForm({ ...addressForm, ward: e.value })} placeholder="Phường/Xã" className="w-full" disabled={!addressForm.district} filter /></div>
                    </div>
                    <InputText value={addressForm.detail} onChange={(e) => setAddressForm({ ...addressForm, detail: e.target.value })} placeholder="Địa chỉ chi tiết" className="w-full" />
                    <div className="flex justify-content-end gap-2 mt-3"><Button label="Hủy" text onClick={() => setShowAddressDialog(false)} /><Button label="Lưu địa chỉ" style={{ background: "#0047ab" }} onClick={handleSaveAddress} /></div>
                </div>
            </Dialog>

            {/* Dialog Chi tiết đơn hàng */}
            <Dialog
                visible={showOrderDialog}
                style={{ width: '800px', maxWidth: '95%' }}
                modal
                onHide={() => setShowOrderDialog(false)}
                header="Chi tiết đơn hàng"
                contentStyle={{ backgroundColor: '#eff3f8', padding: '1.5rem' }}
                headerStyle={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#1e3a8a' }}
            >
                {selectedOrder && (
                    <div className="flex flex-column gap-3">
                        <div className="bg-white p-4 border-round-xl shadow-1 flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center relative overflow-hidden border-left-3 border-blue-700">
                            <div className="flex flex-column gap-1">
                                <span className="text-600 text-sm font-semibold uppercase tracking-wider">Mã đơn hàng / Thời gian</span>
                                <div className="flex align-items-center gap-2 mt-1">
                                    <span className="text-900 text-2xl font-bold">#{selectedOrder.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <span className="text-700 text-sm font-medium"><i className="pi pi-calendar mr-1 text-blue-600"></i>{selectedOrder.date}</span>
                            </div>
                            <div className="mt-3 md:mt-0">
                                <Tag severity={getStatusSeverity(selectedOrder.status)} value={getStatusLabel(selectedOrder.status).toUpperCase()} className="text-base px-3 py-2 font-bold shadow-1" rounded />
                            </div>
                        </div>

                        <div className="grid">
                            <div className="col-12 md:col-7">
                                <div className="bg-white p-4 border-round-xl shadow-1 h-full border-top-3 border-transparent hover:border-blue-500 transition-all">
                                    <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-200">
                                        <span className="w-2rem h-2rem border-circle bg-blue-100 flex align-items-center justify-content-center text-blue-700"><i className="pi pi-map-marker text-lg"></i></span>
                                        <span className="font-bold text-800 uppercase text-sm">Địa chỉ nhận hàng</span>
                                    </div>

                                    <div className="flex flex-column gap-1 pl-1">
                                        <span className="text-900 font-bold text-lg">{selectedOrder.receiverName}</span>
                                        <span className="text-700 font-medium my-1"><i className="pi pi-phone mr-2 text-blue-600"></i>{selectedOrder.receiverPhone}</span>
                                        <span className="text-700 line-height-3"><i className="pi pi-home mr-2 text-blue-600"></i>{selectedOrder.shippingAddress}</span>
                                    </div>
                                </div>
                            </div>
                            {selectedOrder.note && (
                                <div className="mt-3 pt-3 border-top-1 border-200">
                                    <div className="flex align-items-center gap-2 mb-2">
                                        <i className="pi pi-file-edit text-blue-600"></i>
                                        <span className="font-bold text-800 text-sm">Ghi chú từ bạn:</span>
                                    </div>
                                    <p className="m-0 text-700 font-italic bg-yellow-50 p-2 border-round text-sm">
                                        "{selectedOrder.note}"
                                    </p>
                                </div>
                            )}
                            <div className="col-12 md:col-5">
                                <div className="bg-white p-4 border-round-xl shadow-1 h-full border-top-3 border-transparent hover:border-blue-500 transition-all">
                                    <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-200">
                                        <span className="w-2rem h-2rem border-circle bg-blue-100 flex align-items-center justify-content-center text-blue-700"><i className="pi pi-wallet text-lg"></i></span>
                                        <span className="font-bold text-800 uppercase text-sm">Thanh toán</span>
                                    </div>
                                    <div className="flex flex-column gap-3 pl-1">
                                        <div>
                                            <span className="block text-600 text-xs mb-1">Phương thức</span>
                                            <span className="text-blue-800 font-bold bg-blue-50 px-2 py-1 border-round">{selectedOrder.paymentMethod}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tracking timeline có thể thêm logic lấy từ order.history */}

                        <div className="bg-white border-round-xl shadow-1 overflow-hidden">
                            <div className="p-3 bg-gray-100 border-bottom-1 border-200">
                                <span className="font-bold text-800 uppercase text-sm px-2">Chi tiết sản phẩm</span>
                            </div>

                            <div className="p-4 flex flex-column gap-4">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className={`flex gap-3 align-items-center ${idx !== selectedOrder.items.length - 1 ? 'border-bottom-1 border-gray-100 pb-4' : ''}`}>
                                        <div className="w-5rem h-5rem border-1 border-200 border-round p-1 bg-white flex align-items-center justify-content-center flex-shrink-0">
                                            <img src={item.img || "/img/default.png"} alt={item.name} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div className="flex-1 flex justify-content-between align-items-center">
                                            <div>
                                                <p className="m-0 font-bold text-900 text-lg line-height-3 mb-1">{item.name}</p>
                                            </div>
                                            <div className="text-right ml-3">
                                                <span className="block font-bold text-900 text-lg">{item.price.toLocaleString()}₫</span>
                                                <span className="block text-sm text-600 mt-1">x{item.qty}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 p-4 md:p-5 border-top-1 border-blue-200">
                                <div className="flex flex-column gap-3 w-full">
                                    {/* Tạm tính */}
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-700 font-medium text-lg">Tổng tiền hàng</span>
                                        <span className="font-bold text-900 text-xl">{selectedOrder.subtotal.toLocaleString()}₫</span>
                                    </div>

                                    {/* Thuế VAT (Hiển thị nếu có) */}
                                    {selectedOrder.tax > 0 && (
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-700 font-medium text-lg">Thuế VAT (10%)</span>
                                            <span className="font-bold text-900 text-xl">{selectedOrder.tax.toLocaleString()}₫</span>
                                        </div>
                                    )}

                                    {/* Phí vận chuyển */}
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-700 font-medium text-lg">Phí vận chuyển</span>
                                        <span className={`font-bold text-xl ${selectedOrder.shippingFee === 0 ? 'text-green-600' : 'text-900'}`}>
                                            {selectedOrder.shippingFee === 0 ? "Miễn phí" : `${selectedOrder.shippingFee.toLocaleString()}₫`}
                                        </span>
                                    </div>

                                    {/* Phí hỗ trợ (Hiển thị nếu có) */}
                                    {selectedOrder.supportFee > 0 && (
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-700 font-medium text-lg">Phí hỗ trợ kỹ thuật</span>
                                            <span className="font-bold text-900 text-xl">{selectedOrder.supportFee.toLocaleString()}₫</span>
                                        </div>
                                    )}

                                    {/* Giảm giá (Hiển thị nếu có) */}
                                    {selectedOrder.discount > 0 && (
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-700 font-medium text-lg">Giảm giá</span>
                                            <span className="font-bold text-green-600 text-xl">-{selectedOrder.discount.toLocaleString()}₫</span>
                                        </div>
                                    )}

                                    <div className="border-top-1 border-blue-300 border-dashed my-2"></div>

                                    {/* Tổng thanh toán */}
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-800 font-bold text-2xl uppercase">Tổng thanh toán</span>
                                        <div className="text-right">
                                            <span className="block text-3xl text-red-600 font-bold">{selectedOrder.total.toLocaleString()}₫</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-content-end gap-3 mt-4 border-top-1 border-200 pt-4">
                            <Button
                                label="Đóng"
                                icon="pi pi-times"
                                className="p-button-outlined p-button-secondary border-round-lg font-bold px-4"
                                style={{ color: '#4b5563', borderColor: '#d1d5db' }}
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