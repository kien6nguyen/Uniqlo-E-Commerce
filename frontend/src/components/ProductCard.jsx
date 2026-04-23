import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { fetchCart, addOrUpdateCartItem, updateCartItemQuantity, removeCartItem } from "../utils/cartUtils";

function ProductCard({
  id,
  brand = "Brand",
  name,
  price,
  oldPrice,
  img,
  rating = 4.5,
  variants = [],
  colors = [],
}) {
  const navigate = useNavigate();
  const [inCart, setInCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(0);

  const getDefaultVariant = () => variants.length > 0 ? (variants[0]._id || variants[0].name || variants[0]) : null;
  const getDefaultColor = () => colors.length > 0 ? colors[0] : null;

  useEffect(() => {
    const checkState = async () => {
      try {
        const cartItems = await fetchCart();

        const variant = getDefaultVariant();
        const color = getDefaultColor();
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        const item = cartItems.find(i => {
          const itemProduct = i.product._id || i.product;
          return String(itemProduct) === String(id) &&
            String(i.variant || "") === String(variant || "") &&
            String(i.color || "") === String(color || "");
        });

        setInCart(!!item);
        setQuantity(item ? item.quantity : 0);

        if (token && userStr) {
          const user = JSON.parse(userStr);
          if (user.wishlist) {
            const isLiked = user.wishlist.some(p => (p._id || p) === id);
            setInWishlist(isLiked);
          }
        } else {
          const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
          setInWishlist(wishlist.some((p) => p.id === id));
        }
      } catch (err) {
        console.error("Error checking cart state:", err);
      }
    };

    checkState();

    window.addEventListener("wishlistUpdated", checkState);
    window.addEventListener("cartUpdated", checkState);

    return () => {
      window.removeEventListener("wishlistUpdated", checkState);
      window.removeEventListener("cartUpdated", checkState);
    };
  }, [id, variants, colors]);

  const toggleWishlist = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/user/me/wishlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ productId: id })
        });
        const data = await res.json();
        if (data.success) {
          const currentUser = JSON.parse(localStorage.getItem("user")) || {};
          currentUser.wishlist = data.wishlist;
          localStorage.setItem("user", JSON.stringify(currentUser));
          setInWishlist(!inWishlist);
          window.dispatchEvent(new Event("wishlistUpdated"));
        }
      } catch (err) {
        console.error("Lỗi cập nhật wishlist:", err);
      }
    } else {
      let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      if (inWishlist) {
        wishlist = wishlist.filter((p) => p.id !== id);
        setInWishlist(false);
      } else {
        wishlist.push({ id, brand, name, price, oldPrice, img });
        setInWishlist(true);
      }
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      window.dispatchEvent(new Event("wishlistUpdated"));
    }
  };

  const addToCart = async (e) => {
    e?.stopPropagation();

    try {
      const variant = getDefaultVariant();
      const color = getDefaultColor();

      await addOrUpdateCartItem({
        productId: id,
        quantity: 1,
        variant,
        color
      });

      setInCart(true);
      setQuantity(prev => prev + 1);
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert(err.message || "Có lỗi khi thêm vào giỏ hàng!");
    }
  };

  const increaseQty = async (e) => {
    e?.stopPropagation();

    try {
      const variant = getDefaultVariant();
      const color = getDefaultColor();

      await updateCartItemQuantity({
        productId: id,
        quantity: quantity + 1,
        variant,
        color
      });

      setQuantity(prev => prev + 1);
    } catch (err) {
      console.error("Error increasing quantity:", err);
      alert(err.message || "Không thể tăng số lượng!");
    }
  };

  const decreaseQty = async (e) => {
    e?.stopPropagation();

    try {
      const variant = getDefaultVariant();
      const color = getDefaultColor();

      if (quantity > 1) {
        await updateCartItemQuantity({
          productId: id,
          quantity: quantity - 1,
          variant,
          color
        });
        setQuantity(prev => prev - 1);
      } else {
        await removeCartItem(id, variant, color);
        setQuantity(0);
        setInCart(false);
      }
    } catch (err) {
      console.error("Error decreasing quantity:", err);
      alert(err.message || "Không thể giảm số lượng!");
    }
  };

  return (
    <div
      className="flex flex-column h-full cursor-pointer w-full bg-white transition-all duration-200"
      style={{
        border: "1px solid #f0f0f0",
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/api/products/${id}`)}
    >
      <div className="relative w-full aspect-square bg-gray-50 flex justify-content-center align-items-center p-3">
        <img
          src={img}
          alt={name}
          className="max-h-full max-w-full object-contain mix-blend-multiply"
        />
        
        {/* Wishlist Button - Top Right */}
        <i
          className={`pi ${inWishlist ? "pi-heart-fill" : "pi-heart"} absolute top-0 right-0 p-3 text-lg cursor-pointer transition-colors`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist();
          }}
          style={{ color: inWishlist ? "#ff0000" : "#000" }}
        ></i>

        {/* Quick Add Overlay on Hover */}
        {isHovered && !inCart && (
            <div className="absolute bottom-0 left-0 w-full p-2 bg-white-alpha-80 slide-in-bottom">
                <button 
                  className="w-full bg-black text-white text-xs py-2 uppercase font-bold border-none cursor-pointer"
                  onClick={addToCart}
                >
                    Add to Cart
                </button>
            </div>
        )}
      </div>

      <div className="flex flex-column p-2 flex-grow-1">
        <span className="text-xs text-500 uppercase font-bold mb-1">
          {brand}
        </span>
        <span className="font-bold text-sm uppercase text-900 mb-2 line-height-2 h-2rem overflow-hidden">
          {name}
        </span>

        <div className="mt-auto">
            <div className="flex align-items-center gap-2">
                <span className="font-bold text-red-600 text-base">
                    {Number(price).toLocaleString("vi-VN")}₫
                </span>
                {oldPrice && (
                    <span className="line-through text-400 text-xs">
                        {Number(oldPrice).toLocaleString("vi-VN")}₫
                    </span>
                )}
            </div>
            
            <div className="flex align-items-center mt-2">
                <i className="pi pi-star-fill text-yellow-500 text-xs mr-1"></i>
                <span className="text-xs font-bold">{rating}</span>
            </div>
        </div>
      </div>

      {inCart && (
        <div
          className="flex justify-content-between align-items-center border-top-1 border-100 p-2 bg-gray-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="p-1 border-none bg-transparent cursor-pointer" onClick={decreaseQty}>
            <i className="pi pi-minus text-xs"></i>
          </button>
          <span className="font-bold text-sm">{quantity}</span>
          <button className="p-1 border-none bg-transparent cursor-pointer" onClick={increaseQty}>
            <i className="pi pi-plus text-xs"></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductCard;
