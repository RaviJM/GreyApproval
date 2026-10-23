import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();

  return (
    <main className="page-container">
      <header className="topbar">
        <div>
          <p className="eyebrow">BetXDeposit</p>
          <h1>Dashboard</h1>
          <p className="muted">Manage your payment collection activity.</p>
        </div>

        <div className="account-actions">
          <div className="user-info">
            <span className="user-avatar">
              {userId ? String(userId).charAt(0).toUpperCase() : "U"}
            </span>

            <div>
              <span className="user-label">Signed in as</span>
              <strong>{userId || "User"}</strong>
            </div>
          </div>

          <button className="button button-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="welcome-section">
        <div>
          <h2>Welcome back</h2>
          <p className="muted">
            Create a payment QR code or review your transaction history.
          </p>
        </div>

        <button
          className="button button-primary"
          onClick={() => navigate("/generate-qr")}
        >
          <span aria-hidden="true">＋</span> Generate QR
        </button>
      </section>

      <section className="panel history-panel">
        <div className="section-heading">
          <div>
            <h2>Transaction history</h2>
            <p className="muted">Your recent payment collection activity.</p>
          </div>

          <span className="coming-soon">History API pending</span>
        </div>

        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created at</th>
                <th>Updated at</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={6} className="empty-state">
                  <div className="empty-icon" aria-hidden="true">
                    ↗
                  </div>
                  <strong>No transactions to display</strong>
                  <p className="muted">
                    Your transactions will appear here once the history API is
                    connected.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="dashboard-footer">
        Grey Approver · Payment collection dashboard
      </footer>
    </main>
  );
}

export default Dashboard;
