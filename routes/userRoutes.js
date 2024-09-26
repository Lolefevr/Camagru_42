// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Route pour l'inscription d'un utilisateur
router.post("/register", userController.register);

// Route pour la connexion d'un utilisateur
router.post("/login", userController.login); // Ajoute cette route maintenant

// Route pour l'upload d'images
router.post("/upload", userController.uploadImage);

module.exports = router;
