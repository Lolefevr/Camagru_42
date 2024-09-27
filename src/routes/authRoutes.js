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

module.exports = router;
