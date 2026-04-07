function currency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN"
  }).format(amount);
}

let appliedPromo = null;
const CHECKOUT_DRAFT_KEY = "kettyscent_checkout_draft";
let paymentRules = {
  freeDeliveryThreshold: 50000,
  deliveryFee: 2500
};

function stars(rating) {
  const full = Math.max(0, Math.min(5, Number(rating) || 0));
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function calculateCheckoutTotals(subtotal, discountAmount = 0) {
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee = discountedSubtotal >= paymentRules.freeDeliveryThreshold ? 0 : paymentRules.deliveryFee;
  const finalTotal = discountedSubtotal + shippingFee;
  return { discountedSubtotal, shippingFee, finalTotal };
}

function productCard(product) {
  const outOfStock = Number(product.stock || 0) <= 0;
  return `
    <article class="product-card glass-panel gold-border overflow-hidden rounded-[1.5rem] page-fade">
      <div class="relative aspect-[4/5] overflow-hidden bg-black/25 sm:aspect-[3/4] md:h-72 md:aspect-auto">
        <img src="${product.imageUrl}" alt="${product.name}" class="h-full w-full object-contain p-2 transition duration-500 hover:scale-105 md:object-cover md:p-0" />
        <span class="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gold">${product.category}</span>
      </div>
      <div class="space-y-3 p-3 sm:p-4 md:space-y-4 md:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-sm font-semibold text-white sm:text-base md:text-xl">${product.name}</h3>
            <p class="mt-1 line-clamp-2 hidden text-xs text-white/70 sm:block md:mt-2 md:text-sm">${product.description}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.15em] sm:mt-2 sm:text-xs sm:tracking-[0.2em] ${outOfStock ? "text-red-300" : "text-emerald-300"}">${outOfStock ? "Out of stock" : `In stock: ${product.stock}`}</p>
          </div>
          <span class="whitespace-nowrap text-xs font-semibold text-gold sm:text-sm md:text-lg">${currency(product.price)}</span>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <a href="/product.html?id=${product._id}" class="flex-1 rounded-full border border-white/15 px-3 py-2 text-center text-[11px] font-medium text-white transition hover:border-[var(--luxury-gold)] hover:text-gold sm:px-4 sm:py-3 sm:text-sm">View Details</a>
          <button data-add-to-cart="${product._id}" ${outOfStock ? "disabled" : ""} class="flex-1 rounded-full px-3 py-2 text-[11px] font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${outOfStock ? "cursor-not-allowed bg-white/20 text-white/60" : "bg-gold text-black hover:brightness-110"}">Add to Cart</button>
        </div>
      </div>
    </article>
  `;
}

function emptyState(message) {
  return `
    <div class="glass-panel gold-border col-span-full rounded-[1.5rem] p-10 text-center text-white/75">
      ${message}
    </div>
  `;
}

function bindAddToCart(products) {
  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = products.find((entry) => entry._id === button.dataset.addToCart);
      if (!product) {
        return;
      }
      if (Number(product.stock || 0) <= 0) {
        showToast("This perfume is out of stock.");
        return;
      }

      Store.addToCart(product, 1);
      showToast(`${product.name} added to cart.`);
    });
  });
}

async function loadHomePage() {
  const featuredContainer = document.getElementById("featured-products");
  const catalogContainer = document.getElementById("catalog-products");
  const categoryButtons = document.querySelectorAll("[data-category-filter]");

  if (!featuredContainer || !catalogContainer) {
    return;
  }

  const [featuredProducts, allProducts] = await Promise.all([
    API.request("/products?featured=true"),
    API.request("/products")
  ]);

  featuredContainer.innerHTML = featuredProducts.map(productCard).join("");
  catalogContainer.innerHTML = allProducts.map(productCard).join("");

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      categoryButtons.forEach((node) => {
        node.classList.remove("bg-gold", "text-black");
        if (node !== button) {
          node.classList.add("text-white");
        }
      });
      button.classList.add("bg-gold", "text-black");
      button.classList.remove("text-white");

      const category = button.dataset.categoryFilter;
      const products = category === "All"
        ? allProducts
        : allProducts.filter((product) => product.category === category);

      catalogContainer.innerHTML = products.map(productCard).join("") || emptyState("No perfumes match this category yet.");
      bindAddToCart(allProducts);
    });
  });

  bindAddToCart(allProducts);
}

