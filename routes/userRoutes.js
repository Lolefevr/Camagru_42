// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController"); // Importer correctement userController

// Route POST pour l'inscription d'un utilisateur
router.post("/register", userController.register); // Assure-toi que la fonction est bien accessible

module.exports = router;
