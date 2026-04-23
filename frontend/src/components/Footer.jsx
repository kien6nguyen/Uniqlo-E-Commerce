import React from "react";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import ChatWidget from "./ChatWidget";

function Footer() {
  return (
    <footer className="mt-8 border-top-1 border-200 bg-gray-50">
      <div className="container-xl py-6">
        <div className="grid">

          {/* Help */}
          <div className="col-12 md:col-2">
            <h5 className="font-bold mb-3 text-xs uppercase letter-spacing-1">Help</h5>
            <ul className="list-none p-0 m-0 text-xs" style={{ lineHeight: '2' }}>
              <li><a href="#">Check Order</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          {/* About */}
          <div className="col-12 md:col-2">
            <h5 className="font-bold mb-3 text-xs uppercase letter-spacing-1">About UNIQLO</h5>
            <ul className="list-none p-0 m-0 text-xs" style={{ lineHeight: '2' }}>
              <li><a href="#">Information</a></li>
              <li><a href="#">Store Locator</a></li>
              <li><a href="#">Group Companies</a></li>
              <li><a href="#">Sustainability</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div className="col-12 md:col-2">
            <h5 className="font-bold mb-3 text-xs uppercase letter-spacing-1">Follow Us</h5>
            <div className="flex gap-3 mt-1">
              <i className="pi pi-facebook text-lg cursor-pointer hover:text-red-600"></i>
              <i className="pi pi-instagram text-lg cursor-pointer hover:text-red-600"></i>
              <i className="pi pi-twitter text-lg cursor-pointer hover:text-red-600"></i>
              <i className="pi pi-youtube text-lg cursor-pointer hover:text-red-600"></i>
            </div>
          </div>

          {/* Newsletter */}
          <div className="col-12 md:col-3">
            <h5 className="font-bold mb-3 text-xs uppercase letter-spacing-1">E-Newsletter</h5>
            <p className="text-xs mb-2" style={{ lineHeight: '1.6', color: '#666' }}>
              Be the first to know about new arrivals and exclusive offers.
            </p>
            <div className="flex">
              <InputText placeholder="Your email" className="w-full" style={{ height: '32px', fontSize: '0.8rem' }} />
              <button className="bg-black text-white px-3 border-none cursor-pointer text-xs">OK</button>
            </div>
          </div>

          {/* Chat Support */}
          <div className="col-12 md:col-3">
            <h5 className="font-bold mb-3 text-xs uppercase letter-spacing-1">Hỗ Trợ Trực Tuyến</h5>
            <p className="text-xs mb-3" style={{ lineHeight: '1.6', color: '#666' }}>
              Chat trực tiếp với nhân viên UNIQLO. Chúng tôi luôn sẵn sàng hỗ trợ bạn.
            </p>
            <ChatWidget />
          </div>

        </div>

        <Divider className="my-4" />

        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3 text-xs text-500 uppercase" style={{ fontWeight: 600 }}>
          <div className="flex gap-4">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Accessibility</a>
          </div>
          <span>Copyright © {new Date().getFullYear()} UNIQLO CO., LTD. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
