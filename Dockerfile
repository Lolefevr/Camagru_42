# Utiliser l'image Node.js
FROM node:14

# Installer netcat pour que wait-for-it fonctionne
RUN apt-get update && apt-get install -y netcat

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers dans le conteneur
COPY . .

# Installer les dépendances npm
RUN npm install

# Démarrer l'application
CMD ["npm", "run", "dev"]
