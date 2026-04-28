import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Footer from "../components/Footer";

const GENDERS = ["woman", "man", "kid", "baby"];

const VIDEO_DATA = {
  woman: [
    { id: 1, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/26SS_Kids_Baby/Kids/AIRism_Function_SP.mp4", title: "AIRism Function" },
    { id: 2, url: "https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/Campaign/UV/UV_Emma-w-1-1-movie-sp-2.mp4", title: "UV Protection" },
    { id: 3, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/26SS_Bratop/SP.mp4", title: "BRATOP" },
    { id: 4, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/TVCM_26SS/Linen_26SS/Linen_SP_long.mp4", title: "Linen Collection" }
  ],
  man: [
    { id: 5, url: "https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/Masterpiece/23_DRY-EX_T-Shirt_01_wmk_SP_1-1_movie.mp4", title: "MODERN CLASSIC" },
    { id: 6, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/TVCM_26SS/Linen_26SS/Linen_SP3mb.mp4", title: "GRAPHIC T-SHIRTS" },
    { id: 7, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/26SS_UV/DRY-EX_SP.mp4", title: "PERFECT FIT JEANS" },
    { id: 8, url: "https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/UT/manga-ut/manga-ut-m-1-1-movie-gl-sp-02.mp4", title: "ULTRA WARM HEATTECH" }
  ],
  kid: [
    { id: 9, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/26SS_Kids_Baby/Kids/AIRism_Kids_SP.mp4", title: "KIDS ADVENTURES" },
    { id: 10, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/26SS_Kids_Baby/Kids/AIRism_inner_SP.mp4", title: "PLAYFUL DESIGNS" },
    { id: 11, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/26SS_Kids_Baby/Kids/SP.mp4", title: "COZY WINTER" },
    { id: 12, url: "https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/KIDS_BABY/Core/Summer-movie02_k_SP_1-1.mp4", title: "EVERYDAY ESSENTIALS" }
  ],
  baby: [
    { id: 13, url: "https://image.uniqlo.com/UQ/ST3/th/imagesother/00_WEB_L1L2/L1-Movie/26ss/Baby/L1-SP-B-BT-Collection.mp4", title: "SOFT GENTLE TOUCH" },
    { id: 14, url: "https://image.uniqlo.com/UQ/ST3/vn/imagesother/26SS_Kids_Baby/Baby/T-shirts_BABY_SP.mp4", title: "BABY ESSENTIALS" },
    { id: 15, url: "https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/KIDS_BABY/Core/Summer_b_toddler_SP_1-1_movie.mp4", title: "BREATHABLE INNER" },
    { id: 16, url: "https://image.uniqlo.com/UQ/ST3/th/imagesother/00_WEB_L1L2/L1-Movie/26ss/Baby/L1-SP-B-BT-taank-top.mp4", title: "WARM & SAFE" }
  ]
};

const MainLanding = () => {
  const navigate = useNavigate();
  const { gender: paramGender } = useParams();
  const location = useLocation();

  // Determine initial gender index
  const initialGender = useMemo(() => {
    const path = location.pathname.replace("/", "");
    if (GENDERS.includes(path)) return path;
    return "woman";
  }, [location.pathname]);

  const [genderIndex, setGenderIndex] = useState(GENDERS.indexOf(initialGender));
  const [verticalIndices, setVerticalIndices] = useState([0, 0, 0, 0]); // activeIndex for each gender

  const [isScrolling, setIsScrolling] = useState(false);

  // Sync index with URL if URL changes externally
  useEffect(() => {
    const idx = GENDERS.indexOf(initialGender);
    if (idx !== -1 && idx !== genderIndex) {
      setGenderIndex(idx);
    }
  }, [initialGender]);

  const activeVIndex = verticalIndices[genderIndex];
  const currentVideos = VIDEO_DATA[GENDERS[genderIndex]];
  const totalSections = currentVideos.length + 1;

  const handleWheel = useCallback((e) => {
    if (isScrolling) return;

    if (e.deltaY > 0) {
      if (activeVIndex < totalSections - 1) {
        setIsScrolling(true);
        setVerticalIndices(prev => {
          const next = [...prev];
          next[genderIndex] = activeVIndex + 1;
          return next;
        });
        setTimeout(() => setIsScrolling(false), 1300);
      }
    } else if (e.deltaY < 0) {
      if (activeVIndex > 0) {
        setIsScrolling(true);
        setVerticalIndices(prev => {
          const next = [...prev];
          next[genderIndex] = activeVIndex - 1;
          return next;
        });
        setTimeout(() => setIsScrolling(false), 1300);
      }
    }
  }, [genderIndex, activeVIndex, totalSections, isScrolling]);

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Sync header state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('homeSectionChanged', {
      detail: { index: activeVIndex, total: totalSections }
    }));
  }, [activeVIndex, totalSections]);

  return (
    <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden bg-black select-none z-1">
      {/* VERTICAL DOTS */}
      <div className="fixed flex flex-column align-items-center gap-3" style={{ right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 60 }}>
        <i
          className={`pi pi-chevron-up text-white text-xl cursor-pointer transition-all hover:scale-125 ${activeVIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-60'}`}
          onClick={() => {
            setVerticalIndices(prev => {
              const next = [...prev];
              next[genderIndex] = Math.max(0, activeVIndex - 1);
              return next;
            });
          }}
        />
        {Array.from({ length: totalSections }).map((_, i) => (
          <div
            key={i}
            className={`cursor-pointer border-circle transition-all shadow-4 ${activeVIndex === i ? 'bg-white w-3 h-3' : 'bg-white-alpha-40 w-2 h-2'}`}
            style={{ border: activeVIndex === i ? 'none' : '1px solid rgba(255,255,255,0.6)' }}
            onClick={() => {
              setVerticalIndices(prev => {
                const next = [...prev];
                next[genderIndex] = i;
                return next;
              });
            }}
          />
        ))}
        <i
          className={`pi pi-chevron-down text-white text-xl cursor-pointer transition-all hover:scale-125 ${activeVIndex === totalSections - 1 ? 'opacity-0 pointer-events-none' : 'opacity-60'}`}
          onClick={() => {
            setVerticalIndices(prev => {
              const next = [...prev];
              next[genderIndex] = Math.min(totalSections - 1, activeVIndex + 1);
              return next;
            });
          }}
        />
      </div>


      {/* MAIN CONTAINER (Horizontal Slider) */}
      <div
        className="flex h-full"
        style={{
          width: '400%',
          transform: `translateX(-${genderIndex * 25}%)`,
          transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {GENDERS.map((gender, gIdx) => (
          <div key={gender} className="h-full relative" style={{ width: '25%' }}>
            {/* VERTICAL SLIDER per gender */}
            <div
              className="w-full h-full"
              style={{
                transform: `translateY(-${verticalIndices[gIdx] * 100}%)`,
                transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {VIDEO_DATA[gender].map((v, vIdx) => (
                <section key={v.id} className="w-full relative overflow-hidden flex-shrink-0" style={{ width: '100vw', height: '100vh' }}>
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full block"
                    key={v.url}
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
                      <span className="text-white text-sm uppercase tracking-widest mb-1 block" style={{ opacity: 0.8, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>Uniqlo LifeWear {gender}</span>
                      <h2 className="text-white text-4xl lg:text-6xl font-normal m-0 tracking-tighter line-height-1" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                        {v.title}
                      </h2>
                    </div>
                  </div>

                  {/* Scroll Down Arrow */}
                  <div className="scroll-down-arrow" onClick={() => {
                    setVerticalIndices(prev => {
                      const next = [...prev];
                      next[gIdx] = vIdx + 1;
                      return next;
                    });
                  }}>
                    <i className="pi pi-chevron-down"></i>
                  </div>
                </section>
              ))}
              {/* Footer section */}
              <section
                className="relative w-screen h-screen bg-white flex flex-column"
                style={{ width: '100vw', height: '100vh' }}
              >
                <div className="flex-grow-1 overflow-y-auto" style={{ paddingTop: '90px' }}>
                  <Footer />
                </div>
              </section>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default MainLanding;
