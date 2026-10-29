const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/db");

const router = express.Router();

// POST /api/operator/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "Username and password are required.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, password_hash
       FROM operator_users
       WHERE username = $1`,
      [username.trim()],
    );

    const operator = result.rows[0];

    if (
      !operator ||
      !(await bcrypt.compare(password, operator.password_hash))
    ) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      {
        operatorId: operator.id,
        role: "operator",
      },
      process.env.OPERATOR_JWT_SECRET,
      { expiresIn: "8h" },
    );

    return res.status(200).json({
      token,
      username: operator.username,
    });
  } catch (error) {
    console.error("Operator login failed:", error);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
});

module.exports = router;
