const Cart = require("../models/Cart");
const Product = require("../models/Product");
const DiscountCode = require("../models/DiscountCode");

async function findCart(userId, sessionId) {
  if (userId) {
    let cart = await Cart.findOne({ user: userId });
    if (cart) return cart;
  }
  if (sessionId) {
    let cart = await Cart.findOne({ sessionId: sessionId, user: null });
    if (cart) return cart;
  }
  return null;
}

async function recalcCart(cart) {
  cart.subtotal = cart.items.reduce((sum, i) => sum + (i.price || 0), 0);
  cart.tax = +(cart.subtotal * 0.1).toFixed(2);

  let discountAmount = 0;
  let freeShipping = false;

  if (cart.discountCode) {
    const discount = await DiscountCode.findOne({ code: cart.discountCode });
    if (discount) {
      discountAmount = (cart.subtotal * discount.percentage) / 100;
      freeShipping = discount.freeShipping;
    }
  }

  cart.discount = +discountAmount.toFixed(2);
  cart.freeShipping = freeShipping;

  const shippingFee = freeShipping ? 0 : (cart.shippingFee || 30000);
  const supportFee = cart.supportFee || 0;
  cart.total = cart.subtotal + cart.tax + shippingFee + supportFee - cart.discount;
}

exports.addOrUpdateItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.sessionID;

    const { productId, quantity = 1, variantId = null, color = null } = req.body;

    if (!productId) return res.status(400).json({ message: "productId required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let pricePerUnit = product.price;
    let availableStock = product.stock;

    if (variantId) {
      if (product.variants && product.variants.length > 0) {
        const selectedVariant = product.variants.id(variantId);
        if (!selectedVariant) {
          return res.status(400).json({ success: false, message: "Phiên bản sản phẩm không tồn tại" });
        }
        pricePerUnit = selectedVariant.price;
        availableStock = selectedVariant.stock;
      } else {
        return res.status(400).json({ success: false, message: "Sản phẩm này không có phiên bản nào" });
      }
    }
    else if (variantId) {
      return res.status(400).json({ success: false, message: "Sản phẩm này không có phiên bản nào" });
    }
    if (color && product.tags && product.tags.length > 0) {
      if (!product.tags.includes(color)) {
        return res.status(400).json({ success: false, message: "Màu sắc không hợp lệ" });
      }
    }

    let cart = await findCart(userId, sessionId);
    if (!cart) {
      cart = new Cart({
        user: userId || null,
        sessionId: userId ? null : sessionId,
        items: [],
        shippingFee: 30000,
      });
    }

    const idx = cart.items.findIndex((it) => {
      const isSameProduct = String(it.product) === String(productId);

      const currentVariantId = it.variantId ? String(it.variantId) : null;
      const inputVariantIdStr = variantId ? String(variantId) : null;
      const isSameVariant = currentVariantId === inputVariantIdStr;

      const isSameColor = String(it.color || "") === String(color || "");

      return isSameProduct && isSameVariant && isSameColor;
    });

    const method = (req.method || "").toUpperCase();

    if (idx > -1) {
      const currentQty = cart.items[idx].quantity || 0;
      let newQty;

      if (method === "POST") {
        newQty = currentQty + Number(quantity);
      } else {
        newQty = Number(quantity);
      }

      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Chỉ còn ${availableStock} sản phẩm trong kho`
        });
      }

      if (newQty <= 0) {
        cart.items.splice(idx, 1);
        if (cart.items.length === 0) {
          await Cart.deleteOne({ _id: cart._id });
          return res.json({
            success: true,
            message: "Cart deleted",
            cart: { items: [], note: null, shippingFee: 0, freeShipping: false }
          });
        }
      } else {
        cart.items[idx].quantity = newQty;
        cart.items[idx].price = pricePerUnit * newQty;
        cart.items[idx].priceSnapshot = pricePerUnit;
      }
    } else {
      const newQty = Number(quantity);
      if (newQty > availableStock) {
        return res.status(400).json({ success: false, message: `Chỉ còn ${availableStock} sản phẩm` });
      }

      if (newQty > 0) {
        cart.items.push({
          product: productId,
          quantity: newQty,
          price: pricePerUnit * newQty,
          priceSnapshot: pricePerUnit,
          variantId: variantId || null,
          color: color || undefined,
        });
      }
    }

    await recalcCart(cart);
    await cart.save();
    await cart.populate({ path: "items.product", select: "name price images brand" });

    res.json({ success: true, message: "Cart updated", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.updateItemQuantity = exports.addOrUpdateItem;

exports.removeItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    const productId = req.params.productId;

    const { variantId = null, color = null } = req.query;

    let cart = await findCart(userId, sessionId);

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) =>
        !(
          String(item.product) === String(productId) &&
          String(item.variantId || "") === String(variantId || "") &&
          String(item.color || "") === String(color || "")
        )
    );

    if (cart.items.length === 0) {
      await Cart.deleteOne({ _id: cart._id });
      return res.json({
        success: true,
        message: "Item removed, cart deleted",
        cart: { items: [], note: null, shippingFee: 0, freeShipping: false }
      });
    }

    await recalcCart(cart);
    await cart.save();
    await cart.populate({ path: "items.product", select: "name price images brand" });

    res.json({ success: true, message: "Item removed", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.sessionID;

    let cart = await findCart(userId, sessionId);

    if (!cart) {
      return res.json({
        success: true,
        message: "Cart cleared",
        cart: { items: [], note: null, shippingFee: 0, freeShipping: false }
      });
    }

    await Cart.deleteOne({ _id: cart._id });

    res.json({
      success: true,
      message: "Cart cleared",
      cart: { items: [], note: null, shippingFee: 0, freeShipping: false }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCartSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.sessionID;

    const cart = await findCart(userId, sessionId);

    if (!cart) {
      return res.json({
        success: true,
        items: [],
        subtotal: 0,
        tax: 0,
        shippingFee: 30000,
        freeShipping: false,
        discount: 0,
        discountCode: null,
        note: null,
        total: 0
      });
    }

    await cart.populate({ 
        path: "items.product", 
        select: "name price images brand variants" 
    });

    const actualShippingFee = cart.freeShipping ? 0 : (cart.shippingFee || 30000);

    const mappedItems = cart.items.map(item => {
        let variantName = null;

        if (item.variantId && item.product && item.product.variants) {
            const foundVariant = item.product.variants.find(
                v => String(v._id) === String(item.variantId)
            );
            if (foundVariant) {
                variantName = foundVariant.name;
            }
        }

        return {
            ...item.toObject(),
            variantName: variantName,
            unitPrice: item.priceSnapshot || (item.price / item.quantity)
        };
    });

    res.json({
      success: true,
      items: mappedItems,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shippingFee: actualShippingFee,
      freeShipping: cart.freeShipping,
      discount: cart.discount,
      discountCode: cart.discountCode,
      note: cart.note,
      total: cart.total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.applyDiscountCode = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.sessionID;

    if (!code) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập mã giảm giá" });
    }

    const discount = await DiscountCode.findOne({ code: code.toUpperCase() });
    if (!discount) {
      return res.status(404).json({ success: false, message: "Mã giảm giá không tồn tại" });
    }

    if (discount.usedCount >= discount.usageLimit) {
      return res.status(400).json({ success: false, message: "Mã giảm giá đã hết lượt sử dụng" });
    }

    const cart = await findCart(userId, sessionId);

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ success: false, message: "Giỏ hàng trống" });
    }

    if (discount.minOrderValue > 0 && cart.subtotal < discount.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${discount.minOrderValue.toLocaleString('vi-VN')}₫ để áp dụng mã này`,
        minOrderValue: discount.minOrderValue,
        currentValue: cart.subtotal
      });
    }

    cart.discountCode = discount.code;

    await recalcCart(cart);
    await cart.save();
    await cart.populate({ path: "items.product", select: "name price images brand" });

    discount.usedCount += 1;
    await discount.save();

    const actualShippingFee = cart.freeShipping ? 0 : (cart.shippingFee || 30000);

    let message = `Áp dụng mã ${discount.code} thành công! Giảm ${discount.percentage}%`;
    if (discount.freeShipping) {
      message += ' + Miễn phí vận chuyển';
    }

    res.json({
      success: true,
      message,
      cart: {
        ...cart.toObject(),
        shippingFee: actualShippingFee
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeDiscountCode = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.sessionID;

    const cart = await findCart(userId, sessionId);

    if (!cart) {
      return res.status(404).json({ success: false, message: "Giỏ hàng không tồn tại" });
    }

    if (!cart.discountCode) {
      return res.status(400).json({ success: false, message: "Không có mã giảm giá nào được áp dụng" });
    }

    const discount = await DiscountCode.findOne({ code: cart.discountCode });
    if (discount && discount.usedCount > 0) {
      discount.usedCount -= 1;
      await discount.save();
    }

    cart.discountCode = null;
    cart.discount = 0;
    cart.freeShipping = false;

    await recalcCart(cart);
    await cart.save();
    await cart.populate({ path: "items.product", select: "name price images brand" });

    const actualShippingFee = cart.freeShipping ? 0 : (cart.shippingFee || 30000);

    res.json({
      success: true,
      message: "Đã xóa mã giảm giá",
      cart: {
        ...cart.toObject(),
        shippingFee: actualShippingFee
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCartNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    const { note } = req.body;

    let cart = await findCart(userId, sessionId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại"
      });
    }

    cart.note = note || null;
    await cart.save();
    await cart.populate({ path: "items.product", select: "name price images brand" });

    res.json({
      success: true,
      message: "Đã cập nhật ghi chú",
      cart
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};