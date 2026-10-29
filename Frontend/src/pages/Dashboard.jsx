import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingTransactions(true);
      }

      setTransactionError("");

      const response = await apiFetch("/api/qr/transactions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch transaction history.");
      }

      setTransactions(data.transactions);
    } catch (error) {
      setTransactionError(error.message);
    } finally {
      setLoadingTransactions(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  return (
    <main className="page-container">
      <header className="topbar">
        <div>
          <div className="eyebrow">BetXDeposit</div>
          <h1>Dashboard</h1>
          <p className="muted">
            Manage your payment QR codes and transactions.
          </p>
        </div>

        <div className="account-actions">
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

      <section className="welcome-section">
        <div>
          <h2>Welcome back!</h2>
          <p className="muted">
            Generate a QR code to start a payment request.
          </p>
        </div>

        <button
          className="button button-primary"
          onClick={() => navigate("/generate-qr")}
        >
          + Generate QR
        </button>
      </section>

      <section className="panel history-panel">
        <div className="section-heading">
          <div>
            <h2>Transaction History</h2>
            <p className="muted">View your generated payment QR codes.</p>
          </div>

          <button
            className="button button-secondary refresh-button"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
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
                transactions.map((transaction, index) => (
                  <tr key={transaction.id}>
                    <td>{index + 1}</td>
                    <td>{transaction.transactionId}</td>
                    <td>₹{Number(transaction.amount).toFixed(2)}</td>
                    <td>
                      {{
                        0: "Processing",
                        1: "Success",
                        2: "Declined",
                        3: "Expired",
                      }[transaction.status] ?? "Unknown"}
                    </td>
                    <td>{formatDateTime(transaction.createdAt)}</td>
                  </tr>
                ))
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
      </section>

      <footer className="dashboard-footer">
        BetXDeposit · Payment Management
      </footer>
    </main>
  );
}
