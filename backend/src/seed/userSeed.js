const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const axios = require("axios");
const User = require("../models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopdb";
// Hàm lấy provinces + districts + wards
async function loadProvincesData() {
  const url = "https://provinces.open-api.vn/api/v1/?depth=3";
  try {
    console.log("Fetching provinces from API...");
    const res = await axios.get(url, { timeout: 10000 }); // 10s timeout
    return res.data;
  } catch (err) {
    console.warn("Could not load provinces from API, using fallback data:", err.message);
    return [
      {
        name: "Thành phố Hồ Chí Minh",
        districts: [
          { name: "Quận 1", wards: [{ name: "Phường Bến Nghé" }, { name: "Phường Đa Kao" }] },
          { name: "Quận 3", wards: [{ name: "Phường Võ Thị Sáu" }] }
        ]
      },
      {
        name: "Thành phố Hà Nội",
        districts: [
          { name: "Quận Hoàn Kiếm", wards: [{ name: "Phường Hàng Đào" }] },
          { name: "Quận Ba Đình", wards: [{ name: "Phường Phúc Xá" }] }
        ]
      }
    ];
  }
}


function randomPoints() {
  return Math.floor(Math.random() * 500);
}

function randomPhone() {
  return "09" + Math.floor(10000000 + Math.random() * 89999999);
}

// Tạo 1 ‒ 3 địa chỉ, sử dụng data tỉnh/huyện/xã thật
function generateAddresses(provinces, receiver) {
  const count = Math.random() > 0.8 ? 3 : Math.random() > 0.6 ? 2 : 1;
  const addresses = [];

  for (let i = 0; i < count; i++) {
    // random chọn 1 tỉnh
    const prov = provinces[Math.floor(Math.random() * provinces.length)];
    // random chọn 1 quận/huyện của tỉnh đó
    const districts = prov.districts;
    const dist = districts[Math.floor(Math.random() * districts.length)];
    // random chọn 1 ward trong quận đó (nếu có)
    let wardName = "";
    if (dist.wards && dist.wards.length > 0) {
      const ward = dist.wards[Math.floor(Math.random() * dist.wards.length)];
      wardName = ward.name;
    }
    // addressDetail (số nhà + tên đường) giả
    const addressDetail = `Số ${Math.floor(Math.random() * 200)} đường ABC`;

    addresses.push({
      receiver,
      phone: randomPhone(),
      province: prov.name,
      district: dist.name,
      ward: wardName,
      address: prov.name, // hoặc bạn dùng prov.name + dist.name tùy mục đích
      addressDetail
    });
  }

  return addresses;
}

// Tạo tên user gốc + thêm nhiều user
const baseUsers = [
  { fullname: "Admin Master", email: "admin@example.com", password: "admin123", role: "admin", loyaltyPoints: 0 },
  { fullname: "Nguyễn Văn A", email: "thuanminh1390@gmail.com", password: "123456@", role: "user", loyaltyPoints: 120 },
  { fullname: "Trần Thị B", email: "tranthib@example.com", password: "password1", role: "customer", loyaltyPoints: 350 },
  { fullname: "Phạm Minh C", email: "phamminhc@example.com", password: "password1", role: "user", loyaltyPoints: 50 },
  { fullname: "Lê Thảo D", email: "lethaod@example.com", password: "password1", role: "user", loyaltyPoints: 220 }
];

const extraUserNames = [
  "Nguyễn Hoàng E", "Đỗ Mai F", "Võ Nhật G", "Bùi Thanh H", "Mai Hữu I",
  "Hồ Kiều J", "Đặng Thùy K", "Huỳnh Minh L", "Trương Gia M", "Phan Khánh N",
  "Lý Bảo O", "Tăng Lan P", "Tô Mỹ Q", "Trịnh Nhật R", "Ngô Hải S",
  "Đinh Tùng T", "Kiều Minh U", "Lâm Quốc V", "Phùng Gia X", "Châu Hữu Y"
];

async function seedUsers() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log("Kết nối MongoDB...");
      await mongoose.connect(MONGO_URI);
    }

    console.log("Lấy dữ liệu tỉnh/quận/xã từ API...");
    const provinces = await loadProvincesData();

    console.log("Xóa user cũ...");
    await User.deleteMany({});

    const users = [];

    for (const u of baseUsers) {
      users.push({
        fullname: u.fullname,
        email: u.email,
        role: u.role,
        isBanned: false,
        loyaltyPoints: u.loyaltyPoints,
        shippingAddress: generateAddresses(provinces, u.fullname),
        password: u.password
      });
    }

    extraUserNames.forEach((fullname, idx) => {
      users.push({
        fullname,
        email: `user${idx + 10}@example.com`,
        role: Math.random() > 0.5 ? "user" : "customer",
        isBanned: false,
        loyaltyPoints: randomPoints(),
        shippingAddress: generateAddresses(provinces, fullname),
        password: "password1"
      });
    });

    console.log("Hash mật khẩu...");
    for (let u of users) {
      const salt = await bcrypt.genSalt(10);
      u.password = await bcrypt.hash(u.password, salt);
    }

    console.log(`Chèn ${users.length} user...`);
    await User.insertMany(users);

    console.log("Hoàn thành seed users!");

    if (require.main === module) {
      process.exit(0);
    }

  } catch (err) {
    console.error("Lỗi", err);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw err;
    }
  }
}

if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
