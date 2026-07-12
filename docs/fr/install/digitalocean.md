---
read_when:
    - Configurer OpenClaw sur DigitalOcean
    - Vous recherchez un VPS payant simple pour OpenClaw
summary: Héberger OpenClaw sur un Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T15:33:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
    Utilisez une image de base propre (Ubuntu 24.04 LTS). Évitez les images tierces en un clic de Marketplace, sauf si vous avez examiné leurs scripts de démarrage et les paramètres par défaut de leur pare-feu.
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

    # Installer Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Installer OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Créer l’utilisateur non-root qui possédera l’état et les services OpenClaw.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Utilisez le shell root uniquement pour l’initialisation du système. Exécutez les commandes OpenClaw avec l’utilisateur non-root `openclaw` afin que l’état soit stocké sous `/home/openclaw/.openclaw/` et que le Gateway soit installé en tant que service systemd `--user` de cet utilisateur.

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
    Le Gateway écoute sur l’interface de bouclage par défaut. Choisissez l’une des options suivantes.

    **Option A : tunnel SSH (la plus simple)**

    ```bash
    # Depuis votre machine locale
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

    Tailscale Serve authentifie le trafic de l’interface de contrôle et WebSocket au moyen des en-têtes d’identité du tailnet, ce qui suppose que l’hôte du Gateway lui-même est digne de confiance. Les points de terminaison de l’API HTTP continuent d’utiliser le mode d’authentification normal du Gateway (jeton/mot de passe), indépendamment de ce paramètre. Pour exiger des identifiants explicites à secret partagé avec Serve, définissez `gateway.auth.allowTailscale: false` et utilisez `gateway.auth.mode: "token"` ou `"password"`.

    **Option C : écoute sur le tailnet (sans Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ouvrez ensuite `http://<tailscale-ip>:18789` (jeton requis).

  </Step>
</Steps>

## Persistance et sauvegardes

L’état d’OpenClaw est stocké sous :

- `~/.openclaw/` -- `openclaw.json`, les identifiants des canaux et des fournisseurs, le fichier `auth-profiles.json` de chaque agent et les données de session.
- `~/.openclaw/workspace/` -- l’espace de travail de l’agent (SOUL.md, mémoire, artefacts).

Ces données sont conservées lors des redémarrages du Droplet. Pour créer un instantané portable :

```bash
openclaw backup create
```

Les instantanés DigitalOcean sauvegardent l’intégralité du Droplet ; `openclaw backup create` est portable d’un hôte à l’autre.

## Conseils pour 1 Go de RAM

Le Droplet à 6 $ ne dispose que de 1 Go de RAM. Pour garantir un fonctionnement fluide :

- Assurez-vous que l’étape de configuration de l’espace d’échange ci-dessus figure dans `/etc/fstab` afin qu’elle soit conservée lors des redémarrages.
- Préférez les modèles accessibles par API (Claude, GPT) aux modèles locaux -- l’inférence locale de LLM ne tient pas dans 1 Go.
- Définissez `agents.defaults.model.primary` sur un modèle plus petit si de longues invites provoquent des erreurs de mémoire insuffisante.
- Surveillez les ressources avec `free -h` et `htop`.

## Dépannage

**Le Gateway ne démarre pas** -- Exécutez `openclaw doctor --non-interactive` et consultez les journaux avec `journalctl --user -u openclaw-gateway.service -n 50`.

**Le port est déjà utilisé** -- Exécutez `lsof -i :18789` pour trouver le processus, puis arrêtez-le.

**Mémoire insuffisante** -- Vérifiez que l’espace d’échange est actif avec `free -h`. Si les erreurs de mémoire insuffisante persistent, utilisez des modèles accessibles par API (Claude, GPT) plutôt que des modèles locaux, ou passez à un Droplet de 2 Go.

## Étapes suivantes

- [Canaux](/fr/channels) -- connectez Telegram, WhatsApp, Discord et d’autres services
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/fr/install/updating) -- maintenez OpenClaw à jour

## Pages associées

- [Vue d’ensemble de l’installation](/fr/install)
- [Fly.io](/fr/install/fly)
- [Hetzner](/fr/install/hetzner)
- [Hébergement sur VPS](/fr/vps)
