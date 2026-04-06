const bcrypt = require("bcryptjs");

const { User } = require("../models");

async function seedAdminAccount() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("Admin seed skipped because ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
    return;
  }

  const existingAdmin = await User.findOne({
    where: { email: email.toLowerCase() }
  });

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    username,
    email: email.toLowerCase(),
    password: hashedPassword
  });

  console.log(`Seeded admin account: ${email}`);
}

module.exports = { seedAdminAccount };
