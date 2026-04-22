import React from "react";

const HeroBanner = () => {
  return (
    <div 
        className="relative overflow-hidden" 
        style={{ 
            width: '100%', 
            height: 'calc(100vh + 100px)', 
            marginTop: '-100px',
            background: '#000'
        }}
    >
      {/* Background Video - Compensating for margin to fill bottom */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="block"
        style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            transform: 'scale(1.1)', // Tăng zoom để lấp đầy tốt hơn
            filter: 'brightness(0.9)'
        }}
      >
        <source src="https://image.uniqlo.com/UQ/ST3/vn/imagesother/TVCM_26SS/Linen_26SS/Linen_SP_long.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Subdued overlay just for the very top to ensure header icons are visible if needed */}
      <div className="absolute top-0 left-0 w-full h-8rem bg-color-gradient"></div>
    </div>
  );
};

export default HeroBanner;
