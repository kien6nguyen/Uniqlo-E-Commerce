import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { RadioButton } from "primereact/radiobutton";
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

      <div className="bg-[#fdfdfd] min-h-screen pb-20">
        <div className="max-w-screen-md mx-auto px-4 pt-10">
          <div className="flex justify-content-between align-items-end mb-8 pb-4 border-bottom-2 border-black">
            <h1 className="m-0 text-2xl font-black uppercase tracking-tighter">Sổ địa chỉ</h1>
            <button 
              onClick={() => {
                setEditing(null);
                setForm({ name: "", phone: "", detail: "", province: null, district: null, ward: null });
                setShowDialog(true);
              }}
              className="bg-black text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest border-none cursor-pointer hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
            >
              Thêm địa chỉ mới
            </button>
          </div>

          {/* Danh sách địa chỉ */}
          {addresses.length === 0 ? (
            <div className="py-20 text-center bg-white border-round-lg border-1 border-100 shadow-sm">
              <i className="pi pi-map-marker text-gray-100 text-6xl mb-4"></i>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Bạn chưa lưu địa chỉ nào</p>
            </div>
          ) : (
            <div className="flex flex-column gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-6 bg-white border-1 border-round transition-all relative group cursor-pointer ${selected === addr.id ? 'border-black shadow-md' : 'border-gray-100 hover:border-gray-300'}`}
                  onClick={() => handleSelect(addr.id)}
                >
                  <div className="flex align-items-start gap-4">
                    <div className="mt-1">
                      <RadioButton
                        inputId={addr.id}
                        name="address"
                        value={addr.id}
                        onChange={() => handleSelect(addr.id)}
                        checked={selected === addr.id}
                        pt={{
                          box: ({ props }) => ({
                            className: props.checked ? 'bg-black border-black' : 'border-gray-300'
                          }),
                          icon: { className: 'text-[10px]' }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex align-items-center gap-3 mb-2">
                        <span className="text-sm font-black uppercase tracking-tight">{addr.name}</span>
                        {selected === addr.id && (
                          <span className="bg-black text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">Mặc định</span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">{addr.phone}</div>
                      <div className="text-xs text-gray-600 leading-relaxed max-w-[500px]">
                        {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
                        className="p-2 bg-gray-50 border-none text-gray-400 hover:text-black cursor-pointer transition-colors border-round"
                      >
                        <i className="pi pi-pencil text-sm"></i>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                        className="p-2 bg-gray-50 border-none text-gray-400 hover:text-red-500 cursor-pointer transition-colors border-round"
                      >
                        <i className="pi pi-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        header={<span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{editing ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}</span>}
        visible={showDialog}
        modal
        style={{ width: "500px", borderRadius: '8px' }}
        onHide={() => setShowDialog(false)}
        footer={
          <div className="flex justify-content-end gap-3 p-4">
            <button 
              onClick={() => setShowDialog(false)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-black transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={handleSave}
              className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-none cursor-pointer hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
            >
              Lưu địa chỉ
            </button>
          </div>
        }
      >
        <div className="flex flex-column gap-5 p-2">
          <div className="grid grid-nogutter gap-4">
            <div className="col">
              <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Tên người nhận *</label>
              <InputText
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border-none border-bottom-2 border-100 border-noround text-sm p-3 focus:border-black transition-all outline-none"
                placeholder="Họ và tên"
              />
            </div>
            <div className="col">
              <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Số điện thoại *</label>
              <InputText
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border-none border-bottom-2 border-100 border-noround text-sm p-3 focus:border-black transition-all outline-none"
                keyfilter="int"
                placeholder="Nhập 10 số"
                maxLength={10}
              />
            </div>
          </div>

          <div className="flex flex-column gap-4">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Địa chỉ chi tiết *</label>
            
            <div className="grid grid-nogutter gap-3">
              <div className="col">
                <Dropdown
                  value={form.province}
                  options={provinces}
                  optionLabel="name"
                  onChange={(e) => setForm({ ...form, province: e.value })}
                  placeholder="Tỉnh/Thành phố"
                  className="w-full border-none border-bottom-2 border-100 border-noround text-xs focus:border-black"
                />
              </div>
              <div className="col">
                <Dropdown
                  value={form.district}
                  options={districts}
                  optionLabel="name"
                  onChange={(e) => setForm({ ...form, district: e.value })}
                  placeholder="Quận/Huyện"
                  className="w-full border-none border-bottom-2 border-100 border-noround text-xs focus:border-black"
                  disabled={!form.province}
                />
              </div>
            </div>

            <Dropdown
              value={form.ward}
              options={wards}
              optionLabel="name"
              onChange={(e) => setForm({ ...form, ward: e.value })}
              placeholder="Xã/Phường"
              className="w-full border-none border-bottom-2 border-100 border-noround text-xs focus:border-black"
              disabled={!form.district}
            />

            <InputText
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              placeholder="Số nhà, tên đường..."
              className="w-full border-none border-bottom-2 border-100 border-noround text-sm p-3 focus:border-black transition-all outline-none"
            />
          </div>
        </div>
      </Dialog>

      <Footer />
    </>
  );
};

export default AddressPage;
