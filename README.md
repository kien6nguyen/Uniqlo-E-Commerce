# Uniqlo E-Commerce Clone

Đây là dự án xây dựng một website thương mại điện tử (E-Commerce) lấy cảm hứng từ nền tảng bán lẻ thời trang toàn cầu **Uniqlo**. Hệ thống được thiết kế với mục tiêu cung cấp một trải nghiệm mua sắm trực tuyến mượt mà, tốc độ cao, và sở hữu phong cách thiết kế tối giản (minimalism) đặc trưng của Nhật Bản. Dự án là một giải pháp toàn diện bao gồm cả Frontend, Backend, và hệ thống Quản trị (Admin Dashboard), sẵn sàng để triển khai và vận hành.

🌐 **Demo Trực Tuyến (Live Deployment):** 
Dự án hiện đã được deploy thành công trên nền tảng Render. Bạn có thể trải nghiệm trực tiếp giao diện người dùng và toàn bộ luồng mua sắm tại:
👉 **[https://uniqlo-frontend.onrender.com/](https://uniqlo-frontend.onrender.com/)**

---

## 🌟 Tính Năng Nổi Bật

### 🛒 Dành cho Khách hàng (Client)
- **Giao diện chuẩn Minimalism:** Thừa hưởng phong cách UI/UX từ Uniqlo, tập trung mạnh vào hình ảnh sản phẩm, typography rõ ràng và luồng điều hướng trực quan.
- **Hệ thống tìm kiếm & Bộ lọc:** Hỗ trợ duyệt sản phẩm theo danh mục, giới tính (Nam, Nữ, Trẻ em), lọc theo giá, màu sắc và đánh giá. Tích hợp thanh tìm kiếm thông minh.
- **Giỏ hàng & Checkout liền mạch:** Quản lý giỏ hàng tin cậy ngay cả với khách chưa đăng nhập (Guest) thông qua Session. Quy trình checkout hỗ trợ nhập mã giảm giá tự động tính toán.
- **Tích hợp thanh toán VNPAY:** Cổng thanh toán trực tuyến bảo mật, phản hồi IPN webhook chuẩn xác giúp cập nhật trạng thái đơn hàng ngay lập tức.
- **Quản lý Tài khoản & Đơn hàng:** Xem lịch sử mua hàng, trạng thái xử lý đơn hàng chi tiết và cập nhật hồ sơ cá nhân.
- **Đánh giá Sản phẩm (Review System):** Tính năng đánh giá sao và viết bình luận sau khi mua, giúp tăng độ uy tín cho sản phẩm.
- **Real-time Live Chat:** Kênh trao đổi trực tiếp với nhân viên chăm sóc khách hàng ngay trên giao diện website.

### ⚙️ Dành cho Quản trị viên (Admin Dashboard)
- **Quản lý Sản phẩm (Product Management):** Xử lý luồng dữ liệu sản phẩm phức tạp với tính năng quản lý **Biến thể (Variants)** chi tiết theo kích cỡ (Size), màu sắc (Color) và số lượng tồn kho (Stock).
- **Xử lý Đơn hàng (Order Management):** Theo dõi và chuyển đổi trạng thái đơn hàng (Chờ xác nhận -> Đang giao -> Hoàn thành / Đã hủy). Cập nhật realtime đến người dùng.
- **Quản lý Khuyến mãi (Discounts):** Cấu hình mã giảm giá (Discount code), đặt hạn mức phần trăm giảm hoặc số tiền cố định, theo dõi hạn sử dụng.
- **Live Chat Support (Admin Panel):** Console quản lý tin nhắn chuyên dụng giúp Admin tiếp nhận, phản hồi và hỗ trợ nhiều khách hàng cùng lúc thông qua WebSockets.

---

## 🛠 Kiến Trúc & Công Nghệ Sử Dụng

Dự án áp dụng mô hình kiến trúc **MERN Stack** (MongoDB, Express.js, React.js, Node.js) kết hợp với các công nghệ hiện đại nhằm tối ưu hiệu năng:

**Frontend (Client & Admin):**
- **Framework:** React.js (Sử dụng Vite để tối ưu hóa thời gian build và Hot-Reload).
- **State Management:** React Context API (Cart, Wishlist, Authentication).
- **Styling & UI:** Tailwind CSS (cho layout linh hoạt), kết hợp với **PrimeReact** cung cấp các component nâng cao (DataTables, Modals) cho trang Admin.
- **Routing:** React Router DOM (v6).
- **Real-time Engine:** Socket.io-client.

**Backend (API Server):**
- **Runtime:** Node.js.
- **Framework:** Express.js thiết kế theo chuẩn RESTful API.
- **Database:** MongoDB & Mongoose ORM (Cấu trúc Schema tối ưu: References, Populates).
- **Authentication:** JSON Web Token (JWT) lưu trữ an toàn trong HTTP-only Cookies.
- **Payment Gateway:** VNPAY SDK.
- **Real-time & Caching:** Socket.io cho luồng Chat và Redis cho cơ chế quản lý Session Guest Cart (Optional).

---

## 🚀 Hướng Dẫn Cài Đặt (Local Development)

Nếu bạn muốn chạy thử dự án trên môi trường local, hãy làm theo các bước sau:

### 1. Clone repository
```bash
git clone https://github.com/kien6nguyen/Uniqlo-E-Commerce.git
cd Uniqlo-E-Commerce
```

### 2. Thiết lập Backend
```bash
cd backend
npm install
```
Tạo file `.env` trong thư mục `backend` và điền cấu hình:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/uniqlo
JWT_SECRET=your_jwt_secret_key
# Cấu hình VNPAY (để test luồng thanh toán)
VNP_TMN_CODE=your_tmn_code
VNP_HASH_SECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5173/payment-result
```
Khởi động Backend:
```bash
npm run dev
```

### 3. Thiết lập Frontend
Mở một cửa sổ terminal mới:
```bash
cd frontend
npm install
```
Tạo file `.env` trong thư mục `frontend`:
```env
VITE_API_URL=http://localhost:3000
```
Khởi động Frontend:
```bash
npm run dev
```

### 4. Truy cập
- Giao diện Client: `http://localhost:5173`
- Giao diện Admin: `http://localhost:5173/admin`

---

## 📝 Mục Đích Dự Án

Dự án này được phát triển với mục đích học thuật, nhằm:
- Nghiên cứu và vận dụng thực tiễn các luồng nghiệp vụ phức tạp của một hệ thống thương mại điện tử (Quản lý biến thể kho hàng, xử lý thanh toán IPN, quản lý giỏ hàng stateless/stateful).
- Thiết kế hệ thống UI/UX hiện đại, tối giản, mang lại trải nghiệm người dùng cao cấp.
- Thực hành triển khai (Deployment) hệ thống Full-stack thực tế lên môi trường đám mây (Render, MongoDB Atlas).

---
*Cảm ơn bạn đã quan tâm đến dự án!*
