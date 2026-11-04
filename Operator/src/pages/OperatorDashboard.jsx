import { useCallback, useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

const tabs = [
  { label: "Pending", value: 0 },
  { label: "Confirmed", value: 1 },
  { label: "Rejected", value: 2 },
  { label: "Completed", value: 3 },
  { label: "Reverted", value: 4 },
];

const statusLabels = {
  0: "Pending",
  1: "Confirmed",
  2: "Rejected",
  3: "Completed",
  4: "Reverted",
};

export default function OperatorDashboard() {
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [processingAction, setProcessingAction] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("operatorToken");
    localStorage.removeItem("operatorUsername");
    navigate("/login", { replace: true });
  }, [navigate]);

  const fetchTransactions = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const query = new URLSearchParams({
          status: selectedTab,
          page: String(page),
        });

        const response = await apiFetch(
          `/api/operator/transactions?${query.toString()}`,
        );

        const data = await response.json();

        if (response.status === 401) {
          logout();
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch transactions.");
        }

        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
        setTotalRecords(data.totalRecords);
      } catch (error) {
        setError(error.message || "Unable to connect to the server.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedTab, page, logout],
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function handleTabChange(tab) {
    setSelectedTab(tab);
    setPage(1);
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

  const username = localStorage.getItem("operatorUsername") || "Operator";

  async function handleTransactionAction(transaction, action) {
    const transactionId = String(transaction.id);

    setProcessingAction({
      id: transactionId,
      action,
    });

    try {
      const response = await apiFetch(
        `/api/operator/transactions/${encodeURIComponent(transactionId)}/${action}`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to update transaction.");
      }

      toast.success(data.message, {
        autoClose: 2000,
      });

      setSelectedTransaction(null);
      setPendingAction(null);

      await fetchTransactions(true);
    } catch (error) {
      toast.error(error.message || "Unable to connect to the server.", {
        autoClose: 3000,
      });
    } finally {
      setProcessingAction(null);
    }
  }

  function openActionModal(transaction, action) {
    setSelectedTransaction(transaction);
    setPendingAction(action);
  }

  return (
    <main className="operator-page">
      <header className="operator-topbar">
        <div className="operator-brand">
          <div className="brand-mark small">B</div>
          <div>
            <p className="eyebrow">BETXDEPOSIT</p>
            <h1>Operator Console</h1>
          </div>
        </div>

        <div className="operator-account">
          <div className="operator-avatar">
            {username.charAt(0).toUpperCase()}
          </div>
          <span>{username}</span>
          <button className="button button-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="operator-content">
        <div className="page-intro">
          <div>
            <p className="eyebrow">PAYMENTS</p>
            <h2>Transaction Management</h2>
            <p className="muted">Review and track client payment requests.</p>
          </div>

          <button
            className="button button-secondary"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing || loading}
          >
            <span
              className={refreshing ? "refresh-icon spinning" : "refresh-icon"}
            >
              ↻
            </span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <section className="listing-card">
          <div className="tabs" role="tablist" aria-label="Transaction status">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selectedTab === tab.value}
                className={`tab ${selectedTab === tab.value ? "active" : ""}`}
                onClick={() => handleTabChange(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="listing-summary">
            <div>
              <h3>
                {tabs.find((tab) => tab.value === selectedTab)?.label}{" "}
                transactions
              </h3>
              <p className="muted">
                {totalRecords} record{totalRecords === 1 ? "" : "s"} found
              </p>
            </div>

            {!loading && totalPages > 0 && (
              <span className="page-indicator">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="table-wrapper">
            <table className="operator-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>User Name</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>QR Generated At</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="table-message">
                      Loading transactions...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="table-message">
                      Transactions couldn't be loaded.
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-message">
                      <div className="empty-icon">₹</div>
                      <strong>
                        No{" "}
                        {tabs
                          .find((tab) => tab.value === selectedTab)
                          ?.label.toLowerCase()}{" "}
                        transactions
                      </strong>
                      <p className="muted">
                        Transactions matching this status will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => (
                    <tr key={transaction.id}>
                      <td>{(page - 1) * 10 + index + 1}</td>
                      <td>{transaction.userName}</td>
                      <td className="transaction-id">
                        {transaction.transactionId}
                      </td>
                      <td className="amount-cell">
                        ₹{Number(transaction.amount).toFixed(2)}
                      </td>

                      <td>
                        <div className="status-cell">
                          <span
                            className={`status-badge status-${statusLabels[
                              transaction.status
                            ]?.toLowerCase()}`}
                          >
                            {statusLabels[transaction.status] || "Unknown"}
                          </span>

                          {/*
      Pending tab: Reject + Confirm
    */}
                          {selectedTab === 0 && (
                            <div className="transaction-actions">
                              <button
                                type="button"
                                className="action-button action-reject"
                                disabled={
                                  processingAction?.id ===
                                  String(transaction.id)
                                }
                                onClick={() =>
                                  openActionModal(transaction, "reject")
                                }
                              >
                                {processingAction?.id ===
                                  String(transaction.id) &&
                                processingAction.action === "reject"
                                  ? "Rejecting..."
                                  : "Reject"}
                              </button>

                              <button
                                type="button"
                                className="action-button action-confirm"
                                disabled={
                                  processingAction?.id ===
                                  String(transaction.id)
                                }
                                onClick={() =>
                                  openActionModal(transaction, "confirm")
                                }
                              >
                                {processingAction?.id ===
                                  String(transaction.id) &&
                                processingAction.action === "confirm"
                                  ? "Confirming..."
                                  : "Confirm"}
                              </button>
                            </div>
                          )}

                          {/*
      Confirmed tab: Revert + Complete
    */}
                          {selectedTab === 1 && (
                            <div className="transaction-actions">
                              <button
                                type="button"
                                className="action-button action-revert"
                                disabled={
                                  processingAction?.id ===
                                  String(transaction.id)
                                }
                                onClick={() =>
                                  openActionModal(transaction, "revert")
                                }
                              >
                                {processingAction?.id ===
                                  String(transaction.id) &&
                                processingAction.action === "revert"
                                  ? "Reverting..."
                                  : "Revert"}
                              </button>

                              <button
                                type="button"
                                className="action-button action-complete"
                                disabled={
                                  processingAction?.id ===
                                  String(transaction.id)
                                }
                                onClick={() =>
                                  openActionModal(transaction, "complete")
                                }
                              >
                                {processingAction?.id ===
                                  String(transaction.id) &&
                                processingAction.action === "complete"
                                  ? "Completing..."
                                  : "Complete"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>{formatDateTime(transaction.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && !error && totalPages > 0 && (
            <nav className="pagination" aria-label="Transaction pages">
              <button
                className="page-button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
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
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                className="page-button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </section>

        <footer className="operator-footer">
          BetXDeposit · Operator Console
        </footer>
      </section>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />

      {selectedTransaction && pendingAction && (
        <div
          className="confirmation-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !processingAction) {
              setSelectedTransaction(null);
              setPendingAction(null);
            }
          }}
        >
          <div
            className={`confirmation-modal modal-${pendingAction}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
          >
            <div className="modal-top">
              <div className="modal-icon">
                {
                  {
                    confirm: "✓",
                    reject: "×",
                    revert: "↶",
                    complete: "✓✓",
                  }[pendingAction]
                }
              </div>

              <button
                type="button"
                className="modal-close"
                disabled={!!processingAction}
                onClick={() => {
                  setSelectedTransaction(null);
                  setPendingAction(null);
                }}
              >
                ×
              </button>
            </div>

            <p className="modal-eyebrow">TRANSACTION ACTION</p>

            <h2 id="confirmation-title">
              {
                {
                  confirm: "Confirm this transaction?",
                  reject: "Reject this transaction?",
                  revert: "Revert this transaction?",
                  complete: "Complete this transaction?",
                }[pendingAction]
              }
            </h2>

            <p className="modal-description">
              {
                {
                  confirm:
                    "Please review the payment details before confirming.",
                  reject:
                    "Are you sure you want to reject this payment request?",
                  revert:
                    "Please confirm that the amount has actually been reverted to the client's account.",
                  complete:
                    "Are you sure you want to mark this transaction as completed?",
                }[pendingAction]
              }
            </p>

            <div className="modal-amount-card">
              <span>Transaction Amount</span>
              <strong>₹{Number(selectedTransaction.amount).toFixed(2)}</strong>
            </div>

            <div className="modal-details">
              <div className="modal-detail-row">
                <span>Client Name</span>
                <strong>{selectedTransaction.userName}</strong>
              </div>

              <div className="modal-detail-row">
                <span>Transaction ID</span>
                <strong className="modal-transaction-id">
                  {selectedTransaction.transactionId}
                </strong>
              </div>

              <div className="modal-detail-row">
                <span>QR Generated At</span>
                <strong>{formatDateTime(selectedTransaction.createdAt)}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel-button"
                disabled={!!processingAction}
                onClick={() => {
                  setSelectedTransaction(null);
                  setPendingAction(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`modal-confirm-button modal-confirm-${pendingAction}`}
                disabled={!!processingAction}
                onClick={() =>
                  handleTransactionAction(selectedTransaction, pendingAction)
                }
              >
                {processingAction
                  ? {
                      confirm: "Confirming...",
                      reject: "Rejecting...",
                      revert: "Reverting...",
                      complete: "Completing...",
                    }[pendingAction]
                  : {
                      confirm: "Yes, Confirm",
                      reject: "Yes, Reject",
                      revert: "Yes, Revert",
                      complete: "Yes, Complete",
                    }[pendingAction]}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
