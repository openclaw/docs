---
read_when:
    - Configuration d'OpenClaw sur Oracle Cloud
    - À la recherche d’un hébergement VPS gratuit pour OpenClaw
    - Vous voulez OpenClaw 24 h/24 et 7 j/7 sur un petit serveur
summary: Héberger OpenClaw sur l’offre ARM Always Free d’Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T07:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

Exécutez un OpenClaw Gateway persistant sur le niveau ARM **Always Free** d’Oracle Cloud (jusqu’à 4 OCPU, 24 Go de RAM, 200 Go de stockage) sans frais.

## Prérequis

- Compte Oracle Cloud ([inscription](https://www.oracle.com/cloud/free/)) -- consultez le [guide d’inscription communautaire](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si vous rencontrez des problèmes
- Compte Tailscale (gratuit sur [tailscale.com](https://tailscale.com))
- Une paire de clés SSH
- Environ 30 minutes

## Configuration

<Steps>
  <Step title="Créer une instance OCI">
    1. Connectez-vous à l’[Oracle Cloud Console](https://cloud.oracle.com/).
    2. Accédez à **Compute > Instances > Create Instance**.
    3. Configurez :
       - **Nom :** `openclaw`
       - **Image :** Ubuntu 24.04 (aarch64)
       - **Forme :** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU :** 2 (ou jusqu’à 4)
       - **Mémoire :** 12 Go (ou jusqu’à 24 Go)
       - **Volume de démarrage :** 50 Go (jusqu’à 200 Go gratuits)
       - **Clé SSH :** ajoutez votre clé publique
    4. Cliquez sur **Create** et notez l’adresse IP publique.

    <Tip>
    Si la création de l’instance échoue avec « Out of capacity », essayez un autre domaine de disponibilité ou réessayez plus tard. La capacité du niveau gratuit est limitée.
    </Tip>

  </Step>

  <Step title="Se connecter et mettre à jour le système">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` est requis pour la compilation ARM de certaines dépendances.

  </Step>

  <Step title="Configurer l’utilisateur et le nom d’hôte">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    L’activation de linger maintient les services utilisateur en cours d’exécution après la déconnexion.

  </Step>

  <Step title="Installer Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    À partir de maintenant, connectez-vous via Tailscale : `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Installer OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Lorsque l’invite « How do you want to hatch your bot? » s’affiche, sélectionnez **Faire cela plus tard**.

  </Step>

  <Step title="Configurer le Gateway">
    Utilisez l’authentification par jeton avec Tailscale Serve pour un accès distant sécurisé.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` ici sert uniquement à la gestion des IP transférées/clients locaux par le proxy local Tailscale Serve. Ce n’est **pas** `gateway.auth.mode: "trusted-proxy"`. Les routes de visualisation des diffs conservent un comportement de fermeture en cas d’échec dans cette configuration : les requêtes brutes du visualiseur vers `127.0.0.1` sans en-têtes de proxy transférés peuvent renvoyer `Diff not found`. Utilisez `mode=file` / `mode=both` pour les pièces jointes, ou activez intentionnellement les visualiseurs distants et définissez `plugins.entries.diffs.config.viewerBaseUrl` (ou transmettez un `baseUrl` de proxy) si vous avez besoin de liens de visualiseur partageables.

  </Step>

  <Step title="Verrouiller la sécurité du VCN">
    Bloquez tout le trafic sauf Tailscale à la périphérie du réseau :

    1. Accédez à **Networking > Virtual Cloud Networks** dans la console OCI.
    2. Cliquez sur votre VCN, puis sur **Security Lists > Default Security List**.
    3. **Supprimez** toutes les règles d’entrée sauf `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Conservez les règles de sortie par défaut (autoriser tout le trafic sortant).

    Cela bloque SSH sur le port 22, HTTP, HTTPS et tout le reste à la périphérie du réseau. À partir de ce point, vous ne pouvez vous connecter que via Tailscale.

  </Step>

  <Step title="Vérifier">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Accédez à l’interface de contrôle depuis n’importe quel appareil sur votre tailnet :

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Remplacez `<tailnet-name>` par le nom de votre tailnet (visible dans `tailscale status`).

  </Step>
</Steps>

## Vérifier la posture de sécurité

Avec le VCN verrouillé (seul UDP 41641 ouvert) et le Gateway lié au local loopback, le trafic public est bloqué à la périphérie du réseau et l’accès administrateur est réservé au tailnet. Cela supprime la nécessité de plusieurs étapes traditionnelles de durcissement d’un VPS :

| Étape traditionnelle            | Nécessaire ?       | Pourquoi                                                                      |
| ------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| Pare-feu UFW                    | Non                | Le VCN bloque le trafic avant qu’il n’atteigne l’instance.                    |
| fail2ban                        | Non                | Le port 22 est bloqué au niveau du VCN ; aucune surface de force brute.       |
| Durcissement de sshd            | Non                | Tailscale SSH n’utilise pas sshd.                                             |
| Désactiver la connexion root    | Non                | Tailscale authentifie par identité de tailnet, pas par utilisateurs système.   |
| Authentification SSH par clé seule | Non             | Même raison — l’identité de tailnet remplace les clés SSH système.            |
| Durcissement IPv6               | Généralement non   | Dépend des paramètres VCN/sous-réseau ; vérifiez ce qui est réellement attribué/exposé. |

Toujours recommandé :

- `chmod 700 ~/.openclaw` pour restreindre les autorisations des fichiers d’identifiants.
- `openclaw security audit` pour une vérification de posture propre à OpenClaw.
- `sudo apt update && sudo apt upgrade` régulièrement pour les correctifs du système d’exploitation.
- Examinez périodiquement les appareils dans la [console d’administration Tailscale](https://login.tailscale.com/admin).

Commandes de vérification rapides :

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Notes ARM

Le niveau Always Free est ARM (`aarch64`). La plupart des fonctionnalités d’OpenClaw fonctionnent correctement ; un petit nombre de binaires natifs nécessitent des builds ARM :

- Node.js, Telegram, WhatsApp (Baileys) : JavaScript pur, aucun problème.
- La plupart des paquets npm avec du code natif : artefacts `linux-arm64` précompilés disponibles.
- Assistants CLI facultatifs (par exemple les binaires Go/Rust fournis par des skills) : vérifiez qu’une version `aarch64` / `linux-arm64` existe avant l’installation.

Vérifiez l’architecture avec `uname -m` (doit afficher `aarch64`). Pour les binaires sans build ARM, installez depuis les sources ou ignorez-les.

## Persistance et sauvegardes

L’état d’OpenClaw se trouve sous :

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` par agent, état des canaux/fournisseurs et données de session.
- `~/.openclaw/workspace/` — l’espace de travail de l’agent (SOUL.md, mémoire, artefacts).

Ces données survivent aux redémarrages. Pour créer un instantané portable :

```bash
openclaw backup create
```

## Solution de repli : tunnel SSH

Si Tailscale Serve ne fonctionne pas, utilisez un tunnel SSH depuis votre machine locale :

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ouvrez ensuite `http://localhost:18789`.

## Dépannage

**La création de l’instance échoue (« Out of capacity »)** -- Les instances ARM du niveau gratuit sont populaires. Essayez un autre domaine de disponibilité ou réessayez pendant les heures creuses.

**Tailscale ne se connecte pas** -- Exécutez `sudo tailscale up --ssh --hostname=openclaw --reset` pour vous réauthentifier.

**Le Gateway ne démarre pas** -- Exécutez `openclaw doctor --non-interactive` et consultez les journaux avec `journalctl --user -u openclaw-gateway.service -n 50`.

**Problèmes de binaires ARM** -- La plupart des paquets npm fonctionnent sur ARM64. Pour les binaires natifs, recherchez des versions `linux-arm64` ou `aarch64`. Vérifiez l’architecture avec `uname -m`.

## Étapes suivantes

- [Canaux](/fr/channels) -- connectez Telegram, WhatsApp, Discord et plus encore
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/fr/install/updating) -- maintenez OpenClaw à jour

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [GCP](/fr/install/gcp)
- [Hébergement VPS](/fr/vps)
