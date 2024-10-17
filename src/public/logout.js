// Ajouter un bouton de déconnexion dynamiquement
window.addEventListener("load", function () {
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
    fetch("/auth/logout", {
      method: "POST",
      credentials: "include", // Inclure les cookies
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = "/"; // Rediriger vers la page d'accueil
        } else {
          throw new Error("Erreur lors de la déconnexion");
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la déconnexion :", error);
        window.location.href = "/";
      });
  });

  // Ajouter le bouton à la page (en haut à droite)
  document.body.appendChild(logoutBtn);
});
