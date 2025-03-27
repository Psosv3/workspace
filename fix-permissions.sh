#!/bin/bash

# Arrêt des conteneurs
docker-compose down

# Nettoyage
sudo rm -rf */node_modules
sudo rm -f */package-lock.json

# Donner les permissions complètes à tous les dossiers du projet
sudo chmod -R 777 .

# Redémarrage des services
docker-compose -f docker-compose.yaml -f docker-compose.no-synapse.yaml up -d --build 