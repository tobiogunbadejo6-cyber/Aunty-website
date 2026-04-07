const { Op } = require("sequelize");

const { Order, OrderItem, Product, PromoCode, sequelize } = require("../models");
const { serializeOrder } = require("../utils/serializers");
const { computeDiscount } = require("./promoController");

function includeOrderRelations() {
  return [
    {
      model: OrderItem,
      as: "items",
      include: [
        {
          model: Product,
          as: "product"
        }
      ]
    }
  ];
}

function parseDeliveryZones() {
  try {
    const parsed = JSON.parse(process.env.DELIVERY_ZONES_JSON || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((zone) => zone && typeof zone.name === "string")
      .map((zone) => ({
        name: zone.name.trim(),
        fee: Math.max(0, Number(zone.fee || 0))
      }));
  } catch (_error) {
    return [];
  }
}

function computeShippingFee(discountedSubtotal, deliveryZone) {
  const freeDeliveryThreshold = Math.max(0, Number(process.env.FREE_DELIVERY_THRESHOLD || 50000));
  if (discountedSubtotal >= freeDeliveryThreshold) {
    return 0;
  }

  const zones = parseDeliveryZones();
  const matchedZone = zones.find((zone) => zone.name.toLowerCase() === String(deliveryZone || "").trim().toLowerCase());
  if (matchedZone) {
    return matchedZone.fee;
  }

  return Math.max(0, Number(process.env.DELIVERY_FEE || 2500));
}

function generateTrackingId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `KTS-${stamp}-${rand}`;
}

function normalizePhone(input) {
  return String(input || "").replace(/\D+/g, "");
}

function buildOrderWhere(query) {
  const where = {};
  const { search, status, paymentStatus, dateFrom, dateTo } = query;

  if (search) {
    const text = String(search).trim();
    const numericId = Number(text);
    if (!Number.isNaN(numericId)) {
      where[Op.or] = [{ id: numericId }, { trackingId: { [Op.iLike]: `%${text}%` } }];
    } else {
      where.trackingId = { [Op.iLike]: `%${text}%` };
    }
  }

  if (status && ["Pending", "Delivered"].includes(status)) {
    where.status = status;
  }

  if (paymentStatus && ["Pending", "Paid", "Verified"].includes(paymentStatus)) {
    where.paymentStatus = paymentStatus;
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) {
      where.created_at[Op.gte] = new Date(dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  return where;
}

async function createOrder(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { customerName, phone, address, items, promoCode, paymentMethod, paymentReference, paymentStatus, deliveryZone } = req.body;

    if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Customer details and items are required." });
    }

    const productIds = items.map((item) => Number(item.productId));
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      transaction
    });

    const normalizedItems = items.map((item) => {
      const product = products.find((entry) => entry.id === Number(item.productId));

      if (!product) {
        throw new Error("One or more products are invalid.");
      }

      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      if (Number(product.stock || 0) < requestedQty) {
        throw new Error(`${product.name} is out of stock for requested quantity.`);
      }

      return {
        productId: product.id,
        price: product.price,
        quantity: requestedQty
      };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    let appliedPromoCode = null;
    let discountAmount = 0;

    if (promoCode) {
      const promo = await PromoCode.findOne({
        where: {
          code: String(promoCode).trim().toUpperCase(),
          isActive: true
        },
        transaction
      });

      if (!promo) {
        throw new Error("Promo code is invalid.");
      }

      if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
        throw new Error("Promo code has expired.");
      }
      if (Number.isFinite(Number(promo.maxUses)) && Number(promo.maxUses) > 0 && Number(promo.usageCount) >= Number(promo.maxUses)) {
        throw new Error("Promo usage limit reached.");
      }

      appliedPromoCode = promo.code;
      discountAmount = computeDiscount(subtotal, promo);

      if (discountAmount > 0) {
        await promo.update({ usageCount: Number(promo.usageCount || 0) + 1 }, { transaction });
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const shippingFee = computeShippingFee(discountedSubtotal, deliveryZone);
    const totalPrice = discountedSubtotal + shippingFee;
    const trackingId = generateTrackingId();

    const order = await Order.create({
      customerName,
      phone,
      address,
      totalPrice,
      discountAmount,
      shippingFee,
      promoCode: appliedPromoCode,
      paymentMethod: paymentMethod || "BANK_TRANSFER",
      paymentReference: paymentReference || null,
      paymentStatus: paymentStatus || "Pending",
      trackingId,
      deliveryZone: deliveryZone || null
    }, { transaction });

    await OrderItem.bulkCreate(
      normalizedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      { transaction }
    );

    for (const item of normalizedItems) {
      await Product.decrement("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction
      });
    }

    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, { include: includeOrderRelations() });
    return res.status(201).json(serializeOrder(createdOrder));
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return res.status(400).json({ message: error.message || "Failed to place order." });
  }
}

