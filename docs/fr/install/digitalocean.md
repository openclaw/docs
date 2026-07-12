---
read_when:
    - Configuration d’OpenClaw sur DigitalOcean
    - À la recherche d’un VPS payant simple pour OpenClaw
summary: Héberger OpenClaw sur un Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T02:44:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant sur un Droplet DigitalOcean (environ 6 $/mois pour l’offre Basic de 1 Go).

DigitalOcean constitue une solution VPS payante simple. Pour des options moins chères ou gratuites :

- [Hetzner](/fr/install/hetzner) -- davantage de cœurs et de RAM par dollar.
- [Oracle Cloud](/fr/install/oracle) -- offre ARM Always Free (jusqu’à 4 OCPU et 24 Go de RAM), mais l’inscription peut être délicate et seule l’architecture ARM est prise en charge.

## Prérequis

- Compte DigitalOcean ([inscription](https://cloud.digitalocean.com/registrations/new))
- Paire de clés SSH (ou possibilité d’utiliser l’authentification par mot de passe)
- Environ 20 minutes

## Configuration

<Steps>
  <Step title="Créer un Droplet">
    <Warning>
    Utilisez une image de base propre (Ubuntu 24.04 LTS). Évitez les images tierces en un clic de Marketplace, sauf si vous avez examiné leurs scripts de démarrage et leurs paramètres de pare-feu par défaut.
    </Warning>

    1. Connectez-vous à [DigitalOcean](https://cloud.digitalocean.com/).
    2. Cliquez sur **Create > Droplets**.
    3. Choisissez :
       - **Region:** la région la plus proche de vous
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 Go de RAM / SSD de 25 Go
       - **Authentication:** clé SSH (recommandé) ou mot de passe
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

    Utilisez l’interpréteur de commandes root uniquement pour l’amorçage du système. Exécutez les commandes OpenClaw avec l’utilisateur non-root `openclaw` afin que l’état soit stocké sous `/home/openclaw/.openclaw/` et que le Gateway soit installé en tant que service systemd `--user` de cet utilisateur.

  </Step>

  <Step title="Exécuter l’intégration initiale">
    ```bash
    openclaw onboard --install-daemon
    ```

    L’assistant vous guide dans l’authentification du modèle, la configuration des canaux, la génération du jeton du Gateway et l’installation du démon (service utilisateur systemd).

  </Step>

  <Step title="Ajouter un espace d’échange (recommandé pour les Droplets de 1 Go)">
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

  <Step title="Accéder à l’interface de contrôle">
    Par défaut, le Gateway écoute sur local loopback. Choisissez l’une des options suivantes.

    **Option A : tunnel SSH (la plus simple)**

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

    Tailscale Serve authentifie le trafic de l’interface de contrôle et WebSocket à l’aide des en-têtes d’identité du tailnet, ce qui suppose que l’hôte du Gateway lui-même est fiable. Les points de terminaison de l’API HTTP continuent de suivre le mode d’authentification normal du Gateway (jeton/mot de passe), quoi qu’il en soit. Pour exiger des identifiants explicites fondés sur un secret partagé avec Serve, définissez `gateway.auth.allowTailscale: false` et utilisez `gateway.auth.mode: "token"` ou `"password"`.

    **Option C : liaison au tailnet (sans Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ouvrez ensuite `http://<tailscale-ip>:18789` (jeton requis).

  </Step>
</Steps>

## Persistance et sauvegardes

L’état d’OpenClaw est stocké sous :

- `~/.openclaw/` -- `openclaw.json`, les identifiants des canaux et des fournisseurs, le fichier `auth-profiles.json` propre à chaque agent et les données de session.
- `~/.openclaw/workspace/` -- l’espace de travail de l’agent (SOUL.md, mémoire, artefacts).

Ces données persistent après les redémarrages du Droplet. Pour créer un instantané portable :

```bash
openclaw backup create
```

Les instantanés DigitalOcean sauvegardent l’intégralité du Droplet ; `openclaw backup create` est portable entre différents hôtes.

## Conseils pour 1 Go de RAM

Le Droplet à 6 $ ne dispose que de 1 Go de RAM. Pour garantir un fonctionnement fluide :

- Assurez-vous que l’étape de configuration de l’espace d’échange ci-dessus est inscrite dans `/etc/fstab` afin qu’elle persiste après les redémarrages.
- Préférez les modèles basés sur une API (Claude, GPT) aux modèles locaux -- l’inférence locale d’un LLM ne tient pas dans 1 Go.
- Définissez `agents.defaults.model.primary` sur un modèle plus petit si vous rencontrez des erreurs de mémoire insuffisante avec des invites volumineuses.
- Surveillez les ressources avec `free -h` et `htop`.

## Dépannage

**Le Gateway ne démarre pas** -- Exécutez `openclaw doctor --non-interactive` et consultez les journaux avec `journalctl --user -u openclaw-gateway.service -n 50`.

**Le port est déjà utilisé** -- Exécutez `lsof -i :18789` pour trouver le processus, puis arrêtez-le.

**Mémoire insuffisante** -- Vérifiez que l’espace d’échange est actif avec `free -h`. Si les erreurs de mémoire insuffisante persistent, utilisez des modèles basés sur une API (Claude, GPT) plutôt que des modèles locaux, ou passez à un Droplet de 2 Go.

## Étapes suivantes

- [Canaux](/fr/channels) -- connectez Telegram, WhatsApp, Discord et d’autres services
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/fr/install/updating) -- maintenez OpenClaw à jour

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Fly.io](/fr/install/fly)
- [Hetzner](/fr/install/hetzner)
- [Hébergement sur VPS](/fr/vps)
