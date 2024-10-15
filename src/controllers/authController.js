const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../config/database"); // Import de la connexion à la base de données
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

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
exports.uploadImage = async (req, res) => {
  const { image, frame, userId } = req.body;

  // Vérifier si c'est une image envoyée via la webcam (Base64)
  if (!image.startsWith("data:image/png;base64,")) {
    return res.status(400).send("Format d'image non supporté.");
  }

  const base64Data = image.replace(/^data:image\/png;base64,/, "");
  const userImageBuffer = Buffer.from(base64Data, "base64");
  const filename = Date.now() + ".png";
  const filePath = path.join(__dirname, "../uploads/", filename);

  try {
    // Enregistrer temporairement l'image de l'utilisateur
    fs.writeFileSync(filePath, userImageBuffer);

    if (frame) {
      const framePath = path.join(__dirname, "../frames/", `${frame}.png`);

      // Charger l'image de l'utilisateur et le cadre
      const finalImage = await sharp(userImageBuffer)
        .composite([{ input: framePath, gravity: "center" }]) // Superposition du cadre
        .toBuffer();

      // Sauvegarder l'image finale
      fs.writeFileSync(filePath, finalImage);

      // Enregistrer le chemin dans la base de données
      db.query(
        "INSERT INTO images (user_id, image_path) VALUES (?, ?)",
        [userId, `/uploads/${filename}`],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .send("Erreur lors de l'enregistrement de l'image.");
          }
          res
            .status(200)
            .send({ message: "Image sauvegardée avec succès", file: filename });
        }
      );
    } else {
      // Si aucun cadre n'est sélectionné, on sauvegarde seulement l'image utilisateur
      res
        .status(200)
        .send({ message: "Image sauvegardée sans cadre", file: filename });
    }
  } catch (err) {
    console.error("Erreur lors de la création du montage :", err);
    res.status(500).send("Erreur lors du traitement de l'image");
  }
};

// Fonction pour lister les fichiers de calques
exports.getFrames = (req, res) => {
  const framesDir = path.join(__dirname, "../frames"); // Assure-toi que ce chemin est correct

  // Lire le contenu du dossier
  fs.readdir(framesDir, (err, files) => {
    if (err) {
      console.error(
        "Erreur lors de la lecture des fichiers dans frames :",
        err
      );
      return res.status(500).send("Erreur lors de la récupération des frames.");
    }

    // Filtrer uniquement les fichiers PNG
    const frameFiles = files.filter((file) => file.endsWith(".png"));
    res.status(200).json(frameFiles); // Retourner la liste des fichiers au format JSON
  });
};

// Récupérer les images de tous les utilisateurs
exports.getImages = (req, res) => {
  db.query("SELECT * FROM images", (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des images :", err);
      return res.status(500).send("Erreur lors de la récupération des images.");
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

// Fonction pour ajouter un commentaire
exports.addComment = (req, res) => {
  const { userId, comment } = req.body; // Récupérer le userId et le commentaire
  const imageId = req.params.imageId; // L'ID de l'image à commenter

  // Vérifier que le commentaire n'est pas vide
  if (!comment || comment.trim() === "") {
    return res.status(400).send("Le commentaire ne peut pas être vide.");
  }

  // Insérer le commentaire dans la base de données
  db.query(
    "INSERT INTO comments (image_id, user_id, comment) VALUES (?, ?, ?)",
    [imageId, userId, comment],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erreur lors de l'ajout du commentaire.");
      }
      res.status(201).send({ message: "Commentaire ajouté avec succès." });
    }
  );
};

// Fonction pour récupérer les commentaires d'une image
exports.getComments = (req, res) => {
  const imageId = req.params.imageId;

  db.query(
    "SELECT comments.comment, comments.created_at, users.email FROM comments JOIN users ON comments.user_id = users.id WHERE image_id = ? ORDER BY comments.created_at DESC",
    [imageId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .send("Erreur lors de la récupération des commentaires.");
      }
      res.status(200).json(results);
    }
  );
};