async function loadProductPage() {
  const shell = document.getElementById("product-detail");
  if (!shell) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  if (!productId) {
    shell.innerHTML = emptyState("Product not found.");
    return;
  }

  try {
    const product = await API.request(`/products/${productId}`);
    shell.innerHTML = `
      <div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="overflow-hidden rounded-[2rem] gold-border bg-black/25 shadow-gold">
          <img src="${product.imageUrl}" alt="${product.name}" class="h-full max-h-[26rem] w-full object-contain p-4 md:max-h-none md:object-cover md:p-0" />
        </div>
        <div class="space-y-6">
          <span class="inline-flex rounded-full border border-[var(--luxury-gold)] px-4 py-2 text-xs uppercase tracking-[0.35em] text-gold">${product.category}</span>
          <div>
            <h1 class="text-4xl font-semibold text-white md:text-5xl">${product.name}</h1>
            <p class="mt-4 text-lg leading-8 text-white/78">${product.description}</p>
            <p class="mt-3 text-sm uppercase tracking-[0.2em] ${Number(product.stock || 0) > 0 ? "text-emerald-300" : "text-red-300"}">
              ${Number(product.stock || 0) > 0 ? `In stock: ${product.stock}` : "Out of stock"}
            </p>
          </div>
          <div class="text-3xl font-semibold text-gold">${currency(product.price)}</div>
          <div class="flex flex-col gap-4 sm:flex-row">
            <div class="flex items-center rounded-full border border-white/12 bg-white/5">
              <button id="qty-minus" class="px-5 py-4 text-xl text-white/75">-</button>
              <input id="qty-input" type="number" min="1" value="1" class="w-16 bg-transparent text-center text-white focus:outline-none" />
              <button id="qty-plus" class="px-5 py-4 text-xl text-white/75">+</button>
            </div>
            <button id="product-add-to-cart" ${Number(product.stock || 0) <= 0 ? "disabled" : ""} class="rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-[0.3em] transition ${Number(product.stock || 0) <= 0 ? "cursor-not-allowed bg-white/20 text-white/60" : "bg-gold text-black hover:brightness-110"}">Add to Cart</button>
            <a href="/checkout.html" class="rounded-full border border-white/15 px-8 py-4 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-[var(--luxury-gold)] hover:text-gold">Checkout</a>
          </div>
        </div>
      </div>
      <section class="mt-10 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <div class="mb-6">
          <p class="text-sm uppercase tracking-[0.25em] text-gold">Customer Reviews</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">What shoppers are saying</h2>
        </div>
        <div id="review-list" class="space-y-4"></div>
        <form id="review-form" class="mt-8 grid gap-4 md:grid-cols-2">
          <input name="customerName" class="form-input" type="text" placeholder="Your name" required />
          <select name="rating" class="form-select" required>
            <option value="">Select rating</option>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Very good</option>
            <option value="3">3 - Good</option>
            <option value="2">2 - Fair</option>
            <option value="1">1 - Poor</option>
          </select>
          <textarea name="comment" class="form-textarea md:col-span-2" placeholder="Share your experience with this perfume..." required></textarea>
          <button class="rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:brightness-110 md:col-span-2" type="submit">Submit Review</button>
        </form>
      </section>
    `;

    const qtyInput = document.getElementById("qty-input");
    document.getElementById("qty-minus").addEventListener("click", () => {
      qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
    document.getElementById("qty-plus").addEventListener("click", () => {
      qtyInput.value = Math.max(1, Number(qtyInput.value) + 1);
    });
    document.getElementById("product-add-to-cart").addEventListener("click", () => {
      if (Number(product.stock || 0) <= 0) {
        showToast("This perfume is out of stock.");
        return;
      }
      Store.addToCart(product, Math.max(1, Number(qtyInput.value) || 1));
      showToast(`${product.name} added to cart.`);
    });

    const loadReviews = async () => {
      const reviewList = document.getElementById("review-list");
      const reviews = await API.request(`/products/${product._id}/reviews`);
      if (!reviews.length) {
        reviewList.innerHTML = '<p class="text-sm text-white/65">No reviews yet. Be the first to review this scent.</p>';
        return;
      }

      reviewList.innerHTML = reviews.map((review) => `
        <article class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div class="flex items-center justify-between gap-4">
            <h3 class="font-semibold text-white">${review.customerName}</h3>
            <span class="text-gold">${stars(review.rating)}</span>
          </div>
          <p class="mt-2 text-white/75">${review.comment}</p>
        </article>
      `).join("");
    };

    await loadReviews();

    document.getElementById("review-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await API.request(`/products/${product._id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          customerName: formData.get("customerName"),
          rating: Number(formData.get("rating")),
          comment: formData.get("comment")
        })
      });
      event.currentTarget.reset();
      await loadReviews();
      showToast("Thanks for your review.");
    });
  } catch (error) {
    shell.innerHTML = emptyState(error.message);
  }
}

