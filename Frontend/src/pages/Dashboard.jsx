import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/api";

const PAGE_SIZE = 10;

const statusDetails = {
  0: { label: "Processing", className: "processing" },
  1: { label: "Success", className: "success" },
  2: { label: "Processing", className: "processing" },
  3: { label: "Success", className: "success" },
  4: { label: "Reverted", className: "reverted" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [wallet, setWallet] = useState("0.00");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchTransactions = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoadingTransactions(true);
        }

        setTransactionError("");

        const query = new URLSearchParams({
          page: String(page),
        });

        const response = await apiFetch(
          `/api/qr/transactions?${query.toString()}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to fetch transaction history.",
          );
        }

        setTransactions(data.transactions);
        setWallet(data.wallet ?? "0.00");
        setTotalPages(data.totalPages);
        setTotalRecords(data.totalRecords);
      } catch (error) {
        setTransactionError(
          error.message || "Unable to fetch transaction history.",
        );
      } finally {
        setLoadingTransactions(false);
        setRefreshing(false);
      }
    },
    [page],
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function formatDateTime(dateTime) {
    if (!dateTime) return "-";

    return new Date(dateTime).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatAmount(amount) {
    return Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function getStatus(status) {
    return (
      statusDetails[status] || {
        label: "Unknown",
        className: "unknown",
      }
    );
  }

  function goToPage(nextPage) {
    if (nextPage >= 1 && nextPage <= totalPages && nextPage !== page) {
      setPage(nextPage);
    }
  }

  return (
    <main className="page-container client-dashboard">
      {/* Header */}
      <header className="topbar">
        <div className="dashboard-brand">
          <div className="brand-mark">B</div>

          <div>
            <div className="eyebrow">BETXDEPOSIT</div>
            <h1>Dashboard</h1>
            <p className="muted">Your payment activity, all in one place.</p>
          </div>
        </div>

        <div className="account-actions">
          <div className="wallet-info">
            <span className="wallet-label">Wallet Balance</span>
            <strong>₹{formatAmount(wallet)}</strong>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              {(userId || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <span className="user-label">Logged in as</span>
              <strong>{userId || "User"}</strong>
            </div>
          </div>

          <button className="button button-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Welcome section */}
      <section className="welcome-section">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h2>Welcome back!</h2>
          <p className="muted">
            Generate a QR code to start a payment request.
          </p>
        </div>

        <button
          className="button button-primary generate-button"
          onClick={() => navigate("/generate-qr")}
        >
          <span>+</span> Generate QR
        </button>
      </section>

      {/* Transaction history */}
      <section className="panel history-panel">
        <div className="section-heading">
          <div>
            <h2>Transaction History</h2>
            <p className="muted">
              {totalRecords} transaction
              {totalRecords === 1 ? "" : "s"} in your account
            </p>
          </div>

          <button
            className="button button-secondary refresh-button"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing || loadingTransactions}
            title="Refresh transaction history"
          >
            <span
              className={refreshing ? "refresh-icon spinning" : "refresh-icon"}
            >
              ↻
            </span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>QR Generated At</th>
              </tr>
            </thead>

            <tbody>
              {loadingTransactions ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactionError ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {transactionError}
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((transaction, index) => {
                  const status = getStatus(transaction.status);

                  return (
                    <tr key={transaction.id}>
                      <td>{(page - 1) * PAGE_SIZE + index + 1}</td>

                      <td className="transaction-id">
                        {transaction.transactionId}
                      </td>

                      <td className="amount-cell">
                        ₹{formatAmount(transaction.amount)}
                      </td>

                      <td>
                        <span
                          className={`client-status-badge status-${status.className}`}
                        >
                          <span className="status-dot" />
                          {status.label}
                        </span>
                      </td>

                      <td>{formatDateTime(transaction.createdAt)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="empty-icon">₹</div>
                    <strong>No transactions yet</strong>
                    <p className="muted">
                      Your generated QR code transactions will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loadingTransactions && !transactionError && totalPages > 0 && (
          <div className="client-pagination">
            <span className="pagination-info">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords}
            </span>

            <div className="pagination-controls">
              <button
                className="page-button"
                disabled={page === 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`page-button ${
                      page === pageNumber ? "current" : ""
                    }`}
                    aria-current={page === pageNumber ? "page" : undefined}
                    onClick={() => goToPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                className="page-button"
                disabled={page === totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="dashboard-footer">
        BetXDeposit · Payment Management
      </footer>
    </main>
  );
}
