const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const path = require("path");

// Importer la connexion à la base de données
const db = require("../config/database");

// Importer le middleware JWT pour vérifier le token
const verifyToken = require("./middleware/authMiddleware");

// Middleware pour parser les requêtes POST
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use("/frames", express.static(path.join(__dirname, "frames"))); // Calques (frames)
app.use(express.static(path.join(__dirname, "public")));

// Protéger l'accès à la page camera.html (aucun accès direct via /camera.html)
app.get("/camera", (req, res, next) => {
  // besoin de vérifier le token pour la galerie avec verifyToken en argument
  const filePath = path.join(__dirname, "public/camera.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      if (!res.headersSent) {
        return next(err); // Propager l'erreur s'il y a un problème
      }
    }
  });
});

// Protéger l'accès à la page camera.html (aucun accès direct via /camera.html)
app.get("/gallery", (req, res, next) => {
  // besoin de vérifier le token pour la galerie avec verifyToken en argument
  const filePath = path.join(__dirname, "public/gallery.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      if (!res.headersSent) {
        return next(err); // Propager l'erreur s'il y a un problème
      }
    }
  });
});

// Routes d'authentification
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Route de test du serveur
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route basique pour tester si le serveur fonctionne

// Route par défaut pour afficher la page d'authentification (register et login)
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "public/auth.html");
  res.sendFile(filePath);
});

// Route de test de la base de données
app.get("/test-db", (req, res) => {
  db.query("SELECT 1 + 1 AS solution", (err, results) => {
    if (err) {
      res.status(500).send("Erreur avec la base de données");
      return;
    }
    res.send(`La solution est : ${results[0].solution}`);
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send("Une erreur est survenue !");
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
