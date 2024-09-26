const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).send("Un token est requis.");

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send("Token invalide.");
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;
