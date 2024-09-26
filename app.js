const express = require("express");
const app = express();
const port = 3000;

// Importer la connexion à la base de données
const db = require("./database");

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
