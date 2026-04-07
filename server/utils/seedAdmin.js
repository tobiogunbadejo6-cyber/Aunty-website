const bcrypt = require("bcryptjs");

const { User } = require("../models");

async function seedAdminAccount() {
  const primaryUsername = process.env.ADMIN_USERNAME || "admin";
  const primaryEmail = process.env.ADMIN_EMAIL;
  const primaryPassword = process.env.ADMIN_PASSWORD;
  const backupUsername = process.env.BACKUP_ADMIN_USERNAME || "admin_backup";
  const backupEmail = process.env.BACKUP_ADMIN_EMAIL;
  const backupPassword = process.env.BACKUP_ADMIN_PASSWORD;

  const accounts = [
    { username: primaryUsername, email: primaryEmail, password: primaryPassword, label: "primary" },
    { username: backupUsername, email: backupEmail, password: backupPassword, label: "backup" }
  ];

  for (const account of accounts) {
    if (!account.email || !account.password) {
      if (account.label === "primary") {
        console.warn("Primary admin seed skipped because ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
      }
      continue;
    }

    const normalizedEmail = account.email.toLowerCase();
    const existingAdmin = await User.findOne({ where: { email: normalizedEmail } });
    if (existingAdmin) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);
    await User.create({
      username: account.username,
      email: normalizedEmail,
      password: hashedPassword
    });

    console.log(`Seeded ${account.label} admin account: ${normalizedEmail}`);
  }
}

module.exports = { seedAdminAccount };
