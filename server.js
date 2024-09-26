const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes"); // Les routes utilisateurs
const db = require("./config/db"); // On importe db.js pour s'assurer que la connexion est établie
const app = express();
const port = 3000;

// Route de base
app.get("/", (req, res) => {
  res.send("Hello Camagru with MariaDB!");
});

// Middleware pour parser les requêtes POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Utilisation des routes utilisateurs
app.use("/user", userRoutes);

// Démarrer le serveur
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
