const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
const Product = require("../models/Product");

const genders = ['woman', 'man', 'kid', 'baby'];
const categories = ['tops', 'bottoms', 'outerwear', 'innerwear', 'heattech', 'activewear', 'loungewear', 'socks', 'accessories'];
const productLines = ['HEATTECH', 'AIRism', 'Ultra Light Down', 'Fleece', 'Supima Cotton', 'Linen', 'Lifewear Essentials', 'Other'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRealisticProducts() {
    let scrapedData = [];
    try {
        const jsonPath = path.join(__dirname, 'products.json');
        if (fs.existsSync(jsonPath)) {
            scrapedData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            console.log(`Loaded ${scrapedData.length} products from products.json`);
        }
    } catch (err) {
        console.error("Could not load products.json, using fallback data", err);
    }

    // Group scraped data by gender
    const genderPools = {
        woman: scrapedData.filter(p => p.gender === 'woman'),
        man: scrapedData.filter(p => p.gender === 'man'),
        kid: scrapedData.filter(p => p.gender === 'kid'),
        baby: scrapedData.filter(p => p.gender === 'baby')
    };

    const products = [];
    let globalIndex = 0;

    genders.forEach(gender => {
        const pool = genderPools[gender];
        
        for (let i = 0; i < 50; i++) {
            let baseProduct;
            let name, price, image, link;

            if (pool.length > 0) {
                // Use real data from the pool (circular)
                baseProduct = pool[i % pool.length];
                name = i < pool.length ? baseProduct.name : `${baseProduct.name} (Kiểu ${Math.floor(i / pool.length) + 1})`;
                price = baseProduct.price || (Math.floor(Math.random() * 20 + 5) * 50000 - 1000);
                image = baseProduct.imageUrl;
                link = baseProduct.link;
            } else {
                // Fallback if no real data for this gender (e.g. baby)
                // Use a 'kid' product but rename it if available, otherwise complete fallback
                const fallbackPool = genderPools['kid'].length > 0 ? genderPools['kid'] : scrapedData;
                if (fallbackPool.length > 0) {
                    baseProduct = fallbackPool[i % fallbackPool.length];
                    name = `Sản Phẩm ${gender.charAt(0).toUpperCase() + gender.slice(1)} - ${baseProduct.name} (${i + 1})`;
                    price = baseProduct.price || 293000;
                    image = baseProduct.imageUrl;
                } else {
                    name = `Sản phẩm ${gender} mẫu ${i + 1}`;
                    price = 293000;
                    image = "https://image.uniqlo.com/UQ/ST3/vn/imagesgoods/422992/item/vngoods_40_422992_3x4.jpg";
                }
            }

            const category = getRandomItem(categories);
            
            products.push({
                name,
                gender,
                category,
                productLine: getRandomItem(productLines),
                description: `Sản phẩm ${name} mang đến sự thoải mái tối ưu với chất liệu cao cấp và thiết kế hiện đại đặc trưng của Uniqlo.`,
                price,
                stock: Math.floor(Math.random() * 100 + 10),
                images: [image],
                tags: [getRandomItem(['Mới', 'LifeWear', 'HOT']), getRandomItem(['Cotton', 'Linen', 'AIRism', 'Dry-Ex'])],
                variants: [
                    { name: 'S', price, stock: 20, sku: `SKU-${gender}-${globalIndex}-S` },
                    { name: 'M', price, stock: 30, sku: `SKU-${gender}-${globalIndex}-M` },
                    { name: 'L', price, stock: 20, sku: `SKU-${gender}-${globalIndex}-L` }
                ],
                isNewProduct: Math.random() > 0.7,
                isHotDeal: Math.random() > 0.8
            });
            globalIndex++;
        }
    });

    return products;
}

const seedDB = async () => {
  try {
    console.log("Deleting old products...");
    await Product.deleteMany({});

    console.log("Generating 200 products (50 per gender) using scraped Uniqlo data...");
    const products = generateRealisticProducts();

    console.log("Seeding new data...");
    await Product.insertMany(products);

    console.log("Uniqlo Products seeded successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
    throw err;
  }
};

module.exports = seedDB;