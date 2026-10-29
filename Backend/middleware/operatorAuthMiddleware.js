const jwt = require("jsonwebtoken");

function authenticateOperatorToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      message: "Operator authentication required.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.OPERATOR_JWT_SECRET);

    // Accept only tokens created for operators.
    if (decoded.role !== "operator" || !decoded.operatorId) {
      return res.status(401).json({
        message: "Invalid operator token.",
      });
    }

    req.operator = {
      operatorId: decoded.operatorId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired operator token.",
    });
  }
}

module.exports = authenticateOperatorToken;
