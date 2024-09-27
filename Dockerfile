# Utiliser l'image Node.js
FROM node:21

# Installer apt-utils et netcat pour que wait-for-it fonctionne
RUN apt-get update && apt-get install -y apt-utils netcat-openbsd

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (si présent) pour installer les dépendances
COPY package*.json ./

# Installer les dépendances npm
RUN npm install

# Copier tout le reste des fichiers du projet
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "run", "dev"]
