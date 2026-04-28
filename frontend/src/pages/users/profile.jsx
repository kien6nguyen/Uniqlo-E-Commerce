import React, { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import api from "../../utils/axiosInstance";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Message } from "primereact/message";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const LOCATION_API = "https://provinces.open-api.vn/api";
  
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [editDistricts, setEditDistricts] = useState([]);
  const [editWards, setEditWards] = useState([]);
  
  const [addrForm, setAddrForm] = useState({
    receiver: "",
    phone: "",
    provinceCode: null,
    districtCode: null,
    wardCode: null,
    addressDetail: ""
  });

  const [editAddrForm, setEditAddrForm] = useState({
    receiver: "",
    phone: "",
    provinceCode: null,
    districtCode: null,
    wardCode: null,
    addressDetail: ""
  });

  useEffect(() => {
    loadProfile();
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try { 
      const res = await fetch(`${LOCATION_API}/?depth=1`); 
      setProvinces(await res.json()); 
    } catch (e) { 
      console.error(e); 
    }
  };

  const fetchDistricts = async (code) => {
    if (!code) return;
    try { 
      const res = await fetch(`${LOCATION_API}/p/${code}?depth=2`); 
      setDistricts((await res.json()).districts); 
    } catch (e) { 
      console.error(e); 
    }
  };

  const fetchWards = async (code) => {
    if (!code) return;
    try { 
      const res = await fetch(`${LOCATION_API}/d/${code}?depth=2`); 
      setWards((await res.json()).wards); 
    } catch (e) { 
      console.error(e); 
    }
  };

  const fetchEditDistricts = async (code) => {
    if (!code) return;
    try { 
      const res = await fetch(`${LOCATION_API}/p/${code}?depth=2`); 
      setEditDistricts((await res.json()).districts); 
    } catch (e) { 
      console.error(e); 
    }
  };

  const fetchEditWards = async (code) => {
    if (!code) return;
    try { 
      const res = await fetch(`${LOCATION_API}/d/${code}?depth=2`); 
      setEditWards((await res.json()).wards); 
    } catch (e) { 
      console.error(e); 
    }
  };

  const onProvinceChange = (e) => {
    setAddrForm({ ...addrForm, provinceCode: e.value, districtCode: null, wardCode: null });
    setDistricts([]); 
    setWards([]);
    fetchDistricts(e.value);
  };

  const onDistrictChange = (e) => {
    setAddrForm({ ...addrForm, districtCode: e.value, wardCode: null });
    setWards([]);
    fetchWards(e.value);
  };

  const onEditProvinceChange = (e) => {
    setEditAddrForm({ ...editAddrForm, provinceCode: e.value, districtCode: null, wardCode: null });
    setEditDistricts([]); 
    setEditWards([]);
    fetchEditDistricts(e.value);
  };

  const onEditDistrictChange = (e) => {
    setEditAddrForm({ ...editAddrForm, districtCode: e.value, wardCode: null });
    setEditWards([]);
    fetchEditWards(e.value);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.error) {
        setError(res.data.error);
      } else if (res.data.success && res.data.data) {
        setUser(res.data.data);
      } else if (res.data.user) {
        setUser(res.data.user);
      } else {
        setError("Không tìm thấy thông tin người dùng");
      }
    } catch (err) {
      console.error("Load profile error:", err);
      setError("Không thể tải thông tin người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const fullname = e.target.fullname.value;
    try {
      const res = await api.patch("/user/me",
        { fullname },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.error) {
        setError(res.data.error);
        setSuccess("");
      } else {
        setSuccess(res.data.message || "Cập nhật thành công");
        setError("");
        if (res.data.data) {
          setUser(prev => ({
            ...prev,
            fullname: res.data.data.fullname,
            hasPassword: res.data.data.hasPassword
          }));
        } else if (res.data.user) {
          setUser(res.data.user);
        }
      }
    } catch (err) {
      setError("Lỗi khi cập nhật thông tin");
      setSuccess("");
      console.error(err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const res = await api.patch(
        "/user/me/password",
        { newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.error) {
        setError(res.data.error);
        setSuccess("");
      } else {
        setSuccess(res.data.message || "Đổi mật khẩu thành công");
        setError("");
        setUser(prev => ({ ...prev, hasPassword: true }));
        e.target.reset();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Lỗi khi đổi mật khẩu";
      setError(errorMsg);
      setSuccess("");
      console.error("Change password error:", err);
    }
  };

  const handleAddAddress = async () => {
    if (!addrForm.receiver || !addrForm.phone || !addrForm.provinceCode || !addrForm.districtCode || !addrForm.wardCode) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const pName = provinces.find(p => p.code === addrForm.provinceCode)?.name;
    const dName = districts.find(d => d.code === addrForm.districtCode)?.name;
    const wName = wards.find(w => w.code === addrForm.wardCode)?.name;
    const fullAddress = `${addrForm.addressDetail}, ${wName}, ${dName}, ${pName}`;

    try {
      const res = await api.post("/user/me/addresses", {
        receiver: addrForm.receiver,
        phone: addrForm.phone,
        province: addrForm.provinceCode,
        district: addrForm.districtCode,
        ward: addrForm.wardCode,
        addressDetail: addrForm.addressDetail,
        address: fullAddress
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setSuccess(res.data.message || "Đã thêm địa chỉ");
        if (res.data.data?.shippingAddress) {
          setUser({ ...user, shippingAddress: res.data.data.shippingAddress });
        } else if (res.data.addresses) {
          setUser({ ...user, shippingAddress: res.data.addresses });
        }
        setShowAddDialog(false);
        setAddrForm({ receiver: "", phone: "", provinceCode: null, districtCode: null, wardCode: null, addressDetail: "" });
      }
    } catch (err) {
      setError("Lỗi khi thêm địa chỉ");
      console.error(err);
    }
  };

  const handleEditAddress = async (address) => {
    setEditingAddress(address);
    
    setEditAddrForm({
      receiver: address.receiver,
      phone: address.phone,
      provinceCode: address.province ? Number(address.province) : null,
      districtCode: address.district ? Number(address.district) : null,
      wardCode: address.ward ? Number(address.ward) : null,
      addressDetail: address.addressDetail || ""
    });

    if (address.province) {
      await fetchEditDistricts(address.province);
    }
    if (address.district) {
      await fetchEditWards(address.district);
    }

    setShowEditDialog(true);
  };

  const handleSaveEditAddress = async () => {
    if (!editAddrForm.receiver || !editAddrForm.phone || !editAddrForm.provinceCode || !editAddrForm.districtCode || !editAddrForm.wardCode) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const pName = provinces.find(p => p.code === editAddrForm.provinceCode)?.name;
    const dName = editDistricts.find(d => d.code === editAddrForm.districtCode)?.name;
    const wName = editWards.find(w => w.code === editAddrForm.wardCode)?.name;
    const fullAddress = `${editAddrForm.addressDetail}, ${wName}, ${dName}, ${pName}`;

    try {
      const res = await api.patch(`/user/me/addresses/${editingAddress._id}`, {
        receiver: editAddrForm.receiver,
        phone: editAddrForm.phone,
        province: editAddrForm.provinceCode,
        district: editAddrForm.districtCode,
        ward: editAddrForm.wardCode,
        addressDetail: editAddrForm.addressDetail,
        address: fullAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setSuccess(res.data.message || "Đã cập nhật địa chỉ");
        if (res.data.data?.shippingAddress) {
          setUser({ ...user, shippingAddress: res.data.data.shippingAddress });
        } else if (res.data.addresses) {
          setUser({ ...user, shippingAddress: res.data.addresses });
        }
        setShowEditDialog(false);
        setEditingAddress(null);
      }
    } catch (err) {
      setError("Lỗi khi cập nhật địa chỉ");
      console.error(err);
    }
  };

  const handleDeleteAddress = async () => {
    try {
      const res = await api.delete(`/user/me/addresses/${deletingAddress._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setSuccess(res.data.message || "Đã xóa địa chỉ");
        if (res.data.data?.shippingAddress) {
          setUser({ ...user, shippingAddress: res.data.data.shippingAddress });
        } else if (res.data.addresses) {
          setUser({ ...user, shippingAddress: res.data.addresses });
        }
        setShowDeleteDialog(false);
        setDeletingAddress(null);
      }
    } catch (err) {
      setError("Lỗi khi xóa địa chỉ");
      console.error(err);
    }
  };

  const addressBodyTemplate = (rowData) => {
    return (
      <div style={{ maxWidth: '1000px' }}>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {rowData.address}
        </div>
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          onClick={() => handleEditAddress(rowData)}
          tooltip="Sửa"
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => {
            setDeletingAddress(rowData);
            setShowDeleteDialog(true);
          }}
          tooltip="Xóa"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
          <p className="ml-3 text-xl">Đang tải...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div className="p-5 text-center">
          <Message severity="error" text="Không thể tải thông tin người dùng" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>

      <div className="p-4">
        <Card className="p-4 shadow-3">
          <h1 className="mb-4">👤 Hồ sơ cá nhân</h1>
          {error && <Message severity="error" text={error} className="mb-3" />}
          {success && <Message severity="success" text={success} className="mb-3" />}

          {/* Thông tin tài khoản */}
          <section className="mb-5">
            <h4>Thông tin tài khoản</h4>
            <p><strong>Họ và tên:</strong> {user.fullname}</p>
            <p><strong>Email:</strong> {user.email}</p>

            <form onSubmit={handleUpdateProfile} className="flex flex-column gap-3 mt-3">
              <InputText
                name="fullname"
                defaultValue={user.fullname}
                placeholder="Họ và tên"
                className="w-full"
                required
              />
              <Button type="submit" label="Cập nhật thông tin" />
            </form>
          </section>

          {/* Đặt mật khẩu */}
          <section className="mb-5">
            <h4>
              {!user.hasPassword ? "⚠️ Tạo mật khẩu mới" : "🔐 Đổi mật khẩu"}
            </h4>
            {!user.hasPassword && (
              <Message
                severity="warn"
                text="Bạn đang đăng nhập bằng Google hoặc chưa có mật khẩu. Vui lòng thiết lập mật khẩu để bảo vệ tài khoản và đăng nhập bằng email."
                className="mb-3 w-full block"
                style={{ justifyContent: 'flex-start' }}
              />
            )}

            <form onSubmit={handleChangePassword} className="flex flex-column gap-3">
              <Password
                name="newPassword"
                placeholder={!user.hasPassword ? "Nhập mật khẩu mới" : "Nhập mật khẩu mới muốn đổi"}
                feedback
                toggleMask
                inputClassName="w-full"
                className="w-full"
                required
                minLength={6}
                onInput={() => { setError(""); setSuccess(""); }}
              />
              <Password
                name="confirmPassword"
                placeholder="Xác nhận lại mật khẩu"
                feedback={false}
                toggleMask
                inputClassName="w-full"
                className="w-full"
                required
                minLength={6}
                onInput={() => { setError(""); setSuccess(""); }}
              />

              <Button
                type="submit"
                label={!user.hasPassword ? "Tạo mật khẩu ngay" : "Cập nhật mật khẩu mới"}
                icon="pi pi-lock"
                className="w-full"
                style={{
                  background: "linear-gradient(90deg, #0047ab, #00aaff)",
                  border: "none"
                }}
              />
            </form>
          </section>

          {/* Quản lý địa chỉ */}
          <section>
            <div className="flex justify-content-between align-items-center mb-3">
              <h4 className="m-0">Địa chỉ giao hàng</h4>
              <Button 
                label="Thêm địa chỉ mới" 
                icon="pi pi-plus" 
                onClick={() => setShowAddDialog(true)}
              />
            </div>

            <DataTable
              value={user.shippingAddress || []}
              emptyMessage="Chưa có địa chỉ nào"
              showGridlines
              className="p-datatable-sm"
            >
              <Column field="receiver" header="Người nhận" style={{ width: '15%' }} />
              <Column field="phone" header="SĐT" style={{ width: '12%' }} />
              <Column header="Địa chỉ" body={addressBodyTemplate} style={{ width: '70%' }} />
              <Column header="Hành động" body={actionBodyTemplate} style={{ width: '15%' }} align="center" />
            </DataTable>
          </section>
        </Card>
      </div>

      {/* Dialog thêm địa chỉ */}
      <Dialog
        header="Thêm địa chỉ mới"
        visible={showAddDialog}
        style={{ width: "500px" }}
        onHide={() => setShowAddDialog(false)}
      >
        <div className="flex flex-column gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-semibold">Người nhận *</label>
              <InputText
                value={addrForm.receiver}
                onChange={(e) => setAddrForm({ ...addrForm, receiver: e.target.value })}
                placeholder="Họ và tên"
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-semibold">SĐT *</label>
              <InputText
                value={addrForm.phone}
                onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                placeholder="0xxx xxx xxx"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Tỉnh/Thành phố *</label>
            <Dropdown
              value={addrForm.provinceCode}
              options={provinces}
              optionLabel="name"
              optionValue="code"
              onChange={onProvinceChange}
              placeholder="Chọn Tỉnh/Thành"
              filter
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Quận/Huyện *</label>
            <Dropdown
              value={addrForm.districtCode}
              options={districts}
              optionLabel="name"
              optionValue="code"
              onChange={onDistrictChange}
              placeholder="Chọn Quận/Huyện"
              disabled={!addrForm.provinceCode}
              filter
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Phường/Xã *</label>
            <Dropdown
              value={addrForm.wardCode}
              options={wards}
              optionLabel="name"
              optionValue="code"
              onChange={(e) => setAddrForm({ ...addrForm, wardCode: e.value })}
              placeholder="Chọn Phường/Xã"
              disabled={!addrForm.districtCode}
              filter
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Địa chỉ chi tiết *</label>
            <InputText
              value={addrForm.addressDetail}
              onChange={(e) => setAddrForm({ ...addrForm, addressDetail: e.target.value })}
              placeholder="Số nhà, tên đường..."
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Hủy"
            severity="secondary"
            onClick={() => setShowAddDialog(false)}
          />
          <Button
            label="Lưu"
            onClick={handleAddAddress}
          />
        </div>
      </Dialog>

      {/* Dialog sửa địa chỉ */}
      <Dialog
        header="Cập nhật địa chỉ"
        visible={showEditDialog}
        style={{ width: "500px" }}
        onHide={() => setShowEditDialog(false)}
      >
        <div className="flex flex-column gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-semibold">Người nhận *</label>
              <InputText
                value={editAddrForm.receiver}
                onChange={(e) => setEditAddrForm({ ...editAddrForm, receiver: e.target.value })}
                placeholder="Họ và tên"
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-semibold">SĐT *</label>
              <InputText
                value={editAddrForm.phone}
                onChange={(e) => setEditAddrForm({ ...editAddrForm, phone: e.target.value })}
                placeholder="0xxx xxx xxx"
                className="w-full"
              />
            </div>
          </div>

          <div style={{ backgroundColor: '#eef2ff', padding: '10px', borderRadius: '6px', fontSize: '13px', color: '#3730a3', border: '1px solid #c7d2fe' }}>
            <i className="pi pi-info-circle" style={{ marginRight: '5px' }}></i>
            Chọn lại thông tin hành chính bên dưới để cập nhật.
          </div>

          <div>
            <label className="block mb-1 font-semibold">Tỉnh/Thành phố *</label>
            <Dropdown
              value={editAddrForm.provinceCode}
              options={provinces}
              optionLabel="name"
              optionValue="code"
              onChange={onEditProvinceChange}
              placeholder="Chọn Tỉnh/Thành"
              filter
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Quận/Huyện *</label>
            <Dropdown
              value={editAddrForm.districtCode}
              options={editDistricts}
              optionLabel="name"
              optionValue="code"
              onChange={onEditDistrictChange}
              placeholder="Chọn Quận/Huyện"
              disabled={!editAddrForm.provinceCode}
              filter
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Phường/Xã *</label>
            <Dropdown
              value={editAddrForm.wardCode}
              options={editWards}
              optionLabel="name"
              optionValue="code"
              onChange={(e) => setEditAddrForm({ ...editAddrForm, wardCode: e.value })}
              placeholder="Chọn Phường/Xã"
              disabled={!editAddrForm.districtCode}
              filter
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Địa chỉ chi tiết *</label>
            <InputText
              value={editAddrForm.addressDetail}
              onChange={(e) => setEditAddrForm({ ...editAddrForm, addressDetail: e.target.value })}
              placeholder="Số nhà, tên đường..."
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Hủy"
            severity="secondary"
            onClick={() => setShowEditDialog(false)}
          />
          <Button
            label="Lưu thay đổi"
            onClick={handleSaveEditAddress}
          />
        </div>
      </Dialog>

      {/* Dialog xóa địa chỉ */}
      <Dialog
        header="Xác nhận xóa"
        visible={showDeleteDialog}
        style={{ width: "400px" }}
        onHide={() => setShowDeleteDialog(false)}
      >
        <p>Bạn có chắc chắn muốn xóa địa chỉ này không?</p>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Hủy"
            severity="secondary"
            onClick={() => setShowDeleteDialog(false)}
          />
          <Button
            label="Xóa"
            severity="danger"
            onClick={handleDeleteAddress}
          />
        </div>
      </Dialog>

      <Footer />
    </>
  );
}

export default Profile;
