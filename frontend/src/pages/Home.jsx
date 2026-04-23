import React from "react";
import { useParams } from "react-router-dom";

const Home = ({ gender: propGender }) => {
    const { gender: paramGender } = useParams();
    const gender = propGender || paramGender || "woman";
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isScrolling, setIsScrolling] = React.useState(false);

  // DỮ LIỆU VIDEO CHO TỪNG GENDER
  const videoData = {
    woman: [
      { id: 1, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/26SS_Bratop/SP.mp4", title: "NATURAL LINEN" },
      { id: 2, url: "https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/Campaign/UV/UV_Emma-w-1-1-movie-sp-2.mp4", title: "ANIME COLLECTION" },
      { id: 3, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/Home/2024/May/24FW_Core_Outer_JP_long.mp4", title: "MASTERPIECE 2026" },
      { id: 4, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/TVCM_26SS/Linen_26SS/Linen_SP_long.mp4", title: "LIFEWEAR" }
    ],
    man: [
      { id: 5, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-outer.mp4", title: "MODERN CLASSIC" },
      { id: 6, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-ut.mp4", title: "GRAPHIC T-SHIRTS" },
      { id: 7, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-bottoms.mp4", title: "PERFECT FIT JEANS" },
      { id: 8, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-man-heattech.mp4", title: "ULTRA WARM HEATTECH" }
    ],
    kids: [
      { id: 9, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-kids.mp4", title: "KIDS ADVENTURES" },
      { id: 10, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-kids-ut.mp4", title: "PLAYFUL DESIGNS" },
      { id: 11, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-kids-outer.mp4", title: "COZY WINTER" },
      { id: 12, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-kids-basic.mp4", title: "EVERYDAY ESSENTIALS" }
    ],
    baby: [
      { id: 13, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-baby.mp4", title: "SOFT GENTLE TOUCH" },
      { id: 14, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-baby-basic.mp4", title: "BABY ESSENTIALS" },
      { id: 15, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-baby-inner.mp4", title: "BREATHABLE INNER" },
      { id: 16, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/home/24FW-baby-outer.mp4", title: "WARM & SAFE" }
    ]
  };

  const currentVideos = videoData[gender] || videoData["woman"];
  const totalSections = currentVideos.length + 1; // +1 for Footer

  const handleWheel = React.useCallback((e) => {
    if (isScrolling) return;

    if (e.deltaY > 0) {
      if (activeIndex < totalSections - 1) {
        setIsScrolling(true);
        setActiveIndex(prev => prev + 1);
        setTimeout(() => setIsScrolling(false), 1000);
      }
    } else if (e.deltaY < 0) {
      if (activeIndex > 0) {
        setIsScrolling(true);
        setActiveIndex(prev => prev - 1);
        setTimeout(() => setIsScrolling(false), 1000);
      }
    }
  }, [activeIndex, isScrolling, totalSections]);

  React.useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const scrollToSection = (index) => {
      if (isScrolling) return;
      setIsScrolling(true);
      setActiveIndex(index);
      setTimeout(() => setIsScrolling(false), 1000);
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden bg-black z-1">
      <Header />
      
      <div className="fixed right-0 top-50 translate-y-n50 flex flex-column gap-3 p-4 z-5">
          {Array.from({ length: totalSections }).map((_, i) => (
              <div 
                key={i}
                className={`cursor-pointer border-circle transition-all shadow-4 ${activeIndex === i ? 'bg-white w-3 h-3' : 'bg-white-alpha-40 w-2 h-2'}`}
                style={{ border: activeIndex === i ? 'none' : '1px solid rgba(255,255,255,0.6)' }}
                onClick={() => scrollToSection(i)}
              />
          ))}
      </div>

      <div 
        className="w-full h-full"
        style={{ 
            transition: 'transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)',
            transform: `translateY(-${activeIndex * 100}%)` 
        }}
      >
        {currentVideos.map((v) => (
          <section 
            key={v.id} 
            className="relative w-screen h-screen overflow-hidden flex-shrink-0"
            style={{ width: '100vw', height: '100vh' }}
          >
            <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute top-0 left-0 w-full h-full block"
                key={v.url} // Force reload video when URL changes
                style={{ 
                    width: '100vw',
                    height: '100vh',
                    objectFit: 'cover',
                    objectPosition: 'center center'
                }}
            >
                <source src={v.url} type="video/mp4" />
            </video>
            
            <div className="absolute inset-0 flex flex-column justify-content-center align-items-center bg-transparent text-center" style={{ height: '100vh' }}>
              <div className="container-xl w-full pt-8 scalein animation-duration-1000">
                <span className="text-white text-sm uppercase tracking-widest mb-1 block" style={{ opacity: 0.8, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>Uniqlo LifeWear</span>
                <h2 className="text-white text-4xl lg:text-6xl font-normal m-0 tracking-tighter line-height-1" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                  {v.title}
                </h2>
              </div>
            </div>
          </section>
        ))}
        
      </div>
    </div>
  );
};

export default Home;
