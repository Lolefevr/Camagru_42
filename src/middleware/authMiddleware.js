const jwt = require("jsonwebtoken");
const db = require("../../config/database");

const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Récupérer le token depuis le cookie

  if (!token) {
    if (req.accepts("html")) {
      return res.redirect("/");
    } else {
      return res.status(403).json({ message: "Un token est requis." });
    }
  }

  // Vérifier le token JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (req.accepts("html")) {
        return res.redirect("/");
      } else {
        return res.status(401).json({ message: "Token invalide ou expiré." });
      }
    }

    // Vérifier que l'utilisateur existe dans la base de données
    const userId = decoded.id;
    db.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
      if (err) {
        console.error("Erreur lors de la requête à la base de données :", err);
        return res.status(500).send("Erreur du serveur.");
      }

      if (result.length === 0) {
        if (req.accepts("html")) {
          return res.redirect("/");
        } else {
          return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
      }

      // Utilisateur trouvé, continuer
      req.userId = userId;
      next();
    });
  });
};

module.exports = verifyToken;
