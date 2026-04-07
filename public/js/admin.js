const ADMIN_TOKEN_KEY = "aunty_perfume_admin_token";
const LAST_SEEN_ORDER_KEY = "kettyscent_last_seen_order";
let orderPollIntervalId = null;

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function adminHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`
  };
}

function toggleAdminViews(isLoggedIn) {
  document.getElementById("admin-login-view")?.classList.toggle("hidden", isLoggedIn);
  document.getElementById("admin-dashboard-view")?.classList.toggle("hidden", !isLoggedIn);
}

function adminCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN"
  }).format(amount);
}

async function loadOverview() {
  const overview = await API.request("/admin/overview", {
    headers: adminHeaders()
  });

  document.getElementById("metric-products").textContent = overview.totalProducts;
  document.getElementById("metric-orders").textContent = overview.totalOrders;
  document.getElementById("metric-pending").textContent = overview.pendingOrders;
  document.getElementById("metric-delivered").textContent = overview.deliveredOrders;
  document.getElementById("metric-revenue").textContent = adminCurrency(overview.totalRevenue || 0);
  document.getElementById("metric-monthly").textContent = adminCurrency(overview.monthlyRevenue || 0);
  document.getElementById("metric-today-revenue").textContent = adminCurrency(overview.todayRevenue || 0);
  document.getElementById("metric-today-orders").textContent = `${overview.todayOrders || 0} orders`;

  const topProductsList = document.getElementById("top-products-list");
  if (topProductsList) {
    const topProducts = overview.topProducts || [];
    topProductsList.innerHTML = topProducts.length
      ? topProducts.map((item) => `
          <li class="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <span class="font-medium text-white">${item.productName}</span>
            <span class="text-sm font-semibold text-amber-300">${item.unitsSold} sold</span>
          </li>
        `).join("")
      : '<li class="text-sm text-slate-400">No sales data yet.</li>';
  }
}

function fillProductForm(product = null) {
  const form = document.getElementById("product-form");
  form.reset();

  form.elements.productId.value = product?._id || "";
  form.elements.name.value = product?.name || "";
  form.elements.price.value = product?.price || "";
  form.elements.imageUrl.value = product?.imageUrl || "";
  form.elements.description.value = product?.description || "";
  form.elements.category.value = product?.category || "Unisex";
  form.elements.featured.checked = Boolean(product?.featured);

  document.getElementById("product-form-title").textContent = product ? "Edit Perfume" : "Add Perfume";
  document.getElementById("product-submit").textContent = product ? "Update Product" : "Add Product";
}

async function loadProductsTable() {
  const products = await API.request("/products");
  const tableBody = document.getElementById("admin-products-table");

  tableBody.innerHTML = products.map((product) => `
    <tr class="border-b border-white/5">
      <td class="px-4 py-4">
        <div class="flex items-center gap-3">
          <img src="${product.imageUrl}" alt="${product.name}" class="h-14 w-14 rounded-2xl object-cover" />
          <div>
            <p class="font-medium text-white">${product.name}</p>
            <p class="text-sm text-slate-400">${product.category}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-4 text-slate-300">${adminCurrency(product.price)}</td>
      <td class="px-4 py-4 text-slate-300">${product.featured ? "Featured" : "Standard"}</td>
      <td class="px-4 py-4">
        <div class="flex gap-2">
          <button data-edit-product="${product._id}" class="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-amber-400 hover:text-amber-300">Edit</button>
          <button data-delete-product="${product._id}" class="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      const product = await API.request(`/products/${button.dataset.editProduct}`);
      fillProductForm(product);
      document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Delete this perfume?")) {
        return;
      }

      await API.request(`/products/${button.dataset.deleteProduct}`, {
        method: "DELETE",
        headers: adminHeaders()
      });

      await refreshAdminData();
    });
  });
}

function promoValueLabel(promo) {
  if (promo.discountType === "PERCENT") {
    return `${Number(promo.discountValue)}%`;
  }
  return adminCurrency(promo.discountValue);
}

async function loadPromosTable() {
  const tableBody = document.getElementById("admin-promos-table");
  if (!tableBody) {
    return;
  }

  const promos = await API.request("/promos", {
    headers: adminHeaders()
  });

  if (!promos.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-6 text-center text-slate-500">No promo codes created yet.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = promos.map((promo) => `
    <tr class="border-b border-white/5">
      <td class="px-4 py-4 font-black text-gold">${promo.code}</td>
      <td class="px-4 py-4 text-slate-300">${promo.discountType}</td>
      <td class="px-4 py-4 text-slate-300">${promoValueLabel(promo)}</td>
      <td class="px-4 py-4">
        <span class="status-pill ${promo.isActive ? "status-delivered" : "status-pending"}">${promo.isActive ? "Active" : "Inactive"}</span>
      </td>
      <td class="px-4 py-4">
        <div class="flex flex-wrap gap-2">
          <button data-toggle-promo="${promo._id}" data-promo-active="${promo.isActive}" class="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-amber-400 hover:text-amber-300">
            ${promo.isActive ? "Deactivate" : "Activate"}
          </button>
          <button data-delete-promo="${promo._id}" class="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-toggle-promo]").forEach((button) => {
    button.addEventListener("click", async () => {
      const current = button.dataset.promoActive === "true";
      await API.request(`/promos/${button.dataset.togglePromo}`, {
        method: "PUT",
        headers: adminHeaders(),
        body: JSON.stringify({ isActive: !current })
      });
      await loadPromosTable();
    });
  });

  document.querySelectorAll("[data-delete-promo]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Delete this promo code?")) {
        return;
      }
      await API.request(`/promos/${button.dataset.deletePromo}`, {
        method: "DELETE",
        headers: adminHeaders()
      });
      await loadPromosTable();
    });
  });
}

