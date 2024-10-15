const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).json({ message: "Un token est requis." }); // JSON response

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Erreur JWT : ", err); // Log l'erreur de vérification JWT
      return res.status(401).json({ message: "Token invalide." });
    }
    console.log("Token décodé : ", decoded); // Log le contenu du token
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;
