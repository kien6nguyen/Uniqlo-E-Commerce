import React from "react";
import { Carousel } from "primereact/carousel";
import { Button } from "primereact/button";

const PromoPanel = () => {
  // Data quảng cáo (6 cái)
  const items = [
    {
      id: 1,
      title: "iPhone 15 Pro Max",
      subtitle: "Titan tự nhiên - Đỉnh cao công nghệ",
      desc: "Giảm ngay 2 triệu khi thanh toán qua VNPAY",
      bg: "linear-gradient(135deg, #1c1c1c 0%, #434343 100%)",
      img: "https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg",
      textColor: "text-white"
    },
    {
      id: 2,
      title: "Siêu Sale Tháng 10",
      subtitle: "Laptop Gaming - Chiến game cực đỉnh",
      desc: "Giảm đến 40% - Tặng chuột & Balo",
      bg: "linear-gradient(135deg, #2563eb 0%, #00aaff 100%)",
      img: "https://cdn.tgdd.vn/Products/Images/44/313454/dell-xps-13-plus-9320-i7-1xd0t-thumb-600x600.jpg",
      textColor: "text-white"
    },
    {
      id: 3,
      title: "Phụ Kiện Chất",
      subtitle: "Âm thanh sống động",
      desc: "Mua 1 tặng 1 cho tai nghe Sony",
      bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      img: "https://cdn.tgdd.vn/Products/Images/54/278564/tai-nghe-chup-tai-bluetooth-sony-wh-1000xm5-thumb-600x600.jpg",
      textColor: "text-900"
    },
    {
      id: 4,
      title: "MacBook Pro M3",
      subtitle: "Sức mạnh đột phá",
      desc: "Ưu đãi sinh viên giảm thêm 3 triệu",
      bg: "linear-gradient(135deg, #000000 0%, #2c3e50 100%)",
      img: "https://cdn.tgdd.vn/Products/Images/44/318229/macbook-pro-16-inch-m3-pro-18gb-512gb-sliver-thumb-600x600.jpg",
      textColor: "text-white"
    },
    {
      id: 5,
      title: "Galaxy Z Fold5",
      subtitle: "Gập mở linh hoạt",
      desc: "Tặng gói bảo hành Samsung Care+ 1 năm",
      bg: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
      img: "https://cdn.tgdd.vn/Products/Images/42/301644/samsung-galaxy-z-fold5-kem-600x600.jpg",
      textColor: "text-900"
    },
    {
      id: 6,
      title: "iPad Pro M2",
      subtitle: "Màn hình XDR",
      desc: "Giảm 15% khi mua kèm Apple Pencil",
      bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      img: "https://cdn.tgdd.vn/Products/Images/52/295756/ipad-pro-129-inch-m2-wifi-sliver-thumb-600x600.jpg",
      textColor: "text-900"
    }
  ];

  const itemTemplate = (item) => {
    return (
      <div 
        className="flex flex-column md:flex-row align-items-center justify-content-between border-round-2xl p-5 h-full relative overflow-hidden shadow-2 select-none"
        style={{ background: item.bg, minHeight: '320px' }}
      >
        {/* Nội dung chữ */}
        <div className={`flex-1 z-2 ${item.textColor} p-3`}>
          <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">HOT DEAL</div>
          <h2 className="text-4xl font-bold m-0 mb-2">{item.title}</h2>
          <h4 className="text-xl font-normal m-0 mb-4 opacity-90">{item.subtitle}</h4>
          <p className="text-lg mb-5 opacity-80">{item.desc}</p>
          
          <Button 
            label="Mua ngay" 
            icon="pi pi-shopping-cart" 
            className="border-round-3xl font-bold px-4 py-2 shadow-2 hover:scale-105 transition-all cursor-pointer"
            style={{ 
                backgroundColor: item.textColor === 'text-white' ? 'white' : '#1e40af', 
                color: item.textColor === 'text-white' ? '#1e40af' : 'white',
                border: 'none'
            }}
          />
        </div>

        {/* Hình ảnh 3D */}
        <div className="flex-1 flex justify-content-center align-items-center z-2">
            <img 
                src={item.img} 
                alt={item.title} 
                className="w-9 md:w-8 border-round-xl shadow-4 animation-float pointer-events-none" 
                style={{ objectFit: 'contain', transform: 'rotate(-5deg)', maxHeight: '250px' }} 
            />
        </div>
      </div>
    );
  };

  return (
    <div className="grid nested-grid">
        {/* SLIDER LỚN */}
        <div className="col-12 lg:col-8 relative">
            <Carousel 
                value={items} 
                numVisible={1} 
                numScroll={1} 
                itemTemplate={itemTemplate} 
                circular 
                autoPlay={true} 
                transitionInterval={3000} // 3 giây nhảy 1 lần
                showIndicators={true}
                showNavigators={true} // Bật mũi tên cho user bấm
                className="custom-carousel"
            />
        </div>

        {/* 2 BANNER NHỎ BÊN PHẢI */}
        <div className="col-12 lg:col-4 flex flex-column gap-3">
            <div className="flex-1 border-round-2xl p-4 flex align-items-center justify-content-between shadow-1 cursor-pointer hover:shadow-3 transition-all"
                style={{ background: "linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)" }}>
                <div>
                    <h4 className="m-0 text-800 font-bold mb-1">MacBook Air M2</h4>
                    <p className="m-0 text-600 text-sm">Giảm sâu 5tr</p>
                    <Button label="Xem ngay" link className="p-0 mt-2 font-bold" />
                </div>
                <img src="https://cdn.tgdd.vn/Products/Images/44/282827/apple-macbook-air-m2-2022-16gb-256gb-thumb-600x600.jpg" className="w-6rem ml-2" alt="Macbook" />
            </div>

            <div className="flex-1 border-round-2xl p-4 flex align-items-center justify-content-between shadow-1 cursor-pointer hover:shadow-3 transition-all"
                style={{ background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)" }}>
                <div>
                    <h4 className="m-0 text-800 font-bold mb-1">Samsung S24</h4>
                    <p className="m-0 text-600 text-sm">Thu cũ đổi mới</p>
                    <Button label="Chi tiết" link className="p-0 mt-2 font-bold text-orange-500" />
                </div>
                <img src="https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg" className="w-6rem ml-2" alt="Samsung S24" />
            </div>
        </div>

        <style>{`
            .animation-float { animation: float 6s ease-in-out infinite; }
            @keyframes float {
                0% { transform: translateY(0px) rotate(-5deg); }
                50% { transform: translateY(-10px) rotate(-5deg); }
                100% { transform: translateY(0px) rotate(-5deg); }
            }
            
            /* Style cho Nút mũi tên (Navigators) đẹp hơn */
            .custom-carousel .p-carousel-prev,
            .custom-carousel .p-carousel-next {
                position: absolute;
                top: 50%;
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.5);
                z-index: 10;
                transition: all 0.2s;
            }
            .custom-carousel .p-carousel-prev:hover,
            .custom-carousel .p-carousel-next:hover {
                background: rgba(255, 255, 255, 0.8);
                color: #0047ab;
            }
            .custom-carousel .p-carousel-prev { left: 10px; }
            .custom-carousel .p-carousel-next { right: 10px; }

            /* Style cho Chấm tròn (Indicators) */
            .custom-carousel .p-carousel-indicators {
                position: absolute;
                bottom: 15px;
                width: 100%;
                justify-content: center;
                z-index: 10;
            }
            .custom-carousel .p-carousel-indicator button {
                background-color: rgba(255,255,255,0.4);
                width: 8px;
                height: 8px;
                border-radius: 50%;
                transition: all 0.3s;
            }
            .custom-carousel .p-carousel-indicator.p-highlight button {
                background-color: white;
                width: 24px;
                border-radius: 10px;
            }
        `}</style>
    </div>
  );
};

export default PromoPanel;