async function loadOrdersTable() {
  const search = document.getElementById("order-search-input")?.value?.trim();
  const orders = await API.request(`/orders${search ? `?search=${encodeURIComponent(search)}` : ""}`, {
    headers: adminHeaders()
  });
  const tableBody = document.getElementById("admin-orders-table");
  if (!orders.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-slate-500">No orders found for that search.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = orders.map((order) => `
    <tr class="border-b border-white/5 align-top">
      <td class="px-4 py-4 text-slate-300">#${order._id}</td>
      <td class="px-4 py-4">
        <p class="font-medium text-white">${order.customerName}</p>
        <p class="mt-1 text-sm text-slate-400">${order.phone}</p>
      </td>
      <td class="px-4 py-4 text-slate-300">${order.address}</td>
      <td class="px-4 py-4 text-slate-300">
        ${order.items.map((item) => `<div>${item.name} x ${item.quantity}</div>`).join("")}
      </td>
      <td class="px-4 py-4 text-slate-300">${adminCurrency(order.totalAmount)}</td>
      <td class="px-4 py-4">
        <div class="space-y-2">
          <span class="status-pill ${order.status === "Delivered" ? "status-delivered" : "status-pending"}">${order.status}</span>
          <div class="text-xs text-slate-400">Payment: ${order.paymentStatus || "Pending"} (${order.paymentMethod || "-"})</div>
          ${order.paymentReference ? `<div class="text-xs text-slate-400">Ref: ${order.paymentReference}</div>` : ""}
        </div>
      </td>
      <td class="px-4 py-4">
        <div class="flex flex-wrap gap-2">
          <a href="mailto:kettyscent@gmail.com?subject=Order%20${order._id}&body=Customer:%20${encodeURIComponent(order.customerName)}" class="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-amber-400 hover:text-amber-300">Email</a>
          ${order.status === "Delivered"
            ? '<span class="self-center text-sm text-slate-400">Completed</span>'
            : `<button data-deliver-order="${order._id}" class="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110">Mark Delivered</button>`}
          ${order.paymentStatus !== "Paid"
            ? `<button data-mark-paid="${order._id}" class="rounded-full border border-amber-500/50 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10">Mark Paid</button>`
            : ""}
          ${order.paymentStatus === "Paid"
            ? `<button data-mark-verified="${order._id}" class="rounded-full border border-emerald-500/50 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/10">Verify</button>`
            : ""}
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-deliver-order]").forEach((button) => {
    button.addEventListener("click", async () => {
      await API.request(`/orders/${button.dataset.deliverOrder}/deliver`, {
        method: "PATCH",
        headers: adminHeaders()
      });

      await refreshAdminData();
    });
  });

  document.querySelectorAll("[data-mark-paid]").forEach((button) => {
    button.addEventListener("click", async () => {
      await API.request(`/orders/${button.dataset.markPaid}/payment-status`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ status: "Paid" })
      });
      await refreshAdminData();
    });
  });

  document.querySelectorAll("[data-mark-verified]").forEach((button) => {
    button.addEventListener("click", async () => {
      await API.request(`/orders/${button.dataset.markVerified}/payment-status`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ status: "Verified" })
      });
      await refreshAdminData();
    });
  });

  updateLastSeenOrder(orders[0]);
}

async function refreshAdminData() {
  await Promise.all([loadOverview(), loadProductsTable(), loadPromosTable(), loadOrdersTable(), loadPaymentSettings()]);
}

function updateLastSeenOrder(order) {
  if (!order) {
    return;
  }

  const currentSeen = localStorage.getItem(LAST_SEEN_ORDER_KEY);
  if (!currentSeen) {
    localStorage.setItem(LAST_SEEN_ORDER_KEY, String(order._id));
  }
}

function showNewOrderAlert(order) {
  const shell = document.getElementById("new-order-alert-shell");
  const title = document.getElementById("new-order-alert-title");
  const body = document.getElementById("new-order-alert-body");

  if (!shell || !title || !body || !order) {
    return;
  }

  title.textContent = `New order #${order._id} from ${order.customerName}`;
  body.textContent = `${order.items.length} item(s), ${adminCurrency(order.totalAmount)}, ${order.phone}`;
  shell.classList.remove("hidden");
}

function hideNewOrderAlert() {
  document.getElementById("new-order-alert-shell")?.classList.add("hidden");
}

