function serializeProduct(product) {
  const data = typeof product.get === "function" ? product.get({ plain: true }) : product;

  return {
    _id: String(data.id),
    id: data.id,
    name: data.name,
    price: Number(data.price),
    imageUrl: data.imageUrl,
    description: data.description,
    category: data.category,
    featured: Boolean(data.featured),
    createdAt: data.created_at || data.createdAt || null
  };
}

function serializeOrderItem(item) {
  const data = typeof item.get === "function" ? item.get({ plain: true }) : item;
  const product = data.product;

  return {
    _id: String(data.id),
    id: data.id,
    product: data.productId,
    productId: data.productId,
    name: product?.name,
    price: Number(data.price),
    quantity: data.quantity,
    imageUrl: product?.imageUrl
  };
}

function serializeOrder(order, extras = {}) {
  const data = typeof order.get === "function" ? order.get({ plain: true }) : order;

  return {
    _id: String(data.id),
    id: data.id,
    customerName: data.customerName,
    phone: data.phone,
    address: data.address,
    totalAmount: Number(data.totalPrice),
    totalPrice: Number(data.totalPrice),
    discountAmount: Number(data.discountAmount || 0),
    shippingFee: Number(data.shippingFee || 0),
    promoCode: data.promoCode || null,
    paymentMethod: data.paymentMethod || null,
    paymentReference: data.paymentReference || null,
    paymentStatus: data.paymentStatus || "Pending",
    status: data.status,
    createdAt: data.created_at || data.createdAt || null,
    items: Array.isArray(data.items) ? data.items.map(serializeOrderItem) : [],
    ...extras
  };
}

module.exports = {
  serializeProduct,
  serializeOrder
};
