const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../config/database");

// Fonction d'inscription (register)
exports.register = (req, res) => {
  const { email, password } = req.body;

  // Vérifie si l'utilisateur existe déjà
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur du serveur");
    }
    if (result.length > 0) {
      return res.status(400).send("Cet email est déjà utilisé.");
    }

    // Hacher le mot de passe et insérer l'utilisateur dans la base de données
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) throw err;
      db.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hash],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .send("Erreur du serveur lors de l'enregistrement");
          }

          // Générer un token JWT
          const token = jwt.sign(
            { id: result.insertId },
            process.env.JWT_SECRET,
            {
              expiresIn: "1h",
            }
          );
          res.status(201).json({ token });
        }
      );
    });
  });
};

// Fonction de connexion (login)
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Vérifier si l'utilisateur existe
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur du serveur");
    }
    if (result.length === 0) {
      return res.status(400).send("Utilisateur non trouvé.");
    }

    const user = result[0];

    // Comparer le mot de passe avec le hachage stocké
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;

      if (isMatch) {
        // Générer un token JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        res.json({ token });
      } else {
        res.status(400).send("Mot de passe incorrect");
      }
    });
  });
};
