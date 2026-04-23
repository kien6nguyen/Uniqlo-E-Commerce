import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Avatar } from "primereact/avatar";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Password } from 'primereact/password';
import { InputNumber } from 'primereact/inputnumber';

const API_BASE = "http://localhost:3000/api/admin/users";
const LOCATION_API = "https://provinces.open-api.vn/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- DIALOG STATES ---
  const [userDialog, setUserDialog] = useState(false); // Dialog user chính
  const [addressDialog, setAddressDialog] = useState(false); // Dialog danh sách địa chỉ
  const [editAddrDialog, setEditAddrDialog] = useState(false); // Dialog sửa địa chỉ cụ thể

  // --- DATA STATES ---
  const [currentAddresses, setCurrentAddresses] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [editingAddrIndex, setEditingAddrIndex] = useState(null);

  const toast = useRef(null);

  // Form User Chính
  const [user, setUser] = useState({
    fullname: "", email: "", role: "user", password: "",
    phone: "", receiver: "", province: null, district: null, ward: null, addressDetail: "", loyaltyPoints: 0
  });

  // Form Sửa Địa Chỉ Riêng
  const [addrForm, setAddrForm] = useState({
    receiver: "", phone: "", province: null, district: null, ward: null, addressDetail: ""
  });

  // --- LOCATION DATA STATES ---
  const [provinces, setProvinces] = useState([]);

  // Data cho Form User Chính
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Data riêng cho Form Sửa Địa Chỉ (để không bị conflict)
  const [editDistricts, setEditDistricts] = useState([]);
  const [editWards, setEditWards] = useState([]);

  const [submitted, setSubmitted] = useState(false);
  const [dialogHeader, setDialogHeader] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  submitted;
  useEffect(() => {
    loadUsers();
    fetchProvinces();
  }, []);

  // --- API LOCATION HELPERS ---
  const fetchProvinces = async () => {
    try { const res = await fetch(`${LOCATION_API}/?depth=1`); const data = await res.json(); setProvinces(data); } catch (e) { console.error(e); }
  };

  // Hàm lấy Huyện (có tham số isEdit để biết đang nạp vào state nào)
  const fetchDistricts = async (code, isEdit = false) => {
    if (!code) return;
    try {
      const res = await fetch(`${LOCATION_API}/p/${code}?depth=2`);
      const data = await res.json();
      if (isEdit) setEditDistricts(data.districts);
      else setDistricts(data.districts);
    } catch (e) {
      console.error(e);
    }
  };

  // Hàm lấy Xã
  const fetchWards = async (code, isEdit = false) => {
    if (!code) return;
    try {
      const res = await fetch(`${LOCATION_API}/d/${code}?depth=2`);
      const data = await res.json();
      if (isEdit) setEditWards(data.wards);
      else setWards(data.wards);
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers cho Form User Chính
  const onProvinceChange = (e) => { setUser({ ...user, province: e.value, district: null, ward: null }); setDistricts([]); setWards([]); fetchDistricts(e.value, false); };
  const onDistrictChange = (e) => { setUser({ ...user, district: e.value, ward: null }); setWards([]); fetchWards(e.value, false); };

  // Handlers cho Form Sửa Địa Chỉ
  const onEditProvinceChange = (e) => { setAddrForm({ ...addrForm, province: e.value, district: null, ward: null }); setEditDistricts([]); setEditWards([]); fetchDistricts(e.value, true); };
  const onEditDistrictChange = (e) => { setAddrForm({ ...addrForm, district: e.value, ward: null }); setEditWards([]); fetchWards(e.value, true); };

  // --- USER CRUD ---
  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_BASE, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setUsers(data.users);
    } catch (error) { toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi tải dữ liệu' }); console.error(error); }
    finally { setLoading(false); }
  };

  // --- ADDRESS MANAGEMENT FUNCTIONS ---

  // 1. Xem danh sách địa chỉ
  const showAddressList = (rowData) => {
    setCurrentAddresses(rowData.shippingAddress || []);
    setSelectedUserName(rowData.fullname);
    setSelectedUserId(rowData._id);
    setAddressDialog(true);
  };

  // 2. Xóa địa chỉ
  const handleDeleteAddress = async (index) => {
    const updatedAddresses = [...currentAddresses];
    updatedAddresses.splice(index, 1); // Xóa phần tử tại index
    await updateAddressAPI(updatedAddresses, "Đã xóa địa chỉ");
  };

  // 3. Mở Dialog Sửa địa chỉ & LOAD DỮ LIỆU CŨ
  const handleEditAddress = async (addr, index) => {
    setEditingAddrIndex(index);

    // Set data vào form
    setAddrForm({
      receiver: addr.receiver,
      phone: addr.phone,
      // Ép kiểu về Number nếu API trả về string, vì dropdown value=code (number)
      province: addr.province ? Number(addr.province) : null,
      district: addr.district ? Number(addr.district) : null,
      ward: addr.ward ? Number(addr.ward) : null,
      addressDetail: addr.addressDetail || ""
    });

    // QUAN TRỌNG: Load dữ liệu Huyện/Xã ngay lập tức dựa trên mã Code có sẵn
    // Nếu không làm bước này, dropdown Huyện/Xã sẽ rỗng
    if (addr.province) {
      await fetchDistricts(addr.province, true);
    }
    if (addr.district) {
      await fetchWards(addr.district, true);
    }

    setEditAddrDialog(true);
  };

  // 4. Lưu địa chỉ đã sửa
  const saveEditedAddress = async () => {
    if (!addrForm.receiver || !addrForm.phone || !addrForm.province || !addrForm.district || !addrForm.ward) {
      toast.current.show({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }

    // Lấy tên hiển thị từ danh sách options
    const pName = provinces.find(p => p.code == addrForm.province)?.name || "";
    const dName = editDistricts.find(d => d.code == addrForm.district)?.name || "";
    const wName = editWards.find(w => w.code == addrForm.ward)?.name || "";
    const fullAddress = `${addrForm.addressDetail}, ${wName}, ${dName}, ${pName}`;

    // Tạo object địa chỉ mới (CHỨA CẢ CODE VÀ STRING)
    const newAddressObj = {
      receiver: addrForm.receiver,
      phone: addrForm.phone,
      address: fullAddress, // String hiển thị
      province: addrForm.province, // Code để load lại
      district: addrForm.district,
      ward: addrForm.ward,
      addressDetail: addrForm.addressDetail
    };

    const updatedAddresses = [...currentAddresses];
    updatedAddresses[editingAddrIndex] = newAddressObj;

    await updateAddressAPI(updatedAddresses, "Đã cập nhật địa chỉ");
    setEditAddrDialog(false);
  };

  // 5. API Call Update User Address Array
  const updateAddressAPI = async (newAddressArray, successMsg) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/${selectedUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: newAddressArray // Gửi nguyên mảng
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentAddresses(newAddressArray);
        // Cập nhật luôn vào bảng chính để không cần F5
        setUsers(prev => prev.map(u => u._id === selectedUserId ? { ...u, shippingAddress: newAddressArray } : u));
        toast.current.show({ severity: 'success', summary: 'Thành công', detail: successMsg });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
    }
  };


  // --- MAIN USER FORM FUNCTIONS ---
  const editUser = (userData) => { setUser({ ...userData, password: "******", phone: "", receiver: "", province: null, district: null, ward: null, addressDetail: "", loyaltyPoints: userData.loyaltyPoints || 0 }); setDialogHeader("Cập nhật thông tin"); setUserDialog(true); setFieldErrors({}); };

  const validate = () => {
    let errors = {};
    if (!user.fullname.trim()) errors.fullname = "Nhập họ tên.";
    if (!user.email.trim()) errors.email = "Nhập email.";
    if (!user._id && !user.password) errors.password = "Nhập mật khẩu.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveUser = async () => {
    setSubmitted(true);
    if (!validate()) return;
    try {
      const token = localStorage.getItem("token");
      let method = user._id ? "PUT" : "POST";
      let url = user._id ? `${API_BASE}/${user._id}` : API_BASE;

      // Logic tạo user mới có kèm địa chỉ
      const pName = provinces.find(p => p.code === user.province)?.name || "";
      const dName = districts.find(d => d.code === user.district)?.name || "";
      const wName = wards.find(w => w.code === user.ward)?.name || "";

      // Build payload
      const payload = { ...user, loyaltyPoints: user.loyaltyPoints };
      if (user._id) delete payload.password;

      // Nếu là tạo mới và có nhập địa chỉ -> Gửi cấu trúc chuẩn
      if (!user._id && user.province) {
        const fullAddress = `${user.addressDetail}, ${wName}, ${dName}, ${pName}`;
        payload.shippingAddress = [{
          receiver: user.receiver,
          phone: user.phone,
          address: fullAddress,
          province: user.province, // Lưu Code
          district: user.district, // Lưu Code
          ward: user.ward,         // Lưu Code
          addressDetail: user.addressDetail
        }];
      }

      const response = await fetch(url, { method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await response.json();

      if (response.ok) {
        toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã lưu thông tin' });
        setUserDialog(false);
        loadUsers();
      } else throw new Error(data.message);
    } catch (err) { toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message }); }
  };

  const toggleActive = async (userData) => {
    try { const token = localStorage.getItem("token"); const response = await fetch(`${API_BASE}/${userData._id}/ban`, { method: "PATCH", headers: { "Authorization": `Bearer ${token}` } }); const data = await response.json(); if (response.ok) { setUsers(prev => prev.map(u => u._id === userData._id ? { ...u, isBanned: !u.isBanned } : u)); toast.current.show({ severity: data.user.isBanned ? 'warn' : 'success', summary: 'Thông báo', detail: data.message }); } } catch (err) {
      toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
      console.error(err);
    }
  };
  const nameBodyTemplate = (row) => (<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Avatar label={row.fullname?.charAt(0).toUpperCase()} shape="circle" style={{ backgroundColor: '#2b7be9', color: '#ffffff' }} /><span style={{ fontWeight: 500 }}>{row.fullname}</span></div>);
  const activeTemplate = (row) => (<Tag value={!row.isBanned ? "Hoạt động" : "Bị khóa"} severity={!row.isBanned ? "success" : "danger"} />);

  const addressBodyTemplate = (row) => {
    const addressCount = row.shippingAddress ? row.shippingAddress.length : 0;
    if (addressCount === 0) return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa có</span>;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '250px' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', display: 'inline-block' }} title={row.shippingAddress[0].address}>
          {row.shippingAddress[0].address} {addressCount > 1 && `(+${addressCount - 1})`}
        </span>
        <Button icon="pi pi-eye" rounded text severity="secondary" size="small" onClick={() => showAddressList(row)} tooltip="Quản lý địa chỉ" />
      </div>
    );
  };

  const actionBodyTemplate = (row) => (<div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}><Button icon="pi pi-pencil" rounded text severity="info" onClick={() => editUser(row)} /><Button icon={!row.isBanned ? "pi pi-lock" : "pi pi-lock-open"} rounded text severity={!row.isBanned ? "danger" : "success"} onClick={() => toggleActive(row)} /></div>);
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' };
  const labelStyle = { fontWeight: 'bold', color: '#374151' };

  return (
    <Card className="shadow-lg" style={{ margin: '20px', border: 'none' }}>
      <Toast ref={toast} />

      <DataTable value={users} paginator rows={10} loading={loading} header={<div style={{ padding: '10px 0' }}><h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Quản lý người dùng</h2></div>} showGridlines className="p-datatable-sm" rowHover>
        <Column header="#" body={(data, props) => props.rowIndex + 1} align="center" style={{ width: "50px" }} />
        <Column field="fullname" header="Họ tên" body={nameBodyTemplate} sortable />
        <Column field="email" header="Email" sortable />
        <Column header="Địa chỉ" body={addressBodyTemplate} style={{ width: "25%" }} />
        <Column header="SĐT" body={(row) => row.shippingAddress?.[0]?.phone || "-"} align="center" />
        <Column field="role" header="Quyền" body={(rowData) => <Tag value={rowData.role.toUpperCase()} severity={rowData.role === 'admin' ? 'info' : 'warning'} />} align="center" />
        <Column field="loyaltyPoints" header="Điểm" sortable align="center" />
        <Column field="isBanned" header="Trạng thái" body={activeTemplate} align="center" />
        <Column header="Thao tác" body={actionBodyTemplate} align="center" />
      </DataTable>

      {/* DIALOG CHÍNH (User) */}
      <Dialog visible={userDialog} style={{ width: '550px' }} header={dialogHeader} modal onHide={() => setUserDialog(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={fieldStyle}><label style={labelStyle}>Họ tên *</label><InputText value={user.fullname} onChange={(e) => setUser({ ...user, fullname: e.target.value })} />{fieldErrors.fullname && <small className="p-error">{fieldErrors.fullname}</small>}</div>
          <div style={fieldStyle}><label style={labelStyle}>Email *</label><InputText value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} disabled={!!user._id} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Mật khẩu</label><Password value={user.password} onChange={(e) => setUser({ ...user, password: e.target.value })} toggleMask={!user._id} feedback={false} disabled={!!user._id} placeholder={user._id ? "******" : ""} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Điểm</label><InputNumber value={user.loyaltyPoints} onValueChange={(e) => setUser({ ...user, loyaltyPoints: e.value })} min={0} /></div>

          {!user._id && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Địa chỉ đầu tiên</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputText placeholder="Người nhận" value={user.receiver} onChange={(e) => setUser({ ...user, receiver: e.target.value })} />
                <InputText placeholder="SĐT" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <Dropdown value={user.province} options={provinces} optionLabel="name" optionValue="code" onChange={onProvinceChange} placeholder="Tỉnh/TP" filter />
                <Dropdown value={user.district} options={districts} optionLabel="name" optionValue="code" onChange={onDistrictChange} placeholder="Quận/Huyện" disabled={!user.province} filter />
                <Dropdown value={user.ward} options={wards} optionLabel="name" optionValue="code" onChange={(e) => setUser({ ...user, ward: e.value })} placeholder="Xã/Phường" disabled={!user.district} filter />
                <InputText placeholder="Số nhà, đường..." value={user.addressDetail} onChange={(e) => setUser({ ...user, addressDetail: e.target.value })} />
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
          <Button label="Hủy" onClick={() => setUserDialog(false)} className="p-button-text" />
          <Button label="Lưu" onClick={saveUser} />
        </div>
      </Dialog>

      {/* DIALOG DANH SÁCH ĐỊA CHỈ */}
      <Dialog header={`Địa chỉ - ${selectedUserName}`} visible={addressDialog} style={{ width: '600px' }} onHide={() => setAddressDialog(false)}>
        {currentAddresses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Không có địa chỉ nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {currentAddresses.map((addr, index) => (
              <div key={index} style={{ padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#0047ab', marginBottom: '5px' }}>Địa chỉ {index + 1}</div>
                  {addr.isDefault && (
                    <Tag value="Mặc định" severity="success" style={{ fontSize: '0.7rem', padding: '2px 8px' }} />
                  )}
                  <div><strong>{addr.receiver}</strong> | {addr.phone}</div>
                  <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '4px' }}>{addr.address}</div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => handleEditAddress(addr, index)} tooltip="Sửa" />
                  <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => handleDeleteAddress(index)} tooltip="Xóa" />
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Button label="Đóng" onClick={() => setAddressDialog(false)} className="p-button-text" />
        </div>
      </Dialog>

      {/* DIALOG SỬA ĐỊA CHỈ CỤ THỂ */}
      <Dialog header="Cập nhật địa chỉ" visible={editAddrDialog} style={{ width: '500px' }} onHide={() => setEditAddrDialog(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Người nhận</label>
              <InputText value={addrForm.receiver} onChange={(e) => setAddrForm({ ...addrForm, receiver: e.target.value })} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>SĐT</label>
              <InputText value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} />
            </div>
          </div>

          <div style={{ backgroundColor: '#eef2ff', padding: '10px', borderRadius: '6px', fontSize: '13px', color: '#3730a3', border: '1px solid #c7d2fe' }}>
            <i className="pi pi-info-circle" style={{ marginRight: '5px' }}></i>
            Chọn lại thông tin hành chính bên dưới để cập nhật.
          </div>

          <Dropdown value={addrForm.province} options={provinces} optionLabel="name" optionValue="code" onChange={onEditProvinceChange} placeholder="Tỉnh/Thành phố" filter style={{ width: '100%' }} />
          <Dropdown value={addrForm.district} options={editDistricts} optionLabel="name" optionValue="code" onChange={onEditDistrictChange} placeholder="Quận/Huyện" disabled={!addrForm.province} filter style={{ width: '100%' }} />
          <Dropdown value={addrForm.ward} options={editWards} optionLabel="name" optionValue="code" onChange={(e) => setAddrForm({ ...addrForm, ward: e.value })} placeholder="Xã/Phường" disabled={!addrForm.district} filter style={{ width: '100%' }} />
          <InputText value={addrForm.addressDetail} onChange={(e) => setAddrForm({ ...addrForm, addressDetail: e.target.value })} placeholder="Số nhà, tên đường..." style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
          <Button label="Hủy" onClick={() => setEditAddrDialog(false)} className="p-button-text" />
          <Button label="Lưu thay đổi" onClick={saveEditedAddress} />
        </div>
      </Dialog>

    </Card>
  );
};

export default UserManagement;