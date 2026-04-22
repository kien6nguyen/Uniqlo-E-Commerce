import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { RadioButton } from "primereact/radiobutton";
import Header from "../components/Header";
import Footer from "../components/Footer";

const AddressPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    detail: "",
    province: null,
    district: null,
    ward: null,
  });

  // ======== LẤY DỮ LIỆU TỈNH/HUYỆN/XÃ ========
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then(setProvinces);

    const stored = JSON.parse(localStorage.getItem("addresses")) || [];
    setAddresses(stored);

    const selectedId = localStorage.getItem("selectedAddressId");
    if (selectedId) setSelected(selectedId);
  }, []);

  useEffect(() => {
    if (form.province) {
      fetch(`https://provinces.open-api.vn/api/p/${form.province.code}?depth=2`)
        .then((res) => res.json())
        .then((data) => setDistricts(data.districts || []));
    } else setDistricts([]);
    setForm((f) => ({ ...f, district: null, ward: null }));
    setWards([]);
  }, [form.province]);

  useEffect(() => {
    if (form.district) {
      fetch(
        `https://provinces.open-api.vn/api/d/${form.district.code}?depth=2`
      )
        .then((res) => res.json())
        .then((data) => setWards(data.wards || []));
    } else setWards([]);
    setForm((f) => ({ ...f, ward: null }));
  }, [form.district]);

  // ======== HÀM LƯU, XOÁ, SỬA ========
  const handleSave = () => {
    if (!form.name || !form.phone || !form.detail) {
      alert("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    // ✅ Kiểm tra số điện thoại: chỉ 10 chữ số
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.phone)) {
      alert("⚠️ Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số.");
      return;
    }

    const newAddress = {
      id: editing ? editing.id : Date.now().toString(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      detail: form.detail.trim(),
      province: form.province?.name,
      district: form.district?.name,
      ward: form.ward?.name,
    };

    let updated = [];
    if (editing) {
      updated = addresses.map((a) =>
        a.id === editing.id ? newAddress : a
      );
    } else {
      updated = [...addresses, newAddress];
    }

    setAddresses(updated);
    localStorage.setItem("addresses", JSON.stringify(updated));
    setShowDialog(false);
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      detail: "",
      province: null,
      district: null,
      ward: null,
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa địa chỉ này không?")) {
      const updated = addresses.filter((a) => a.id !== id);
      setAddresses(updated);
      localStorage.setItem("addresses", JSON.stringify(updated));
      if (selected === id) {
        setSelected(null);
        localStorage.removeItem("selectedAddress");
        localStorage.removeItem("selectedAddressId");
      }
    }
  };

  const handleEdit = (addr) => {
    setEditing(addr);
    setForm({
      name: addr.name,
      phone: addr.phone,
      detail: addr.detail,
      province: provinces.find((p) => p.name === addr.province) || null,
      district: { name: addr.district },
      ward: { name: addr.ward },
    });
    setShowDialog(true);
  };

  // ✅ Lưu địa chỉ được chọn và quay về Checkout
  const handleSelect = (id) => {
    setSelected(id);
    const selectedAddress = addresses.find((a) => a.id === id);
    localStorage.setItem("selectedAddressId", id);
    localStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
    window.location.href = "/checkout"; // quay lại trang thanh toán
  };

  return (
    <>
      <Header />
      <div className="p-5 bg-gray-50 flex justify-content-center">
        <div
          className="surface-card border-round-lg shadow-2 p-5"
          style={{ width: "900px", background: "#fff" }}
        >
          <h2 className="text-2xl font-bold mb-4">Quản lý địa chỉ giao hàng</h2>

          {/* Danh sách địa chỉ */}
          {addresses.length === 0 ? (
            <p>Chưa có địa chỉ nào.</p>
          ) : (
            <div className="flex flex-column gap-3 mb-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3 border-1 border-round-lg flex justify-content-between align-items-center"
                  style={{
                    borderColor: selected === addr.id ? "#0d6efd" : "#d1d5db",
                    backgroundColor:
                      selected === addr.id ? "#eef5ff" : "#ffffff",
                  }}
                >
                  <div className="flex align-items-center gap-3">
                    <RadioButton
                      inputId={addr.id}
                      name="address"
                      value={addr.id}
                      onChange={() => handleSelect(addr.id)}
                      checked={selected === addr.id}
                    />
                    <div>
                      <div className="font-bold">{addr.name}</div>
                      <div className="text-sm text-500">{addr.phone}</div>
                      <div>
                        {addr.detail}, {addr.ward}, {addr.district},{" "}
                        {addr.province}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      onClick={() => handleEdit(addr)}
                      tooltip="Sửa"
                    />
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      onClick={() => handleDelete(addr.id)}
                      tooltip="Xóa"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            label="Thêm địa chỉ mới"
            icon="pi pi-plus"
            onClick={() => {
              setEditing(null);
              setForm({
                name: "",
                phone: "",
                detail: "",
                province: null,
                district: null,
                ward: null,
              });
              setShowDialog(true);
            }}
          />
        </div>
      </div>

      {/* ✅ Hộp thoại thêm/sửa đẹp, có header căn giữa */}
      <Dialog
        header={
          <div
            style={{
              textAlign: "center",
              fontWeight: "700",
              fontSize: "1.2rem",
              color: "#374151",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "10px",
            }}
          >
            {editing ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </div>
        }
        visible={showDialog}
        modal
        style={{ width: "580px" }}
        onHide={() => setShowDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Hủy" text onClick={() => setShowDialog(false)} />
            <Button label="Lưu" onClick={handleSave} />
          </div>
        }
      >
        {/* ✅ Form có khoảng cách hợp lý giữa label và input */}
        <div className="flex flex-column gap-4 mt-3">
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#374151" }}>
              Họ tên người nhận
            </label>
            <InputText
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#374151" }}>
              Số điện thoại
            </label>
            <InputText
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full"
              keyfilter="int"
              placeholder="Nhập 10 số điện thoại"
              maxLength={10}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#374151" }}>
              Tỉnh / Thành phố
            </label>
            <Dropdown
              value={form.province}
              options={provinces}
              optionLabel="name"
              onChange={(e) => setForm({ ...form, province: e.value })}
              placeholder="Chọn tỉnh"
              className="w-full"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#374151" }}>
              Huyện / Quận
            </label>
            <Dropdown
              value={form.district}
              options={districts}
              optionLabel="name"
              onChange={(e) => setForm({ ...form, district: e.value })}
              placeholder="Chọn huyện"
              className="w-full"
              disabled={!form.province}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#374151" }}>
              Xã / Phường
            </label>
            <Dropdown
              value={form.ward}
              options={wards}
              optionLabel="name"
              onChange={(e) => setForm({ ...form, ward: e.value })}
              placeholder="Chọn xã"
              className="w-full"
              disabled={!form.district}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#374151" }}>
              Địa chỉ chi tiết
            </label>
            <InputText
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              placeholder="Số nhà, tên đường..."
              className="w-full"
            />
          </div>
        </div>
      </Dialog>

      <Footer />
    </>
  );
};

export default AddressPage;
