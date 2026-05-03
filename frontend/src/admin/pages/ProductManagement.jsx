import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Chip } from "primereact/chip";
import { Checkbox } from "primereact/checkbox";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/products`;

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const fileInputRef = useRef(null);
  const toast = useRef(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [showProductDeleteDialog, setShowProductDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const categories = [
    { label: "Nữ (Woman)", value: "woman" },
    { label: "Nam (Man)", value: "man" },
    { label: "Trẻ em (Kid)", value: "kid" },
    { label: "Em bé (Baby)", value: "baby" },
  ];

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: null,
    stock: 0,
    description: "",
    brand: "",
    isHotDeal: false,
    isNewProduct: false,
    images: [],
    newImages: []
  });

  const [variantForm, setVariantForm] = useState({
    name: "",
    price: null,
    stock: 0,
    sku: ""
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setTableLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_BASE, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách sản phẩm",
        life: 3000
      });
      console.error("Error loading products:", err);
    } finally {
      setTableLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      price: null,
      stock: 0,
      description: "",
      brand: "",
      isHotDeal: false,
      isNewProduct: false,
      images: [],
      newImages: []
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAdd = () => {
    setIsEdit(false);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (product) => {
    setIsEdit(true);
    setSelectedProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      description: product.description || "",
      brand: product.brand || "",
      isHotDeal: product.isHotDeal || false,
      isNewProduct: product.isNewProduct || false,
      images: product.images || [],
      newImages: []
    });
    setShowDialog(true);
  };
  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowProductDeleteDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/${productToDelete._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Đã xóa",
          detail: "Sản phẩm đã được xóa thành công",
          life: 3000
        });
        loadProducts();
      } else {
        throw new Error("Không thể xóa sản phẩm");
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: err.message,
        life: 3000
      });
    } finally {
      setShowProductDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setForm({ ...form, newImages: files });
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeExistingImage = (index) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);
    setForm({ ...form, images: newImages });
  };

  const removeNewImage = (index) => {
    const newImages = [...form.newImages];
    newImages.splice(index, 1);
    setForm({ ...form, newImages });
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.price) {
      toast.current?.show({
        severity: "error",
        summary: "Thiếu thông tin",
        detail: "Vui lòng nhập tên, danh mục và giá",
        life: 3000
      });
      return;
    }

    if (form.price < 0) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi giá trị",
        detail: "Giá sản phẩm không được là số âm",
        life: 3000
      });
      return;
    }

    if (form.stock < 0) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi giá trị",
        detail: "Số lượng tồn kho không được là số âm",
        life: 3000
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("description", form.description);
      formData.append("brand", form.brand);
      formData.append("isHotDeal", form.isHotDeal);
      formData.append("isNewProduct", form.isNewProduct);

      if (isEdit) {
        formData.append("existingImages", JSON.stringify(form.images));
      }

      form.newImages.forEach((file) => {
        formData.append("images", file);
      });

      const url = isEdit ? `${API_BASE}/${selectedProduct._id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: isEdit ? "Cập nhật thành công" : "Thêm thành công",
          detail: data.message,
          life: 3000
        });
        setShowDialog(false);
        loadProducts();
      } else {
        throw new Error(data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: err.message,
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  const newProductBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: 'center' }}>
        {rowData.isNewProduct ? (
          <Chip label="New" style={{ backgroundColor: '#d1fae5', color: '#065f46' }} /> // Màu xanh lá
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
        )}
      </div>
    );
  };
  const handleManageVariants = (product) => {
    setSelectedProduct(product);
    setVariantForm({ name: "", price: null, stock: 0, sku: "" });
    setShowVariantDialog(true);
  };

  const handleAddVariant = async () => {
    if (!variantForm.name || !variantForm.price || variantForm.stock === null) {
      toast.current?.show({
        severity: "error",
        summary: "Thiếu thông tin",
        detail: "Vui lòng nhập đầy đủ thông tin variant",
        life: 3000
      });
      return;
    }

    if (variantForm.price < 0) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi giá trị",
        detail: "Giá variant không được là số âm",
        life: 3000
      });
      return;
    }

    if (variantForm.stock < 0) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi giá trị",
        detail: "Số lượng tồn kho variant không được là số âm",
        life: 3000
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/${selectedProduct._id}/variants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(variantForm)
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã thêm variant",
          life: 3000
        });
        setVariantForm({ name: "", price: null, stock: 0, sku: "" });

        await loadProducts();
        setSelectedProduct(data.product);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: err.message,
        life: 3000
      });
    }
  };

  const confirmDeleteVariant = (variantId) => {
    setVariantToDelete(variantId);
    setShowDeleteDialog(true);
  };

  const handleDeleteVariant = async () => {
    if (!variantToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/${selectedProduct._id}/variants/${variantToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Đã xóa",
          detail: "Variant đã được xóa",
          life: 3000
        });

        await loadProducts();
        setSelectedProduct(data.product);

        setShowDeleteDialog(false);
        setVariantToDelete(null);
      } else {
        throw new Error(data.message || "Không thể xóa variant");
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: err.message,
        life: 3000
      });
      setShowDeleteDialog(false);
      setVariantToDelete(null);
    }
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#374151' }}>Quản lý sản phẩm</h2>
      <Button
        label="Thêm sản phẩm"
        icon="pi pi-plus"
        style={{ backgroundColor: '#0047ab', border: 'none' }}
        onClick={handleAdd}
      />
    </div>
  );

  const actionBody = (rowData) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
      <Button
        icon="pi pi-list"
        rounded
        text
        severity="success"
        tooltip="Quản lý variants"
        onClick={() => handleManageVariants(rowData)}
      />
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        tooltip="Sửa sản phẩm"
        onClick={() => handleEdit(rowData)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        tooltip="Xóa sản phẩm"
        onClick={() => handleDelete(rowData)}
      />
    </div>
  );

  const imageBodyTemplate = (rowData) => {
    const imageUrl = rowData.images?.[0];
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={rowData.name}
            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
          />
        ) : (
          <div style={{ width: '50px', height: '50px', backgroundColor: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <i className="pi pi-image" style={{ fontSize: '1.5rem' }}></i>
          </div>
        )}
      </div>
    );
  };

  const variantsBodyTemplate = (rowData) => {
    const variants = rowData.variants || [];

    if (variants.length === 0) {
      return (
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Không có variant</span>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center' }}>
        <Chip
          label={`${variants.length} variant${variants.length > 1 ? 's' : ''}`}
          style={{ backgroundColor: '#dbeafe', color: '#1e40af', cursor: 'pointer' }}
          onClick={() => handleManageVariants(rowData)}
        />
      </div>
    );
  };

  const hotDealBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: 'center' }}>
        {rowData.isHotDeal ? (
          <Chip label="Hot Deal" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }} />
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
        )}
      </div>
    );
  };

  const dialogFooter = (
    <div style={{ display: 'flex', gap: '15px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', marginTop: '20px' }}>
      <Button
        label="Hủy"
        onClick={() => setShowDialog(false)}
        style={{
          flex: 1,
          backgroundColor: '#f3f4f6',
          color: '#4b5563',
          border: '1px solid #e5e7eb',
          fontWeight: '600'
        }}
      />
      <Button
        label={isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
        loading={loading}
        onClick={handleSave}
        style={{
          flex: 1,
          backgroundColor: '#0047ab',
          border: 'none',
          color: 'white',
          fontWeight: '600'
        }}
      />
    </div>
  );

  const variantDialogFooter = (
    <div style={{ display: 'flex', gap: '10px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', marginTop: '15px' }}>
      <Button
        label="Đóng"
        onClick={() => setShowVariantDialog(false)}
        style={{
          flex: 1,
          backgroundColor: '#f3f4f6',
          color: '#4b5563',
          border: '1px solid #e5e7eb',
          fontWeight: '600'
        }}
      />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <div className="card shadow-lg" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
        <DataTable
          value={products}
          header={header}
          paginator
          rows={10}
          loading={tableLoading}
          showGridlines
          className="p-datatable-sm"
          tableStyle={{ minWidth: "60rem" }}
          emptyMessage="Chưa có sản phẩm nào."
          rowHover
        >
          <Column
            header="Hình ảnh"
            body={imageBodyTemplate}
            alignHeader="center"
            align="center"
            style={{ width: "8%" }}
          />
          <Column
            header="Mới"
            body={newProductBodyTemplate}
            alignHeader="center"
            align="center"
            style={{ width: "8%" }}
          />

          <Column
            field="name"
            header="Tên sản phẩm"
            sortable
            alignHeader="center"
            align="center"
            style={{ width: "20%", fontWeight: "600" }}
          />

          <Column
            field="category"
            header="Danh mục"
            sortable
            alignHeader="center"
            align="center"
            style={{ width: "12%" }}
          />

          <Column
            field="brand"
            header="Thương hiệu"
            sortable
            alignHeader="center"
            align="center"
            style={{ width: "12%" }}
          />

          <Column
            field="price"
            header="Giá (₫)"
            sortable
            body={(row) => row.price ? row.price.toLocaleString("vi-VN") : "-"}
            alignHeader="center"
            align="center"
            style={{ width: "12%" }}
          />

          <Column
            field="stock"
            header="Tồn kho"
            sortable
            alignHeader="center"
            align="center"
            style={{ width: "8%" }}
          />

          <Column
            header="Variants"
            body={variantsBodyTemplate}
            alignHeader="center"
            align="center"
            style={{ width: "12%" }}
          />

          <Column
            header="Hot Deal"
            body={hotDealBodyTemplate}
            alignHeader="center"
            align="center"
            style={{ width: "8%" }}
          />

          <Column
            body={actionBody}
            header="Thao tác"
            alignHeader="center"
            align="center"
            style={{ width: "12%" }}
          />
        </DataTable>
      </div>

      <Dialog
        header={<div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>{isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</div>}
        visible={showDialog}
        style={{ width: "600px", borderRadius: '12px', overflow: 'hidden' }}
        modal
        onHide={() => setShowDialog(false)}
        draggable={false}
        contentStyle={{ padding: '20px', maxHeight: '70vh', overflow: 'auto' }}
        footer={dialogFooter}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', color: '#374151' }}>Hình ảnh sản phẩm</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />

            <div
              style={{
                minHeight: '120px',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: '#f9fafb',
                padding: '10px'
              }}
              onClick={triggerFileUpload}
            >
              {form.images.length === 0 && form.newImages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af' }}>
                  <i className="pi pi-image" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Nhấn để tải ảnh lên</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
                  {form.images.map((img, idx) => (
                    <div key={`existing-${idx}`} style={{ position: 'relative' }}>
                      <img src={img} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                      <Button
                        icon="pi pi-times" 
                        rounded
                        text
                        severity="danger"
                        size="small"
                        style={{ position: 'absolute', top: '-20px', right: '-20px', backgroundColor: 'white' }}
                        onClick={(e) => { e.stopPropagation(); removeExistingImage(idx); }}
                      />
                    </div>
                  ))}
                  {form.newImages.map((file, idx) => (
                    <div key={`new-${idx}`} style={{ position: 'relative' }}>
                      <img src={URL.createObjectURL(file)} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                      <Button
                        icon="pi pi-times"
                        rounded
                        text
                        severity="danger"
                        size="small"
                        style={{ position: 'absolute', top: '-20px', right: '-20px', backgroundColor: 'white' }}
                        onClick={(e) => { e.stopPropagation(); removeNewImage(idx); }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Tên sản phẩm <span style={{ color: 'red' }}>*</span></label>
              <InputText
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Áo phông Uniqlo U"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Danh mục <span style={{ color: 'red' }}>*</span></label>
                <Dropdown
                  value={form.category}
                  options={categories}
                  onChange={(e) => setForm({ ...form, category: e.value })}
                  placeholder="Chọn danh mục"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Thương hiệu</label>
                <InputText
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Ví dụ: Uniqlo"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Giá bán (₫) <span style={{ color: 'red' }}>*</span></label>
                <InputNumber
                  value={form.price}
                  onValueChange={(e) => setForm({ ...form, price: e.value })}
                  mode="currency"
                  currency="VND"
                  locale="vi-VN"
                  placeholder="0"
                  style={{ width: '100%' }}
                  inputStyle={{ width: '100%' }}
                  min={0}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Tồn kho</label>
                <InputNumber
                  value={form.stock}
                  onValueChange={(e) => setForm({ ...form, stock: e.value })}
                  placeholder="0"
                  style={{ width: '100%' }}
                  inputStyle={{ width: '100%' }}
                  min={0}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Checkbox
                    checked={form.isHotDeal}
                    onChange={(e) => setForm({ ...form, isHotDeal: e.checked })}
                    inputId="hotdeal"
                  />
                  <label htmlFor="hotdeal" style={{ fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                    Hot Deal
                  </label>
                </div>

              
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Checkbox
                    checked={form.isNewProduct}
                    onChange={(e) => setForm({ ...form, isNewProduct: e.checked })}
                    inputId="newproduct"
                  />
                  <label htmlFor="newproduct" style={{ fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                    Sản phẩm mới
                  </label>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Mô tả</label>
              <InputTextarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Nhập mô tả chi tiết..."
                rows={3}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        header={<div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Quản lý Variants - {selectedProduct?.name}</div>}
        visible={showVariantDialog}
        style={{ width: "650px", borderRadius: '12px' }}
        modal
        onHide={() => setShowVariantDialog(false)}
        draggable={false}
        contentStyle={{ padding: '20px' }}
        footer={variantDialogFooter}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Thêm variant mới</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InputText
                value={variantForm.name}
                onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                placeholder="Tên variant (VD: 128GB)"
              />
              <InputNumber
                value={variantForm.price}
                onValueChange={(e) => setVariantForm({ ...variantForm, price: e.value })}
                placeholder="Giá"
                mode="currency"
                currency="VND"
                locale="vi-VN"
                min={0}
              />
              <InputNumber
                value={variantForm.stock}
                onValueChange={(e) => setVariantForm({ ...variantForm, stock: e.value })}
                placeholder="Tồn kho"
                min={0}
              />
              <InputText
                value={variantForm.sku}
                onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                placeholder="SKU (tùy chọn)"
              />
            </div>
            <Button
              label="Thêm Variant"
              icon="pi pi-plus"
              className="mt-2"
              style={{ backgroundColor: '#0047ab', border: 'none' }}
              onClick={handleAddVariant}
            />
          </div>

          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Danh sách variants ({selectedProduct?.variants?.length || 0})</h4>
            {!selectedProduct?.variants || selectedProduct.variants.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Chưa có variant nào</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedProduct.variants.map((variant) => (
                  <div
                    key={variant._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: 'white'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{variant.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Giá: {variant.price?.toLocaleString("vi-VN")}₫ | Tồn: {variant.stock}
                        {variant.sku && ` | SKU: ${variant.sku}`}
                      </div>
                    </div>
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      onClick={() => confirmDeleteVariant(variant._id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>
      <Dialog
        header="Xác nhận xóa"
        visible={showDeleteDialog}
        style={{ width: "400px" }}
        modal
        onHide={() => {
          setShowDeleteDialog(false);
          setVariantToDelete(null);
        }}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button
              label="Hủy"
              onClick={() => {
                setShowDeleteDialog(false);
                setVariantToDelete(null);
              }}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                border: '1px solid #e5e7eb',
                fontWeight: '600'
              }}
            />
            <Button
              label="Xóa"
              onClick={handleDeleteVariant}
              style={{
                backgroundColor: '#dc2626',
                border: 'none',
                color: 'white',
                fontWeight: '600'
              }}
            />
          </div>
        }
      >
        <p>Bạn có chắc chắn muốn xóa variant này?</p>
      </Dialog>
      <Dialog
        header="Xác nhận xóa sản phẩm"
        visible={showProductDeleteDialog}
        style={{ width: "450px" }}
        modal
        onHide={() => {
          setShowProductDeleteDialog(false);
          setProductToDelete(null);
        }}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px' }}>
            <Button
              label="Hủy"
              icon="pi pi-times"
              onClick={() => {
                setShowProductDeleteDialog(false);
                setProductToDelete(null);
              }}
              className="p-button-text"
              style={{ color: '#4b5563' }}
            />
            <Button
              label="Xóa"
              icon="pi pi-check"
              onClick={confirmDeleteProduct}
              severity="danger"
              autoFocus
            />
          </div>
        }
      >
        <div className="flex align-items-center justify-content-center">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: '#f59e0b', marginRight: '1rem' }} />
          {productToDelete && (
            <span>
              Bạn có chắc chắn muốn xóa sản phẩm <b>{productToDelete.name}</b> không?
              <br />
              <small style={{color: 'red'}}>Hành động này không thể hoàn tác.</small>
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
