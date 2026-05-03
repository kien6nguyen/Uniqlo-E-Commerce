# Uniqlo E-Commerce Clone

Đây là dự án xây dựng một website thương mại điện tử (E-Commerce) lấy cảm hứng từ Uniqlo. Hệ thống cung cấp trải nghiệm mua sắm trực tuyến toàn diện cho người dùng với thiết kế tối giản, hiện đại và tối ưu hiệu suất.

## 🌟 Các tính năng nổi bật

### Dành cho Khách hàng (Client)
- **Duyệt sản phẩm:** Xem danh sách sản phẩm theo danh mục, giới tính (Nam, Nữ, Trẻ em), và tìm kiếm thông minh.
- **Chi tiết sản phẩm:** Xem thông tin chi tiết, chọn màu sắc, kích thước, kiểm tra số lượng tồn kho và hình ảnh trực quan.
- **Giỏ hàng & Thanh toán:** Thêm sản phẩm vào giỏ hàng, quản lý số lượng và quy trình checkout tối ưu.
- **Tích hợp VNPAY:** Hỗ trợ thanh toán trực tuyến bảo mật, nhanh chóng qua cổng thanh toán VNPAY.
- **Đánh giá & Nhận xét:** Khách hàng có thể xếp hạng (sao) và để lại bình luận cho từng sản phẩm.
- **Quản lý tài khoản:** Cập nhật thông tin cá nhân, xem lịch sử đơn hàng và theo dõi trạng thái giao hàng.
- **Danh sách yêu thích (Wishlist):** Lưu lại các sản phẩm yêu thích để mua sau.

### Dành cho Quản trị viên (Admin)
- **Quản lý sản phẩm:** Thêm, sửa, xóa thông tin sản phẩm, quản lý biến thể (màu sắc, size) và hàng tồn kho.
- **Quản lý đơn hàng:** Theo dõi và cập nhật trạng thái các đơn đặt hàng của khách hàng.
- **Hỗ trợ khách hàng:** Tích hợp tính năng Chat trực tiếp (Live Chat) để hỗ trợ và tư vấn khách hàng theo thời gian thực.

## 🛠 Công nghệ sử dụng

- **Frontend:** React.js kết hợp với Vite. Giao diện được xây dựng bằng **PrimeReact** và các thư viện hỗ trợ (PrimeFlex, Tailwind CSS) cho UI đồng nhất, phản hồi tốt trên đa thiết bị.
- **Backend:** Node.js và Express.js, cấu trúc chuẩn RESTful API.
- **Cơ sở dữ liệu:** MongoDB (Mongoose).
- **Thanh toán:** Tích hợp SDK VNPAY.
- **Bảo mật & Khác:** JWT Authentication, Websocket (Socket.io) cho Chat/Thông báo.

## 🚀 Hướng dẫn cài đặt và chạy dự án

1. **Clone repository này về máy:**
   ```bash
   git clone <url-repo>
   cd Uniqlo
   ```

2. **Cài đặt dependencies cho Backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Cài đặt dependencies cho Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Cấu hình biến môi trường (.env):**
   - Tạo file `.env` ở thư mục `backend` và điền các thông tin như: kết nối MongoDB, VNPAY TmnCode/HashSecret, JWT Secret...
   - Tạo file `.env` ở thư mục `frontend` và điền các cấu hình kết nối API (ví dụ: `VITE_API_URL`, `VITE_API_BASE`).

5. **Khởi động ứng dụng:**
   - **Chạy Backend:**
     ```bash
     cd backend
     npm run dev
     ```
   - **Chạy Frontend:**
     ```bash
     cd frontend
     npm run dev
     ```

6. Truy cập vào ứng dụng tại `http://localhost:5173` trên trình duyệt.

## 📝 Mục đích
Dự án này được phát triển với mục đích học tập, nghiên cứu và xây dựng một kiến trúc hệ thống E-Commerce hoàn chỉnh từ Frontend đến Backend.
