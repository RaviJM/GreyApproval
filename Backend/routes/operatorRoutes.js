const express = require("express");
const pool = require("../db/db");

const router = express.Router();

const allowedStatuses = [0, 1, 2, 3, 4];

const statusMap = {
  pending: 0,
  confirmed: 1,
  rejected: 2,
  completed: 3,
  reverted: 4,
};

// Validate the internal transaction ID.
function isValidTransactionId(id) {
  return typeof id === "string" && /^[1-9]\d*$/.test(id);
}

// Common handler for single-query status transitions.
// The WHERE condition ensures the status has not already changed.
async function updateTransactionStatus(
  req,
  res,
  expectedStatus,
  newStatus,
  successMessage,
) {
  const { id } = req.params;

  if (!isValidTransactionId(id)) {
    return res.status(400).json({
      message: "Invalid transaction ID.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
         AND status = $3
       RETURNING id`,
      [newStatus, id, expectedStatus],
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        message:
          "Transaction status has already been updated. Please refresh the page.",
      });
    }

    return res.status(200).json({
      message: successMessage,
    });
  } catch (error) {
    console.error("Transaction status update failed:", error);

    return res.status(500).json({
      message: "Unable to update transaction status. Please try again.",
    });
  }
}

// =====================================================
// GET TRANSACTIONS
// GET /api/operator/transactions?status=0&page=1
// =====================================================

router.get("/transactions", async (req, res) => {
  const status = req.query.status === undefined ? 0 : Number(req.query.status);

  const page = Number.parseInt(req.query.page, 10);

  if (!Number.isInteger(status) || !allowedStatuses.includes(status)) {
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

// =====================================================
// 1. REJECT TRANSACTION
// POST /api/operator/transactions/:id/reject
// Pending (0) -> Rejected (2)
// =====================================================

router.post("/transactions/:id/reject", async (req, res) => {
  return updateTransactionStatus(
    req,
    res,
    0,
    2,
    "Transaction rejected successfully.",
  );
});

// =====================================================
// 2. CONFIRM TRANSACTION
// POST /api/operator/transactions/:id/confirm
// Pending (0) -> Confirmed (1) + Wallet credit
// =====================================================

router.post("/transactions/:id/confirm", async (req, res) => {
  const { id } = req.params;

  if (!isValidTransactionId(id)) {
    return res.status(400).json({
      message: "Invalid transaction ID.",
    });
  }

  const db = await pool.connect();

  try {
    // Start PostgreSQL transaction.
    await db.query("BEGIN");

    // Only update if the transaction is still Pending.
    const transactionResult = await db.query(
      `UPDATE transactions
       SET status = 1,
           updated_at = NOW()
       WHERE id = $1
         AND status = 0
       RETURNING user_id, amount`,
      [id],
    );

    if (transactionResult.rowCount === 0) {
      await db.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Transaction status has already been updated. Please refresh the page.",
      });
    }

    const transaction = transactionResult.rows[0];

    // Credit the corresponding user's wallet.
    const walletResult = await db.query(
      `UPDATE users
       SET wallet = wallet + $1
       WHERE id = $2
       RETURNING id`,
      [transaction.amount, transaction.user_id],
    );

    // If the user does not exist, roll back the status update too.
    if (walletResult.rowCount === 0) {
      await db.query("ROLLBACK");

      return res.status(500).json({
        message:
          "Unable to credit the user's wallet. Transaction was not confirmed.",
      });
    }

    // Both updates succeeded. Commit them together.
    await db.query("COMMIT");

    return res.status(200).json({
      message: "Transaction confirmed and wallet credited successfully.",
    });
  } catch (error) {
    // If anything fails, undo all changes.
    try {
      await db.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Transaction rollback failed:", rollbackError);
    }

    console.error("Transaction confirmation failed:", error);

    return res.status(500).json({
      message:
        "Unable to confirm transaction or credit wallet. No changes were saved.",
    });
  } finally {
    db.release();
  }
});

// =====================================================
// 3. REVERT TRANSACTION
// POST /api/operator/transactions/:id/revert
// Confirmed (1) -> Reverted (4)
// =====================================================

router.post("/transactions/:id/revert", async (req, res) => {
  const { id } = req.params;

  if (!isValidTransactionId(id)) {
    return res.status(400).json({
      message: "Invalid transaction ID.",
    });
  }

  const db = await pool.connect();

  try {
    // Start PostgreSQL transaction.
    await db.query("BEGIN");

    // Only revert if the transaction is currently Confirmed.
    const transactionResult = await db.query(
      `UPDATE transactions
       SET status = 4,
           updated_at = NOW()
       WHERE id = $1
         AND status = 1
       RETURNING user_id, amount`,
      [id],
    );

    if (transactionResult.rowCount === 0) {
      await db.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Transaction status has already been updated. Please refresh the page.",
      });
    }

    const transaction = transactionResult.rows[0];

    // Subtract the transaction amount from the user's wallet.
    const walletResult = await db.query(
      `UPDATE users
       SET wallet = wallet - $1
       WHERE id = $2
       RETURNING id`,
      [transaction.amount, transaction.user_id],
    );

    // If wallet update fails, roll back the status update too.
    if (walletResult.rowCount === 0) {
      await db.query("ROLLBACK");

      return res.status(500).json({
        message:
          "Unable to debit the user's wallet. Transaction was not reverted.",
      });
    }

    // Both updates succeeded.
    await db.query("COMMIT");

    return res.status(200).json({
      message: "Transaction reverted and wallet debited successfully.",
    });
  } catch (error) {
    try {
      await db.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Transaction rollback failed:", rollbackError);
    }

    console.error("Transaction revert failed:", error);

    return res.status(500).json({
      message:
        "Unable to revert transaction or debit wallet. No changes were saved.",
    });
  } finally {
    db.release();
  }
});

// =====================================================
// 4. COMPLETE TRANSACTION
// POST /api/operator/transactions/:id/complete
// Confirmed (1) -> Completed (3)
// =====================================================

router.post("/transactions/:id/complete", async (req, res) => {
  return updateTransactionStatus(
    req,
    res,
    1,
    3,
    "Transaction marked as completed successfully.",
  );
});

module.exports = router;
