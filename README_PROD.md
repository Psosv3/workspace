# MISE EN PRODUCTION

## CONFIGURER LE .ENV
DOMAIN=workspace.onexus.tech
SECRET_KEY=votreclésecrète
JITSI_URL=meet.jit.si
START_ROOM_URL=/_/global/maps.workspace.onexus.tech/starter/map.json

## MODIFIER LE docker-compose.yaml
services:
  reverse-proxy:
    # ... existing code ...
    networks:
      default:
        aliases:
          - "front.workspace.onexus.tech"
          - "play.workspace.onexus.tech"
          - "room-api.workspace.onexus.tech"
          - "maps.workspace.onexus.tech"
          - "oidc.workspace.onexus.tech"
          - "map-storage.workspace.onexus.tech"
          - "matrix.workspace.onexus.tech"
          - "pusher.workspace.onexus.tech"

  play:
    # ... existing code ...
    environment:
      # ... existing code ...
      ALLOWED_CORS_ORIGIN: "http://play.workspace.onexus.tech"
      VITE_URL: "http://front.workspace.onexus.tech"
      PUSHER_URL: "http://play.workspace.onexus.tech"
      FRONT_URL: "http://play.workspace.onexus.tech"
      UPLOADER_URL: "http://uploader.workspace.onexus.tech"

## CONFIGURER LE DNS
*.workspace.onexus.tech.  IN  A  <votre-ip-vps>
workspace.onexus.tech.    IN  A  <votre-ip-vps>

## CONFIGURER SSL DANS docker-compose.yaml
  reverse-proxy:
    # ... existing code ...
    command:
      - --api.insecure=true
      - --providers.docker
      - --entryPoints.web.address=:80
      - --entryPoints.websecure.address=:443
      - --certificatesresolvers.myresolver.acme.tlschallenge=true
      - --certificatesresolvers.myresolver.acme.email=votre@email.com
      - --certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./letsencrypt:/letsencrypt

## DEMARRAGE
### Créez d'abord le dossier pour les certificats
mkdir letsencrypt

### Démarrez les services
docker-compose up -d

<!-- Il se peut qu'il y ait des problèmes d'autorisation (synapse dans mon cas) -->
# CONFIGURER LA SECURITE
### Allez dans le dossier synapse
cd synapse

### Donnez les permissions d'exécution
sudo chmod +x start.sh

### Assurez-vous que les permissions sont correctes pour tout le dossier
sudo chown -R 991:991 .
