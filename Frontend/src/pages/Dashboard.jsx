import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();

  // Temporary empty array until we connect the API.
  // Later, transaction records will come from the backend.
  const transactions = [];

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
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <tr key={transaction.id}>
                    <td>{index + 1}</td>
                    <td>{transaction.transactionId}</td>
                    <td>₹{Number(transaction.amount).toFixed(2)}</td>
                    <td>{transaction.status}</td>
                    <td>{formatDateTime(transaction.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="empty-state">
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
