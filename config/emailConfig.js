// ./config/emailConfig.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com", // Serveur SMTP de SendinBlue
  port: 587, // Port SMTP (587 pour TLS)
  secure: false, // Utiliser TLS
  auth: {
    user: process.env.SENDINBLUE_USER, // Identifiant SMTP SendinBlue
    pass: process.env.SENDINBLUE_PASS, // Clé API SMTP SendinBlue
  },
});

// Vérifier la configuration du transporteur
transporter.verify((error, success) => {
  if (error) {
    console.error("Erreur de configuration du transporteur SMTP :", error);
  } else {
    console.log("Transporteur SMTP configuré avec succès.");
  }
});

module.exports = transporter;
