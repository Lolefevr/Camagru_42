const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Route pour l'inscription
router.post("/register", authController.register);

// Route pour la connexion
router.post("/login", authController.login);

// Route pour l'upload d'images (sécurisée avec JWT)
router.post("/upload", authController.uploadImage); // , verifyToken

// Route pour afficher les images
router.get("/images", authController.getImages);

// Route pour liker une image
router.post("/like/:imageId", authController.likeImage);

module.exports = router;
