import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";

function AddressForm({ form, setForm, fieldErrors }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Lấy danh sách tỉnh
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();
        setProvinces(data.map((p) => ({ code: p.code, name: p.name })));
      } catch (err) {
        console.error("Lỗi load provinces", err);
      }
    };
    fetchProvinces();
  }, []);

  // Khi chọn tỉnh -> load huyện
  useEffect(() => {
    if (form.province) {
      const fetchDistricts = async () => {
        try {
          const res = await fetch(
            `https://provinces.open-api.vn/api/p/${form.province}?depth=2`
          );
          const data = await res.json();
          setDistricts(
            data.districts.map((d) => ({ code: d.code, name: d.name }))
          );
          setWards([]);
          setForm({ ...form, district: "", ward: "" });
        } catch (err) {
          console.error("Lỗi load districts", err);
        }
      };
      fetchDistricts();
    }
  }, [form.province]);

  // Khi chọn huyện -> load xã
  useEffect(() => {
    if (form.district) {
      const fetchWards = async () => {
        try {
          const res = await fetch(
            `https://provinces.open-api.vn/api/d/${form.district}?depth=2`
          );
          const data = await res.json();
          setWards(data.wards.map((w) => ({ code: w.code, name: w.name })));
          setForm({ ...form, ward: "" });
        } catch (err) {
          console.error("Lỗi load wards", err);
        }
      };
      fetchWards();
    }
  }, [form.district]);

  return (
    <div className="flex flex-column gap-3">
      {/* Tỉnh */}
      <Dropdown
        value={form.province}
        options={provinces}
        optionLabel="name"
        optionValue="code"
        onChange={(e) => setForm({ ...form, province: e.value })}
        placeholder="Chọn Tỉnh/Thành phố"
        className={`w-full ${fieldErrors.province ? "p-invalid" : ""}`}
      />
      {fieldErrors.province && (
        <small className="p-error">{fieldErrors.province}</small>
      )}

      {/* Huyện */}
      <Dropdown
        value={form.district}
        options={districts}
        optionLabel="name"
        optionValue="code"
        onChange={(e) => setForm({ ...form, district: e.value })}
        placeholder="Chọn Quận/Huyện"
        className={`w-full ${fieldErrors.district ? "p-invalid" : ""}`}
        disabled={!form.province}
      />
      {fieldErrors.district && (
        <small className="p-error">{fieldErrors.district}</small>
      )}

      {/* Xã */}
      <Dropdown
        value={form.ward}
        options={wards}
        optionLabel="name"
        optionValue="code"
        onChange={(e) => setForm({ ...form, ward: e.value })}
        placeholder="Chọn Xã/Phường"
        className={`w-full ${fieldErrors.ward ? "p-invalid" : ""}`}
        disabled={!form.district}
      />
      {fieldErrors.ward && (
        <small className="p-error">{fieldErrors.ward}</small>
      )}

      {/* Số nhà */}
      <InputText
        value={form.addressDetail}
        onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
        placeholder="Số nhà, đường..."
        className={`w-full ${
          fieldErrors.addressDetail ? "p-invalid" : ""
        }`}
      />
      {fieldErrors.addressDetail && (
        <small className="p-error">{fieldErrors.addressDetail}</small>
      )}
    </div>
  );
}

export default AddressForm;
