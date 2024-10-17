const jwt = require("jsonwebtoken");
const db = require("../../config/database");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "Un token est requis." });
  }

  // Décoder le token JWT
  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token invalide ou expiré." });
    }

    // Vérifier que l'utilisateur existe dans la base de données
    const userId = decoded.id;
    db.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
      if (err) {
        return res.status(500).send("Erreur du serveur.");
      }

      if (result.length === 0) {
        // L'utilisateur n'existe plus dans la base de données
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // Utilisateur trouvé, continuer
      req.userId = userId;
      next();
    });
  });
};

module.exports = verifyToken;
