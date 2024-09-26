// controllers/userController.js
const bcrypt = require("bcrypt");
const db = require("../config/db"); // Vérifie que le chemin est correct
const multer = require("multer");
const path = require("path");

const fs = require("fs");

// Configurer multer pour stocker les images dans un dossier local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Les images seront sauvegardées dans le dossier "uploads"
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique pour chaque fichier
  },
});
const upload = multer({ storage: storage });
// Gestion de l'upload d'images (via fichier ou via base64 pour la webcam)
exports.uploadImage = (req, res) => {
  const { image, userId } = req.body;

  // Vérifie si c'est une image envoyée via la webcam (en Base64)
  if (image.startsWith("data:image/png;base64,")) {
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const filename = Date.now() + ".png";
    const filePath = path.join(__dirname, "../uploads/", filename);

    // Sauvegarder l'image sur le serveur
    fs.writeFile(filePath, base64Data, "base64", (err) => {
      if (err) {
        return res.status(500).send("Erreur lors de la sauvegarde de l'image");
      }

      // Sauvegarder le chemin de l'image dans la base de données
      db.query(
        "INSERT INTO images (user_id, image_path) VALUES (?, ?)",
        [userId, `/uploads/${filename}`],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .send("Erreur du serveur lors de l'enregistrement de l'image");
          }
          res
            .status(200)
            .send({ message: "Image sauvegardée avec succès", file: filename });
        }
      );
    });
  } else {
    return res.status(400).send("Format d'image non supporté.");
  }
};

exports.register = (req, res) => {
  const { username, email, password } = req.body;

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
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hash],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .send("Erreur du serveur lors de l'enregistrement");
          }
          res.status(200).send("Utilisateur enregistré avec succès");
        }
      );
    });
  });
};

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
        res.status(200).send("Connexion réussie");
      } else {
        res.status(400).send("Mot de passe incorrect");
      }
    });
  });
};
