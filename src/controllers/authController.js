const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../config/database"); // Import de la connexion à la base de données
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const transporter = require("../../config/emailConfig");

// Fonction pour vérifier le token (utilisée par /verify-token)
exports.verifyToken = (req, res) => {
  res.status(200).json({ valid: true });
};

// Fonction de déconnexion (logout)
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Déconnexion réussie" });
};

// Fonction d'inscription (register)
// Fonction d'inscription (register)
exports.register = (req, res) => {
  const { email, username, password } = req.body; // Inclure username

  // Vérifie si l'utilisateur existe déjà par email ou par username
  db.query(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [email, username],
    (err, result) => {
      if (err) {
        return res.status(500).send("Erreur du serveur");
      }
      if (result.length > 0) {
        if (result[0].email === email) {
          return res.status(400).send("Cet email est déjà utilisé.");
        }
        if (result[0].username === username) {
          return res.status(400).send("Ce nom d'utilisateur est déjà utilisé.");
        }
      }

      // Hacher le mot de passe et insérer l'utilisateur dans la base de données
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) throw err;
        db.query(
          "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
          [email, username, hash],
          (err, result) => {
            if (err) {
              return res
                .status(500)
                .send("Erreur du serveur lors de l'enregistrement");
            }

            const userId = result.insertId;

            // Générer un jeton de vérification JWT
            const verificationToken = jwt.sign(
              { id: userId },
              process.env.JWT_SECRET,
              { expiresIn: "24h" } // Le jeton expire après 24 heures
            );

            // Stocker le jeton de vérification dans la base de données
            db.query(
              "UPDATE users SET verificationToken = ? WHERE id = ?",
              [verificationToken, userId],
              (err, updateResult) => {
                if (err) {
                  return res
                    .status(500)
                    .send(
                      "Erreur du serveur lors de la mise à jour de l'utilisateur"
                    );
                }

                // Construire le lien de vérification
                const verificationLink = `http://localhost:3000/auth/verify-email?token=${verificationToken}`;

                // Définir les options de l'email
                const mailOptions = {
                  from: '"Camagru Support" illidan888@hotmail.fr', // Remplacez par votre adresse email vérifiée
                  to: email,
                  subject: "Vérification de votre compte Camagru",
                  html: `
					<p>Merci de vous être inscrit sur Camagru !</p>
					<p>Veuillez cliquer sur le lien suivant pour vérifier votre adresse email :</p>
					<a href="${verificationLink}">Vérifier mon email</a>
					<p>Ce lien expirera dans 24 heures.</p>
				  `,
                };

                // Envoyer l'email de vérification
                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    console.error(
                      "Erreur lors de l'envoi de l'email de vérification :",
                      error
                    );
                    return res
                      .status(500)
                      .send(
                        "Erreur lors de l'envoi de l'email de vérification"
                      );
                  }
                  console.log("Email de vérification envoyé :", info.response);

                  res.status(201).json({
                    message:
                      "Inscription réussie. Veuillez vérifier votre email pour confirmer votre compte.",
                  });
                });
              }
            );
          }
        );
      });
    }
  );
};

