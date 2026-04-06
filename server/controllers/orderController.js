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

async function createOrder(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { customerName, phone, address, items, promoCode, paymentMethod, paymentReference, paymentStatus } = req.body;

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

      return {
        productId: product.id,
        price: product.price,
        quantity: Math.max(1, Number(item.quantity) || 1)
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

      appliedPromoCode = promo.code;
      discountAmount = computeDiscount(subtotal, promo);
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const freeDeliveryThreshold = Math.max(0, Number(process.env.FREE_DELIVERY_THRESHOLD || 50000));
    const deliveryFee = Math.max(0, Number(process.env.DELIVERY_FEE || 2500));
    const shippingFee = discountedSubtotal >= freeDeliveryThreshold ? 0 : deliveryFee;
    const totalPrice = discountedSubtotal + shippingFee;

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
      paymentStatus: paymentStatus || "Pending"
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

    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, { include: includeOrderRelations() });
    return res.status(201).json(serializeOrder(createdOrder));
  } catch (error) {
    await transaction.rollback();
    return res.status(400).json({ message: error.message || "Failed to place order." });
  }
}

async function getOrders(_req, res) {
  try {
    const { search } = _req.query;
    const where = {};

    if (search) {
      const numericId = Number(search);
      where.id = Number.isNaN(numericId) ? -1 : numericId;
    }

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
  markOrderDelivered,
  updateOrderPaymentStatus
};
