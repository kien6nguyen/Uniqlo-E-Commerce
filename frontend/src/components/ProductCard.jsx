import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCart, addOrUpdateCartItem } from "../utils/cartUtils";

function ProductCard({
  id,
  brand = "UNIQLO",
  name,
  price,
  oldPrice,
  img,
  rating = 4.5,
  tags = [], // used for colors in our seed
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    const checkWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      setInWishlist(wishlist.some((p) => p.id === id));
    };
    checkWishlist();
    window.addEventListener("wishlistUpdated", checkWishlist);
    return () => window.removeEventListener("wishlistUpdated", checkWishlist);
  }, [id]);

  const toggleWishlist = (e) => {
    e.stopPropagation();
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    if (inWishlist) {
      wishlist = wishlist.filter((p) => p.id !== id);
    } else {
      wishlist.push({ id, name, price, img });
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    setInWishlist(!inWishlist);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const getImageUrl = (url) => {
    if (!url) return "/img/default.png";
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_API_URL || ""}/${url.replace(/\\/g, "/")}`;
  };

  return (
    <div
      className="flex flex-column cursor-pointer group mb-4"
      style={{ background: "#fff", transition: "all 0.3s ease" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/product/${id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f4f4] mb-3">
        <img
          src={getImageUrl(img)}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out"
          style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/600x800?text=Uniqlo+Product";
          }}
        />
        
        {/* Wishlist Button */}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white-alpha-80 flex align-items-center justify-content-center border-none cursor-pointer transition-all hover:bg-white z-10"
          onClick={toggleWishlist}
        >
          <i className={`pi ${inWishlist ? "pi-heart-fill text-red-500" : "pi-heart text-gray-700"} text-sm`}></i>
        </button>

        {/* Status Badges */}
        <div className="absolute bottom-2 left-2 flex flex-column gap-1">
          {oldPrice && (
            <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-tighter">
              Giảm giá
            </div>
          )}
          {tags.includes("Mới") && (
            <div className="bg-black text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-tighter">
              Mới về
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-column gap-1 px-1">
        {/* Colors (Tags as colors) */}
        <div className="flex gap-1 mb-1 h-3">
          {tags.filter(t => t !== "Mới" && t !== "LifeWear").slice(0, 5).map((color, i) => (
            <div 
              key={i} 
              className="w-3 h-3 rounded-full border-1 border-gray-200" 
              style={{ backgroundColor: color.toLowerCase() }}
            />
          ))}
        </div>


        <h3 className="m-0 text-sm font-medium text-[#111] line-clamp-2 leading-tight h-10 overflow-hidden">
          {name}
        </h3>

        <div className="mt-2 flex align-items-baseline gap-2">
          <span className="text-base font-bold text-red-600">
            {Number(price).toLocaleString("vi-VN")}₫
          </span>
          {oldPrice && (
            <span className="text-xs text-gray-300 line-through">
              {Number(oldPrice).toLocaleString("vi-VN")}₫
            </span>
          )}
        </div>

        {/* Rating & CTA (Subtle) */}
        <div className="mt-2 flex justify-content-between align-items-center">
          <div className="flex align-items-center gap-1">
            <i className="pi pi-star-fill text-yellow-400 text-[10px]"></i>
            <span className="text-[10px] font-bold text-gray-400">{rating} (20+)</span>
          </div>
          <i className={`pi pi-shopping-bag text-gray-300 transition-colors ${isHovered ? 'text-black' : ''} text-sm`}></i>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

