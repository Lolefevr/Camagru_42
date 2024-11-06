const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser"); // Importer cookie-parser

// Importer la connexion à la base de données
const db = require("../config/database");

// Importer le middleware JWT pour vérifier le token
const verifyToken = require("./middleware/authMiddleware");

// Middleware pour parser les requêtes POST
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // Utiliser cookie-parser
app.use("/frames", express.static(path.join(__dirname, "frames"))); // Calques (frames)
app.use(express.static(path.join(__dirname, "public")));

// Protéger l'accès à la page camera.html (aucun accès direct via /camera.html)
app.get("/camera", verifyToken, (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "-1");
  const filePath = path.join(__dirname, "public/camera.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      if (!res.headersSent) {
        return next(err); // Propager l'erreur s'il y a un problème
      }
    }
  });
});

// Protéger l'accès à la page gallery.html (aucun accès direct via /gallery.html)
app.get("/gallery", verifyToken, (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "-1");
  const filePath = path.join(__dirname, "public/gallery.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      if (!res.headersSent) {
        return next(err);
      }
    }
  });
});

// Nouvelle route pour Settings
app.get("/settings", verifyToken, (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "-1");
  const filePath = path.join(__dirname, "public/settings.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      if (!res.headersSent) {
        return next(err);
      }
    }
  });
});

// Routes d'authentification
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Route pour les uploads d'images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Gérer les erreurs CSRF
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    // Le token CSRF est invalide ou manquant
    res.status(403).send("Formulaire invalide ou expiré.");
  } else {
    next(err);
  }
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
