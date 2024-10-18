// ./src/testEmail.js
const transporter = require("../config/emailConfig");

const mailOptions = {
  from: '"Camagru Support" illidan888@hotmail.fr', // Remplace par ton expéditeur vérifié
  to: "illidan888@hotmail.fr", // Remplace par ton adresse email de test
  subject: "Test d'envoi d'email avec SendinBlue",
  text: "Bonjour,\n\nCeci est un email de test pour vérifier la configuration de SendinBlue.\n\nMerci !",
  html: "<p>Bonjour,</p><p>Ceci est un email de test pour vérifier la configuration de SendinBlue.</p><p>Merci !</p>",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error("Erreur lors de l'envoi de l'email de test:", error);
  }
  console.log("Email de test envoyé avec succès:", info.response);
});
