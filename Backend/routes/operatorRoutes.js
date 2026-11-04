const express = require("express");
const pool = require("../db/db");

const router = express.Router();

// GET /api/operator/transactions?status=0&page=1
router.get("/transactions", async (req, res) => {
  const status = Number(req.query.status ?? 0);

  const page = Number.parseInt(req.query.page, 10);

  if (!Number.isInteger(status) || ![0, 1, 2, 4, 5].includes(status)) {
    return res.status(400).json({
      message: "Invalid transaction status.",
    });
  }

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({
      message: "Page must be a positive integer.",
    });
  }

  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM transactions
       WHERE status = $1`,
      [status],
    );

    const totalRecords = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / pageSize);

    const result = await pool.query(
      `SELECT
         t.id,
         u.user_id AS "userName",
         t.transaction_uid AS "transactionId",
         t.amount,
         t.status,
         t.created_at AS "createdAt"
       FROM transactions t
       INNER JOIN users u ON u.id = t.user_id
       WHERE t.status = $1
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT $2 OFFSET $3`,
      [status, pageSize, offset],
    );

    return res.status(200).json({
      status,
      page,
      pageSize,
      totalRecords,
      totalPages,
      transactions: result.rows,
    });
  } catch (error) {
    console.error("Operator transaction listing failed:", error);

    return res.status(500).json({
      message: "Unable to fetch transactions.",
    });
  }
});

module.exports = router;