// Fonction pour vérifier l'email
exports.verifyEmail = (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Jeton de vérification manquant.");
  }

  // Vérifier le jeton JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Erreur lors de la vérification du jeton :", err);
      return res.status(400).send("Jeton de vérification invalide ou expiré.");
    }

    const userId = decoded.id;

    // Trouver l'utilisateur avec ce jeton
    db.query(
      "SELECT * FROM users WHERE id = ? AND verificationToken = ?",
      [userId, token],
      (err, results) => {
        if (err) {
          console.error(
            "Erreur lors de la requête à la base de données :",
            err
          );
          return res.status(500).send("Erreur du serveur.");
        }

        if (results.length === 0) {
          return res.status(400).send("Jeton de vérification invalide.");
        }

        // Mettre à jour l'utilisateur comme vérifié
        db.query(
          "UPDATE users SET isVerified = 1, verificationToken = NULL WHERE id = ?",
          [userId],
          (err, updateResult) => {
            if (err) {
              console.error(
                "Erreur lors de la mise à jour de l'utilisateur :",
                err
              );
              return res
                .status(500)
                .send("Erreur lors de la mise à jour de l'utilisateur.");
            }

            res.send(
              "Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter."
            );
          }
        );
      }
    );
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

    // Vérifier si l'utilisateur a vérifié son email
    if (!user.isVerified) {
      return res
        .status(400)
        .send("Veuillez vérifier votre adresse email avant de vous connecter.");
    }

    // Comparer le mot de passe avec le hachage stocké
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;

      if (isMatch) {
        // Générer un token JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        // Définir le token dans un cookie HTTP-only
        res.cookie("token", token, {
          httpOnly: true,
          // secure: true, // À activer si vous utilisez HTTPS
          maxAge: 3600000, // 1 heure en millisecondes
        });

        res.json({ message: "Connexion réussie" });
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

  // Vérifier si c'est une image envoyée via la webcam (Base64)
  if (!image.startsWith("data:image/png;base64,")) {
    return res.status(400).send("Format d'image non supporté.");
  }

  const base64Data = image.replace(/^data:image\/png;base64,/, "");
  const userImageBuffer = Buffer.from(base64Data, "base64");
  const filename = `${Date.now()}.png`;
  const filePath = path.join(__dirname, "../uploads/", filename);

  // Sauvegarder l'image sur le serveur
  fs.writeFile(filePath, userImageBuffer, (err) => {
    if (err) {
      console.error("Erreur lors de la sauvegarde de l'image:", err);
      return res.status(500).send("Erreur lors de la sauvegarde de l'image");
    }

    // Sauvegarder le chemin de l'image dans la base de données
    db.query(
      "INSERT INTO images (user_id, image_path) VALUES (?, ?)",
      [userId, `/uploads/${filename}`],
      (err, result) => {
        if (err) {
          console.error("Erreur lors de l'enregistrement de l'image:", err);
          return res
            .status(500)
            .send("Erreur lors de l'enregistrement de l'image.");
        }
        res
          .status(200)
          .send({ message: "Image sauvegardée avec succès", file: filename });
      }
    );
  });
};

// Récupérer les images paginées de tous les utilisateurs
exports.getImages = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  db.query(
    "SELECT i.*, u.email FROM images i JOIN users u ON i.user_id = u.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?",
    [limit, offset],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération des images :", err);
        return res
          .status(500)
          .send("Erreur lors de la récupération des images.");
      }

      // Une fois les images récupérées, comptons le nombre total d'images
      db.query("SELECT COUNT(*) as total FROM images", (err, countResult) => {
        if (err) {
          console.error("Erreur lors du comptage des images :", err);
          return res.status(500).send("Erreur lors du comptage des images.");
        }

        const totalImages = countResult[0].total;
        const hasMore = page * limit < totalImages;

        res.status(200).json({
          images: results, // images avec l'email inclus
          hasMore: hasMore, // booléen pour savoir s'il y a encore des images après cette page
        });
      });
    }
  );
};

exports.getUserInfo = (req, res) => {
  const userId = req.userId; // ID de l'utilisateur connecté fourni par le middleware

  db.query(
    "SELECT username, email FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(
          "Erreur lors de la récupération des informations utilisateur :",
          err
        );
        return res
          .status(500)
          .json({ success: false, message: "Erreur serveur." });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Utilisateur non trouvé." });
      }

      // Log pour vérifier que les informations sont correctement récupérées
      console.log("Informations utilisateur récupérées :", results[0]);
      res.status(200).json({ success: true, user: results[0] });
    }
  );
};

// Route pour modifier le profil (email et pseudo)
exports.updateProfile = (req, res) => {
  const { username, email } = req.body;
  const userId = req.userId; // ID de l'utilisateur connecté via le middleware

  if (!username && !email) {
    return res
      .status(400)
      .json({ success: false, message: "Aucun changement à appliquer." });
  }

  // Initialiser une liste pour stocker les champs à mettre à jour
  const fieldsToUpdate = {};
  if (username) fieldsToUpdate.username = username;
  if (email) fieldsToUpdate.email = email;

  // Vérifier si l'email est déjà utilisé par un autre utilisateur
  if (email) {
    db.query(
      "SELECT * FROM users WHERE email = ? AND id != ?",
      [email, userId],
      (err, result) => {
        if (err)
          return res
            .status(500)
            .json({ success: false, message: "Erreur du serveur." });

        if (result.length > 0) {
          return res
            .status(400)
            .json({ success: false, message: "Cet email est déjà utilisé." });
        }

        // Mettre à jour les informations de l'utilisateur
        db.query(
          "UPDATE users SET ? WHERE id = ?",
          [fieldsToUpdate, userId],
          (err) => {
            if (err)
              return res
                .status(500)
                .json({ success: false, message: "Erreur serveur." });

            res.status(200).json({
              success: true,
              message: "Profil mis à jour avec succès.",
            });
          }
        );
      }
    );
  } else {
    // Mettre à jour si seul le pseudo est modifié
    db.query(
      "UPDATE users SET ? WHERE id = ?",
      [fieldsToUpdate, userId],
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ success: false, message: "Erreur serveur." });

        res
          .status(200)
          .json({ success: true, message: "Profil mis à jour avec succès." });
      }
    );
  }
};

