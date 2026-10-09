const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "codecollab_secret_2026";

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token — please log in" });
  }

  try {
    const token   = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, username }
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};