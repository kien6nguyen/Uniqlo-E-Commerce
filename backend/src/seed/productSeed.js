const mongoose = require("mongoose");
const Product = require("../models/Product");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/your_database_name";

const sampleProducts = [
  // --- LAPTOP (Cũ + Mới) ---
  {
    name: "MacBook Pro 14 inch M3 Pro",
    category: "laptop",
    brand: "Apple",
    description: "MacBook Pro 14 inch với chip M3 Pro mạnh mẽ, màn hình Liquid Retina XDR tuyệt đẹp.",
    price: 49990000,
    stock: 50,
    images: [
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=1000"
    ],
    tags: ["apple", "macbook", "m3", "premium"],
    averageRating: 4.9,
    isHotDeal: true,
    isNewProduct: true,
    variants: [
      { name: "M3 Pro / 18GB / 512GB - Space Black", price: 49990000, stock: 20, sku: "MBP-M3P-18-512" },
      { name: "M3 Pro / 36GB / 1TB - Silver", price: 59990000, stock: 10, sku: "MBP-M3P-36-1TB" }
    ]
  },

  {
    name: "Asus ROG Zephyrus G14",
    category: "laptop",
    brand: "Asus",
    description: "Laptop gaming 14 inch mạnh nhất thế giới, màn hình Anime Matrix độc đáo.",
    price: 39990000,
    stock: 40,
    images: [
      "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=1000"
    ],
    tags: ["asus", "rog", "gaming", "compact"],
    averageRating: 4.7,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "Ryzen 9 / RTX 4060 / 16GB", price: 39990000, stock: 20, sku: "G14-4060" },
      { name: "Ryzen 9 / RTX 4070 / 32GB", price: 48990000, stock: 10, sku: "G14-4070" }
    ]
  },
  {
    name: "Acer Nitro 5 Tiger",
    category: "laptop",
    brand: "Acer",
    description: "Laptop gaming quốc dân, hiệu năng cao giá rẻ, tản nhiệt mát mẻ.",
    price: 21990000,
    stock: 100,
    images: ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=1000"],
    tags: ["acer", "gaming", "budget"],
    averageRating: 4.4,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "i5-12500H / RTX 3050", price: 21990000, stock: 50, sku: "NITRO-3050" },
      { name: "i7-12700H / RTX 4050", price: 26990000, stock: 30, sku: "NITRO-4050" }
    ]
  },

  // --- PHONE (Cũ + Mới) ---
  {
    name: "iPhone 15 Pro Max",
    category: "phone",
    brand: "Apple",
    description: "Khung viền Titan bền bỉ, chip A17 Pro, nút Action Button mới.",
    price: 34990000,
    stock: 100,
    images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=1000"],
    tags: ["iphone", "apple", "titanium"],
    averageRating: 4.8,
    isHotDeal: true,
    isNewProduct: true,
    variants: [
      { name: "256GB - Titan Tự Nhiên", price: 34990000, stock: 40, sku: "IP15PM-256" },
      { name: "512GB - Titan Xanh", price: 40990000, stock: 30, sku: "IP15PM-512" }
    ]
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    category: "phone",
    brand: "Samsung",
    description: "Quyền năng Galaxy AI, khung Titan, bút S-Pen tích hợp.",
    price: 31990000,
    stock: 80,
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=1000"],
    tags: ["samsung", "ai", "spen"],
    averageRating: 4.7,
    isHotDeal: true,
    isNewProduct: true,
    variants: [
      { name: "256GB - Xám Titan", price: 31990000, stock: 50, sku: "S24U-256" },
      { name: "512GB - Vàng Titan", price: 36990000, stock: 20, sku: "S24U-512" }
    ]
  },


  {
    name: "Samsung Galaxy Z Flip 5",
    category: "phone",
    brand: "Samsung",
    description: "Điện thoại gập nhỏ gọn, màn hình phụ Flex Window lớn tiện lợi.",
    price: 19990000,
    stock: 60,
    images: ["https://images.unsplash.com/photo-1584006682522-dc17d6c0d9ac?auto=format&fit=crop&q=80&w=1000"],
    tags: ["samsung", "foldable", "fashion"],
    averageRating: 4.4,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "256GB - Xanh Mint", price: 19990000, stock: 30, sku: "ZFLIP5-MINT" },
      { name: "512GB - Tím", price: 23990000, stock: 15, sku: "ZFLIP5-PUR" }
    ]
  },


  // --- ACCESSORY (Cũ + Mới) ---
  {
    name: "Chuột Logitech MX Master 3S",
    category: "accessory",
    brand: "Logitech",
    description: "Chuột không dây hiệu năng cao, click không tiếng ồn, cuộn siêu tốc.",
    price: 2690000,
    stock: 150,
    images: ["https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&q=80&w=1000"],
    tags: ["mouse", "logitech", "office"],
    averageRating: 4.9,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "Graphite", price: 2690000, stock: 100, sku: "MX3S-BLK" },
      { name: "Pale Grey", price: 2690000, stock: 50, sku: "MX3S-WHT" }
    ]
  },
  {
    name: "Keychron K2 Pro",
    category: "accessory",
    brand: "Keychron",
    description: "Bàn phím cơ không dây QMK/VIA custom, hot-swap.",
    price: 2490000,
    stock: 60,
    images: ["https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=1000"],
    tags: ["keyboard", "mechanical"],
    averageRating: 4.6,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "Red Switch", price: 2490000, stock: 30, sku: "K2P-RED" },
      { name: "Brown Switch", price: 2490000, stock: 30, sku: "K2P-BRN" }
    ]
  },
  {
    name: "Sony WH-1000XM5",
    category: "accessory",
    brand: "Sony",
    description: "Tai nghe chống ồn tốt nhất thế giới, thiết kế mới, pin 30h.",
    price: 6990000,
    stock: 45,
    images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=1000"],
    tags: ["sony", "audio", "headphone", "anc"],
    averageRating: 4.8,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "Đen", price: 6990000, stock: 25, sku: "XM5-BLK" },
      { name: "Bạc", price: 6990000, stock: 20, sku: "XM5-SLV" }
    ]
  },

  {
    name: "Razer BlackWidow V4 Pro",
    category: "accessory",
    brand: "Razer",
    description: "Bàn phím cơ gaming đỉnh cao, núm xoay điều khiển, LED gầm.",
    price: 5490000,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1595044426077-d36d9236d54a?auto=format&fit=crop&q=80&w=1000"],
    tags: ["razer", "keyboard", "gaming", "rgb"],
    averageRating: 4.6,
    isHotDeal: false,
    isNewProduct: true,
    variants: [
      { name: "Green Switch", price: 5490000, stock: 15, sku: "BW4P-GRN" },
      { name: "Yellow Switch", price: 5490000, stock: 15, sku: "BW4P-YEL" }
    ]
  },

  // --- MONITOR (Cũ + Mới) ---
  {
    name: "Dell UltraSharp U2723QE",
    category: "monitor",
    brand: "Dell",
    description: "Màn hình 27 inch 4K IPS Black, chuyên đồ họa.",
    price: 13500000,
    stock: 25,
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=1000"],
    tags: ["dell", "monitor", "4k"],
    averageRating: 4.8,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "Tiêu chuẩn", price: 13500000, stock: 25, sku: "U2723QE" }
    ]
  },
  {
    name: "LG UltraGear 27GR95QE",
    category: "monitor",
    brand: "LG",
    description: "Màn hình Gaming OLED 240Hz đầu tiên thế giới, phản hồi 0.03ms.",
    price: 19990000,
    stock: 15,
    images: ["https://images.unsplash.com/photo-1616763355548-1b606f439f86?auto=format&fit=crop&q=80&w=1000"],
    tags: ["lg", "gaming", "oled", "240hz"],
    averageRating: 4.9,
    isHotDeal: false,
    isNewProduct: true,
    variants: [
      { name: "27 inch OLED", price: 19990000, stock: 15, sku: "27GR95QE" }
    ]
  },

  {
    name: "Asus ProArt PA279CRV",
    category: "monitor",
    brand: "Asus",
    description: "Màn hình đồ họa chuyên nghiệp, 4K HDR, Calman Verified.",
    price: 11990000,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"],
    tags: ["asus", "design", "4k"],
    averageRating: 4.5,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "Tiêu chuẩn", price: 11990000, stock: 30, sku: "PA279CRV" }
    ]
  },
  {
    name: "HP Spectre x360 14",
    category: "laptop",
    brand: "HP",
    description: "Laptop 2-in-1 xoay gập cao cấp nhất, màn hình OLED cảm ứng, bút cảm ứng đi kèm.",
    price: 42990000,
    stock: 15,
    images: ["https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&q=80&w=1000"],
    tags: ["hp", "convertible", "touchscreen", "business"],
    averageRating: 4.7,
    isHotDeal: false,
    isNewProduct: true,
    variants: [
      { name: "Core Ultra 7 / 16GB / 1TB - Nightfall Black", price: 42990000, stock: 10, sku: "SPEC-14-BLK" },
      { name: "Core Ultra 7 / 32GB / 2TB - Slate Blue", price: 49990000, stock: 5, sku: "SPEC-14-BLU" }
    ]
  },
  {
    name: "Lenovo Legion 5 Pro",
    category: "laptop",
    brand: "Lenovo",
    description: "Cỗ máy chiến game quốc dân, màn hình 2K 165Hz chuẩn màu, tản nhiệt cực tốt.",
    price: 36990000,
    stock: 50,
    images: ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=1000"], // Ảnh minh họa gaming
    tags: ["lenovo", "gaming", "legion", "performance"],
    averageRating: 4.8,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "i7-13700HX / RTX 4060", price: 36990000, stock: 30, sku: "LEGION5-4060" },
      { name: "i9-13900HX / RTX 4070", price: 45990000, stock: 20, sku: "LEGION5-4070" }
    ]
  },

  {
    name: "MSI Raider GE78 HX",
    category: "laptop",
    brand: "MSI",
    description: "Quái vật hiệu năng, dải đèn LED Matrix cực ngầu, thay thế máy bàn.",
    price: 89990000,
    stock: 5,
    images: ["https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=1000"],
    tags: ["msi", "hardcore", "gaming", "rgb"],
    averageRating: 4.9,
    isHotDeal: false,
    isNewProduct: true,
    variants: [
      { name: "i9-13980HX / RTX 4090 / 64GB", price: 89990000, stock: 5, sku: "GE78-4090" }
    ]
  },
  {
    name: "MacBook Air M2 13 inch",
    category: "laptop",
    brand: "Apple",
    description: "Thiết kế mới mỏng nhẹ, chip M2, sạc MagSafe tiện lợi.",
    price: 24990000,
    stock: 80,
    images: ["https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=1000"],
    tags: ["apple", "macbook", "air", "student"],
    averageRating: 4.8,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "8GB / 256GB - Midnight", price: 24990000, stock: 40, sku: "MBA-M2-MID" },
      { name: "8GB / 256GB - Starlight", price: 24990000, stock: 40, sku: "MBA-M2-STAR" }
    ]
  },

  // --- PHONE MỚI (Đa dạng phân khúc) ---
  {
    name: "Samsung Galaxy A55 5G",
    category: "phone",
    brand: "Samsung",
    description: "Thiết kế Key Island độc đáo, lưng kính sang trọng, pin 5000mAh.",
    price: 9990000,
    stock: 120,
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=1000"],
    tags: ["samsung", "midrange", "5g", "budget"],
    averageRating: 4.6,
    isHotDeal: true,
    isNewProduct: true,
    variants: [
      { name: "8GB/128GB - Tím", price: 9690000, stock: 60, sku: "A55-128-PUR" },
      { name: "12GB/256GB - Xanh", price: 10990000, stock: 60, sku: "A55-256-BLU" }
    ]
  },
  {
    name: "Asus ROG Phone 8 Pro",
    category: "phone",
    brand: "Asus",
    description: "Gaming phone tối thượng, màn hình LED AniMe Vision mặt lưng, nút AirTrigger.",
    price: 29990000,
    stock: 20,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1000"],
    tags: ["asus", "gaming", "rgb", "performance"],
    averageRating: 4.8,
    isHotDeal: false,
    isNewProduct: true,
    variants: [
      { name: "16GB/512GB - Black", price: 29990000, stock: 15, sku: "ROG8-512" },
      { name: "24GB/1TB - Edition", price: 34990000, stock: 5, sku: "ROG8-1TB" }
    ]
  },

  {
    name: "iPhone 13",
    category: "phone",
    brand: "Apple",
    description: "Lựa chọn kinh tế nhất của Apple hiện tại, vẫn mượt mà và chụp ảnh đẹp.",
    price: 13990000,
    stock: 150,
    images: ["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=1000"],
    tags: ["apple", "budget", "compact"],
    averageRating: 4.8,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "128GB - Hồng", price: 13990000, stock: 50, sku: "IP13-PNK" },
      { name: "128GB - Xanh lá", price: 13990000, stock: 50, sku: "IP13-GRN" }
    ]
  },
  {
    name: "OnePlus 12",
    category: "phone",
    brand: "OnePlus",
    description: "Flagship Killer trở lại, sạc siêu nhanh 100W, màn hình mượt nhất thế giới.",
    price: 18990000,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&q=80&w=1000"],
    tags: ["oneplus", "fast-charge", "android"],
    averageRating: 4.7,
    isHotDeal: false,
    isNewProduct: true,
    variants: [
      { name: "16GB/512GB - Flowy Emerald", price: 18990000, stock: 30, sku: "OP12-GRN" }
    ]
  },

  // --- ACCESSORY MỚI (Chuột, Phím, Loa, Ổ cứng) ---

  {
    name: "Apple Watch Series 9",
    category: "accessory",
    brand: "Apple",
    description: "Đồng hồ thông minh phổ biến nhất, tính năng Double Tap mới, màn hình sáng 2000 nits.",
    price: 9990000,
    stock: 40,
    images: ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=1000"],
    tags: ["apple", "watch", "wearable", "health"],
    averageRating: 4.8,
    isHotDeal: true,
    isNewProduct: true,
    variants: [
      { name: "41mm - Nhôm - GPS", price: 9990000, stock: 20, sku: "AWS9-41" },
      { name: "45mm - Nhôm - GPS", price: 10990000, stock: 20, sku: "AWS9-45" }
    ]
  },
  {
    name: "Loa Bluetooth JBL Charge 5",
    category: "accessory",
    brand: "JBL",
    description: "Loa di động chống nước, pin 20h, âm bass mạnh mẽ đặc trưng.",
    price: 3490000,
    stock: 50,
    images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=1000"],
    tags: ["audio", "speaker", "bluetooth", "jbl"],
    averageRating: 4.7,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "Camo (Rằn ri)", price: 3490000, stock: 20, sku: "JBL-C5-CAMO" },
      { name: "Đỏ", price: 3490000, stock: 30, sku: "JBL-C5-RED" }
    ]
  },


  // --- MONITOR MỚI (Cong, Văn phòng, eSports) ---

  {
    name: "LG UltraFine Ergo 32 inch",
    category: "monitor",
    brand: "LG",
    description: "Chân đế Ergo kẹp bàn linh hoạt, 4K HDR10, cổng USB-C sạc 60W.",
    price: 16990000,
    stock: 10,
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=1000"],
    tags: ["lg", "ergo", "workstation", "4k"],
    averageRating: 4.8,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "32UN880", price: 16990000, stock: 10, sku: "32UN880" }
    ]
  },

  {
    name: "MSI Optix G27C4",
    category: "monitor",
    brand: "MSI",
    description: "Màn hình cong gaming giá rẻ, 165Hz, tấm nền VA độ tương phản cao.",
    price: 4590000,
    stock: 50,
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"],
    tags: ["msi", "budget", "curved", "165hz"],
    averageRating: 4.3,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "27 inch FHD", price: 4590000, stock: 50, sku: "G27C4" }
    ]
  },
  {
    name: "Dell P2422H",
    category: "monitor",
    brand: "Dell",
    description: "Màn hình văn phòng chuẩn mực, chân đế xoay dọc, bảo vệ mắt ComfortView.",
    price: 4290000,
    stock: 200,
    images: ["https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&q=80&w=1000"],
    tags: ["dell", "office", "durable", "fhd"],
    averageRating: 4.6,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "24 inch", price: 4290000, stock: 200, sku: "P2422H" }
    ]
  },
  {
    name: "MacBook Air M1 2020",
    category: "laptop",
    brand: "Apple",
    description: "Chiếc MacBook bán chạy nhất mọi thời đại, hiệu năng vẫn rất tốt với chip M1, pin trâu.",
    price: 18990000,
    stock: 200,
    images: ["https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=1000"],
    tags: ["apple", "macbook", "budget", "student"],
    averageRating: 4.9,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "8GB/256GB - Vàng (Gold)", price: 18990000, stock: 100, sku: "MBA-M1-GLD" },
      { name: "8GB/256GB - Xám (Space Gray)", price: 18990000, stock: 100, sku: "MBA-M1-GRY" }
    ]
  },


  {
    name: "Dell Inspiron 16 Plus",
    category: "laptop",
    brand: "Dell",
    description: "Laptop màn hình lớn 16 inch, hiệu năng cao cho dân văn phòng và sáng tạo nội dung nhẹ.",
    price: 28990000,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=1000"],
    tags: ["dell", "inspiron", "office", "big-screen"],
    averageRating: 4.4,
    isHotDeal: false,
    isNewProduct: true,
    variants: [
      { name: "Core i7-13700H / 16GB / 1TB", price: 28990000, stock: 30, sku: "INS16-PLUS" }
    ]
  },
  {
    name: "Razer Blade 15",
    category: "laptop",
    brand: "Razer",
    description: "Được mệnh danh là MacBook của thế giới Windows Gaming, thiết kế nhôm nguyên khối đen tuyền.",
    price: 59990000,
    stock: 10,
    images: ["https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=1000"],
    tags: ["razer", "premium", "gaming", "slim"],
    averageRating: 4.7,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "QHD 240Hz / RTX 4070", price: 59990000, stock: 10, sku: "BLADE15-4070" }
    ]
  },

  // --- PHONE (Tầm trung & Giá rẻ) ---






  // --- ACCESSORY (Ergonomic & Gaming Gear) ---

  {
    name: "Corsair K70 RGB PRO",
    category: "accessory",
    brand: "Corsair",
    description: "Bàn phím cơ huyền thoại, khung nhôm phay xước, switch Cherry MX bền bỉ.",
    price: 3890000,
    stock: 25,
    images: ["https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=1000"],
    tags: ["keyboard", "gaming", "corsair", "mechanical"],
    averageRating: 4.7,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "Cherry MX Red", price: 3890000, stock: 15, sku: "K70-RED" },
      { name: "Cherry MX Speed (Silver)", price: 3890000, stock: 10, sku: "K70-SPD" }
    ]
  },
  {
    name: "HyperX Cloud II Wireless",
    category: "accessory",
    brand: "HyperX",
    description: "Tai nghe gaming không dây thoải mái nhất, âm thanh vòm 7.1 ảo.",
    price: 3190000,
    stock: 60,
    images: ["https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&q=80&w=1000"],
    tags: ["headphone", "gaming", "hyperx", "wireless"],
    averageRating: 4.9,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "Đỏ đen", price: 3190000, stock: 60, sku: "CLOUD2-RED" }
    ]
  },
  {
    name: "Apple Magic Trackpad 2",
    category: "accessory",
    brand: "Apple",
    description: "Bàn di chuột đa điểm mượt mà, diện tích lớn, pin sạc Lightning.",
    price: 3290000,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&q=80&w=1000"],
    tags: ["apple", "trackpad", "design"],
    averageRating: 4.8,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "Trắng", price: 3290000, stock: 15, sku: "TRKPD-WHT" },
      { name: "Đen", price: 3690000, stock: 15, sku: "TRKPD-BLK" }
    ]
  },
  {
    name: "JBL Go 3",
    category: "accessory",
    brand: "JBL",
    description: "Loa Bluetooth siêu nhỏ gọn, chống nước IP67, mang đi mọi nơi.",
    price: 990000,
    stock: 100,
    images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=1000"],
    tags: ["audio", "speaker", "portable", "cheap"],
    averageRating: 4.5,
    isHotDeal: true,
    isNewProduct: false,
    variants: [
      { name: "Xanh rằn ri", price: 990000, stock: 50, sku: "GO3-CAMO" },
      { name: "Đỏ", price: 990000, stock: 50, sku: "GO3-RED" }
    ]
  },

  // --- MONITOR (Di động & Đồ họa) ---
  {
    name: "Asus ZenScreen MB16ACE",
    category: "monitor",
    brand: "Asus",
    description: "Màn hình di động 15.6 inch, kết nối 1 cáp USB-C, siêu mỏng nhẹ.",
    price: 5990000,
    stock: 20,
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"],
    tags: ["asus", "portable", "travel", "monitor"],
    averageRating: 4.4,
    isHotDeal: false,
    isNewProduct: false,
    variants: [
      { name: "15.6 inch IPS FHD", price: 5990000, stock: 20, sku: "MB16ACE" }
    ]
  },
  {
    name: "Samsung Smart Monitor M8",
    category: "monitor",
    brand: "Samsung",
    description: "Màn hình thông minh không cần PC, tích hợp Netflix/Youtube, có webcam rời.",
    price: 10990000,
    stock: 15,
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=1000"],
    tags: ["samsung", "smart-monitor", "white", "4k"],
    averageRating: 4.6,
    isHotDeal: true,
    isNewProduct: true,
    variants: [
      { name: "32 inch 4K - Trắng", price: 10990000, stock: 10, sku: "M8-WHT" },
      { name: "32 inch 4K - Hồng", price: 10990000, stock: 5, sku: "M8-PNK" }
    ]
  },

  {
    name: "Dell Alienware AW3423DWF",
    category: "monitor",
    brand: "Dell",
    description: "Đỉnh cao màn hình gaming QD-OLED, màu đen sâu tuyệt đối, thiết kế đậm chất ngoài hành tinh.",
    price: 28990000,
    stock: 5,
    images: ["https://images.unsplash.com/photo-1616763355548-1b606f439f86?auto=format&fit=crop&q=80&w=1000"],
    tags: ["alienware", "oled", "high-end", "gaming"],
    averageRating: 4.9,
    isHotDeal: false,
    isNewProduct: true,
    variants: [
      { name: "34 inch Curved OLED", price: 28990000, stock: 5, sku: "AW3423DWF" }
    ]
  }
];

const seedDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(MONGO_URI);
      console.log("Connected!");
    }

    console.log("Deleting old data...");
    await Product.deleteMany({}); // Xóa dữ liệu cũ để tránh trùng lặp

    console.log("Seeding new data...");
    await Product.insertMany(sampleProducts);

    console.log("Data seeded successfully!");

    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error("Seeding failed:", err);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw err;
    }
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = seedDB;