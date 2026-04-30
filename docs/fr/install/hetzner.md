---
read_when:
    - Vous voulez qu’OpenClaw fonctionne 24 h/24 et 7 j/7 sur un VPS cloud (pas sur votre ordinateur portable)
    - Vous voulez un Gateway prêt pour la production, toujours actif, sur votre propre VPS
    - Vous souhaitez un contrôle total de la persistance, des binaires et du comportement de redémarrage
    - Vous exécutez OpenClaw dans Docker sur Hetzner ou un fournisseur similaire
summary: Exécuter OpenClaw Gateway 24 h/24 et 7 j/7 sur un VPS Hetzner économique (Docker) avec un état persistant et des binaires intégrés
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T07:33:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw sur Hetzner (Docker, guide VPS de production)

## Objectif

Exécuter un Gateway OpenClaw persistant sur un VPS Hetzner avec Docker, avec un état durable, des binaires intégrés et un comportement de redémarrage sûr.

Si vous voulez « OpenClaw 24/7 pour environ 5 $ », c’est la configuration fiable la plus simple.
Les tarifs Hetzner changent ; choisissez le plus petit VPS Debian/Ubuntu et augmentez la taille si vous rencontrez des OOM.

Rappel du modèle de sécurité :

- Les agents partagés à l’échelle de l’entreprise conviennent lorsque tout le monde se trouve dans la même frontière de confiance et que le runtime est réservé à un usage professionnel.
- Maintenez une séparation stricte : VPS/runtime dédié + comptes dédiés ; aucun profil personnel Apple/Google/navigateur/gestionnaire de mots de passe sur cet hôte.
- Si les utilisateurs sont adversaires les uns des autres, séparez par gateway/hôte/utilisateur OS.

Voir [Sécurité](/fr/gateway/security) et [Hébergement VPS](/fr/vps).

## Que faisons-nous (en termes simples) ?

- Louer un petit serveur Linux (VPS Hetzner)
- Installer Docker (runtime d’application isolé)
- Démarrer le Gateway OpenClaw dans Docker
- Persister `~/.openclaw` + `~/.openclaw/workspace` sur l’hôte (survit aux redémarrages/reconstructions)
- Accéder à l’interface utilisateur de contrôle depuis votre ordinateur portable via un tunnel SSH

Cet état `~/.openclaw` monté inclut `openclaw.json`, les fichiers par agent
`agents/<agentId>/agent/auth-profiles.json`, et `.env`.

Le Gateway est accessible via :

- Redirection de port SSH depuis votre ordinateur portable
- Exposition directe du port si vous gérez vous-même le pare-feu et les jetons

Ce guide suppose Ubuntu ou Debian sur Hetzner.  
Si vous êtes sur un autre VPS Linux, adaptez les paquets en conséquence.
Pour le flux Docker générique, voir [Docker](/fr/install/docker).

---

## Parcours rapide (opérateurs expérimentés)

1. Provisionner le VPS Hetzner
2. Installer Docker
3. Cloner le dépôt OpenClaw
4. Créer des répertoires hôtes persistants
5. Configurer `.env` et `docker-compose.yml`
6. Intégrer les binaires requis dans l’image
7. `docker compose up -d`
8. Vérifier la persistance et l’accès au Gateway

---

## Ce dont vous avez besoin

