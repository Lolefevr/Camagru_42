const express = require("express");
const router = express.Router();
const path = require("path");
const authController = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: true });

// Route pour l'inscription
router.post("/register", csrfProtection, authController.register);

// Route pour vérifier l'email
router.get("/verify-email", authController.verifyEmail);

// Route pour la connexion
router.post("/login", csrfProtection, authController.login);

// Route pour la déconnexion
router.post("/logout", csrfProtection, authController.logout);

// Route pour l'upload d'images (sécurisée avec JWT)
router.post("/upload", csrfProtection, verifyToken, authController.uploadImage);

// Route pour afficher les images
router.get("/images", authController.getImages);

// Route pour liker une image
router.post(
  "/like/:imageId",
  csrfProtection,
  verifyToken,
  authController.likeImage
);

// Route pour vérifier si l'utilisateur a déjà liké une image
router.get("/like-status/:imageId", verifyToken, authController.likeStatus);

// Route pour vérifier la validité du token
router.post(
  "/verify-token",
  csrfProtection,
  verifyToken,
  authController.verifyToken
);

// Route pour ajouter un commentaire
router.post(
  "/comment/:imageId",
  csrfProtection,
  verifyToken,
  authController.addComment
);

// Route pour récupérer les commentaires d'une image
router.get("/comments/:imageId", authController.getComments);

// Route pour lister les frames
router.get("/frames", authController.getFrames);

// Route pour récupérer les images de l'utilisateur
router.get("/user-images", verifyToken, authController.getUserImages);
// Route pour supprimer une image
router.delete(
  "/delete-image/:imageId",
  verifyToken,
  authController.deleteImage
);

// Nouvelle route pour la page settings (sécurisée avec le JWT)
router.get("/settings", verifyToken, (req, res) => {
  const filePath = path.join(dirname, "../public/settings.html");
  res.sendFile(filePath);
});

// Route pour obtenir les informations de l'utilisateur connecté
router.get("/user-info", verifyToken, authController.getUserInfo);

// Remplacez ensureAuthenticated par verifyToken pour sécuriser les routes
router.post(
  "/update-profile",
  csrfProtection,
  verifyToken,
  authController.updateProfile
);
router.post(
  "/update-password",
  csrfProtection,
  verifyToken,
  authController.updatePassword
);
// Route pour la réinitialisation de mot de passe (mot de passe oublié)
router.post("/forgot-password", csrfProtection, authController.forgotPassword);

router.get("/reset-password", (req, res) => {
  const filePath = path.join(__dirname, "../public/reset-password.html");
  res.sendFile(filePath);
});

// Route pour obtenir le token CSRF
router.get("/csrf-token", csrfProtection, authController.getCsrfToken);

// Route pour la réinitialisation du mot de passe (mot de passe oublié)
router.post("/reset-password", csrfProtection, authController.resetPassword);

router.post(
  "/update-notification-preference",
  verifyToken,
  authController.updateNotificationPreference
);

module.exports = router;
