require("dotenv").config();

const { connectDB } = require("../config/db");
const { Product, PromoCode, PaymentSetting } = require("../models");
const { seedAdminAccount } = require("./seedAdmin");

const sampleProducts = [
  {
    name: "Velvet Ember",
    price: 129,
    imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=900&q=80",
    description: "A warm evening blend of smoked vanilla, amber resin, and cedarwood for a rich signature trail.",
    category: "Unisex",
    featured: true
  },
  {
    name: "Noir Jardin",
    price: 145,
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80",
    description: "Dark rose petals, saffron, and patchouli wrapped in a velvet floral composition.",
    category: "Women",
    featured: true
  },
  {
    name: "Atlas Mist",
    price: 118,
    imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=900&q=80",
    description: "Fresh bergamot, black pepper, and mineral woods inspired by crisp mountain air.",
    category: "Men",
    featured: true
  },
  {
    name: "Golden Santal",
    price: 155,
    imageUrl: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=80",
    description: "Creamy sandalwood, tonka bean, and jasmine create a polished and luminous presence.",
    category: "Unisex",
    featured: false
  },
  {
    name: "Lune Blanche",
    price: 132,
    imageUrl: "https://images.unsplash.com/photo-1615634260877-c4f3f0c6d56f?auto=format&fit=crop&w=900&q=80",
    description: "White musk, iris, and pear blossom for a soft, airy floral profile.",
    category: "Women",
    featured: false
  },
  {
    name: "Midnight Vetiver",
    price: 138,
    imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59db9?auto=format&fit=crop&w=900&q=80",
    description: "Vetiver roots, cardamom, and leather unfold into a dry, sophisticated finish.",
    category: "Men",
    featured: false
  }
];

async function seed() {
  try {
    await connectDB();
    await Product.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await Product.bulkCreate(sampleProducts);
    await PromoCode.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await PromoCode.bulkCreate([
      { code: "WELCOME10", discountType: "PERCENT", discountValue: 10, isActive: true },
      { code: "KETTY500", discountType: "FLAT", discountValue: 500, isActive: true }
    ]);
    await PaymentSetting.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await PaymentSetting.create({
      businessName: "KETTYSCENT",
      bankName: "GTBank",
      accountName: "KETTYSCENT ENTERPRISE",
      accountNumber: "0123456789",
      instructions: "Make payment and enter your payment reference on the next page.",
      acceptBankTransfer: true,
      acceptCard: false,
      acceptUssd: false
    });
    await seedAdminAccount();
    console.log("Sample products and promo codes seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
