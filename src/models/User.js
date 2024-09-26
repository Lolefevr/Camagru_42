const db = require("../../config/database");
const bcrypt = require("bcrypt");

// Fonction pour trouver un utilisateur par email
const findUserByEmail = (email, callback) => {
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

// Fonction pour créer un nouvel utilisateur
const createUser = (email, password, callback) => {
  // Hachage du mot de passe
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return callback(err);

    // Insérer l'utilisateur dans la base de données
    db.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hash],
      (err, results) => {
        if (err) return callback(err);
        callback(null, results);
      }
    );
  });
};

// Fonction pour comparer un mot de passe avec le haché
const comparePassword = (password, hash, callback) => {
  console.log("Mot de passe fourni pour la comparaison:", password); // Log du mot de passe fourni
  console.log("Mot de passe haché stocké dans la base de données:", hash); // Log du hash dans la BDD

  bcrypt.compare(password, hash, (err, isMatch) => {
    if (err) return callback(err);
    console.log("Le mot de passe correspond-il ?", isMatch); // Ajoute un log pour vérifier si ça correspond
    callback(null, isMatch);
  });
};

module.exports = {
  findUserByEmail,
  createUser,
  comparePassword,
};
