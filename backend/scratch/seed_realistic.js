
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../src/models/Product');

dotenv.config();

const genders = ['woman', 'man', 'kids', 'baby'];
const categories = ['tops', 'bottoms', 'outerwear', 'innerwear', 'heattech', 'activewear', 'loungewear', 'socks', 'accessories'];
const productLines = ['HEATTECH', 'AIRism', 'Ultra Light Down', 'Fleece', 'Supima Cotton', 'Linen', 'Lifewear Essentials', 'Other'];

const productData = {
    woman: {
        tops: ['Áo Thun Cổ Tròn AIRism', 'Áo Sơ Mi Vải Rayon', 'Áo Kiểu Sát Nách Cotton', 'Áo Len Cổ Lọ Cachemere', 'Áo Thun Dài Tay Cổ Cao'],
        bottoms: ['Quần Jeans Ống Suông', 'Váy Xếp Ly Dáng Dài', 'Quần Smart Ankle Pants', 'Quần Short Cotton Thun', 'Quần Legging Siêu Co Giãn'],
        outerwear: ['Áo Khoác Ultra Light Down', 'Áo Parka Chống UV', 'Áo Khoác Lông Cừu Fleece', 'Áo Blazer Dáng Rộng'],
    },
    man: {
        tops: ['Áo Thun Cổ Tròn Supima Cotton', 'Áo Sơ Mi Vải Oxford', 'Áo Polo AIRism Cài Nút', 'Áo Len Merino Cổ Tròn', 'Áo Sơ Mi Vải Flanel'],
        bottoms: ['Quần Jeans Dáng Slim Fit', 'Quần Kando (Vải Len)', 'Quần Chino Dáng Suông', 'Quần Short Bơi', 'Quần Jogger AIRism'],
        outerwear: ['Áo Khoác Parka BlockTech', 'Áo Khoác Gilet Siêu Nhẹ', 'Áo Khoác Bomber', 'Áo Khoác Vải Dạ'],
    },
    kids: {
        tops: ['Áo Thun In Hình Đồ Họa', 'Áo Sơ Mi Cotton Kẻ Sọc', 'Áo Nỉ Có Mũ'],
        bottoms: ['Quần Short Vải Nỉ', 'Quần Jeans Lưng Chun', 'Váy Cotton Dáng Xòe'],
        outerwear: ['Áo Khoác Có Mũ Chống UV', 'Áo Khoác Chần Bông'],
    },
    baby: {
        tops: ['Áo Liền Quần Bodysuit', 'Áo Thun Cotton Mềm'],
        bottoms: ['Quần Legging Co Giãn', 'Quần Short Cotton'],
        outerwear: ['Áo Khoác Nhẹ Có Mũ', 'Bộ Đồ Ngủ Cotton'],
    }
};

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRealisticProducts() {
    const products = [];
    
    genders.forEach(gender => {
        for (let i = 0; i < 50; i++) {
            const category = getRandomItem(categories);
            const genderPool = productData[gender];
            const categoryNames = genderPool[category] || genderPool['tops']; // fallback to tops
            const baseName = getRandomItem(categoryNames);
            const name = `${baseName} (Mẫu ${i + 1})`;
            
            const price = Math.floor(Math.random() * 20 + 5) * 50000 - 1000; // Realistic prices like 199k, 299k...
            
            // Uniqlo image pattern: https://image.uniqlo.com/UQ/ST3/vn/images/i18n/goods/[ID]/item/goods_00_[ID].jpg
            const fakeId = Math.floor(Math.random() * 100000 + 400000);
            const image = `https://image.uniqlo.com/UQ/ST3/vn/images/i18n/goods/${fakeId}/item/goods_00_${fakeId}.jpg`;
            
            products.push({
                name,
                gender,
                category,
                productLine: getRandomItem(productLines),
                description: `Sản phẩm ${name} mang đến sự thoải mái tối ưu với chất liệu cao cấp và thiết kế hiện đại đặc trưng của Uniqlo.`,
                price,
                stock: Math.floor(Math.random() * 100 + 10),
                images: [image],
                tags: ['Mới', 'LifeWear'],
                variants: [
                    { name: 'S', price, stock: 20, sku: `SKU-${fakeId}-S` },
                    { name: 'M', price, stock: 30, sku: `SKU-${fakeId}-M` },
                    { name: 'L', price, stock: 20, sku: `SKU-${fakeId}-L` }
                ],
                isNewProduct: Math.random() > 0.7,
                isHotDeal: Math.random() > 0.8
            });
        }
    });
    
    return products;
}

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Cleaning existing products...');
        await Product.deleteMany({});

        console.log('Generating 200 realistic products...');
        const products = generateRealisticProducts();

        console.log('Inserting into database...');
        await Product.insertMany(products);

        console.log('Seed successful! 200 products added.');
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