async function checkForNewOrders() {
  try {
    const orders = await API.request("/orders", {
      headers: adminHeaders()
    });

    if (!orders.length) {
      return;
    }

    const latestOrder = orders[0];
    const lastSeenOrderId = localStorage.getItem(LAST_SEEN_ORDER_KEY);

    if (lastSeenOrderId && String(latestOrder._id) !== String(lastSeenOrderId)) {
      showNewOrderAlert(latestOrder);
      await refreshAdminData();
    }

    localStorage.setItem(LAST_SEEN_ORDER_KEY, String(latestOrder._id));
  } catch (_error) {
    // Ignore polling errors so the admin page stays usable.
  }
}

function setupLogin() {
  const loginForm = document.getElementById("admin-login-form");
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const result = await API.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    setToken(result.token);
    toggleAdminViews(true);
    await refreshAdminData();
  });
}

function setupProductForm() {
  const form = document.getElementById("product-form");
  if (!form) {
    return;
  }

  fillProductForm();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const productId = formData.get("productId");
    const normalizedPrice = Number(String(formData.get("price") || "").replace(/,/g, "").trim());

    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      window.alert("Enter a valid price (numbers only). Example: 50000");
      return;
    }

    const payload = {
      name: formData.get("name"),
      price: normalizedPrice,
      imageUrl: formData.get("imageUrl"),
      description: formData.get("description"),
      category: formData.get("category"),
      featured: formData.get("featured") === "on"
    };

    try {
      await API.request(productId ? `/products/${productId}` : "/products", {
        method: productId ? "PUT" : "POST",
        headers: adminHeaders(),
        body: JSON.stringify(payload)
      });

      fillProductForm();
      await refreshAdminData();
      window.alert(productId ? "Product updated successfully." : "Product added successfully.");
    } catch (error) {
      if (error.message === "Not authorized." || error.message === "Invalid token.") {
        removeToken();
        toggleAdminViews(false);
        window.alert("Your admin session expired. Please login again.");
        return;
      }

      window.alert(error.message || "Failed to save product. Check image URL and required fields.");
    }
  });
}

function setupLogout() {
  document.getElementById("admin-logout")?.addEventListener("click", () => {
    clearInterval(orderPollIntervalId);
    removeToken();
    toggleAdminViews(false);
  });
}

async function loadPaymentSettings() {
  const form = document.getElementById("payment-settings-form");
  if (!form) {
    return;
  }

  const settings = await API.request("/payments/settings");
  document.getElementById("ps-business-name").value = settings.businessName || "";
  document.getElementById("ps-bank-name").value = settings.bankName || "";
  document.getElementById("ps-account-name").value = settings.accountName || "";
  document.getElementById("ps-account-number").value = settings.accountNumber || "";
  document.getElementById("ps-instructions").value = settings.instructions || "";
}

function setupPaymentSettingsForm() {
  const form = document.getElementById("payment-settings-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await API.request("/admin/payment-settings", {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify({
        businessName: document.getElementById("ps-business-name").value,
        bankName: document.getElementById("ps-bank-name").value,
        accountName: document.getElementById("ps-account-name").value,
        accountNumber: document.getElementById("ps-account-number").value,
        instructions: document.getElementById("ps-instructions").value
      })
    });
    await loadPaymentSettings();
  });
}

function setupPromoForm() {
  const form = document.getElementById("promo-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = document.getElementById("promo-code").value.trim().toUpperCase();
    const discountType = document.getElementById("promo-type").value;
    const discountValue = Number(document.getElementById("promo-value").value);

    if (!code) {
      window.alert("Promo code is required.");
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      window.alert("Promo value must be greater than 0.");
      return;
    }

    if (discountType === "PERCENT" && discountValue > 100) {
      window.alert("Percent promo cannot be above 100.");
      return;
    }

    await API.request("/promos", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        code,
        discountType,
        discountValue
      })
    });

    form.reset();
    document.getElementById("promo-type").value = "PERCENT";
    await loadPromosTable();
  });
}

function setupOrderSearch() {
  const searchInput = document.getElementById("order-search-input");
  const resetButton = document.getElementById("order-search-reset");

  if (!searchInput || !resetButton) {
    return;
  }

  searchInput.addEventListener("input", async () => {
    await loadOrdersTable();
  });

  resetButton.addEventListener("click", async () => {
    searchInput.value = "";
    await loadOrdersTable();
  });
}

function setupAlerts() {
  document.getElementById("dismiss-new-order-alert")?.addEventListener("click", hideNewOrderAlert);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("admin-page")) {
    return;
  }

  setupLogin();
  setupProductForm();
  setupLogout();
  setupOrderSearch();
  setupAlerts();
  setupPaymentSettingsForm();
  setupPromoForm();

  const loggedIn = Boolean(getToken());
  toggleAdminViews(loggedIn);

  if (loggedIn) {
    try {
      await refreshAdminData();
      clearInterval(orderPollIntervalId);
      orderPollIntervalId = setInterval(checkForNewOrders, 30000);
    } catch (_error) {
      removeToken();
      toggleAdminViews(false);
    }
  }
});
