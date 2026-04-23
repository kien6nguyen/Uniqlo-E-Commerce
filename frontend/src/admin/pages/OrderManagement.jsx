import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";

const API_BASE = "http://localhost:3000/api/admin/orders";

export default function OrderManagement() {
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 20, page: 1 });
  const [filterType, setFilterType] = useState("");
  const [dateRange, setDateRange] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  const [tempStatus, setTempStatus] = useState("");

  const toast = useRef(null);

  const orderStatuses = [
    { label: "Chờ xử lý", value: "Pending" },
    { label: "Đã thanh toán", value: "Paid" },
    { label: "Đang giao", value: "Shipped" },
    { label: "Hoàn thành", value: "Completed" },
    { label: "Đã hủy", value: "Cancelled" },
  ];

  const filterOptions = [
    { label: "Tất cả thời gian", value: "" },
    { label: "Hôm nay", value: "today" },
    { label: "Hôm qua", value: "yesterday" },
    { label: "Tuần này", value: "week" },
    { label: "Tháng này", value: "month" },
    { label: "Tùy chỉnh ngày", value: "custom" },
  ];

  // --- FETCH DATA ---
  useEffect(() => {
    loadOrders();
  }, [lazyParams, filterType]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let query = `?page=${lazyParams.page}&limit=${lazyParams.rows}`;

      if (filterType === 'custom' && dateRange && dateRange[0] && dateRange[1]) {
        query += `&startDate=${dateRange[0].toISOString()}&endDate=${dateRange[1].toISOString()}`;
      } else if (filterType && filterType !== 'custom') {
        query += `&range=${filterType}`;
      }

      const response = await fetch(`${API_BASE}${query}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setTotalRecords(data.total);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách đơn hàng' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = () => {
    setLazyParams(prev => ({ ...prev, first: 0, page: 1 }));
    loadOrders();
  };

  const onPage = (event) => {
    setLazyParams({ first: event.first, rows: event.rows, page: event.page + 1 });
  };

  // --- LOGIC CHI TIẾT ---
  const viewOrderDetails = async (orderId) => {
    setDialogLoading(true);
    setShowDialog(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/${orderId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setSelectedOrder(data.order);
        setTempStatus(data.order.status);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xem chi tiết' });
      setShowDialog(false);
    } finally {
      setDialogLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !tempStatus) return;
    if (tempStatus === selectedOrder.status) {
      toast.current.show({ severity: 'info', summary: 'Thông báo', detail: 'Trạng thái chưa thay đổi' });
      return;
    }

    setDialogLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/${selectedOrder._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: tempStatus })
      });
      const data = await response.json();

      if (data.success) {
        toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật trạng thái đơn hàng' });
        setShowDialog(false);
        loadOrders();
      } else {
        throw new Error(data.message || "Lỗi cập nhật");
      }
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Lỗi', detail: error.message });
    } finally {
      setDialogLoading(false);
    }
  };

  // --- FORMATTERS ---
  const formatCurrency = (value) => value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0 ₫";
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString("vi-VN", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : "-";

  const getSeverity = (status) => {
    switch (status) {
      case "Pending": return "warning";
      case "Paid": return "info";
      case "Shipped": return "primary";
      case "Completed": return "success";
      case "Cancelled": return "danger";
      default: return null;
    }
  };
  const getStatusLabel = (status) => orderStatuses.find(s => s.value === status)?.label || status;

  // --- TEMPLATES ---
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-gray-700 m-0">Quản lý đơn hàng</h2>
      <div className="flex items-center gap-2">
        <Dropdown value={filterType} options={filterOptions} onChange={(e) => { setFilterType(e.value); if (e.value !== 'custom') setLazyParams(prev => ({ ...prev, first: 0, page: 1 })); }} placeholder="Thời gian" className="w-48" />
        {filterType === 'custom' && (<><Calendar value={dateRange} onChange={(e) => setDateRange(e.value)} selectionMode="range" readOnlyInput placeholder="Từ - Đến ngày" className="w-64" /><Button icon="pi pi-search" onClick={handleFilterClick} /></>)}
      </div>
    </div>
  );

  const statusBodyTemplate = (rowData) => <Tag value={getStatusLabel(rowData.status)} severity={getSeverity(rowData.status)} style={{ fontSize: '0.8rem' }} />;
  const actionBodyTemplate = (rowData) => <div className="flex justify-center"><Button icon="pi pi-eye" rounded text severity="info" onClick={() => viewOrderDetails(rowData._id)} /></div>;

  const dialogFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
      <Button label="Đóng" icon="pi pi-times" onClick={() => setShowDialog(false)} className="p-button-text" style={{ color: '#4b5563' }} />
      <Button label="Lưu thay đổi" icon="pi pi-check" onClick={updateOrderStatus} loading={dialogLoading} autoFocus />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />

      <div className="card shadow-lg rounded-xl border border-gray-100 bg-white p-4">
        <DataTable value={orders} lazy paginator first={lazyParams.first} rows={lazyParams.rows} totalRecords={totalRecords} onPage={onPage} loading={loading} header={header} showGridlines rowHover emptyMessage="Không tìm thấy đơn hàng." className="p-datatable-sm" tableStyle={{ minWidth: '60rem' }}>
          <Column field="_id" header="Mã ĐH" body={(row) => <span className="font-mono text-blue-600 font-bold text-xs">{row._id.slice(-6).toUpperCase()}</span>} alignHeader="center" align="center" style={{ width: '10%' }} />
          <Column field="shippingAddress.receiver" header="Khách hàng" style={{ width: '20%' }} />
          <Column field="createdAt" header="Ngày đặt" body={(row) => formatDate(row.createdAt)} alignHeader="center" align="center" style={{ width: '15%' }} />
          <Column field="finalAmount" header="Tổng tiền" body={(row) => <span className="font-bold">{formatCurrency(row.finalAmount)}</span>} alignHeader="center" align="right" style={{ width: '15%' }} />
          <Column field="status" header="Trạng thái" body={statusBodyTemplate} alignHeader="center" align="center" style={{ width: '15%' }} />
          <Column header="Chi tiết" body={actionBodyTemplate} alignHeader="center" align="center" style={{ width: '10%' }} />
        </DataTable>
      </div>

      {/* --- DIALOG CHI TIẾT --- */}
      <Dialog
        header={<div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
          Chi tiết đơn hàng <span style={{ color: '#2563eb' }}>#{selectedOrder?._id?.slice(-6).toUpperCase()}</span>
        </div>}
        visible={showDialog}
        style={{ width: "700px", borderRadius: '12px', overflow: 'hidden' }}
        modal
        onHide={() => setShowDialog(false)}
        draggable={false}
        contentStyle={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}
        footer={dialogFooter}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* 1. Phần Update Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px dashed #bfdbfe' }}>
              <label style={{ fontWeight: '600', color: '#1e40af' }}>Cập nhật trạng thái đơn hàng</label>
              <Dropdown
                value={tempStatus}
                options={orderStatuses}
                onChange={(e) => setTempStatus(e.value)}
                placeholder="Chọn trạng thái"
                style={{ width: '100%' }}
              />
            </div>

            {/* 2. Thông tin khách hàng & Giao hàng */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Người nhận</label>
                <InputText value={selectedOrder.shippingAddress?.receiver} readOnly className="p-inputtext-sm bg-gray-50" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Số điện thoại</label>
                <InputText value={selectedOrder.shippingAddress?.phone} readOnly className="p-inputtext-sm bg-gray-50" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Địa chỉ giao hàng</label>
              <InputTextarea value={selectedOrder.shippingAddress?.address} rows={2} readOnly style={{ resize: 'none' }} className="bg-gray-50" />
            </div>

            {/* 3. Thông tin thanh toán */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Phương thức thanh toán</label>
                <InputText value={selectedOrder.payment?.method?.toUpperCase()} readOnly className="p-inputtext-sm bg-gray-50" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Ngày đặt hàng</label>
                <InputText value={formatDate(selectedOrder.createdAt)} readOnly className="p-inputtext-sm bg-gray-50" />
              </div>
            </div>

            {selectedOrder.note && (
              <div className="bg-yellow-50 p-3 border-round border-1 border-yellow-200 text-yellow-800">
                <i className="pi pi-exclamation-circle mr-2"></i>
                <span className="font-italic">"{selectedOrder.note}"</span>
              </div>
            )}

            {/* 4. Danh sách sản phẩm */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Sản phẩm ({selectedOrder.items?.length})</label>
              <DataTable value={selectedOrder.items} size="small" showGridlines stripedRows style={{ fontSize: '0.9rem' }}>
                <Column field="product.name" header="Tên SP" />
                <Column field="quantity" header="SL" align="center" style={{ width: '50px' }} />
                <Column field="price" header="Đơn giá" body={(r) => formatCurrency(r.price)} align="right" />
                <Column header="Thành tiền" body={(r) => formatCurrency(r.price * r.quantity)} align="right" style={{ fontWeight: 'bold' }} />
              </DataTable>
            </div>

            {/* 5. TỔNG KẾT TÀI CHÍNH CHI TIẾT (Đã sửa lỗi hiển thị) */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div className="flex flex-column gap-2">
                
                {/* 5.1 Tổng tiền hàng */}
                <div className="flex justify-content-between text-700">
                  <span>Tổng tiền hàng:</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>

                {/* 5.2 Phí vận chuyển */}
                <div className="flex justify-content-between text-700">
                  <span>Phí vận chuyển:</span>
                  <span className="text-orange-600">+{formatCurrency(selectedOrder.shippingFee || 0)}</span>
                </div>

                {/* 5.3 Phí Support/Phụ thu (MỚI THÊM) */}
                {(selectedOrder.supportFee > 0) && (
                  <div className="flex justify-content-between text-700">
                    <span>Phí dịch vụ/Phụ thu:</span>
                    <span className="text-orange-600">+{formatCurrency(selectedOrder.supportFee)}</span>
                  </div>
                )}

                {/* 5.4 Voucher giảm giá (Tách riêng, không tính gộp) */}
                {(selectedOrder.discountAmount > 0) && (
                  <div className="flex justify-content-between text-red-500">
                    <span>Voucher giảm giá {selectedOrder.discountCode ? `(${selectedOrder.discountCode})` : ''}:</span>
                    {/* Hiển thị số tiền discount trực tiếp từ DB */}
                    <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}

                {/* 5.5 Điểm thưởng sử dụng (SỬA LỖI TÍNH TOÁN) */}
                {(selectedOrder.loyaltyPointsUsed > 0) && (
                  <div className="flex justify-content-between text-green-600">
                    <span>Điểm thưởng sử dụng ({selectedOrder.loyaltyPointsUsed} điểm):</span>
                    {/* SỬA LỖI: Tính trực tiếp 1 điểm = 1000đ, không tính ngược từ FinalAmount */}
                    <span>-{formatCurrency(selectedOrder.loyaltyPointsUsed * 1000)}</span>
                  </div>
                )}

                <Divider className="my-2" />

                {/* 5.6 Tổng thanh toán */}
                <div className="flex justify-content-between align-items-center">
                  <span className="text-xl font-bold text-900">Khách phải trả:</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedOrder.finalAmount)}</span>
                </div>

                {/* 5.7 Điểm tích lũy */}
                {(selectedOrder.loyaltyPointsEarned > 0) && (
                  <div className="flex justify-content-end mt-2">
                    <Tag icon="pi pi-star-fill" severity="warning" value={`Đơn này tích lũy: +${selectedOrder.loyaltyPointsEarned} điểm`}></Tag>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </Dialog>
    </div>
  );
}