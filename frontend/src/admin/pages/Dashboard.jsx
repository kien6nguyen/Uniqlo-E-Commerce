import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { ProgressSpinner } from 'primereact/progressspinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  
  // Dữ liệu Simple Dashboard
  const [simpleStats, setSimpleStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalOrders: 0,
    totalRevenue: 0,
    bestSellingProducts: []
  });

  // Dữ liệu Advanced Dashboard
  const [advancedStats, setAdvancedStats] = useState({
    revenueChart: [],
    categoryChart: []
  });

  // Bộ lọc thời gian
  const [viewMode, setViewMode] = useState('month'); 
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [viewMode, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      const simpleRes = await fetch("http://localhost:3000/api/admin/dashboard/simple", { headers });
      const simpleData = await simpleRes.json();

      if (simpleData.success) {
        setSimpleStats(simpleData.data);
      }

      let query = `?interval=${viewMode}`;
      if (dateRange && dateRange[0] && dateRange[1]) {
         query += `&startDate=${dateRange[0].toISOString()}&endDate=${dateRange[1].toISOString()}`;
      } else {
         const end = new Date();
         const start = new Date();
         start.setFullYear(end.getFullYear() - 1);
         query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }

      const advancedRes = await fetch(`http://localhost:3000/api/admin/dashboard/advanced${query}`, { headers });
      const advancedData = await advancedRes.json();

      if (advancedData.success) {
        processAdvancedData(advancedData.data);
      }

    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý dữ liệu thô từ API thành format cho Recharts
  const processAdvancedData = (data) => {
    const revenueChart = data.stats.map(item => {
      let name = "";
      if (data.interval === 'month') name = `T${item._id.month}/${item._id.year}`;
      else if (data.interval === 'quarter') name = `Q${item._id.quarter}/${item._id.year}`;
      else if (data.interval === 'year') name = `${item._id.year}`;
      else name = `W${item._id.week}/${item._id.year}`;

      return {
        name: name,
        revenue: item.totalRevenue / 1000000, 
        profit: item.totalProfit / 1000000,
        quantity: item.totalOrders
      };
    });

    const categoryChart = data.productTypeStats.map(item => ({
      name: item._id || "Khác",
      value: item.count
    }));

    setAdvancedStats({ revenueChart, categoryChart });
  };

  const StatCard = ({ title, value, subText, icon, color, bgColor }) => (
    <div style={{ 
        backgroundColor: 'white', padding: '20px', borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', 
        justifyContent: 'space-between', alignItems: 'flex-start', flex: 1, border: '1px solid #f0f0f0'
    }}>
      <div>
        <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>{title}</p>
        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1f2937', margin: '8px 0' }}>{value}</h3>
        <span style={{ color: '#9ca3af', fontSize: '12px' }}>{subText}</span>
      </div>
      <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`pi ${icon}`} style={{ fontSize: '24px', color: color }}></i>
      </div>
    </div>
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (loading && !simpleStats.totalUsers) {
      return <div className="flex justify-center items-center h-screen"><ProgressSpinner /></div>;
  }

  const SimpleDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        <StatCard 
            title="Tổng người dùng" 
            value={simpleStats.totalUsers} 
            subText={`+${simpleStats.newUsersThisMonth} tháng này`} 
            icon="pi-users" color="#4f46e5" bgColor="#eef2ff" 
        />
        <StatCard 
            title="Tổng đơn hàng" 
            value={simpleStats.totalOrders} 
            subText="Đã hoàn thành & Đang xử lý" 
            icon="pi-shopping-cart" color="#d97706" bgColor="#fef3c7" 
        />
        <StatCard 
            title="Doanh thu" 
            value={(simpleStats.totalRevenue / 1000000).toFixed(1) + " Tr"} 
            subText="Tổng doanh thu thực tế" 
            icon="pi-wallet" color="#10b981" bgColor="#d1fae5" 
        />
        <StatCard 
            title="Sản phẩm bán chạy" 
            value={simpleStats.bestSellingProducts[0]?.name || "N/A"} 
            subText={`Top 1: ${simpleStats.bestSellingProducts[0]?.totalSold || 0} cái`} 
            icon="pi-star" color="#e11d48" bgColor="#ffe4e6" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Top Products Chart */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '20px' }}>
                <i className="pi pi-star-fill" style={{ color: '#eab308', marginRight: '8px' }}></i> 
                Top 5 Sản Phẩm Bán Chạy
            </h3>
            <div style={{ height: '350px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={simpleStats.bestSellingProducts} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fontWeight: 600, fill: '#4b5563' }} />
                        <Tooltip cursor={{ fill: '#f9fafb' }} formatter={(value) => [`${value} cái`, "Đã bán"]} />
                        <Bar dataKey="totalSold" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Summary Card */}
        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '30px', borderRadius: '16px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>Hiệu Suất Kinh Doanh</h3>
                <p style={{ opacity: 0.8, fontSize: '14px' }}>Dữ liệu cập nhật theo thời gian thực.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
                    <span>Giá trị đơn TB</span>
                    <span style={{ fontWeight: 'bold' }}>
                        {simpleStats.totalOrders > 0 
                            ? formatCurrency(simpleStats.totalRevenue / simpleStats.totalOrders) 
                            : "0 đ"}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Người dùng mới</span>
                    <span style={{ fontWeight: 'bold' }}>{simpleStats.newUsersThisMonth}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  // --- TAB: ADVANCED DASHBOARD ---
  const AdvancedDashboard = () => {
    const viewOptions = [
        { label: 'Theo Tháng', value: 'month' },
        { label: 'Theo Quý', value: 'quarter' },
        { label: 'Theo Năm', value: 'year' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="pi pi-filter-fill" style={{ color: '#4f46e5' }}></i>
                    <span style={{ fontWeight: 'bold', color: '#374151' }}>Bộ lọc:</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Dropdown value={viewMode} options={viewOptions} onChange={(e) => setViewMode(e.value)} placeholder="Xem theo" />
                    <Calendar value={dateRange} onChange={(e) => setDateRange(e.value)} selectionMode="range" placeholder="Khoảng thời gian" showIcon />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Biểu đồ Doanh thu & Lợi nhuận */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '20px' }}>Doanh thu & Lợi nhuận (Triệu VNĐ)</h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={advancedStats.revenueChart}>
                                <CartesianGrid stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} hide />
                                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN').format(value)} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                                <Line yAxisId="left" type="monotone" dataKey="profit" name="Lợi nhuận (Est. 20%)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Biểu đồ Danh mục */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '20px' }}>Tỷ trọng Danh mục (Số lượng)</h3>
                    <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={advancedStats.categoryChart}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {advancedStats.categoryChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Biểu đồ Đơn hàng (Full width) */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '20px' }}>Xu hướng Số lượng Đơn hàng</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={advancedStats.revenueChart} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="quantity" name="Số đơn" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorQty)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div style={{ padding: '30px', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0 }}>Bảng Điều Khiển</h1>
        <p style={{ color: '#6b7280', marginTop: '5px' }}>Tổng quan hiệu suất kinh doanh từ dữ liệu thực tế</p>
      </div>

      <TabView 
        className="custom-dashboard-tabs"
        pt={{
            nav: { style: { borderBottom: '1px solid #e5e7eb', marginBottom: '20px' } },
            inkbar: { style: { backgroundColor: '#4f46e5', height: '3px' } }
        }}
      >
        <TabPanel header="Tổng Quan">
            <SimpleDashboard />
        </TabPanel>
        <TabPanel header="Phân Tích Chi Tiết">
            <AdvancedDashboard />
        </TabPanel>
      </TabView>

      <style>{`
        .p-tabview-nav-link { background: transparent !important; border: none !important; color: #6b7280 !important; font-weight: 600 !important; font-size: 16px !important; padding: 15px 25px !important; transition: all 0.3s !important; }
        .p-tabview-nav-link:hover, .p-highlight .p-tabview-nav-link { color: #4f46e5 !important; }
        .p-tabview-panels { background: transparent !important; padding: 0 !important; }
      `}</style>
    </div>
  );
}