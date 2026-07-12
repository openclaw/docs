---
read_when:
    - Vous souhaitez qu’OpenClaw fonctionne 24 h/24 et 7 j/7 sur un VPS cloud (et non sur votre ordinateur portable)
    - Vous souhaitez un Gateway de niveau production, toujours actif, sur votre propre VPS
    - Vous souhaitez un contrôle total sur la persistance, les binaires et le comportement de redémarrage
    - Vous exécutez OpenClaw dans Docker sur Hetzner ou un fournisseur similaire
summary: Exécutez le Gateway OpenClaw 24 h/24 et 7 j/7 sur un VPS Hetzner économique (Docker), avec un état persistant et des binaires intégrés
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T15:34:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant sur un VPS Hetzner à l’aide de Docker, avec un état durable, des binaires intégrés à l’image et un comportement de redémarrage sûr.

Les tarifs de Hetzner évoluent ; choisissez le plus petit VPS Debian/Ubuntu adapté et augmentez ses ressources si vous rencontrez des erreurs de mémoire insuffisante.

Vous pouvez accéder au Gateway par redirection de port SSH depuis votre ordinateur portable, ou en exposant directement le port si vous gérez vous-même le pare-feu et les jetons.

Rappel concernant le modèle de sécurité :

- Les agents partagés au sein d’une entreprise conviennent lorsque tout le monde se trouve dans le même périmètre de confiance et que l’environnement d’exécution est exclusivement professionnel.
- Maintenez une séparation stricte : VPS/environnement d’exécution dédiés et comptes dédiés ; aucun profil personnel Apple, Google, de navigateur ou de gestionnaire de mots de passe sur cet hôte.
- Si les utilisateurs sont susceptibles d’être hostiles les uns envers les autres, séparez-les par Gateway, hôte ou utilisateur du système d’exploitation.

Consultez [Sécurité](/fr/gateway/security) et [Hébergement sur VPS](/fr/vps).

Ce guide suppose l’utilisation d’Ubuntu ou Debian sur Hetzner. Sur un autre VPS Linux, adaptez les paquets en conséquence. Pour la procédure Docker générique, consultez [Docker](/fr/install/docker).

## Prérequis

- VPS Hetzner avec accès root
- Accès SSH depuis votre ordinateur portable
- Docker et Docker Compose
- Identifiants d’authentification du modèle
- Identifiants facultatifs de fournisseurs (code QR WhatsApp, jeton de bot Telegram, OAuth Gmail)
- Environ 20 minutes

## Procédure rapide

1. Provisionner le VPS Hetzner
2. Installer Docker
3. Cloner le dépôt OpenClaw
4. Créer des répertoires persistants sur l’hôte
5. Configurer `.env` et `docker-compose.yml`
6. Intégrer les binaires requis à l’image
7. `docker compose up -d`
8. Vérifier la persistance et l’accès au Gateway

