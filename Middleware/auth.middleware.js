const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = function authenticateToken(req, res, next) {
  const token = req.cookies.auth_token; // Get the token from cookies

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. Please log in first." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Not an admin." });
    }

    req.user = decoded; // Attach decoded user info to the request object

    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired token. Please log in again." });
  }
};

module.exports = authMiddleware;