// Route pour modifier le mot de passe
exports.updatePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Veuillez fournir tous les champs requis.",
    });
  }

  // Récupérer le mot de passe actuel de l'utilisateur depuis la base de données
  db.query(
    "SELECT password FROM users WHERE id = ?",
    [userId],
    async (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Erreur serveur." });

      const user = result[0];
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "Utilisateur non trouvé." });

      // Vérifier le mot de passe actuel
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res.status(400).json({
          success: false,
          message: "Le mot de passe actuel est incorrect.",
        });

      // Hacher et mettre à jour le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, userId],
        (err) => {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: "Erreur serveur." });

          res.status(200).json({
            success: true,
            message: "Mot de passe mis à jour avec succès.",
          });
        }
      );
    }
  );
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

// Fonction pour vérifier si l'utilisateur a déjà liké l'image
exports.likeStatus = (req, res) => {
  const imageId = req.params.imageId;
  const userId = req.userId;

  db.query(
    "SELECT * FROM likes WHERE user_id = ? AND image_id = ?",
    [userId, imageId],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .send("Erreur lors de la vérification des likes.");
      }

      const liked = result.length > 0;
      db.query(
        "SELECT likes FROM images WHERE id = ?",
        [imageId],
        (err, rows) => {
          if (err) {
            return res
              .status(500)
              .send("Erreur lors de la récupération des likes.");
          }
          const likes = rows[0].likes;
          res.status(200).json({ liked, likes });
        }
      );
    }
  );
};

// Fonction pour liker ou annuler un like sur une image
exports.likeImage = (req, res) => {
  const imageId = req.params.imageId;
  const userId = req.userId;

  // Vérifier si l'utilisateur a déjà liké l'image
  db.query(
    "SELECT * FROM likes WHERE user_id = ? AND image_id = ?",
    [userId, imageId],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .send("Erreur lors de la vérification des likes.");
      }

      if (result.length > 0) {
        // L'utilisateur a déjà liké, on retire le like
        db.query(
          "DELETE FROM likes WHERE user_id = ? AND image_id = ?",
          [userId, imageId],
          (err, result) => {
            if (err) {
              return res
                .status(500)
                .send("Erreur lors de la suppression du like.");
            }

            // Décrémenter le compteur de likes de l'image
            db.query(
              "UPDATE images SET likes = likes - 1 WHERE id = ?",
              [imageId],
              (err, result) => {
                if (err) {
                  return res
                    .status(500)
                    .send(
                      "Erreur lors de la mise à jour du compteur de likes."
                    );
                }

                return res.status(200).json({ message: "Like retiré." });
              }
            );
          }
        );
      } else {
        // L'utilisateur n'a pas encore liké, on ajoute le like
        db.query(
          "INSERT INTO likes (user_id, image_id) VALUES (?, ?)",
          [userId, imageId],
          (err, result) => {
            if (err) {
              return res.status(500).send("Erreur lors de l'ajout du like.");
            }

            // Incrémenter le compteur de likes de l'image
            db.query(
              "UPDATE images SET likes = likes + 1 WHERE id = ?",
              [imageId],
              (err, result) => {
                if (err) {
                  return res
                    .status(500)
                    .send(
                      "Erreur lors de la mise à jour du compteur de likes."
                    );
                }

                return res.status(200).json({ message: "Like ajouté." });
              }
            );
          }
        );
      }
    }
  );
};

// Fonction pour ajouter un commentaire
exports.addComment = (req, res) => {
  const userId = req.userId; // Récupérer l'ID de l'utilisateur depuis le middleware
  const { comment } = req.body; // Récupérer le commentaire
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

// Récupérer les images de l'utilisateur connecté
exports.getUserImages = (req, res) => {
  const userId = req.userId; // Récupérer l'ID de l'utilisateur depuis le token

  db.query(
    "SELECT * FROM images WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(
          "Erreur lors de la récupération des images de l'utilisateur :",
          err
        );
        return res
          .status(500)
          .send("Erreur lors de la récupération des images.");
      }
      res.status(200).json(results);
    }
  );
};