async function getOrders(_req, res) {
  try {
    const where = buildOrderWhere(_req.query);

    const orders = await Order.findAll({
      where,
      include: includeOrderRelations(),
      order: [["created_at", "DESC"]]
    });

    res.json(orders.map((order) => serializeOrder(order)));
  } catch (_error) {
    res.status(500).json({ message: "Failed to fetch orders." });
  }
}

async function exportOrdersCsv(req, res) {
  try {
    const where = buildOrderWhere(req.query);
    const orders = await Order.findAll({
      where,
      include: includeOrderRelations(),
      order: [["created_at", "DESC"]]
    });

    const headers = [
      "OrderID",
      "TrackingID",
      "CustomerName",
      "Phone",
      "Address",
      "DeliveryZone",
      "PaymentStatus",
      "OrderStatus",
      "PromoCode",
      "Discount",
      "ShippingFee",
      "Total",
      "Items",
      "CreatedAt"
    ];

    const csvRows = orders.map((order) => {
      const serialized = serializeOrder(order);
      const items = serialized.items.map((item) => `${item.name} x${item.quantity}`).join(" | ");
      const values = [
        serialized._id,
        serialized.trackingId || "",
        serialized.customerName,
        serialized.phone,
        serialized.address,
        serialized.deliveryZone || "",
        serialized.paymentStatus,
        serialized.status,
        serialized.promoCode || "",
        serialized.discountAmount,
        serialized.shippingFee,
        serialized.totalAmount,
        items,
        serialized.createdAt
      ];

      return values.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headers.join(","), ...csvRows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="kettyscent-orders-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to export orders." });
  }
}

async function trackOrder(req, res) {
  try {
    const trackingId = String(req.query.trackingId || "").trim().toUpperCase();
    const phone = normalizePhone(req.query.phone);

    if (!trackingId || !phone) {
      return res.status(400).json({ message: "Tracking ID and phone are required." });
    }

    const order = await Order.findOne({
      where: { trackingId },
      include: includeOrderRelations()
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (normalizePhone(order.phone) !== phone) {
      return res.status(403).json({ message: "Phone number does not match this order." });
    }

    return res.json(serializeOrder(order));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to track order." });
  }
}

async function markOrderDelivered(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    await order.update({ status: "Delivered" });

    const updatedOrder = await Order.findByPk(order.id, { include: includeOrderRelations() });

    return res.json(serializeOrder(updatedOrder));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to update order." });
  }
}

async function updateOrderPaymentStatus(req, res) {
  try {
    const { status } = req.body;
    if (!["Pending", "Paid", "Verified"].includes(status)) {
      return res.status(400).json({ message: "Invalid payment status." });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    await order.update({ paymentStatus: status });
    const updatedOrder = await Order.findByPk(order.id, { include: includeOrderRelations() });
    return res.json(serializeOrder(updatedOrder));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to update payment status." });
  }
}

module.exports = {
  createOrder,
  getOrders,
  exportOrdersCsv,
  trackOrder,
  markOrderDelivered,
  updateOrderPaymentStatus
};
