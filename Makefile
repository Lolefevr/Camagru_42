# Variables
DOCKER_COMPOSE = docker-compose

# Commandes
.PHONY: build up down restart clean fclean logs

# Build (construit, installe les dépendances npm, et démarre)
build:
	$(DOCKER_COMPOSE) up --build

# Démarrer les conteneurs (sans rebuild)
up:
	$(DOCKER_COMPOSE) up

# Arrêter les conteneurs
down:
	$(DOCKER_COMPOSE) down

# Redémarrer les conteneurs
restart:
	$(DOCKER_COMPOSE) down && $(DOCKER_COMPOSE) up

# Nettoyer les conteneurs, volumes et images
clean:
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans

# Supprimer toutes les traces Docker : conteneurs, images, volumes, réseaux
fclean:
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans
	docker system prune -af
	docker volume prune -f
	docker network prune -f
	docker image prune -af

# Afficher les logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Accéder au conteneur Node.js en ligne de commande
shell-app:
	$(DOCKER_COMPOSE) exec app bash

# Accéder au conteneur MariaDB en ligne de commande
shell-db:
	$(DOCKER_COMPOSE) exec db bash
