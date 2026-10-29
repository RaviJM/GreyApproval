const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const qrRoutes = require("./routes/qrRoutes");
const authenticateToken = require("./middleware/authMiddleware");

const operatorAuthRoutes = require("./routes/operatorAuthRoutes");
const operatorRoutes = require("./routes/operatorRoutes");
const authenticateOperatorToken = require("./middleware/operatorAuthMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Public API
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// Public client authentication
app.use("/api/auth", authRoutes);

// Public operator login
app.use("/api/operator/auth", operatorAuthRoutes);

// Client APIs: require the client JWT
app.use("/api/qr", authenticateToken, qrRoutes);

// Operator APIs: require the operator JWT
app.use("/api/operator", authenticateOperatorToken, operatorRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
