const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
exports.createVnpayPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase(); 
    const txnRef = `${orderId}_${randomSuffix}`; 

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    let returnUrl = process.env.VNP_RETURN_URL;
    if (returnUrl && returnUrl.startsWith('https//')) {
        returnUrl = returnUrl.replace('https//', 'https://');
    } else if (returnUrl && returnUrl.startsWith('http//')) {
        returnUrl = returnUrl.replace('http//', 'http://');
    }

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const createDate = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef, 
      vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.round(order.finalAmount * 100),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;
    

    const paymentUrl = vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });

    res.json({ success: true, paymentUrl });
  } catch (err) {
    console.error("Create VNPAY payment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    if (!vnp_Params || !vnp_Params["vnp_TxnRef"]) {
        console.log("Lỗi: Không tìm thấy tham số vnp_TxnRef");
        return res.redirect(`${process.env.CLIENT_URL}/payment/failed?message=InvalidInput`);
    }
    const secureHash = vnp_Params["vnp_SecureHash"];

    let txnRef = vnp_Params["vnp_TxnRef"];
    let responseCode = vnp_Params["vnp_ResponseCode"];

    const orderId = txnRef.split("_")[0];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const secretKey = process.env.VNP_HASH_SECRET;
    let clientUrl = process.env.CLIENT_URL;
    if (clientUrl && clientUrl.startsWith('https//')) {
        clientUrl = clientUrl.replace('https//', 'https://');
    } else if (clientUrl && clientUrl.startsWith('http//')) {
        clientUrl = clientUrl.replace('http//', 'http://');
    }

    let vnp_Params_Sorted = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params_Sorted, { encode: false });
    
    const signed = crypto
      .createHmac("sha512", secretKey)
      .update(Buffer.from(signData, 'utf-8'))
      .digest("hex");

    if (secureHash !== signed) {
      console.log("Invalid Signature");
      return res.redirect(`${clientUrl}/payment/failed?message=InvalidSignature`);
    }

    const order = await Order.findById(orderId);

    if (!order) {
      console.log("Order Not Found:", orderId);
      return res.redirect(`${clientUrl}/payment/failed?message=OrderNotFound`);
    }

    if (responseCode === "00") {
      order.payment.status = "paid";
      order.payment.transactionId = vnp_Params["vnp_TransactionNo"];
      order.payment.paymentTime = new Date();
      order.status = "Paid";
      

      order.history.push({ status: "Paid", updatedAt: new Date() });
      await order.save();

      if (order.user) {
        await Cart.deleteOne({ user: order.user });
      }

      return res.redirect(`${clientUrl}/payment/success?orderId=${order._id}`);
    } else {
      order.payment.status = "failed";
      order.status = "Cancelled";
      order.history.push({ status: "Cancelled", updatedAt: new Date() });
      await order.save();

      return res.redirect(`${clientUrl}/payment/failed?orderId=${order._id}&code=${responseCode}`);
    }
  } catch (err) {
    console.error("VNPAY return error:", err);
    let clientUrl = process.env.CLIENT_URL;
    if (clientUrl && clientUrl.startsWith('https//')) clientUrl = clientUrl.replace('https//', 'https://');
    return res.redirect(`${clientUrl}/payment/failed?message=ServerError`);
  }
};

exports.vnpayIpn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    if (!vnp_Params || !vnp_Params["vnp_TxnRef"]) {
        return res.status(200).json({ RspCode: "99", Message: "Input required" });
    }
    const secureHash = vnp_Params["vnp_SecureHash"];

    let txnRef = vnp_Params["vnp_TxnRef"];
    let responseCode = vnp_Params["vnp_ResponseCode"];

    const orderId = txnRef.split("_")[0];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const secretKey = process.env.VNP_HASH_SECRET;
    
    let vnp_Params_Sorted = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params_Sorted, { encode: false });
    
    const signed = crypto
      .createHmac("sha512", secretKey)
      .update(Buffer.from(signData, 'utf-8'))
      .digest("hex");

    if (secureHash !== signed) {
      return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }
    if (order.payment.status === "paid") {
      return res.status(200).json({ RspCode: "00", Message: "Order already confirmed" });
    }
    if (responseCode === "00") {
      order.payment.status = "paid";
      order.payment.transactionId = vnp_Params["vnp_TransactionNo"];
      order.payment.paymentTime = new Date();
      order.status = "Paid";
      order.history.push({ status: "Paid", updatedAt: new Date() });
      await order.save();
      
      return res.status(200).json({ RspCode: "00", Message: "Success" });
    } else {
      order.payment.status = "failed";
      order.status = "Cancelled";
      order.history.push({ status: "Cancelled", updatedAt: new Date() });
      await order.save();
      
      return res.status(200).json({ RspCode: "00", Message: "Payment failed" });
    }
  } catch (err) {
    console.error("VNPAY IPN error:", err);
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
};