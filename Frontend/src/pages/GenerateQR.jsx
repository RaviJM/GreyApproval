import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { apiFetch } from "../services/api";

function GenerateQR() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const [upiUrl, setUpiUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateQR(e) {
    e.preventDefault();

    setUpiUrl("");
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/api/qr/generateQR", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate QR");
      }

      setUpiUrl(data.paymentUrl);
      setTransactionId(data.transactionId);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container">
      <header className="topbar">
        <div>
          <p className="eyebrow">GREY APPROVER</p>
          <h1>Generate QR</h1>
          <p className="muted">
            Enter an amount to create a UPI payment QR code.
          </p>
        </div>

        <button
          className="button button-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <section className="panel generator-panel">
        {!upiUrl ? (
          <>
            <div className="section-heading">
              <h2>Payment details</h2>
              <p className="muted">Enter the amount you want to collect.</p>
            </div>

            <form onSubmit={generateQR} className="amount-form">
              <label htmlFor="amount">Amount (₹)</label>

              <input
                id="amount"
                type="number"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />

              <button
                type="submit"
                className="button button-primary"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate QR Code"}
              </button>
            </form>
          </>
        ) : (
          <div className="qr-result">
            <div className="success-indicator">QR code generated</div>

            <h2>Scan to pay</h2>
            <p className="muted">Open a UPI app and scan this QR code.</p>

            <div className="qr-frame">
              <QRCodeSVG value={upiUrl} size={260} level="M" marginSize={4} />
            </div>

            <p className="amount-display">₹{Number(amount).toFixed(2)}</p>

            <p>
              <u>Transaction ID-</u>
              <b> {transactionId} </b>
            </p>

            <button
              className="button button-primary"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>

            <button
              className="text-button"
              onClick={() => {
                setAmount("");
                setUpiUrl("");
                setError("");
              }}
            >
              Generate another QR
            </button>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </section>
    </main>
  );
}

export default GenerateQR;
