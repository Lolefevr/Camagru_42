const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).json({ message: "Un token est requis." }); // JSON response

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token invalide." }); // JSON response
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;
