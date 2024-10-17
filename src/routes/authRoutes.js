const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Route pour l'inscription
router.post("/register", authController.register);

// Route pour la connexion
router.post("/login", authController.login);

// Route pour l'upload d'images (sécurisée avec JWT)
router.post("/upload", verifyToken, authController.uploadImage);

// Route pour afficher les images
router.get("/images", authController.getImages);

// Route pour liker une image
router.post("/like/:imageId", authController.likeImage);

// Route pour vérifier la validité du token
router.post("/verify-token", verifyToken, (req, res) => {
  res.status(200).json({ valid: true });
});

// Route pour ajouter un commentaire
router.post("/comment/:imageId", authController.addComment);

// Route pour récupérer les commentaires d'une image
router.get("/comments/:imageId", authController.getComments);

// Nouvelle route pour lister les frames
router.get("/frames", authController.getFrames);

// Route pour récupérer les images de l'utilisateur
router.get("/user-images", verifyToken, authController.getUserImages);

// Route pour supprimer une image
router.delete(
  "/delete-image/:imageId",
  verifyToken,
  authController.deleteImage
);

module.exports = router;
