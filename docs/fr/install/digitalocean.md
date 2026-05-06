---
read_when:
    - Configuration d’OpenClaw sur DigitalOcean
    - À la recherche d’un VPS payant simple pour OpenClaw
summary: Héberger OpenClaw sur un Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T07:27:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant sur un Droplet DigitalOcean (~6 $/mois pour le forfait Basic 1 Go).

DigitalOcean est le chemin VPS payant le plus simple. Si vous préférez des options moins chères ou gratuites :

- [Hetzner](/fr/install/hetzner) — 3,79 €/mois, plus de cœurs/RAM par dollar.
- [Oracle Cloud](/fr/install/oracle) — ARM Always Free (jusqu’à 4 OCPU, 24 Go de RAM), mais l’inscription peut être capricieuse et limitée à ARM.

## Prérequis

- Compte DigitalOcean ([inscription](https://cloud.digitalocean.com/registrations/new))
- Paire de clés SSH (ou acceptation d’utiliser l’authentification par mot de passe)
- Environ 20 minutes

## Configuration

<Steps>
  <Step title="Créer un Droplet">
    <Warning>
    Utilisez une image de base propre (Ubuntu 24.04 LTS). Évitez les images tierces Marketplace en 1 clic, sauf si vous avez examiné leurs scripts de démarrage et leurs paramètres de pare-feu par défaut.
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
    openclaw --version
    ```

  </Step>

  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    L’assistant vous guide dans l’authentification du modèle, la configuration du canal, la génération du jeton du Gateway et l’installation du daemon (systemd).

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

  <Step title="Accéder à l’interface de contrôle">
    Le Gateway se lie à loopback par défaut. Choisissez l’une de ces options.

    **Option A : tunnel SSH (la plus simple)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Ouvrez ensuite `http://localhost:18789`.

    **Option B : Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Ouvrez ensuite `https://<magicdns>/` depuis n’importe quel appareil de votre tailnet.

    Tailscale Serve authentifie le trafic de l’interface de contrôle et WebSocket via les en-têtes d’identité tailnet, ce qui suppose que l’hôte du Gateway lui-même est fiable. Les points de terminaison de l’API HTTP suivent le mode d’authentification normal du Gateway (jeton/mot de passe) dans tous les cas. Pour exiger des identifiants explicites à secret partagé avec Serve, définissez `gateway.auth.allowTailscale: false` et utilisez `gateway.auth.mode: "token"` ou `"password"`.

    **Option C : liaison tailnet (sans Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ouvrez ensuite `http://<tailscale-ip>:18789` (jeton requis).

  </Step>
</Steps>

## Persistance et sauvegardes

L’état d’OpenClaw se trouve sous :

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` par agent, état des canaux/fournisseurs et données de session.
- `~/.openclaw/workspace/` — l’espace de travail de l’agent (SOUL.md, mémoire, artefacts).

Ces données survivent aux redémarrages du Droplet. Pour créer un instantané portable :

```bash
openclaw backup create
```

Les snapshots DigitalOcean sauvegardent tout le Droplet ; `openclaw backup create` est portable entre hôtes.

## Conseils pour 1 Go de RAM

Le Droplet à 6 $ ne dispose que de 1 Go de RAM. Pour garder un fonctionnement fluide :

- Assurez-vous que l’étape de swap ci-dessus est dans `/etc/fstab` afin qu’elle survive aux redémarrages.
- Préférez les modèles basés sur API (Claude, GPT) aux modèles locaux — l’inférence LLM locale ne tient pas dans 1 Go.
- Définissez `agents.defaults.model.primary` sur un modèle plus petit si vous rencontrez des OOM avec de grands prompts.
- Surveillez avec `free -h` et `htop`.

## Dépannage

**Le Gateway ne démarre pas** -- Exécutez `openclaw doctor --non-interactive` et vérifiez les journaux avec `journalctl --user -u openclaw-gateway.service -n 50`.

**Port déjà utilisé** -- Exécutez `lsof -i :18789` pour trouver le processus, puis arrêtez-le.

**Mémoire insuffisante** -- Vérifiez que le swap est actif avec `free -h`. Si vous rencontrez encore des OOM, utilisez des modèles basés sur API (Claude, GPT) plutôt que des modèles locaux, ou passez à un Droplet de 2 Go.

## Étapes suivantes

- [Canaux](/fr/channels) -- connecter Telegram, WhatsApp, Discord et plus encore
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/fr/install/updating) -- maintenir OpenClaw à jour

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Fly.io](/fr/install/fly)
- [Hetzner](/fr/install/hetzner)
- [Hébergement VPS](/fr/vps)
