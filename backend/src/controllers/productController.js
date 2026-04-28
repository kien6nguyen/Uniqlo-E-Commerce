const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
    try {
        const { name, price, description, category, brand, tags, stock, variants, isHotDeal, isNewProduct } = req.body;
        const images = req.files?.map((file) => file.path) || [];
        
        const newProduct = new Product({
            name,
            price,
            description,
            category,
            brand,
            tags,
            stock,
            images,
            variants,
            isHotDeal: isHotDeal === 'true' || isHotDeal === true,
            isNewProduct: isNewProduct === 'true' || isNewProduct === true,
        });
        
        await newProduct.save();
        
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: {
                id: newProduct._id,
                name: newProduct.name,
                price: newProduct.price,
                description: newProduct.description,
                category: newProduct.category,
                brand: newProduct.brand,
                tags: newProduct.tags,
                variants: newProduct.variants,
                stock: newProduct.stock,
                images: newProduct.images,
                averageRating: newProduct.averageRating,
                isHotDeal: newProduct.isHotDeal, 
                createdAt: newProduct.createdAt,
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        res.json({
            success: true,
            message: "Get product successfully",
            product: {
                id: product._id,
                name: product.name,
                price: product.price,
                description: product.description,
                gender: product.gender,
                category: product.category,
                productLine: product.productLine,
                brand: product.brand,
                tags: product.tags,
                stock: product.stock,
                images: product.images,
                averageRating: product.averageRating,
                isHotDeal: product.isHotDeal,
                isNewProduct: product.isNewProduct,
                variants: product.variants,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        
        const currentProduct = await Product.findById(id);
        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (req.body.existingImages) {
            const existingImages = JSON.parse(req.body.existingImages);
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map((file) => file.path);
                updates.images = [...existingImages, ...newImages];
            } else {
                updates.images = existingImages;
            }
        } else if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file) => file.path);
            updates.images = newImages;
        }

        if (updates.isHotDeal !== undefined) {
             updates.isHotDeal = updates.isHotDeal === 'true' || updates.isHotDeal === true;
        }
        if (updates.isNewProduct !== undefined) {
             updates.isNewProduct = updates.isNewProduct === 'true' || updates.isNewProduct === true;
        }

        const disallowedFields = ["id", "_id", "createdAt", "averageRating", "variants", "existingImages"];
        disallowedFields.forEach(field => delete updates[field]);

        const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        res.json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully",
            product: {
                id: deletedProduct._id,
                name: deletedProduct.name,
                price: deletedProduct.price,
                description: deletedProduct.description,
                category: deletedProduct.category,
                stock: deletedProduct.stock,
                images: deletedProduct.images,
                averageRating: deletedProduct.averageRating,
                isHotDeal: deletedProduct.isHotDeal, 
                createdAt: deletedProduct.createdAt,
                updatedAt: deletedProduct.updatedAt
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.addVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, sku } = req.body;

    if (!name || !price || !stock) {
        return res.status(400).json({ message: "Missing required fields: name, price, or stock" });
    }
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.variants.push({ name, price, stock, sku });
    await product.save();

    res.status(201).json({
      message: "Variant added successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;
    const { name, price, stock, sku } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    if (name !== undefined) variant.name = name;
    if (price !== undefined) variant.price = price;
    if (stock !== undefined) variant.stock = stock;
    if (sku !== undefined) variant.sku = sku;

    await product.save();

    res.json({
      message: "Variant updated successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    variant.deleteOne(); 
    await product.save();

    res.json({
      message: "Variant deleted successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.filterProduct = async (req, res) => {
  try {
    const { 
      gender,
      productLine,
      category, 
      brand, 
      tags,
      search, 
      minPrice, 
      maxPrice, 
      minRating, 
      inStock, 
      isHotDeal,
      isNewProduct,
      sort 
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {};

    // 1. Lọc theo giới tính (ưu tiên đầu tiên)
    if (gender && gender !== "all") {
      const genderList = gender.split(',').map(g => g.trim().toLowerCase());
      filter.gender = genderList.length === 1 ? genderList[0] : { $in: genderList };
    }

    // 2. Lọc theo dòng sản phẩm (ưu tiên thứ hai)
    if (productLine && productLine !== "All") {
      const lineList = productLine.split(',').map(l => l.trim());
      filter.productLine = lineList.length === 1 ? lineList[0] : { $in: lineList };
    }

    // 3. Lọc theo danh mục
    if (category && category !== "All") filter.category = category;

    // 4. Thương hiệu
    if (brand) {
      const brandList = brand.split(',').map(b => b.trim());
      if (brandList.length > 0) filter.brand = { $in: brandList };
    }

    // 5. Tags
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      if (tagList.length > 0) filter.tags = { $in: tagList };
    }

    // 6. Deals & New
    if (isHotDeal !== undefined) filter.isHotDeal = isHotDeal === 'true';
    if (isNewProduct !== undefined) filter.isNewProduct = isNewProduct === 'true';

    // 7. Tìm kiếm text (Ưu tiên tên sản phẩm và tags để tăng độ chính xác)
    if (search) {
      const searchStr = (Array.isArray(search) ? search.join(' ') : search).trim();
      const searchTerms = searchStr.split(/\s+/).filter(t => t.length > 0);
      
      // Tạo regex cho từng từ để tìm kiếm linh hoạt hơn
      const regexArr = searchTerms.map(t => new RegExp(t, "i"));
      
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          // Tìm chính xác cả cụm
          { name: { $regex: searchStr, $options: "i" } },
          // Hoặc khớp tất cả các từ trong tên
          { $and: searchTerms.map(t => ({ name: { $regex: t, $options: "i" } })) },
          // Hoặc khớp bất kỳ từ nào trong tags
          { tags: { $in: regexArr } },
          { sku: { $regex: searchStr, $options: "i" } }
        ]
      });
    }
    // Nếu vẫn muốn tìm trong description nhưng độ ưu tiên thấp hơn, 
    // ta có thể giữ lại hoặc loại bỏ tùy nhu cầu chính xác.
    // Ở đây tôi loại bỏ description để tránh "quần jean" hiện khi tìm "áo thun".

    // 8. Khoảng giá
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // 9. Rating tối thiểu
    if (minRating) filter.averageRating = { $gte: Number(minRating) };

    // 10. Còn hàng
    if (inStock === "true") filter.stock = { $gt: 0 };

    const sortOption = {};
    switch (sort) {
      case "name_asc": sortOption.name = 1; break;
      case "name_desc": sortOption.name = -1; break;
      case "price_asc": sortOption.price = 1; break;
      case "price_desc": sortOption.price = -1; break;
      case "newest": sortOption.createdAt = -1; break;
      case "oldest": sortOption.createdAt = 1; break;
      case "rating_desc": sortOption.averageRating = -1; break;
      default: sortOption.createdAt = -1;
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      products
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getFilterAttributes = async (req, res) => {
  try {
    const { gender } = req.query;
    // Nếu có gender, lọc attributes theo gender đó
    const matchStage = gender && gender !== 'all' ? { $match: { gender } } : null;

    const pipeline = (field) => [
      ...(matchStage ? [matchStage] : []),
      { $unwind: `$${field}` },
      { $group: { _id: `$${field}` } },
      { $sort: { _id: 1 } }
    ];

    const [brandsRaw, tagsRaw, productLinesRaw, priceStats, categories] = await Promise.all([
      Product.aggregate(pipeline("brand")),
      Product.aggregate(pipeline("tags")),
      Product.aggregate([
        ...(matchStage ? [matchStage] : []),
        { $group: { _id: "$productLine" } },
        { $sort: { _id: 1 } }
      ]),
      Product.aggregate([
        ...(matchStage ? [matchStage] : []),
        { $group: { _id: null, maxPrice: { $max: "$price" }, minPrice: { $min: "$price" } } }
      ]),
      Product.aggregate([
        ...(matchStage ? [matchStage] : []),
        { $group: { _id: "$category" } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      brands: brandsRaw.map(b => b._id).filter(Boolean),
      tags: tagsRaw.map(t => t._id).filter(Boolean),
      productLines: productLinesRaw.map(p => p._id).filter(Boolean),
      categories: categories.map(c => c._id).filter(Boolean),
      priceRange: {
        min: priceStats[0]?.minPrice || 0,
        max: priceStats[0]?.maxPrice || 50000000
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};