<Steps>
  <Step title="Provisionner le VPS">
    Créez un VPS Ubuntu ou Debian dans Hetzner, puis connectez-vous en tant que root :

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Considérez le VPS comme une infrastructure avec état, et non comme une infrastructure jetable.

  </Step>

  <Step title="Installer Docker (sur le VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Vérifiez l’installation :

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

    Ce guide construit une image personnalisée afin que tous les binaires qui y sont intégrés survivent aux redémarrages.

  </Step>

  <Step title="Créer des répertoires persistants sur l’hôte">
    Les conteneurs Docker sont éphémères ; tout état à long terme doit résider sur l’hôte.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Définissez le propriétaire sur l’utilisateur du conteneur (uid 1000) :
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurer les variables d’environnement">
    Créez `.env` à la racine du dépôt :

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

    Définissez `OPENCLAW_GATEWAY_TOKEN` pour gérer le jeton stable du Gateway via
    `.env` ; sinon, configurez `gateway.auth.token` avant de compter sur les clients
    entre les redémarrages. Si aucun des deux n’est défini, OpenClaw utilise un jeton limité à l’environnement d’exécution pour
    ce démarrage. Générez un mot de passe de trousseau pour `GOG_KEYRING_PASSWORD` :

    ```bash
    openssl rand -hex 32
    ```

    **Ne validez pas ce fichier dans le dépôt.** Il contient des variables d’environnement du conteneur et de l’environnement d’exécution, telles que
    `OPENCLAW_GATEWAY_TOKEN`. Les données d’authentification OAuth et par clé d’API des fournisseurs sont stockées dans le fichier
    monté `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Configuration de Docker Compose">
    Créez ou mettez à jour `docker-compose.yml` :

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
          # Recommandé : limitez le Gateway à l’interface de bouclage sur le VPS ; accédez-y via un tunnel SSH.
          # Pour l’exposer publiquement, supprimez le préfixe `127.0.0.1:` et configurez le pare-feu en conséquence.
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

    `--allow-unconfigured` sert uniquement à faciliter l’amorçage et ne remplace pas une véritable configuration du Gateway. Définissez tout de même l’authentification (`gateway.auth.token` ou un mot de passe) et un mode de liaison sûr pour votre déploiement.

  </Step>

  <Step title="Étapes partagées pour l’environnement d’exécution de la VM Docker">
    Suivez le guide partagé de l’environnement d’exécution pour la procédure commune sur l’hôte Docker :

    - [Intégrer les binaires requis à l’image](/fr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construire et lancer](/fr/install/docker-vm-runtime#build-and-launch)
    - [Emplacement des données persistantes](/fr/install/docker-vm-runtime#what-persists-where)
    - [Mises à jour](/fr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accès propre à Hetzner">
    Après les étapes partagées de construction et de lancement, ouvrez le tunnel.

    **Prérequis :** assurez-vous que la configuration sshd de votre VPS autorise la redirection TCP. Si vous
    avez renforcé votre configuration SSH, vérifiez `/etc/ssh/sshd_config` et définissez :

    ```text
    AllowTcpForwarding local
    ```

    `local` autorise les redirections locales `ssh -L` depuis votre ordinateur portable tout en bloquant
    les redirections distantes depuis le serveur. La valeur `no` provoque l’échec du tunnel avec le message :
    `channel 3: open failed: administratively prohibited: open failed`

    Après avoir confirmé que la redirection TCP est activée, redémarrez le service SSH
    (`systemctl restart ssh`) et exécutez le tunnel depuis votre ordinateur portable :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Ouvrez `http://127.0.0.1:18789/` et collez le secret partagé configuré.
    Ce guide utilise le jeton du Gateway par défaut ; utilisez plutôt le mot de passe configuré
    si vous avez choisi l’authentification par mot de passe.

  </Step>
</Steps>

La carte de persistance partagée se trouve dans [Environnement d’exécution de la VM Docker](/fr/install/docker-vm-runtime#what-persists-where).

## Infrastructure en tant que code (Terraform)

Pour les équipes qui préfèrent les workflows d’infrastructure en tant que code, une configuration Terraform maintenue par la communauté fournit :

- Une configuration Terraform modulaire avec gestion distante de l’état
- Un provisionnement automatisé via cloud-init
- Des scripts de déploiement (amorçage, déploiement, sauvegarde/restauration)
- Un renforcement de la sécurité (pare-feu, UFW, accès SSH uniquement)
- Une configuration de tunnel SSH pour accéder au Gateway

**Dépôts :**

- Infrastructure : [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuration Docker : [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cette approche complète la configuration Docker ci-dessus avec des déploiements reproductibles, une infrastructure gérée par contrôle de version et une reprise après sinistre automatisée.

<Note>
Maintenu par la communauté. Pour signaler des problèmes ou contribuer, consultez les liens vers les dépôts ci-dessus.
</Note>

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)

## Pages connexes

- [Présentation de l’installation](/fr/install)
- [Fly.io](/fr/install/fly)
- [Docker](/fr/install/docker)
- [Hébergement sur VPS](/fr/vps)