// Supprimer une image
exports.deleteImage = (req, res) => {
  const imageId = req.params.imageId;
  const userId = req.userId; // ID de l'utilisateur connecté

  // Récupérer le chemin de l'image depuis la base de données avant la suppression
  db.query(
    "SELECT image_path FROM images WHERE id = ? AND user_id = ?",
    [imageId, userId],
    (err, result) => {
      if (err) {
        console.error("Erreur lors de la récupération de l'image :", err);
        return res
          .status(500)
          .send("Erreur lors de la récupération de l'image.");
      }

      if (result.length === 0) {
        return res.status(404).send({ message: "Image non trouvée." });
      }

      const filePath = path.join(__dirname, "..", result[0].image_path); // Chemin de l'image

      // Supprimer l'image de la base de données
      db.query(
        "DELETE FROM images WHERE id = ? AND user_id = ?",
        [imageId, userId],
        (err, result) => {
          if (err) {
            console.error(
              "Erreur lors de la suppression de l'image dans la base de données :",
              err
            );
            return res
              .status(500)
              .send("Erreur lors de la suppression de l'image.");
          }

          // Supprimer le fichier image du dossier uploads
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(
                "Erreur lors de la suppression du fichier image :",
                err
              );
              // L'erreur de suppression de fichier n'empêche pas la réponse de succès
            }
            res.status(200).send({ message: "Image supprimée avec succès" });
          });
        }
      );
    }
  );
};

// Fonction pour réinitialiser le mot de passe (mot de passe oublié)
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  // Vérifier si l'utilisateur existe dans la base de données
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) {
      console.error("Erreur serveur:", err);
      return res
        .status(500)
        .json({ success: false, message: "Erreur serveur." });
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Email non trouvé." });
    }

    const userId = result[0].id;

    // Générer un token de réinitialisation de mot de passe
    const resetToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Définir les options de l'email
    const mailOptions = {
      from: '"Camagru Support" illidan888@hotmail.fr',
      to: email,
      subject: "Réinitialisation de votre mot de passe Camagru",
      html: `
		  <p>Bonjour,</p>
		  <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
		  <a href="http://localhost:3000/auth/reset-password?token=${resetToken}">Réinitialiser mon mot de passe</a>
		  <p>Ce lien expirera dans 1 heure.</p>
		`,
    };

    // Envoyer l'email de réinitialisation
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur d'envoi d'email:", error);
        return res
          .status(500)
          .json({ success: false, message: "Erreur d'envoi d'email." });
      }
      console.log("Email de réinitialisation envoyé:", info.response);
      res.json({
        success: true,
        message: "Lien de réinitialisation envoyé par email.",
      });
    });
  });
};

// Fonction pour réinitialiser le mot de passe après que l'utilisateur ait cliqué sur le lien
exports.resetPassword = (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Paramètres manquants." });
  }

  // Vérifier le token JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Erreur de vérification du token :", err);
      return res
        .status(400)
        .json({ success: false, message: "Token invalide ou expiré." });
    }

    const userId = decoded.id;

    // Hacher le nouveau mot de passe
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Erreur lors du hachage du mot de passe :", err);
        return res
          .status(500)
          .json({ success: false, message: "Erreur serveur." });
      }

      // Mettre à jour le mot de passe dans la base de données
      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, userId],
        (err, result) => {
          if (err) {
            console.error(
              "Erreur lors de la mise à jour du mot de passe :",
              err
            );
            return res
              .status(500)
              .json({ success: false, message: "Erreur serveur." });
          }

          res.status(200).json({
            success: true,
            message: "Mot de passe réinitialisé avec succès.",
          });
        }
      );
    });
  });
};

// Fonction pour mettre à jour la préférence de notification par email
exports.updateNotificationPreference = (req, res) => {
  const { receiveEmailNotifications } = req.body;
  const userId = req.userId; // ID de l'utilisateur connecté fourni par le middleware

  db.query(
    "UPDATE users SET receive_email_notifications = ? WHERE id = ?",
    [receiveEmailNotifications ? 1 : 0, userId],
    (err, result) => {
      if (err) {
        console.error(
          "Erreur lors de la mise à jour de la préférence de notification :",
          err
        );
        return res
          .status(500)
          .json({ success: false, message: "Erreur serveur." });
      }
      res.status(200).json({
        success: true,
        message: "Préférence de notification mise à jour avec succès.",
      });
    }
  );
};
