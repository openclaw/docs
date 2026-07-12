---
read_when:
    - Configuration d’OpenClaw sur Oracle Cloud
    - À la recherche d’un hébergement VPS gratuit pour OpenClaw
    - Vous souhaitez utiliser OpenClaw 24 h/24 et 7 j/7 sur un petit serveur
summary: Héberger OpenClaw sur l’offre ARM Always Free d’Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T15:34:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant sur l’offre ARM **Always Free** d’Oracle Cloud (jusqu’à 4 OCPU, 24 Go de RAM et 200 Go de stockage), sans frais.

## Prérequis

- Un compte Oracle Cloud ([inscription](https://www.oracle.com/cloud/free/)) -- consultez le [guide d’inscription de la communauté](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) en cas de problème
- Un compte Tailscale (gratuit sur [tailscale.com](https://tailscale.com))
- Une paire de clés SSH
- Environ 30 minutes

## Configuration

<Steps>
  <Step title="Créer une instance OCI">
    1. Connectez-vous à la [console Oracle Cloud](https://cloud.oracle.com/).
    2. Accédez à **Compute > Instances > Create Instance**.
    3. Configurez les paramètres suivants :
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (ou jusqu’à 4)
       - **Memory:** 12 Go (ou jusqu’à 24 Go)
       - **Boot volume:** 50 Go (jusqu’à 200 Go gratuits)
       - **SSH key:** ajoutez votre clé publique
    4. Cliquez sur **Create** et notez l’adresse IP publique.

    <Tip>
    Si la création de l’instance échoue avec le message « Out of capacity », essayez un autre domaine de disponibilité ou réessayez plus tard. La capacité de l’offre gratuite est limitée.
    </Tip>

  </Step>

  <Step title="Se connecter et mettre à jour le système">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` est requis pour compiler certaines dépendances sur ARM.

  </Step>

  <Step title="Configurer l’utilisateur et le nom d’hôte">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    L’activation de la persistance maintient les services utilisateur en cours d’exécution après la déconnexion.

  </Step>

  <Step title="Installer Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Désormais, connectez-vous via Tailscale : `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Installer OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Lorsque le message « How do you want to hatch your bot? » s’affiche, sélectionnez **Do this later**.

  </Step>

  <Step title="Configurer le Gateway">
    Utilisez l’authentification par jeton avec Tailscale Serve pour sécuriser l’accès à distance.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Ici, `gateway.trustedProxies=["127.0.0.1"]` sert uniquement à la gestion de l’adresse IP transférée et du client local par le proxy Tailscale Serve local. Il ne s’agit **pas** de `gateway.auth.mode: "trusted-proxy"`. Dans cette configuration, les routes de la visionneuse de différences conservent un comportement de fermeture en cas d’échec : les requêtes brutes adressées à la visionneuse depuis `127.0.0.1` sans en-têtes de proxy transférés renvoient `Diff not found`. Utilisez `mode=file` / `mode=both` pour les pièces jointes, ou activez volontairement les visionneuses distantes et définissez `plugins.entries.diffs.config.viewerBaseUrl` (ou transmettez un `baseUrl` de proxy) si vous avez besoin de liens partageables vers la visionneuse.

  </Step>

  <Step title="Sécuriser le VCN">
    Bloquez tout le trafic, sauf celui de Tailscale, à la périphérie du réseau :

    1. Dans la console OCI, accédez à **Networking > Virtual Cloud Networks**.
    2. Cliquez sur votre VCN, puis sur **Security Lists > Default Security List**.
    3. **Supprimez** toutes les règles de trafic entrant, à l’exception de `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Conservez les règles de trafic sortant par défaut (autoriser tout le trafic sortant).

    Cela bloque SSH sur le port 22, HTTP, HTTPS et tout autre trafic à la périphérie du réseau. À partir de ce moment, vous ne pouvez vous connecter que via Tailscale.

  </Step>

  <Step title="Vérifier">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Accédez à l’interface de contrôle depuis n’importe quel appareil de votre tailnet :

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Remplacez `<tailnet-name>` par le nom de votre tailnet (visible dans `tailscale status`).

  </Step>
</Steps>

## Vérifier la posture de sécurité

Avec le VCN verrouillé (seul le port UDP 41641 est ouvert) et le Gateway lié à l’interface de bouclage, le trafic public est bloqué à la périphérie du réseau et l’accès administratif est limité au tailnet. Plusieurs étapes traditionnelles de sécurisation d’un VPS deviennent ainsi inutiles :

| Étape traditionnelle                 | Nécessaire ?       | Pourquoi                                                                                  |
| ------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------- |
| Pare-feu UFW                         | Non                | Le VCN bloque le trafic avant qu’il n’atteigne l’instance.                                 |
| fail2ban                             | Non                | Le port 22 est bloqué au niveau du VCN ; aucune surface d’attaque par force brute.         |
| Renforcement de sshd                 | Non                | Tailscale SSH n’utilise pas sshd.                                                          |
| Désactivation de la connexion root   | Non                | Tailscale authentifie selon l’identité du tailnet, et non selon les utilisateurs système. |
| Authentification par clé SSH uniquement | Non             | Même raison -- l’identité du tailnet remplace les clés SSH système.                        |
| Renforcement d’IPv6                  | Généralement non   | Dépend des paramètres du VCN/sous-réseau ; vérifiez ce qui est réellement attribué/exposé. |

Mesures toujours recommandées :

- `chmod 700 ~/.openclaw` pour restreindre les autorisations des fichiers d’identifiants.
- `openclaw security audit` pour vérifier la posture propre à OpenClaw.
- Exécutez régulièrement `sudo apt update && sudo apt upgrade` pour appliquer les correctifs du système d’exploitation.
- Examinez régulièrement les appareils dans la [console d’administration Tailscale](https://login.tailscale.com/admin).

Commandes de vérification rapide :

```bash
# Vérifier qu’aucun port public n’est en écoute
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Vérifier que Tailscale SSH est actif
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH actif"

# Facultatif : désactiver entièrement sshd après avoir confirmé le bon fonctionnement de Tailscale SSH
sudo systemctl disable --now ssh
```

## Remarques sur ARM

L’offre Always Free utilise l’architecture ARM (`aarch64`). La plupart des fonctionnalités d’OpenClaw fonctionnent correctement ; un petit nombre de binaires natifs nécessitent des versions ARM :

- Node.js, Telegram, WhatsApp (Baileys) : JavaScript pur, aucun problème.
- La plupart des paquets npm contenant du code natif : des artefacts `linux-arm64` précompilés sont disponibles.
- Utilitaires CLI facultatifs (par exemple, les binaires Go/Rust distribués par des Skills) : vérifiez qu’une version `aarch64` / `linux-arm64` est disponible avant l’installation.

Vérifiez l’architecture avec `uname -m` (la commande doit afficher `aarch64`). Pour les binaires sans version ARM, effectuez l’installation à partir des sources ou ignorez-les.

## Persistance et sauvegardes

L’état d’OpenClaw se trouve dans les emplacements suivants :

- `~/.openclaw/` -- `openclaw.json`, les fichiers `auth-profiles.json` propres à chaque agent, l’état des canaux et des fournisseurs, ainsi que les données de session.
- `~/.openclaw/workspace/` -- l’espace de travail de l’agent (SOUL.md, mémoire, artefacts).

Ces données persistent après les redémarrages. Pour créer un instantané portable :

```bash
openclaw backup create
```

## Solution de secours : tunnel SSH

Si Tailscale Serve ne fonctionne pas, utilisez un tunnel SSH depuis votre machine locale :

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ouvrez ensuite `http://localhost:18789`.

## Résolution des problèmes

**La création de l’instance échoue (« Out of capacity »)** -- Les instances ARM de l’offre gratuite sont très demandées. Essayez un autre domaine de disponibilité ou réessayez pendant les heures creuses.

**Tailscale ne se connecte pas** -- Exécutez `sudo tailscale up --ssh --hostname=openclaw --reset` pour vous réauthentifier.

**Le Gateway ne démarre pas** -- Exécutez `openclaw doctor --non-interactive` et consultez les journaux avec `journalctl --user -u openclaw-gateway.service -n 50`.

**Problèmes liés aux binaires ARM** -- La plupart des paquets npm fonctionnent sur ARM64. Pour les binaires natifs, recherchez des versions `linux-arm64` ou `aarch64`. Vérifiez l’architecture avec `uname -m`.

## Étapes suivantes

- [Canaux](/fr/channels) -- connectez Telegram, WhatsApp, Discord et d’autres services
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/fr/install/updating) -- maintenez OpenClaw à jour

## Voir aussi

- [Présentation de l’installation](/fr/install)
- [GCP](/fr/install/gcp)
- [Hébergement sur VPS](/fr/vps)
