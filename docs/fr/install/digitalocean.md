---
read_when:
    - Configuration d’OpenClaw sur DigitalOcean
    - Recherche d’un VPS payant simple pour OpenClaw
summary: Héberger OpenClaw sur un Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-11T20:41:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
---

Exécutez un OpenClaw Gateway persistant sur un Droplet DigitalOcean (~6 $/mois pour l’offre Basic 1 Go).

DigitalOcean est l’option VPS payante la plus simple. Si vous préférez des options moins chères ou gratuites :

- [Hetzner](/fr/install/hetzner) — 3,79 €/mois, plus de cœurs/RAM par dollar.
- [Oracle Cloud](/fr/install/oracle) — ARM Always Free (jusqu’à 4 OCPU, 24 Go de RAM), mais l’inscription peut être capricieuse et l’offre est uniquement ARM.

## Prérequis

- Compte DigitalOcean ([inscription](https://cloud.digitalocean.com/registrations/new))
- Paire de clés SSH (ou volonté d’utiliser l’authentification par mot de passe)
- Environ 20 minutes

## Configuration

<Steps>
  <Step title="Créer un Droplet">
    <Warning>
    Utilisez une image de base propre (Ubuntu 24.04 LTS). Évitez les images Marketplace 1-click de tiers, sauf si vous avez examiné leurs scripts de démarrage et leurs paramètres de pare-feu par défaut.
    </Warning>

    1. Connectez-vous à [DigitalOcean](https://cloud.digitalocean.com/).
    2. Cliquez sur **Create > Droplets**.
    3. Choisissez :
       - **Région :** la plus proche de vous
       - **Image :** Ubuntu 24.04 LTS
       - **Taille :** Basic, Regular, 1 vCPU / 1 Go de RAM / 25 Go SSD
       - **Authentification :** clé SSH (recommandé) ou mot de passe
    4. Cliquez sur **Create Droplet** et notez l’adresse IP.

  </Step>

  <Step title="Se connecter et installer">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Utilisez le shell root uniquement pour l’amorçage du système. Exécutez les commandes OpenClaw avec l’utilisateur non-root `openclaw` afin que l’état réside sous `/home/openclaw/.openclaw/` et que le Gateway s’installe comme service systemd de cet utilisateur.

  </Step>

  <Step title="Lancer l’onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    L’assistant vous guide dans l’authentification du modèle, la configuration du canal, la génération du jeton du Gateway et l’installation du démon (systemd).

  </Step>

  <Step title="Ajouter du swap (recommandé pour les Droplets de 1 Go)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Vérifier le Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accéder à l’interface utilisateur de contrôle">
    Le Gateway se lie au loopback par défaut. Choisissez l’une de ces options.

    **Option A : tunnel SSH (le plus simple)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Ouvrez ensuite `http://localhost:18789`.

    **Option B : Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Ouvrez ensuite `https://<magicdns>/` depuis n’importe quel appareil de votre tailnet.

    Tailscale Serve authentifie le trafic de l’interface utilisateur de contrôle et WebSocket via les en-têtes d’identité du tailnet, ce qui suppose que l’hôte du Gateway lui-même est fiable. Les points de terminaison de l’API HTTP suivent le mode d’authentification normal du Gateway (jeton/mot de passe) dans tous les cas. Pour exiger des identifiants à secret partagé explicites via Serve, définissez `gateway.auth.allowTailscale: false` et utilisez `gateway.auth.mode: "token"` ou `"password"`.

    **Option C : liaison au tailnet (sans Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ouvrez ensuite `http://<tailscale-ip>:18789` (jeton requis).

  </Step>
</Steps>

## Persistance et sauvegardes

L’état d’OpenClaw réside sous :

- `~/.openclaw/` — `openclaw.json`, les fichiers `auth-profiles.json` par agent, l’état des canaux/fournisseurs et les données de session.
- `~/.openclaw/workspace/` — l’espace de travail de l’agent (SOUL.md, mémoire, artefacts).

Ces données survivent aux redémarrages du Droplet. Pour créer un instantané portable :

```bash
openclaw backup create
```

Les instantanés DigitalOcean sauvegardent l’intégralité du Droplet ; `openclaw backup create` est portable entre hôtes.

## Conseils pour 1 Go de RAM

Le Droplet à 6 $ ne dispose que de 1 Go de RAM. Pour garder un fonctionnement fluide :

- Assurez-vous que l’étape de swap ci-dessus est présente dans `/etc/fstab` afin qu’elle survive aux redémarrages.
- Préférez les modèles basés sur API (Claude, GPT) aux modèles locaux — l’inférence LLM locale ne tient pas dans 1 Go.
- Définissez `agents.defaults.model.primary` sur un modèle plus petit si vous rencontrez des OOM sur de grandes invites.
- Surveillez avec `free -h` et `htop`.

## Dépannage

**Le Gateway ne démarre pas** -- Exécutez `openclaw doctor --non-interactive` et consultez les journaux avec `journalctl --user -u openclaw-gateway.service -n 50`.

**Port déjà utilisé** -- Exécutez `lsof -i :18789` pour trouver le processus, puis arrêtez-le.

**Mémoire insuffisante** -- Vérifiez que le swap est actif avec `free -h`. Si vous rencontrez encore des OOM, utilisez des modèles basés sur API (Claude, GPT) plutôt que des modèles locaux, ou passez à un Droplet de 2 Go.

## Étapes suivantes

- [Canaux](/fr/channels) -- connectez Telegram, WhatsApp, Discord et plus encore
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/fr/install/updating) -- maintenez OpenClaw à jour

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Fly.io](/fr/install/fly)
- [Hetzner](/fr/install/hetzner)
- [Hébergement VPS](/fr/vps)
