# Variables
DOCKER_COMPOSE = docker-compose

# Commandes
.PHONY: build up down restart clean fclean logs rebuild

# Build (construit, installe les dépendances npm, et démarre en mode détaché)
build:
	$(DOCKER_COMPOSE) up --build -d

# Démarrer les conteneurs en mode détaché (sans rebuild)
up:
	$(DOCKER_COMPOSE) up -d

# Arrêter les conteneurs
down:
	$(DOCKER_COMPOSE) down

# Redémarrer les conteneurs en mode détaché
restart:
	$(DOCKER_COMPOSE) down && $(DOCKER_COMPOSE) up -d

# Rebuild (arrêter, reconstruire et redémarrer les conteneurs en mode détaché)
rebuild:
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) up --build -d

# Nettoyer les conteneurs, volumes et images
clean:
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans

# Supprimer toutes les traces Docker : conteneurs, images, volumes, réseaux, et contenu du dossier uploads
fclean:
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans
	docker system prune -af
	docker volume prune -f
	docker network prune -f
	docker image prune -af
	find ./src/uploads/ -mindepth 1 -delete


# Afficher les logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Accéder au conteneur Node.js en ligne de commande
shell-app:
	$(DOCKER_COMPOSE) exec app bash

# Accéder au conteneur MariaDB en ligne de commande
shell-db:
	$(DOCKER_COMPOSE) exec db mysql -u root -p

