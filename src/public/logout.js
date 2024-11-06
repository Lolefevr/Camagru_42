document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.querySelector(".logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
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
        });
    });
  }
});
