const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/carts`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("sessionId", sessionId);
  }

  const headers = {
    "Content-Type": "application/json",
    "x-session-id": sessionId
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export function makeCartKey(id, variantId, color) {
  const v = variantId || "default";
  const c = color || "default";
  return `${id}-${v}-${c}`;
}

export async function fetchCart() {
  try {
    const res = await fetch(`${API_BASE}/summary`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch cart");
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("Error fetching cart:", err);
    return [];
  }
}

function emitCartUpdated(detail = null, skipReload = false) {
  try {
    const ev = new CustomEvent("cartUpdated", {
      detail: {
        ...detail,
        skipReload
      }
    });
    window.dispatchEvent(ev);
  } catch (err) {
    console.error("Error emitting cartUpdated event:", err);
    window.dispatchEvent(new Event("cartUpdated"));
  }
}

export async function addOrUpdateCartItem({ productId, quantity = 1, variantId = null, color = null }) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: 'include',
      // Gửi variantId trong body
      body: JSON.stringify({ productId, quantity, variantId, color })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to add/update cart item");
    }
    const data = await res.json();

    emitCartUpdated(data, false);

    return data;
  } catch (err) {
    console.error("Error adding to cart:", err);
    throw err;
  }
}

export async function updateCartItemQuantity({ productId, quantity, variantId = null, color = null }) {
  try {
    const res = await fetch(API_BASE, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: 'include',
      // Gửi variantId trong body
      body: JSON.stringify({ productId, quantity, variantId, color })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update cart item");
    }
    const data = await res.json();

    emitCartUpdated(data, false);

    return data;
  } catch (err) {
    console.error("Error updating cart:", err);
    throw err;
  }
}

export async function removeCartItem(productId, variantId = null, color = null) {
  try {
    const params = new URLSearchParams();

    if (variantId) params.append('variantId', variantId);
    if (color) params.append('color', color);

    const url = `${API_BASE}/${productId}${params.toString() ? '?' + params.toString() : ''}`;

    const res = await fetch(url, {
      method: "DELETE",
      credentials: 'include',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error("Failed to remove cart item");
    const data = await res.json();

    emitCartUpdated(data, false);

    return data;
  } catch (err) {
    console.error("Error removing from cart:", err);
    throw err;
  }
}

export async function clearCart() {
  try {
    const res = await fetch(API_BASE, {
      method: "DELETE",
      credentials: 'include',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error("Failed to clear cart");
    const data = await res.json();

    emitCartUpdated(data, false);

    return data;
  } catch (err) {
    console.error("Error clearing cart:", err);
    throw err;
  }
}

export async function getCartItemQuantity(productId, variantId = null, color = null) {
  try {
    const items = await fetchCart();
    const item = items.find(i =>
      String(i.product._id || i.product) === String(productId) &&
      String(i.variantId || "") === String(variantId || "") && // So sánh variantId
      String(i.color || "") === String(color || "")
    );
    return item ? item.quantity : 0;
  } catch (err) {
    console.error("Error getting cart item quantity:", err);
    return 0;
  }
}

export async function applyDiscountCode(code) {
  try {
    const res = await fetch(`${API_BASE}/apply-discount`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to apply discount code");
    }

    emitCartUpdated(data, true);

    return data;
  } catch (err) {
    console.error("Error applying discount:", err);
    throw err;
  }
}

export async function removeDiscountCode() {
  try {
    const res = await fetch(`${API_BASE}/remove-discount`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to remove discount code");
    }

    emitCartUpdated(data, true);

    return data;
  } catch (err) {
    console.error("Error removing discount:", err);
    throw err;
  }
}
