const { Op, fn, col } = require("sequelize");

const { Product, Order, OrderItem } = require("../models");

async function getDashboardOverview(_req, res) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const [totalProducts, totalOrders, pendingOrders, deliveredOrders] = await Promise.all([
      Product.count(),
      Order.count(),
      Order.count({ where: { status: "Pending" } }),
      Order.count({ where: { status: "Delivered" } })
    ]);

    const [salesSummary, todaySalesSummary, topProductsRows] = await Promise.all([
      Order.findOne({
        attributes: [[fn("COALESCE", fn("SUM", col("total_price")), 0), "sumRevenue"]]
      }),
      Order.findOne({
        where: { created_at: { [Op.gte]: startOfToday } },
        attributes: [
          [fn("COALESCE", fn("SUM", col("total_price")), 0), "sumRevenue"],
          [fn("COUNT", col("id")), "countOrders"]
        ]
      }),
      OrderItem.findAll({
        attributes: [
          "productId",
          [fn("SUM", col("quantity")), "unitsSold"]
        ],
        include: [{ model: Product, as: "product", attributes: ["name"] }],
        group: ["OrderItem.product_id", "product.id"],
        order: [[fn("SUM", col("quantity")), "DESC"]],
        limit: 5
      })
    ]);

    const monthlyRevenue = await Order.findOne({
      where: { created_at: { [Op.gte]: startOfMonth } },
      attributes: [[fn("COALESCE", fn("SUM", col("total_price")), 0), "sumRevenue"]]
    });

    const topProducts = topProductsRows.map((row) => {
      const plain = row.get({ plain: true });
      return {
        productId: plain.productId,
        productName: plain.product?.name || "Unknown",
        unitsSold: Number(plain.unitsSold || 0)
      };
    });

    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: Number(salesSummary?.get("sumRevenue") || 0),
      monthlyRevenue: Number(monthlyRevenue?.get("sumRevenue") || 0),
      todayRevenue: Number(todaySalesSummary?.get("sumRevenue") || 0),
      todayOrders: Number(todaySalesSummary?.get("countOrders") || 0),
      topProducts
    });
  } catch (_error) {
    res.status(500).json({ message: "Failed to fetch dashboard overview." });
  }
}

module.exports = { getDashboardOverview };
