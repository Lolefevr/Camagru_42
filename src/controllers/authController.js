const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../config/database"); // Import de la connexion à la base de données
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Fonction d'inscription (register)
exports.register = (req, res) => {
  const { email, password } = req.body;

  // Vérifie si l'utilisateur existe déjà
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur du serveur");
    }
    if (result.length > 0) {
      console.log("cet email est déjà utilisé");
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
  const { image } = req.body;
  const userId = req.userId; // Récupérer l'ID de l'utilisateur depuis le token JWT
  console.log(req.body);
  console.log("debut de fonction uploadImage");
  const { image, userId } = req.body;

  // Vérifie si c'est une image envoyée via la webcam (en Base64)
  if (image.startsWith("data:image/png;base64,")) {
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const filename = Date.now() + ".png";
    const filePath = path.join(__dirname, "../uploads/", filename);

    // Sauvegarder l'image sur le serveur
    fs.writeFile(filePath, base64Data, "base64", (err) => {
      console.log("debut de fonction writeFile");
      if (err) {
        console.log(err);
        console.log("Erreur lors de la sauvegarde de l'image 1");
        return res.status(500).send("Erreur lors de la sauvegarde de l'image");
      }

      // Sauvegarder le chemin de l'image dans la base de données
      db.query(
        "INSERT INTO images (user_id, image_path) VALUES (?, ?)",
        [userId, `/uploads/${filename}`],
        (err, result) => {
          if (err) {
            console.log(err);
            console.log("Erreur lors de la sauvegarde de l'image 2");
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
    console.log(err);
    console.log("format d'image non supporté");
    return res.status(400).send("Format d'image non supporté.");
  }
};

// Récupérer les images de tous les utilisateurs
exports.getImages = (req, res) => {
  db.query("SELECT * FROM images", (err, results) => {
    if (err) {
      console.log(err);
      console.log("Erreur lors de la récupération des images");
      return res.status(500).send("Erreur lors de la récupération des images");
    }
    res.status(200).json(results);
  });
};

// Fonction pour liker une image
exports.likeImage = (req, res) => {
  const imageId = req.params.imageId;

  // Incrémenter le compteur de likes pour l'image spécifiée
  db.query(
    "UPDATE images SET likes = likes + 1 WHERE id = ?",
    [imageId],
    (err, result) => {
      if (err) {
        return res.status(500).send("Erreur lors de l'enregistrement du like.");
      }

      // Récupérer le nouveau nombre de likes
      db.query(
        "SELECT likes FROM images WHERE id = ?",
        [imageId],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .send("Erreur lors de la récupération des likes.");
          }

          // Envoyer la nouvelle valeur de likes au client
          res.status(200).json({ likes: result[0].likes });
        }
      );
    }
  );
};