- VPS Hetzner avec accès root
- Accès SSH depuis votre ordinateur portable
- Aisance de base avec SSH + copier/coller
- Environ 20 minutes
- Docker et Docker Compose
- Identifiants d’authentification du modèle
- Identifiants de fournisseur facultatifs
  - QR WhatsApp
  - Jeton de bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Provisionner le VPS">
    Créez un VPS Ubuntu ou Debian chez Hetzner.

    Connectez-vous en tant que root :

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Ce guide suppose que le VPS est stateful.
    Ne le traitez pas comme une infrastructure jetable.

  </Step>

  <Step title="Installer Docker (sur le VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Vérifiez :

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Cloner le dépôt OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Ce guide suppose que vous allez construire une image personnalisée pour garantir la persistance des binaires.

  </Step>

  <Step title="Créer des répertoires hôtes persistants">
    Les conteneurs Docker sont éphémères.
    Tout état de longue durée doit résider sur l’hôte.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurer les variables d’environnement">
    Créez `.env` à la racine du dépôt.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Laissez `OPENCLAW_GATEWAY_TOKEN` vide sauf si vous souhaitez explicitement
    le gérer via `.env` ; OpenClaw écrit un jeton de gateway aléatoire dans la
    configuration au premier démarrage. Générez un mot de passe de trousseau et collez-le dans
    `GOG_KEYRING_PASSWORD` :

    ```bash
    openssl rand -hex 32
    ```

    **Ne commitez pas ce fichier.**

    Ce fichier `.env` sert aux variables d’environnement du conteneur/runtime comme `OPENCLAW_GATEWAY_TOKEN`.
    L’authentification OAuth/clé API stockée pour les fournisseurs réside dans le fichier monté
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Configuration Docker Compose">
    Créez ou mettez à jour `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` sert uniquement à faciliter l’amorçage ; ce n’est pas un remplacement d’une configuration de gateway appropriée. Configurez tout de même l’authentification (`gateway.auth.token` ou mot de passe) et utilisez des paramètres de bind sûrs pour votre déploiement.

  </Step>

  <Step title="Étapes de runtime Docker VM partagé">
    Utilisez le guide de runtime partagé pour le flux commun de l’hôte Docker :

    - [Intégrer les binaires requis dans l’image](/fr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construire et lancer](/fr/install/docker-vm-runtime#build-and-launch)
    - [Ce qui persiste et où](/fr/install/docker-vm-runtime#what-persists-where)
    - [Mises à jour](/fr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accès propre à Hetzner">
    Après les étapes de construction et de lancement partagées, terminez la configuration suivante pour ouvrir le tunnel :

    **Prérequis :** Assurez-vous que la configuration sshd de votre VPS autorise la redirection TCP. Si vous
    avez renforcé votre configuration SSH, vérifiez `/etc/ssh/sshd_config` et définissez :

    ```
    AllowTcpForwarding local
    ```

    `local` autorise les redirections locales `ssh -L` depuis votre ordinateur portable tout en bloquant
    les redirections distantes depuis le serveur. Le définir sur `no` fera échouer le tunnel
    avec :
    `channel 3: open failed: administratively prohibited: open failed`

    Après avoir confirmé que la redirection TCP est activée, redémarrez le service SSH
    (`systemctl restart ssh`) et exécutez le tunnel depuis votre ordinateur portable :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Ouvrez :

    `http://127.0.0.1:18789/`

    Collez le secret partagé configuré. Ce guide utilise par défaut le jeton de gateway ;
    si vous êtes passé à l’authentification par mot de passe, utilisez plutôt ce mot de passe.

  </Step>
</Steps>

La carte de persistance partagée se trouve dans [Docker VM Runtime](/fr/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Pour les équipes qui préfèrent les workflows d’infrastructure-as-code, une configuration Terraform maintenue par la communauté fournit :

- Configuration Terraform modulaire avec gestion d’état distant
- Provisionnement automatisé via cloud-init
- Scripts de déploiement (bootstrap, déploiement, sauvegarde/restauration)
- Renforcement de la sécurité (pare-feu, UFW, accès SSH uniquement)
- Configuration de tunnel SSH pour l’accès au gateway

**Dépôts :**

- Infrastructure : [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuration Docker : [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cette approche complète la configuration Docker ci-dessus avec des déploiements reproductibles, une infrastructure versionnée et une reprise après sinistre automatisée.

<Note>
Maintenu par la communauté. Pour les problèmes ou contributions, consultez les liens de dépôt ci-dessus.
</Note>

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Fly.io](/fr/install/fly)
- [Docker](/fr/install/docker)
- [Hébergement VPS](/fr/vps)
