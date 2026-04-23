import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../utils/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";

function Register() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullname: "",
    province: "",
    district: "",
    ward: "",
    addressDetail: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();
        setProvinces(data.map((p) => ({ name: p.name, code: p.code })));
      } catch (err) {
        console.error("Lỗi load provinces:", err);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (form.province) {
      const fetchDistricts = async () => {
        try {
          const res = await fetch(`https://provinces.open-api.vn/api/p/${form.province}?depth=2`);
          const data = await res.json();
          setDistricts(data.districts.map((d) => ({ name: d.name, code: d.code })));
          setWards([]);
          setForm((prev) => ({ ...prev, district: "", ward: "" }));
        } catch (err) {
          console.error("Lỗi load districts:", err);
        }
      };
      fetchDistricts();
    }
  }, [form.province]);

  useEffect(() => {
    if (form.district) {
      const fetchWards = async () => {
        try {
          const res = await fetch(`https://provinces.open-api.vn/api/d/${form.district}?depth=2`);
          const data = await res.json();
          setWards(data.wards.map((w) => ({ name: w.name, code: w.code })));
          setForm((prev) => ({ ...prev, ward: "" }));
        } catch (err) {
          console.error("Lỗi load wards:", err);
        }
      };
      fetchWards();
    }
  }, [form.district]);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "email") {
      if (!validateEmail(value)) {
        setFieldErrors((prev) => ({ ...prev, email: "Email không hợp lệ" }));
      } else {
        setFieldErrors((prev) => {
          const { email, ...rest } = prev;
          return rest;
        });
      }
    } else if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const { [name]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    let errors = {};
    Object.keys(form).forEach((key) => {
      if (!form[key]) {
        errors[key] = "Trường này không được bỏ trống";
      }
    });

    if (form.email && !validateEmail(form.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const res = await api.post("/auth/register", form);
      if (res.data.success) {
        setSuccess(res.data.message);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(res.data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi server");
    }
  };

  return (
    <div className="min-h-screen flex flex-column bg-white">
      <Header />
      
      <main className="flex-grow flex align-items-center justify-content-center py-8 px-4 md:px-6">
        <div className="w-full max-w-50rem">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold m-0 mb-1 tracking-tight uppercase">Tạo tài khoản</h1>
            <p className="text-500 text-sm font-medium">Trở thành thành viên của UNIQLO</p>
          </div>

          {error && (
            <div className="mb-4">
              <Message severity="error" text={error} className="w-full text-xs" style={{ borderRadius: 0 }} />
            </div>
          )}
          {success && (
            <div className="mb-4">
              <Message severity="success" text={success} className="w-full text-xs" style={{ borderRadius: 0 }} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid">
            {/* COLUMN 1: INFORMATION & ADDRESS */}
            <div className="col-12 md:col-6 flex flex-column gap-3 px-3">
              <div className="flex flex-column gap-1">
                <label className="font-bold text-xs uppercase tracking-wider text-700">Họ và tên</label>
                <InputText
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  className={`w-full ${fieldErrors.fullname ? "p-invalid" : ""}`}
                  style={{ padding: '0.65rem' }}
                />
                {fieldErrors.fullname && <small className="p-error text-xs font-semibold">{fieldErrors.fullname}</small>}
              </div>

              <div className="flex flex-column gap-1">
                <label className="font-bold text-xs uppercase tracking-wider text-700">Email</label>
                <InputText
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email"
                  className={`w-full ${fieldErrors.email ? "p-invalid" : ""}`}
                  style={{ padding: '0.65rem' }}
                />
                {fieldErrors.email && <small className="p-error text-xs font-semibold">{fieldErrors.email}</small>}
              </div>

              <div className="flex flex-column gap-1">
                <label className="font-bold text-xs uppercase tracking-wider text-700">Tỉnh/Thành phố</label>
                <Dropdown
                  value={form.province}
                  options={provinces}
                  optionLabel="name"
                  optionValue="code"
                  onChange={(e) => setForm({ ...form, province: e.value })}
                  placeholder="Chọn tỉnh/thành phố"
                  filter
                  className={`w-full ${fieldErrors.province ? "p-invalid" : ""}`}
                />
                {fieldErrors.province && <small className="p-error text-xs font-semibold">{fieldErrors.province}</small>}
              </div>

              <div className="flex flex-column gap-1">
                <label className="font-bold text-xs uppercase tracking-wider text-700">Quận/Huyện</label>
                <Dropdown
                  value={form.district}
                  options={districts}
                  optionLabel="name"
                  optionValue="code"
                  onChange={(e) => setForm({ ...form, district: e.value })}
                  placeholder="Chọn quận/huyện"
                  filter
                  className={`w-full ${fieldErrors.district ? "p-invalid" : ""}`}
                  disabled={!form.province}
                />
                {fieldErrors.district && <small className="p-error text-xs font-semibold">{fieldErrors.district}</small>}
              </div>

              <div className="flex flex-column gap-1">
                <label className="font-bold text-xs uppercase tracking-wider text-700">Phường/Xã</label>
                <Dropdown
                  value={form.ward}
                  options={wards}
                  optionLabel="name"
                  optionValue="code"
                  onChange={(e) => setForm({ ...form, ward: e.value })}
                  placeholder="Chọn phường/xã"
                  filter
                  className={`w-full ${fieldErrors.ward ? "p-invalid" : ""}`}
                  disabled={!form.district}
                />
                {fieldErrors.ward && <small className="p-error text-xs font-semibold">{fieldErrors.ward}</small>}
              </div>
            </div>

            {/* COLUMN 2: SECURITY & ACTIONS */}
            <div className="col-12 md:col-6 flex flex-column gap-3 px-3">
              <div className="flex flex-column gap-1">
                <label className="font-bold text-xs uppercase tracking-wider text-700">Địa chỉ chi tiết</label>
                <InputText
                  name="addressDetail"
                  value={form.addressDetail}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường..."
                  className={`w-full ${fieldErrors.addressDetail ? "p-invalid" : ""}`}
                  style={{ padding: '0.65rem' }}
                />
                {fieldErrors.addressDetail && <small className="p-error text-xs font-semibold">{fieldErrors.addressDetail}</small>}
              </div>

              <div className="flex flex-column gap-1">
                <label className="font-bold text-xs uppercase tracking-wider text-700">Mật khẩu</label>
                <InputText
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mật khẩu"
                  className={`w-full ${fieldErrors.password ? "p-invalid" : ""}`}
                  style={{ padding: '0.65rem' }}
                />
                {fieldErrors.password && <small className="p-error text-xs font-semibold">{fieldErrors.password}</small>}
              </div>

              <div className="flex flex-column gap-1">
                <label className="font-bold text-xs uppercase tracking-wider text-700">Xác nhận mật khẩu</label>
                <InputText
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu"
                  className={`w-full ${fieldErrors.confirmPassword ? "p-invalid" : ""}`}
                  style={{ padding: '0.65rem' }}
                />
                {fieldErrors.confirmPassword && <small className="p-error text-xs font-semibold">{fieldErrors.confirmPassword}</small>}
              </div>

              <div className="flex align-items-center mb-2">
                <Checkbox
                  inputId="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.checked)}
                  className="mr-2"
                />
                <label htmlFor="showPassword" className="text-xs cursor-pointer select-none text-600 font-medium">
                  Hiển thị mật khẩu
                </label>
              </div>

              <div className="mt-2 flex flex-column gap-3">
                <Button
                  type="submit"
                  label="ĐĂNG KÝ"
                  className="w-full bg-black text-white hover:bg-gray-800 transition-colors border-none py-2 font-bold tracking-widest text-sm"
                  style={{ borderRadius: 0, height: '44px' }}
                />

                <div className="relative flex align-items-center justify-content-center my-1">
                  <div className="border-top-1 border-200 w-full absolute"></div>
                  <span className="bg-white px-3 text-400 text-xs font-bold relative z-1">HOẶC</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const apiUrl = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:3000"}`;
                    window.location.href = `${apiUrl}/api/auth/google`;
                  }}
                  className="w-full bg-white text-black border-1 border-black hover:bg-black hover:text-white transition-all py-2 font-bold tracking-widest text-sm flex align-items-center justify-content-center cursor-pointer"
                  style={{ height: '44px' }}
                >
                  <i className="pi pi-google mr-2"></i>
                  TIẾP TỤC VỚI GOOGLE
                </button>
              </div>

              <div className="text-center mt-3">
                <span className="text-500 text-xs">Bạn đã có tài khoản? </span>
                <Link to="/login" className="font-bold text-black border-bottom-1 border-black hover:opacity-70 ml-1 text-xs">
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Register;
