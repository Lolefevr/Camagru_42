const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Route pour l'inscription
router.post("/register", authController.register);

// Route pour la connexion
router.post("/login", authController.login);

module.exports = router;
