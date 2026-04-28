import React from "react";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import ChatWidget from "./ChatWidget";

function Footer() {
  return (
    <footer className="bg-[#f9f9f9] text-[#111] pt-16 pb-8 border-top-1 border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid">
          {/* Help */}
          <div className="col-12 md:col-2 mb-8 md:mb-0">
            <h5 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Hỗ trợ</h5>
            <ul className="list-none p-0 m-0 flex flex-column gap-3">
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Kiểm tra đơn hàng</a></li>
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Chính sách đổi trả</a></li>
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Thông tin giao hàng</a></li>
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Liên hệ chúng tôi</a></li>
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Câu hỏi thường gặp</a></li>
            </ul>
          </div>

          {/* About */}
          <div className="col-12 md:col-2 mb-8 md:mb-0">
            <h5 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Về Uniqlo</h5>
            <ul className="list-none p-0 m-0 flex flex-column gap-3">
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Thông tin tập đoàn</a></li>
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Danh sách cửa hàng</a></li>
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Tính bền vững</a></li>
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Nghề nghiệp</a></li>
              <li><a href="#" className="text-gray-500 no-underline hover:text-black transition-colors text-xs font-medium">Tin tức</a></li>
            </ul>
          </div>

          {/* Social */}
          <div className="col-12 md:col-2 mb-8 md:mb-0">
            <h5 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Theo dõi</h5>
            <div className="flex gap-4">
              <i className="pi pi-facebook text-xl cursor-pointer hover:text-red-600 transition-all transform hover:scale-110"></i>
              <i className="pi pi-instagram text-xl cursor-pointer hover:text-red-600 transition-all transform hover:scale-110"></i>
              <i className="pi pi-twitter text-xl cursor-pointer hover:text-red-600 transition-all transform hover:scale-110"></i>
              <i className="pi pi-youtube text-xl cursor-pointer hover:text-red-600 transition-all transform hover:scale-110"></i>
            </div>
          </div>

          {/* Newsletter */}
          <div className="col-12 md:col-3 mb-8 md:mb-0">
            <h5 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Bản tin điện tử</h5>
            <p className="text-gray-500 text-xs mb-4 leading-relaxed font-medium">
              Đăng ký để nhận thông tin về các bộ sưu tập mới và ưu đãi độc quyền.
            </p>
            <div className="flex">
              <input 
                type="text" 
                placeholder="Email của bạn" 
                className="bg-white border-1 border-gray-200 text-[#111] px-4 py-2 flex-1 text-xs outline-none focus:border-black transition-colors" 
              />
              <button className="bg-black text-white px-4 py-2 border-none cursor-pointer text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">
                OK
              </button>
            </div>
          </div>

          {/* Support */}
          <div className="col-12 md:col-3">
            <h5 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Hỗ trợ trực tuyến</h5>
            <div className="bg-white p-4 rounded-lg border-1 border-gray-200 shadow-sm">
              <p className="text-gray-500 text-xs mb-4 leading-relaxed font-medium">
                Chúng tôi luôn sẵn sàng trả lời các thắc mắc của bạn.
              </p>
              <ChatWidget />
            </div>
          </div>
        </div>

        <div className="border-top-1 border-gray-200 mt-16 pt-8 flex flex-column md:flex-row justify-content-between align-items-center gap-6">
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
            <a href="#" className="text-gray-400 no-underline hover:text-black transition-colors">Quyền riêng tư</a>
            <a href="#" className="text-gray-400 no-underline hover:text-black transition-colors">Điều khoản</a>
            <a href="#" className="text-gray-400 no-underline hover:text-black transition-colors">Khả năng tiếp cận</a>
          </div>
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            Copyright © {new Date().getFullYear()} UNIQLO CO., LTD. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
