const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const qrRoutes = require("./routes/qrRoutes");
const authenticateToken = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Public API
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// Public authentication APIs
app.use("/api/auth", authRoutes);

// All routes mounted below this middleware require authentication
app.use("/api", authenticateToken);

// Protected APIs
app.use("/api/qr", qrRoutes);

// Example protected API to test authentication
app.get("/api/profile", (req, res) => {
  res.json({
    message: "Authenticated successfully!",
    userId: req.user.userId,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
