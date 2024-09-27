const express = require("express");
const app = express();
const port = process.env.PORT || 3000; // Récupérer le port à partir des variables d'environnement
const bodyParser = require("body-parser");
const path = require("path");

// Importer la connexion à la base de données
const db = require("../config/database");

// Middleware pour parser les requêtes POST
// Configurer une limite de taille pour les requêtes JSON
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Middleware pour parser le body des requêtes en JSON (intégré à Express)
app.use(express.json());

// Routes d'authentification
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route basique pour tester si le serveur fonctionne
app.get("/", (req, res) => {
  res.send("Camagru is running!");
});

// Route pour tester la base de données
app.get("/test-db", (req, res) => {
  db.query("SELECT 1 + 1 AS solution", (err, results) => {
    if (err) {
      res.status(500).send("Erreur avec la base de données");
      return;
    }
    res.send(`La solution est : ${results[0].solution}`);
  });
});

// Gestion globale des erreurs (bonne pratique)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Une erreur est survenue !");
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
