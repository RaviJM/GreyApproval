const express = require("express");
const pool = require("../db/db");

const router = express.Router();

const statusMap = {
  pending: 0,
  confirmed: 1,
  rejected: 2,
  reverted: 4,
  completed: 5,
};

// GET /api/operator/transactions?status=pending&page=1
router.get("/transactions", async (req, res) => {
  const statusName = String(req.query.status || "pending").toLowerCase();
  const status = statusMap[statusName];

  const page = Number.parseInt(req.query.page, 10);

  if (status === undefined) {
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
      status: statusName,
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
