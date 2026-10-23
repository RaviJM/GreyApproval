const express = require("express");
const pool = require("../db/db");

const router = express.Router();

// POST /api/qr/generateQR
router.post("/generateQR", async (req, res) => {
  // Step 1: Extract and validate authenticated user ID
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      message: "User authentication required.",
    });
  }

  // Step 2: Validate amount
  const amount = Number(req.body.amount);

  if (
    req.body.amount === undefined ||
    req.body.amount === null ||
    req.body.amount === "" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.round(amount * 100) !== amount * 100
  ) {
    return res.status(400).json({
      message: "Please provide a valid amount.",
    });
  }

  try {
    // Step 3: Generate the UPI payment URL
    const pa = "ravi.mak2003@oksbi";
    const pn = "Ravi Makwana";
    const am = amount.toFixed(2);
    const cu = "INR";
    const aid = "uGICAgIC_sZiASw"; // Account-specific ID

    const paymentUrl =
      `upi://pay?pa=${pa}` +
      `&pn=${encodeURIComponent(pn)}` +
      `&am=${am}` +
      `&cu=${cu}` +
      `&aid=${aid}`;

    // Step 4: Insert transaction after URL generation
    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, status)
      VALUES ($1, $2, $3)
      RETURNING transaction_uid`,
      [userId, amount, 0],
    );

    // Step 5: Return URL only if the DB insert succeeds
    return res.status(201).json({
      message: "QR generated successfully",
      paymentUrl,
      transactionId: result.rows[0].transaction_uid,
    });
  } catch (error) {
    console.error("QR generation failed:", error);

    return res.status(500).json({
      message: "Unable to generate the payment QR. Please try again.",
    });
  }
});

module.exports = router;
