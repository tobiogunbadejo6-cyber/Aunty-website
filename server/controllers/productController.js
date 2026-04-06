const { Op } = require("sequelize");

const { Product } = require("../models");
const { serializeProduct } = require("../utils/serializers");

async function getProducts(req, res) {
  try {
    const { category, featured, search } = req.query;
    const where = {};

    if (category) {
      where.category = category;
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const products = await Product.findAll({
      where,
      order: [["created_at", "DESC"]]
    });

    res.json(products.map(serializeProduct));
  } catch (_error) {
    res.status(500).json({ message: "Failed to fetch products." });
  }
}

async function getProductById(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.json(serializeProduct(product));
  } catch (_error) {
    return res.status(500).json({ message: "Failed to fetch product." });
  }
}

async function createProduct(req, res) {
  try {
    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      imageUrl: req.body.imageUrl,
      description: req.body.description,
      category: req.body.category,
      featured: Boolean(req.body.featured)
    });

    res.status(201).json(serializeProduct(product));
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to create product." });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    await product.update({
      name: req.body.name,
      price: req.body.price,
      imageUrl: req.body.imageUrl,
      description: req.body.description,
      category: req.body.category,
      featured: Boolean(req.body.featured)
    });

    return res.json(serializeProduct(product));
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to update product." });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    await product.destroy();
    return res.json({ message: "Product deleted successfully." });
  } catch (_error) {
    return res.status(500).json({ message: "Failed to delete product." });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