function renderCartItems() {
  const cartContainer = document.getElementById("cart-items");
  const totalNode = document.getElementById("cart-total");
  const summaryNode = document.getElementById("order-summary-count");

  if (!cartContainer || !totalNode || !summaryNode) {
    return;
  }

  const cart = Store.getCart();
  summaryNode.textContent = `${cart.reduce((sum, item) => sum + item.quantity, 0)} item(s)`;
  totalNode.textContent = currency(Store.getTotal());
  document.dispatchEvent(new CustomEvent("cart:updated"));

  if (!cart.length) {
    cartContainer.innerHTML = emptyState("Your cart is empty. Add a perfume to continue.");
    return;
  }

  cartContainer.innerHTML = cart.map((item) => `
    <div class="flex flex-col gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center">
      <img src="${item.imageUrl}" alt="${item.name}" class="h-24 w-full rounded-2xl bg-black/20 object-contain p-2 sm:w-24 sm:object-cover sm:p-0" />
      <div class="flex-1">
        <h3 class="text-lg font-medium text-white">${item.name}</h3>
        <p class="mt-1 text-sm text-gold">${currency(item.price)}</p>
      </div>
      <div class="flex items-center gap-3">
        <input data-qty-input="${item.productId}" type="number" min="1" value="${item.quantity}" class="form-input w-24" />
        <button data-remove-item="${item.productId}" class="rounded-full border border-red-400/40 px-4 py-3 text-sm text-red-200 transition hover:bg-red-500/10">Remove</button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll("[data-qty-input]").forEach((input) => {
    input.addEventListener("change", () => {
      Store.updateQuantity(input.dataset.qtyInput, Math.max(1, Number(input.value) || 1));
      renderCartItems();
    });
  });

  document.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      Store.removeFromCart(button.dataset.removeItem);
      renderCartItems();
    });
  });
}

async function loadCheckoutPage() {
  if (!document.getElementById("checkout-form")) {
    return;
  }

  let deliveryZones = [];
  try {
    const settings = await API.request("/payments/settings");
    paymentRules = {
      freeDeliveryThreshold: Number(settings.freeDeliveryThreshold || 50000),
      deliveryFee: Number(settings.deliveryFee || 2500)
    };
    deliveryZones = Array.isArray(settings.deliveryZones) ? settings.deliveryZones : [];
  } catch (_error) {
    // Fallback to defaults if settings API fails.
  }

  appliedPromo = null;
  renderCartItems();

  const promoCodeInput = document.getElementById("promo-code-input");
  const promoFeedback = document.getElementById("promo-feedback");
  const promoSummary = document.getElementById("promo-summary");
  const promoDiscountAmount = document.getElementById("promo-discount-amount");
  const applyPromoBtn = document.getElementById("apply-promo-btn");
  const totalNode = document.getElementById("cart-total");
  const deliveryNode = document.getElementById("delivery-fee-amount");
  const deliveryRuleNote = document.getElementById("delivery-rule-note");
  const deliveryZoneSelect = document.getElementById("deliveryZone");
  const zoneFeeMap = new Map(deliveryZones.map((zone) => [String(zone.name || "").toLowerCase(), Number(zone.fee || 0)]));

  const getZoneShippingFee = (discountedSubtotal) => {
    if (discountedSubtotal >= paymentRules.freeDeliveryThreshold) {
      return 0;
    }
    const selectedZone = String(deliveryZoneSelect?.value || "").toLowerCase();
    if (selectedZone && zoneFeeMap.has(selectedZone)) {
      return Math.max(0, Number(zoneFeeMap.get(selectedZone)));
    }
    return Math.max(0, Number(paymentRules.deliveryFee || 0));
  };

  if (deliveryZoneSelect && deliveryZones.length) {
    deliveryZones.forEach((zone) => {
      if (!zone?.name) {
        return;
      }
      const option = document.createElement("option");
      option.value = zone.name;
      option.textContent = `${zone.name} (${currency(Number(zone.fee || 0))})`;
      deliveryZoneSelect.appendChild(option);
    });
  }

  const updateCheckoutTotals = () => {
    const subtotal = Store.getTotal();
    const discountAmount = appliedPromo?.discountAmount || 0;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const shippingFee = getZoneShippingFee(discountedSubtotal);
    const finalTotal = discountedSubtotal + shippingFee;
    totalNode.textContent = currency(finalTotal);
    deliveryNode.textContent = shippingFee === 0 ? "FREE" : currency(shippingFee);
    deliveryRuleNote.textContent = `Free delivery for orders from ${currency(paymentRules.freeDeliveryThreshold)} and above.`;
    promoSummary.classList.toggle("hidden", !appliedPromo);
    promoDiscountAmount.textContent = `- ${currency(discountAmount)}`;
  };

  document.addEventListener("cart:updated", updateCheckoutTotals);
  deliveryZoneSelect?.addEventListener("change", updateCheckoutTotals);

  applyPromoBtn?.addEventListener("click", async () => {
    const code = promoCodeInput.value.trim();
    if (!code) {
      appliedPromo = null;
      promoFeedback.textContent = "Enter a promo code to apply discount.";
      updateCheckoutTotals();
      return;
    }

    try {
      const result = await API.request("/promos/validate", {
        method: "POST",
        body: JSON.stringify({
          code,
          subtotal: Store.getTotal()
        })
      });

      appliedPromo = result;
      promoFeedback.textContent = `Promo applied: ${result.code} (${currency(result.discountAmount)} off).`;
      updateCheckoutTotals();
    } catch (error) {
      appliedPromo = null;
      promoFeedback.textContent = error.message;
      updateCheckoutTotals();
    }
  });

  document.getElementById("checkout-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const cart = Store.getCart();

    if (!cart.length) {
      showToast("Your cart is empty.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      customerName: formData.get("customerName"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      deliveryZone: formData.get("deliveryZone") || null,
      promoCode: appliedPromo?.code || null,
      promoDiscountAmount: appliedPromo?.discountAmount || 0,
      shippingFeePreview: getZoneShippingFee(Math.max(0, Store.getTotal() - (appliedPromo?.discountAmount || 0))),
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(payload));
    window.location.href = "/payment.html";
  });

  updateCheckoutTotals();
}

async function loadPaymentPage() {
  const shell = document.getElementById("payment-shell");
  if (!shell) {
    return;
  }

  const draft = JSON.parse(sessionStorage.getItem(CHECKOUT_DRAFT_KEY) || "null");
  if (!draft || !Array.isArray(draft.items) || !draft.items.length) {
    shell.innerHTML = emptyState("No checkout details found. Please return to checkout.");
    return;
  }

  try {
    const paymentSettings = await API.request("/payments/settings");
    paymentRules = {
      freeDeliveryThreshold: Number(paymentSettings.freeDeliveryThreshold || 50000),
      deliveryFee: Number(paymentSettings.deliveryFee || 2500)
    };
    const cart = Store.getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const promoDiscount = Number(draft.promoDiscountAmount || 0);
    const discountedSubtotal = Math.max(0, subtotal - promoDiscount);
    const zones = Array.isArray(paymentSettings.deliveryZones) ? paymentSettings.deliveryZones : [];
    const zone = zones.find((entry) => String(entry.name || "").toLowerCase() === String(draft.deliveryZone || "").toLowerCase());
    const shippingFee = discountedSubtotal >= paymentRules.freeDeliveryThreshold
      ? 0
      : (zone ? Number(zone.fee || 0) : paymentRules.deliveryFee);
    const finalTotal = discountedSubtotal + shippingFee;

    shell.innerHTML = `
      <div class="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section class="glass-panel gold-border rounded-[1.75rem] p-6">
          <p class="text-sm uppercase tracking-[0.25em] text-gold">Payment Details</p>
          <h1 class="mt-2 text-3xl font-semibold text-white">Complete your payment</h1>
          <p class="mt-3 text-white/70">${paymentSettings.instructions || "Make a bank transfer and submit your payment reference."}</p>
          <div class="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/80">
            <p><span class="text-white/55">Business:</span> ${paymentSettings.businessName || "KETTYSCENT"}</p>
            <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p><span class="text-white/55">Bank:</span> <span id="payment-bank-name">${paymentSettings.bankName || "-"}</span></p>
              <button id="copy-bank-btn" type="button" class="rounded-full border border-white/20 px-3 py-1 text-xs text-white transition hover:border-[var(--luxury-gold)] hover:text-gold">Copy Bank</button>
            </div>
            <p class="mt-2"><span class="text-white/55">Account Name:</span> ${paymentSettings.accountName || "-"}</p>
            <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p><span class="text-white/55">Account Number:</span> <span id="payment-account-number">${paymentSettings.accountNumber || "-"}</span></p>
              <button id="copy-account-btn" type="button" class="rounded-full border border-white/20 px-3 py-1 text-xs text-white transition hover:border-[var(--luxury-gold)] hover:text-gold">Copy Number</button>
            </div>
            <p class="mt-2"><span class="text-white/55">Delivery Rule:</span> Free from ${currency(paymentRules.freeDeliveryThreshold)}.</p>
          </div>
          <form id="payment-form" class="mt-6 space-y-4">
            <div class="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
              Payment Method: <span class="text-gold font-semibold">Bank Transfer</span>
            </div>
            <input name="paymentReference" class="form-input" type="text" placeholder="Payment reference / transaction ID" />
            <button class="w-full rounded-full bg-gold px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:brightness-110" type="submit">
              Confirm Payment & Place Order
            </button>
          </form>
        </section>
        <section class="glass-panel gold-border rounded-[1.75rem] p-6">
          <p class="text-sm uppercase tracking-[0.25em] text-gold">Order Summary</p>
          <div class="mt-4 space-y-3 text-white/80">
            ${cart.map((item) => `<div class="flex items-center justify-between"><span>${item.name} x ${item.quantity}</span><span>${currency(item.price * item.quantity)}</span></div>`).join("")}
          </div>
          <div class="mt-6 border-t border-white/10 pt-4">
            <div class="flex items-center justify-between text-white/70"><span>Subtotal</span><span>${currency(subtotal)}</span></div>
            ${draft.promoCode ? `<div class="mt-2 flex items-center justify-between text-green-300"><span>Promo</span><span>${draft.promoCode}</span></div>` : ""}
            ${draft.promoCode ? `<div class="mt-2 flex items-center justify-between text-green-300"><span>Discount</span><span>- ${currency(promoDiscount)}</span></div>` : ""}
            <div class="mt-2 flex items-center justify-between text-white/70"><span>Delivery</span><span>${shippingFee === 0 ? "FREE" : currency(shippingFee)}</span></div>
            ${draft.deliveryZone ? `<div class="mt-2 flex items-center justify-between text-white/70"><span>Zone</span><span>${draft.deliveryZone}</span></div>` : ""}
            <div class="mt-4 flex items-center justify-between text-xl font-semibold text-gold"><span>Total</span><span>${currency(finalTotal)}</span></div>
          </div>
        </section>
      </div>
    `;

    const copyText = async (value, label) => {
      try {
        await navigator.clipboard.writeText(String(value || ""));
        showToast(`${label} copied.`);
      } catch (_error) {
        showToast(`Failed to copy ${label.toLowerCase()}.`);
      }
    };

    document.getElementById("copy-bank-btn")?.addEventListener("click", async () => {
      const bankName = document.getElementById("payment-bank-name")?.textContent?.trim();
      await copyText(bankName, "Bank name");
    });

    document.getElementById("copy-account-btn")?.addEventListener("click", async () => {
      const accountNumber = document.getElementById("payment-account-number")?.textContent?.trim();
      await copyText(accountNumber, "Account number");
    });

    document.getElementById("payment-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const paymentMethod = "BANK_TRANSFER";
      const paymentReference = formData.get("paymentReference");

      const order = await API.request("/orders", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          paymentMethod,
          paymentReference,
          paymentStatus: paymentReference ? "Paid" : "Pending"
        })
      });

      sessionStorage.setItem("latestOrder", JSON.stringify(order));
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      Store.clearCart();
      window.location.href = "/confirmation.html";
    });
  } catch (error) {
    shell.innerHTML = emptyState(error.message || "Unable to load payment page.");
  }
}

function loadConfirmationPage() {
  const confirmationNode = document.getElementById("confirmation-shell");
  if (!confirmationNode) {
    return;
  }

  const order = JSON.parse(sessionStorage.getItem("latestOrder") || "null");
  if (!order) {
    confirmationNode.innerHTML = emptyState("No recent order found.");
    return;
  }

  confirmationNode.innerHTML = `
    <div class="mx-auto max-w-3xl rounded-[2rem] border border-[var(--luxury-gold)] bg-white/5 p-8 text-center shadow-gold md:p-12">
      <span class="inline-flex rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-black">Order Confirmed</span>
      <h1 class="mt-6 text-4xl font-semibold text-white">Thank you, ${order.customerName}</h1>
      <p class="mt-4 text-lg text-white/75">Your fragrance order has been placed successfully. Our team will contact you shortly to confirm delivery.</p>
      <div class="mt-8 grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-left text-white/80 md:grid-cols-3">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-white/50">Order ID</p>
          <p class="mt-2 font-medium">${order._id}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-white/50">Tracking ID</p>
          <p class="mt-2 font-medium">${order.trackingId || "-"}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-white/50">Status</p>
          <p class="mt-2 font-medium text-gold">${order.status}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-white/50">Total</p>
          <p class="mt-2 font-medium">${currency(order.totalAmount)}</p>
        </div>
      </div>
      ${order.promoCode ? `<p class="mt-4 text-sm text-white/70">Promo code used: <span class="text-gold">${order.promoCode}</span> (saved ${currency(order.discountAmount || 0)})</p>` : ""}
      <p class="mt-2 text-sm text-white/70">Delivery fee: <span class="text-gold">${order.shippingFee === 0 ? "FREE" : currency(order.shippingFee || 0)}</span></p>
      ${order.deliveryZone ? `<p class="mt-2 text-sm text-white/70">Delivery zone: <span class="text-gold">${order.deliveryZone}</span></p>` : ""}
      <p class="mt-2 text-sm text-white/70">Payment: <span class="text-gold">${order.paymentStatus || "Pending"}</span> via ${order.paymentMethod || "BANK_TRANSFER"}</p>
      <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href="/track.html" class="inline-flex rounded-full border border-white/15 px-8 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-[var(--luxury-gold)] hover:text-gold">Track Order</a>
        <a href="https://wa.me/2348134069319?text=${encodeURIComponent(`HI KETTY SCENT, I JUST PLACED ORDER ${order._id} (TRACKING: ${order.trackingId || "-"})`)}" target="_blank" rel="noreferrer" class="inline-flex rounded-full bg-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:brightness-110">Send WhatsApp Summary</a>
        <a href="/" class="inline-flex rounded-full bg-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:brightness-110">Continue Shopping</a>
      </div>
    </div>
  `;
}

async function loadTrackPage() {
  const form = document.getElementById("track-order-form");
  const result = document.getElementById("track-result");
  if (!form || !result) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const trackingId = document.getElementById("track-id").value.trim().toUpperCase();
    const phone = document.getElementById("track-phone").value.trim();

    try {
      const order = await API.request(`/orders/track?trackingId=${encodeURIComponent(trackingId)}&phone=${encodeURIComponent(phone)}`);
      result.innerHTML = `
        <div class="rounded-[1.25rem] border border-white/10 bg-black/20 p-5 text-white/80">
          <p class="text-sm uppercase tracking-[0.22em] text-gold">Tracking Result</p>
          <p class="mt-3"><span class="text-white/60">Order ID:</span> ${order._id}</p>
          <p class="mt-2"><span class="text-white/60">Tracking ID:</span> ${order.trackingId || "-"}</p>
          <p class="mt-2"><span class="text-white/60">Status:</span> <span class="text-gold">${order.status}</span></p>
          <p class="mt-2"><span class="text-white/60">Payment:</span> ${order.paymentStatus}</p>
          <p class="mt-2"><span class="text-white/60">Total:</span> ${currency(order.totalAmount)}</p>
          <p class="mt-2"><span class="text-white/60">Address:</span> ${order.address}</p>
        </div>
      `;
    } catch (error) {
      result.innerHTML = `<p class="mt-3 text-sm text-red-300">${error.message}</p>`;
    }
  });
}

function showToast(message) {
  const shell = document.getElementById("toast");
  if (!shell) {
    return;
  }

  shell.textContent = message;
  shell.classList.remove("opacity-0", "translate-y-3");
  shell.classList.add("opacity-100", "translate-y-0");

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    shell.classList.add("opacity-0", "translate-y-3");
    shell.classList.remove("opacity-100", "translate-y-0");
  }, 2500);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadHomePage();
    await loadProductPage();
    await loadCheckoutPage();
    await loadPaymentPage();
    loadConfirmationPage();
    await loadTrackPage();
  } catch (error) {
    showToast(error.message);
  }
});
