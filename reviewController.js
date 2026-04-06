const { Product, Review } = require("../models");

function serializeReview(review) {
  const row = review.get({ plain: true });
  return {
    _id: String(row.id),
    id: row.id,
    productId: row.productId,
    customerName: row.customerName,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at || row.createdAt || null
  };
}

async function getProductReviews(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const reviews = await Review.findAll({
      where: { productId: Number(req.params.id) },
      order: [["created_at", "DESC"]]
    });

    return res.json(reviews.map(serializeReview));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to fetch reviews." });
  }
}

async function createProductReview(req, res) {
  try {
    const { customerName, rating, comment } = req.body;
    const productId = Number(req.params.id);

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (!customerName || !comment || !rating) {
      return res.status(400).json({ message: "Name, rating, and comment are required." });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const review = await Review.create({
      productId,
      customerName: String(customerName).trim(),
      rating: parsedRating,
      comment: String(comment).trim()
    });

    return res.status(201).json(serializeReview(review));
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to create review." });
  }
}

module.exports = {
  getProductReviews,
  createProductReview
};
