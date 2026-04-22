const qs = require("qs");
const crypto = require("crypto");

function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  keys.forEach((key) => (sorted[key] = obj[key]));
  return sorted;
}

function createVnpayUrl(req, orderId, amount) {
  const date = new Date();
  const createDate = `${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${date
    .getDate()
    .toString()
    .padStart(2, "0")}${date
    .getHours()
    .toString()
    .padStart(2, "0")}${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId.toString(),
    vnp_OrderInfo: "Thanh toan don hang #" + orderId,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100, // VNPAY tính theo đồng
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    vnp_IpAddr: req.ip,
    vnp_CreateDate: createDate,
  };

  const sortedParams = sortObject(vnpParams);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  sortedParams["vnp_SecureHash"] = signed;
  const query = qs.stringify(sortedParams, { encode: true });
  return `${process.env.VNP_URL}?${query}`;
}

module.exports = { createVnpayUrl };
