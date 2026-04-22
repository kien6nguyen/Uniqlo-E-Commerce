// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOrderConfirmationEmail = async (email, order) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Xác nhận đơn hàng #${order._id}`,
      html: `
        <h1>Cảm ơn bạn đã đặt hàng!</h1>
        <p>Mã đơn hàng: <strong>${order._id}</strong></p>
        <p>Tổng tiền: ${order.finalAmount.toLocaleString()} VND</p>
        <p>Trạng thái: ${order.status}</p>
        <h3>Chi tiết sản phẩm:</h3>
        <ul>
          ${order.items.map(item => `<li>${item.quantity} x Product ID: ${item.product} - ${item.price.toLocaleString()} VND</li>`).join('')}
        </ul>
        <p>Chúng tôi sẽ sớm giao hàng cho bạn.</p>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}`);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
};

module.exports = { transporter, sendOrderConfirmationEmail };
