require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const { connectDB } = require("./server/config/db");
const authRoutes = require("./server/routes/authRoutes");
const productRoutes = require("./server/routes/productRoutes");
const orderRoutes = require("./server/routes/orderRoutes");
const adminRoutes = require("./server/routes/adminRoutes");
const promoRoutes = require("./server/routes/promoRoutes");
const paymentRoutes = require("./server/routes/paymentRoutes");
const { seedAdminAccount } = require("./server/utils/seedAdmin");

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PANEL_PATH = process.env.ADMIN_PANEL_PATH || "/staff-console";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/admin.html", (_req, res) => {
  return res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
});

app.get(ADMIN_PANEL_PATH, (_req, res) => {
  return res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("*", (req, res) => {
  const allowedPages = ["/", "/index.html", "/product.html", "/checkout.html", "/payment.html", "/confirmation.html"];
  if (allowedPages.includes(req.path)) {
    const fileName = req.path === "/" ? "index.html" : req.path.slice(1);
    return res.sendFile(path.join(__dirname, "public", fileName));
  }

  return res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  try {
    await connectDB();
    await seedAdminAccount();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();
