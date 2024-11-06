document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.querySelector(".logout-btn");

  // Fonction pour récupérer le token CSRF
  async function getCsrfToken() {
    try {
      const response = await fetch("/auth/csrf-token", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Échec de l'obtention du token CSRF");
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error("Erreur lors de la récupération du token CSRF:", error);
      alert(
        "Erreur lors de la récupération du token CSRF. Veuillez réessayer plus tard."
      );
      throw error;
    }
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        const csrfToken = await getCsrfToken(); // Récupérer le token CSRF avant la déconnexion
        const response = await fetch("/auth/logout", {
          method: "POST",
          headers: {
            "CSRF-Token": csrfToken, // Inclure le token CSRF dans les en-têtes
          },
          credentials: "include", // Inclure les cookies
        });

        if (response.ok) {
          window.location.href = "/"; // Rediriger vers la page d'accueil
        } else {
          throw new Error("Erreur lors de la déconnexion");
        }
      } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
      }
    });
  }
});
