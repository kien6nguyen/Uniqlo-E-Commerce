export const mockStats = [
  { title: "Tổng người dùng", value: "1,245", icon: "pi pi-users", color: "#00aaff" },
  { title: "Tổng đơn hàng", value: "512", icon: "pi pi-shopping-cart", color: "#f59e0b" },
  { title: "Doanh thu", value: "128 triệu ₫", icon: "pi pi-dollar", color: "#22c55e" },
  { title: "Lợi nhuận", value: "45 triệu ₫", icon: "pi pi-chart-line", color: "#ef4444" },
];

export const mockChartData = {
  revenue: {
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    datasets: [
      {
        label: "Doanh thu (triệu ₫)",
        backgroundColor: "#00aaff",
        data: [15, 22, 18, 30, 45, 35],
      },
    ],
  },
  category: {
    labels: ["Laptop", "Điện thoại", "Tai nghe", "Phụ kiện"],
    datasets: [
      {
        data: [300, 450, 200, 150],
        backgroundColor: ["#0047ab", "#00aaff", "#22c55e", "#f59e0b"],
      },
    ],
  },
};
