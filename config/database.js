const mysql = require("mysql2");
require("dotenv").config(); // Charger les variables d'environnement

// Fonction pour gérer la reconnexion
function connectToDatabase() {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || "db",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  connection.connect((err) => {
    if (err) {
      console.error("Erreur de connexion à la base de données:", err);
      setTimeout(connectToDatabase, 5000); // Réessayer toutes les 5 secondes
    } else {
      console.log("Connecté à la base de données MariaDB");
    }
  });

  connection.on("error", (err) => {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Connexion perdue. Reconnexion...");
      connectToDatabase();
    } else {
      throw err;
    }
  });

  return connection;
}

// Connecter à la base de données
const db = connectToDatabase();

module.exports = db;
