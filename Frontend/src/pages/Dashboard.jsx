import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const [amount, setAmount] = useState("");
  const [upiUrl, setUpiUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { logout } = useAuth();

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
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function goToGeneratePage() {
    setAmount("");
    setUpiUrl("");
    setError("");
    setLoading(false);
  }

  return (
    <div>
      <h2>BetXDeposit</h2>

      <button onClick={logout}>Logout</button>

      {!upiUrl ? (
        <form onSubmit={generateQR}>
          <label htmlFor="amount">Enter Amount (₹)</label>
          <br />

          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />

          <br />
          <br />

          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate QR Code"}
          </button>
        </form>
      ) : (
        <div>
          <QRCodeSVG value={upiUrl} size={300} level="M" marginSize={4} />

          <p>Amount: ₹{Number(amount).toFixed(2)}</p>

          <button onClick={goToGeneratePage}>Generate Another QR Code</button>
        </div>
      )}

      {error && <p>{error}</p>}
    </div>
  );
}

export default Dashboard;
