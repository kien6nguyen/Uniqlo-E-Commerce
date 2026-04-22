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
                category: product.category,
                stock: product.stock,
                images: product.images,
                averageRating: product.averageRating,
                isHotDeal: product.isHotDeal, 
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
    if (category && category !== "All") filter.category = category;
    if (brand) {
        const brandList = brand.split(',');
        if (brandList.length > 0) {
            filter.brand = { $in: brandList };
        }
    }
    if (tags) {
        const tagList = tags.split(',');
        if (tagList.length > 0) {
            filter.tags = { $in: tagList }; 
        }
    }
    if (category) filter.category = category;
    
    if (isHotDeal !== undefined) {
        filter.isHotDeal = isHotDeal === 'true';
    }
    if (isNewProduct !== undefined) {
        filter.isNewProduct = isNewProduct === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minRating) filter.averageRating = { $gte: Number(minRating) };

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
    const [brands, tags, priceStats] = await Promise.all([
      Product.distinct("brand"),
      Product.distinct("tags"),
      Product.aggregate([
        { 
          $group: { 
            _id: null, 
            maxPrice: { $max: "$price" },
            minPrice: { $min: "$price" }
          } 
        }
      ])
    ]);

    res.json({
      success: true,
      brands: brands.filter(b => b), 
      tags: tags.filter(t => t),
      priceRange: {
        min: priceStats[0]?.minPrice || 0,
        max: priceStats[0]?.maxPrice || 50000000
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};