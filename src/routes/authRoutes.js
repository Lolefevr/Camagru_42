const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Route pour l'inscription
router.post("/register", authController.register);

// Route pour la connexion
router.post("/login", authController.login);

// Route pour l'upload d'images
router.post("/upload", authController.uploadImage);

// Route pour afficher les images
router.get("/images", authController.getImages);

// Route pour liker une image
router.post("/like/:imageId", authController.likeImage);

module.exports = router;
