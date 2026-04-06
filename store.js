const STORE_KEY = "aunty_perfume_cart";

const Store = {
  getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
    } catch (_error) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(STORE_KEY, JSON.stringify(cart));
    this.updateCartCount();
  },

  addToCart(product, quantity = 1) {
    const cart = this.getCart();
    const existingItem = cart.find((item) => item.productId === product._id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity
      });
    }

    this.saveCart(cart);
  },

  updateQuantity(productId, quantity) {
    const cart = this.getCart()
      .map((item) => (item.productId === productId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    this.saveCart(cart);
  },

  removeFromCart(productId) {
    const cart = this.getCart().filter((item) => item.productId !== productId);
    this.saveCart(cart);
  },

  getTotal() {
    return this.getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  clearCart() {
    localStorage.removeItem(STORE_KEY);
    this.updateCartCount();
  },

  updateCartCount() {
    const count = this.getCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = count;
    });
  }
};

window.Store = Store;
document.addEventListener("DOMContentLoaded", () => Store.updateCartCount());
