---
read_when:
    - Vous souhaitez qu’OpenClaw fonctionne 24 h/24 et 7 j/7 sur GCP
    - Vous souhaitez un Gateway de niveau production, toujours actif, sur votre propre machine virtuelle
    - Vous souhaitez un contrôle total sur la persistance, les fichiers binaires et le comportement de redémarrage
summary: Exécutez le Gateway OpenClaw 24 h/24 et 7 j/7 sur une VM GCP Compute Engine (Docker) avec un état persistant
title: GCP
x-i18n:
    generated_at: "2026-07-12T15:32:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

  Exécutez un Gateway OpenClaw persistant sur une VM GCP Compute Engine à l’aide de Docker, avec un état durable, des binaires intégrés et un comportement de redémarrage sûr.

  Les tarifs varient selon le type de machine et la région ; choisissez la plus petite VM adaptée à votre charge de travail et augmentez sa capacité si vous rencontrez des erreurs de mémoire insuffisante.

  Le Gateway est accessible depuis votre ordinateur portable par redirection de port SSH, ou par exposition directe du port si vous gérez vous-même le pare-feu et les jetons.

  Ce guide utilise Debian sur GCP Compute Engine. Ubuntu fonctionne également ; adaptez les paquets en conséquence. Pour la procédure Docker générique, consultez [Docker](/fr/install/docker).

  ## Prérequis

  - Compte GCP (`e2-micro` est éligible à l’offre gratuite)
  - CLI `gcloud`, ou la [Cloud Console](https://console.cloud.google.com)
  - Accès SSH depuis votre ordinateur portable
  - Docker et Docker Compose
  - Identifiants d’authentification du modèle
  - Identifiants de fournisseur facultatifs (code QR WhatsApp, jeton de bot Telegram, OAuth Gmail)
  - Environ 20 à 30 minutes

  ## Procédure rapide

  1. Créez un projet GCP, activez la facturation et l’API Compute Engine
  2. Créez une VM Compute Engine (`e2-small`, Debian 12, 20GB)
  3. Connectez-vous à la VM par SSH et installez Docker
  4. Clonez le dépôt OpenClaw
  5. Créez des répertoires hôtes persistants
  6. Configurez `.env` et `docker-compose.yml`
  7. Intégrez les binaires requis, générez l’image et lancez le service

  <Steps>
  <Step title="Installer la CLI gcloud (ou utiliser la console)">
    Installez-la depuis [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), puis exécutez :

    ```bash
    gcloud init
    gcloud auth login
    ```

    Vous pouvez également effectuer toutes les étapes ci-dessous dans l’interface web de la [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Créer un projet GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Activez la facturation sur [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (obligatoire pour Compute Engine).

    Équivalent dans la console : IAM & Admin > Create Project, activez la facturation, puis APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Créer la VM">
    | Type      | Caractéristiques         | Coût                     | Remarques                                               |
    | --------- | ------------------------ | ------------------------ | ------------------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB de RAM       | Environ $25/mo           | Le plus fiable pour les builds Docker locaux            |
    | e2-small  | 2 vCPU, 2GB de RAM       | Environ $12/mo           | Minimum recommandé pour un build Docker                 |
    | e2-micro  | 2 vCPU (partagés), 1GB de RAM | Éligible à l’offre gratuite | Le build Docker échoue souvent par manque de mémoire (code de sortie 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Se connecter à la VM par SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console : cliquez sur "SSH" à côté de la VM dans le tableau de bord Compute Engine.

    La propagation de la clé SSH peut prendre 1 à 2 minutes après la création de la VM ; patientez et réessayez si la connexion est refusée.

  </Step>

  <Step title="Installer Docker (sur la VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Déconnectez-vous, puis reconnectez-vous afin que la modification du groupe prenne effet :

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    Ce guide génère une image personnalisée afin que tous les binaires intégrés soient conservés après les redémarrages.

  </Step>

  <Step title="Créer des répertoires hôtes persistants">
    Les conteneurs Docker sont éphémères ; tout état persistant doit être conservé sur l’hôte.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configurer les variables d’environnement">
    Créez `.env` à la racine du dépôt :

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Définissez `OPENCLAW_GATEWAY_TOKEN` pour gérer le jeton stable du Gateway au moyen de
    `.env` ; sinon, configurez `gateway.auth.token` avant de compter sur les clients
    après des redémarrages. Si aucun des deux n’est défini, OpenClaw utilise uniquement
    pour ce démarrage un jeton généré à l’exécution. Générez un mot de passe de trousseau pour `GOG_KEYRING_PASSWORD` :

    ```bash
    openssl rand -hex 32
    ```

    **Ne validez pas ce fichier dans le dépôt.** Il contient des variables d’environnement du conteneur et de l’exécution, telles que
    `OPENCLAW_GATEWAY_TOKEN`. Les authentifications OAuth et par clé d’API des fournisseurs enregistrées se trouvent dans le fichier
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` monté.

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
          # Recommandé : limitez le Gateway à l’interface de bouclage de la VM ; accédez-y via un tunnel SSH.
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

    `--allow-unconfigured` sert uniquement à faciliter l’amorçage et ne remplace pas une véritable configuration du Gateway. Définissez tout de même l’authentification (`gateway.auth.token` ou un mot de passe) ainsi qu’un mode de liaison sûr pour votre déploiement.

  </Step>

  <Step title="Étapes d’exécution partagées sur une VM Docker">
    Suivez le guide d’exécution partagé pour le flux commun d’hébergement Docker :

    - [Intégrer les binaires requis à l’image](/fr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compiler et lancer](/fr/install/docker-vm-runtime#build-and-launch)
    - [Emplacement des données persistantes](/fr/install/docker-vm-runtime#what-persists-where)
    - [Mises à jour](/fr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Remarques de lancement propres à GCP">
    Si la compilation échoue avec `Killed` ou `exit code 137` pendant `pnpm install --frozen-lockfile`, la VM manque de mémoire. Utilisez au minimum `e2-small`, ou `e2-medium` pour des premières compilations plus fiables.

    Lorsque vous utilisez une liaison au réseau local (`OPENCLAW_GATEWAY_BIND=lan`), configurez une origine de navigateur approuvée avant de continuer :

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Remplacez `18789` par le port configuré si vous l’avez modifié.

  </Step>

  <Step title="Accès depuis votre ordinateur portable">
    Créez un tunnel SSH pour transférer le port du Gateway :

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Ouvrez `http://127.0.0.1:18789/` dans votre navigateur.

    Réaffichez un lien propre vers le tableau de bord :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Si l’interface vous demande une authentification par secret partagé, collez le jeton ou
    le mot de passe configuré dans les paramètres de Control UI (ce flux Docker écrit un jeton
    par défaut ; utilisez plutôt le mot de passe configuré si vous avez opté pour
    l’authentification par mot de passe).

    Si Control UI affiche `unauthorized` ou `disconnected (1008): pairing required`, approuvez l’appareil du navigateur :

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Consultez [Environnement d’exécution d’une VM Docker](/fr/install/docker-vm-runtime#what-persists-where) pour la carte de persistance partagée et le [processus de mise à jour](/fr/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Dépannage

**Connexion SSH refusée**

La propagation de la clé SSH peut prendre 1-2 minutes après la création de la VM. Attendez, puis réessayez.

**Problèmes liés à OS Login**

Vérifiez votre profil OS Login :

```bash
gcloud compute os-login describe-profile
```

Assurez-vous que votre compte dispose des autorisations IAM requises (Compute OS Login ou Compute OS Admin Login).

**Mémoire insuffisante (OOM)**

Si la compilation Docker échoue avec `Killed` et `exit code 137`, le processus de la VM a été arrêté faute de mémoire :

```bash
# Arrêtez d’abord la VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Modifiez le type de machine
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Démarrez la VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Comptes de service (bonne pratique de sécurité)

Pour un usage personnel, votre compte utilisateur par défaut convient parfaitement. Pour l’automatisation ou le CI/CD, créez un compte de service dédié avec des autorisations minimales :

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="Déploiement d’OpenClaw"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Évitez le rôle Owner pour l’automatisation ; utilisez le rôle le plus restreint qui convient. Consultez [Comprendre les rôles](https://cloud.google.com/iam/docs/understanding-roles).

## Étapes suivantes

- Configurez les canaux de messagerie : [Canaux](/fr/channels)
- Associez des appareils locaux en tant que Node : [Node](/fr/nodes)
- Configurez le Gateway : [Configuration du Gateway](/fr/gateway/configuration)

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Azure](/fr/install/azure)
- [Hébergement sur un VPS](/fr/vps)
