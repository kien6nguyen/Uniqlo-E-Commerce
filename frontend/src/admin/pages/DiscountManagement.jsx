import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/discounts`;

const DiscountManagement = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [discountDialog, setDiscountDialog] = useState(false);
  const [deleteDiscountDialog, setDeleteDiscountDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const toast = useRef(null);

  const emptyDiscount = {
    code: "",
    percentage: null,
    usageLimit: 10,
    minOrderValue: 0,
    description: "",
    freeShipping: false
  };
  const [discount, setDiscount] = useState(emptyDiscount);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_BASE, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDiscounts(data.discounts);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading discounts:", error);
      toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách mã giảm giá' });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setDiscount(emptyDiscount);
    setSubmitted(false);
    setDiscountDialog(true);
  };

  const editDiscount = (item) => {
    setDiscount({ ...item });
    setDiscountDialog(true);
  };

  const saveDiscount = async () => {
    setSubmitted(true);

    if (!discount.code || !discount.percentage) {
        toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng nhập đúng Mã và % giảm giá', life: 3000 });
        return;
    }

    if (discount.percentage < 0 || discount.usageLimit < 0 || discount.minOrderValue < 0) {
        toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng không nhập số âm', life: 3000 });
        return;
    }

    if (discount.usageLimit > 10) {
        toast.current.show({ severity: 'error', summary: 'Cảnh báo', detail: 'Số lượng mã tối đa chỉ được phép là 10', life: 3000 });
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const isEdit = !!discount._id;
        const url = isEdit ? `${API_BASE}/${discount._id}` : API_BASE;
        const method = isEdit ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(discount)
        });

        const data = await response.json();

        if (response.ok) {
            toast.current.show({ 
                severity: 'success', 
                summary: 'Thành công', 
                detail: isEdit ? 'Đã cập nhật mã giảm giá' : 'Tạo mã giảm giá thành công', 
                life: 3000 
            });

            if (isEdit) {
                setDiscounts(prev => prev.map(d => d._id === discount._id ? data.discount : d));
            } else {
                setDiscounts(prev => [data.discount, ...prev]);
            }

            setDiscountDialog(false);
            setDiscount(emptyDiscount);
        } else {
            throw new Error(data.message || "Có lỗi xảy ra");
        }
    } catch (err) {
        toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
    }
  };

  const confirmDeleteDiscount = (item) => {
    setDiscount(item);
    setDeleteDiscountDialog(true);
  };

  const deleteDiscount = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/${discount._id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            setDiscounts(prev => prev.filter(d => d._id !== discount._id));
            setDeleteDiscountDialog(false);
            setDiscount(emptyDiscount);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa mã giảm giá' });
        } else {
            const data = await response.json();
            throw new Error(data.message);
        }
    } catch (err) {
        toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
    }
  };

  const generateRandomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setDiscount({ ...discount, code });
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#374151' }}>Quản lý mã giảm giá</h2>
      <Button
        label="Thêm mã giảm giá"
        icon="pi pi-plus"
        style={{ backgroundColor: '#0047ab', border: 'none' }}
        onClick={openNew}
      />
    </div>
  );

  const progressTemplate = (row) => {
    const limit = row.usageLimit || 1;
    const used = row.usedCount || 0;
    const percentage = Math.min((used / limit) * 100, 100);
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '80%', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentage}%`, backgroundColor: percentage >= 100 ? '#ef4444' : '#0ea5e9', transition: 'width 0.3s ease' }}
          ></div>
          <span style={{ position: 'relative', zIndex: 10, color: '#333', fontSize: '12px', fontWeight: 'bold', lineHeight: '24px', display: 'block', textAlign: 'center' }}>
            {used}/{limit}
          </span>
        </div>
      </div>
    );
  };

  const actionBodyTemplate = (row) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
      <Button icon="pi pi-pencil" rounded text severity="warning" tooltip="Sửa" onClick={() => editDiscount(row)} />
      <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Xóa" onClick={() => confirmDeleteDiscount(row)} />
    </div>
  );

  const dialogFooter = (
    <div style={{ display: 'flex', gap: '15px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <Button label="Hủy" onClick={() => setDiscountDialog(false)} style={{ flex: 1, backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', fontWeight: '600' }} />
        <Button label="Lưu" onClick={saveDiscount} style={{ flex: 1, backgroundColor: '#0047ab', border: 'none', color: 'white', fontWeight: '600' }} />
    </div>
  );

  const deleteDialogFooter = (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Button label="Hủy" icon="pi pi-times" onClick={() => setDeleteDiscountDialog(false)} className="p-button-text" />
        <Button label="Xóa" icon="pi pi-check" onClick={deleteDiscount} severity="danger" autoFocus />
    </div>
  );

  return (
    <Card className="shadow-lg" style={{ margin: '20px', padding: '10px', borderRadius: '12px', border: 'none' }}>
      <Toast ref={toast} />
      
      <DataTable
        value={discounts}
        paginator
        rows={10}
        loading={loading}
        header={header}
        showGridlines
        className="p-datatable-sm"
        tableStyle={{ minWidth: '65rem' }} 
        rowHover
        emptyMessage="Chưa có mã giảm giá nào."
        sortField="createdAt" 
        sortOrder={-1}
      >
        <Column field="code" header="Mã Code" alignHeader="center" align="center" style={{ width: '10%', fontWeight: 'bold', color: '#0047ab' }} />
        <Column field="percentage" header="Giảm (%)" body={(row) => `${row.percentage}%`} alignHeader="center" align="center" style={{ width: '8%' }} />
        <Column header="Số lượng" body={progressTemplate} alignHeader="center" align="center" style={{ width: '15%' }} />
        <Column field="minOrderValue" header="Đơn tối thiểu" body={(row) => row.minOrderValue.toLocaleString('vi-VN') + 'đ'} alignHeader="center" align="center" style={{ width: '12%' }} />
        
        <Column 
            field="freeShipping" 
            header="Freeship" 
            body={(row) => row.freeShipping ? <Tag severity="success" value="Có" /> : "-"} 
            alignHeader="center" 
            align="center" 
            style={{ width: '8%' }} 
        />

        <Column 
            field="createdAt" 
            header="Ngày tạo" 
            body={(row) => formatDate(row.createdAt)} 
            alignHeader="center" 
            align="center" 
            sortable 
            style={{ width: '15%' }} 
        />

        <Column 
            field="createdBy" 
            header="Người tạo" 
            alignHeader="center" 
            align="center" 
            style={{ width: '15%', fontSize: '0.9rem' }} 
            body={(row) => row.createdBy || "-"}
        />

        <Column header="Thao tác" body={actionBodyTemplate} alignHeader="center" align="center" style={{ width: '12%' }} />
      </DataTable>

      {/* Dialog Thêm/Sửa */}
      <Dialog
        header={<div style={{ textAlign: 'center', width: '100%', fontWeight: 'bold', fontSize: '1.25rem' }}>{discount._id ? "Cập nhật mã" : "Tạo mã giảm giá mới"}</div>}
        visible={discountDialog}
        style={{ width: "500px", borderRadius: '12px' }}
        onHide={() => setDiscountDialog(false)}
        footer={dialogFooter}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', color: '#374151' }}>Mã Code <span style={{color:'red'}}>*</span></label>
            <div className="p-inputgroup">
                <InputText
                    value={discount.code}
                    onChange={(e) => setDiscount({ ...discount, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SALE50"
                    className={submitted && !discount.code ? 'p-invalid' : ''}
                />
                <Button icon="pi pi-refresh" onClick={generateRandomCode} tooltip="Tạo ngẫu nhiên" severity="secondary"/>
            </div>
            {submitted && !discount.code && <small className="p-error">Vui lòng nhập mã.</small>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Giảm giá (%) <span style={{color:'red'}}>*</span></label>
                <InputNumber
                  value={discount.percentage}
                  onValueChange={(e) => setDiscount({ ...discount, percentage: e.value })}
                  min={1} max={100} // Chặn UI nhập số âm và > 100
                  placeholder="VD: 10"
                  inputClassName={submitted && !discount.percentage ? 'p-invalid' : ''}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Số lượng mã</label>
                <InputNumber
                  value={discount.usageLimit}
                  onValueChange={(e) => setDiscount({ ...discount, usageLimit: e.value })}
                  min={1} // Chặn UI nhập số âm và 0
                />
                {/* Hiển thị chú thích nhỏ bên dưới */}
                <small style={{color: '#6b7280'}}>Tối đa 10 mã.</small>
              </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', color: '#374151' }}>Giá trị đơn tối thiểu (VNĐ)</label>
            <InputNumber
              value={discount.minOrderValue}
              onValueChange={(e) => setDiscount({ ...discount, minOrderValue: e.value })}
              mode="currency" currency="VND" locale="vi-VN"
              min={0} // Chặn UI nhập số âm
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', color: '#374151' }}>Mô tả</label>
            <InputTextarea
              value={discount.description}
              onChange={(e) => setDiscount({ ...discount, description: e.target.value })}
              rows={2}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox 
                inputId="freeship" 
                checked={discount.freeShipping} 
                onChange={e => setDiscount({ ...discount, freeShipping: e.checked })} 
            />
            <label htmlFor="freeship" style={{ cursor: 'pointer', userSelect: 'none' }}>Miễn phí vận chuyển</label>
          </div>
        </div>
      </Dialog>

      {/* Dialog Xóa */}
      <Dialog 
        visible={deleteDiscountDialog} 
        style={{ width: '450px' }} 
        header="Xác nhận" 
        modal 
        footer={deleteDialogFooter} 
        onHide={() => setDeleteDiscountDialog(false)}
      >
        <div className="flex align-items-center justify-content-center">
            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: '#f59e0b', marginRight: '1rem' }} />
            {discount && (
                <span>
                    Bạn có chắc chắn muốn xóa mã <b>{discount.code}</b>?
                    <br/><small style={{color:'red'}}>Hành động này không thể hoàn tác.</small>
                </span>
            )}
        </div>
      </Dialog>
    </Card>
  );
};

export default DiscountManagement;
