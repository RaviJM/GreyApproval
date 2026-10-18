const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("QR Code API is running!");
});

app.post("/api/generateQR", (req, res) => {
  const amount = Number(req.body.amount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.round(amount * 100) !== amount * 100
  ) {
    return res.status(400).json({
      message: "Enter a valid amount with at most two decimal places.",
    });
  }

  const pa = "ravi.mak2003@oksbi";
  const pn = "Ravi Makwana";
  const am = amount.toFixed(2);
  const cu = "INR";
  const aid = "uGICAgIC_sZiASw"; // id is specific to account

  // Encode only the payee name
  const paymentUrl =
    `upi://pay?pa=${pa}` +
    `&pn=${encodeURIComponent(pn)}` +
    `&am=${am}` +
    `&cu=${cu}` +
    `&aid=${aid}`;

  res.json({
    message: "QR generated successfully",
    paymentUrl,
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
