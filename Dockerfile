# Utiliser l'image officielle Node.js 21
FROM node:21

# Installer les dépendances système pour 'sharp'
RUN apt-get update && apt-get install -y \
    libvips-dev \
    build-essential \
    python3 \
    make \
    g++ \
	netcat-openbsd

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm install

# Copier le reste du code de votre application
COPY . .

# Exposer le port de l'application
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "run", "dev"]



