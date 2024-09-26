// config/db.js
const mysql = require("mysql2");

// Créer une connexion à la base de données
const db = mysql.createConnection({
  host: "localhost",
  user: "root_user", // Remplace par ton utilisateur MariaDB
  password: "1234", // Remplace par ton mot de passe
  database: "camagru", // Remplace par ton nom de base de données
});

// Connecter à la base de données
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
    return;
  }
  console.log("Connecté à la base de données MariaDB");
});

module.exports = db;
