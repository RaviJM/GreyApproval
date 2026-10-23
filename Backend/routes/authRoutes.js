const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/db");

const router = express.Router();

// POST /api/signup
router.post("/signup", async (req, res) => {
  const { userId, password } = req.body;

  if (
    typeof userId !== "string" ||
    typeof password !== "string" ||
    !userId.trim() ||
    password.length < 8 ||
    password.length > 72
  ) {
    return res.status(400).json({
      message: "Enter a user ID and a password of 8–72 characters.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO users (user_id, password_hash)
       VALUES ($1, $2)`,
      [userId.trim(), passwordHash],
    );

    return res.status(201).json({
      message: "Account created successfully. Please log in.",
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "That user ID is already registered.",
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      message: "Could not create account.",
    });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  const { userId, password } = req.body;

  if (
    typeof userId !== "string" ||
    typeof password !== "string" ||
    !userId.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "User ID and password are required.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, password_hash
       FROM users
       WHERE user_id = $1`,
      [userId.trim()],
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      userId: user.user_id,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Could not log in.",
    });
  }
});

module.exports = router;
