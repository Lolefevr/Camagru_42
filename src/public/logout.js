// Ajouter un bouton de déconnexion dynamiquement
window.onload = function () {
  const token = localStorage.getItem("token");

  if (token) {
    // Créer le bouton de déconnexion
    const logoutBtn = document.createElement("button");
    logoutBtn.innerText = "Déconnexion";
    logoutBtn.classList.add(
      "bg-red-600",
      "text-white",
      "p-2",
      "rounded-md",
      "hover:bg-red-700",
      "fixed",
      "top-4",
      "right-4"
    );

    // Ajouter un listener au clic pour déconnexion
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("token"); // Supprimer le token du localStorage
      window.location.href = "/"; // Rediriger vers la page d'authentification
    });

    // Ajouter le bouton à la page (en haut à droite)
    document.body.appendChild(logoutBtn);
  }
};
