const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User } = require("../models");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const admin = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username
      }
    });
  } catch (_error) {
    return res.status(500).json({ message: "Login failed." });
  }
}

module.exports = { login };
