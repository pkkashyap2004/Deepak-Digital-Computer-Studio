export const API = "/api";

export const money = value => "₹" + Number(value || 0).toLocaleString("en-IN");

export function readCart() {
  try {
    const value = JSON.parse(window.localStorage.getItem("cart") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  try {
    window.localStorage.setItem("cart", JSON.stringify(cart));
  } catch (error) {
    console.warn("DDCS cart could not be saved locally:", error);
  }
}
