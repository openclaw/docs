---
read_when:
    - Déploiement d’OpenClaw sur Fly.io
    - Configuration des volumes Fly, des secrets et de la configuration du premier démarrage
summary: Déploiement pas à pas sur Fly.io pour OpenClaw avec stockage persistant et HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T11:32:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Déploiement Fly.io

**Objectif :** une Gateway OpenClaw exécutée sur une machine [Fly.io](https://fly.io) avec stockage persistant, HTTPS automatique et accès Discord/canaux.

## Ce dont vous avez besoin

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) installé
- Un compte Fly.io (le niveau gratuit fonctionne)
- Authentification modèle : clé API pour le fournisseur de modèles choisi
- Identifiants de canal : jeton de bot Discord, jeton Telegram, etc.

## Chemin rapide pour débuter

1. Cloner le dépôt → personnaliser `fly.toml`
2. Créer l’application + le volume → définir les secrets
3. Déployer avec `fly deploy`
4. Se connecter en SSH pour créer la configuration ou utiliser Control UI

<Steps>
  <Step title="Créer l’application Fly">
    ```bash
    # Cloner le dépôt
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Créer une nouvelle application Fly (choisissez votre propre nom)
    fly apps create my-openclaw

    # Créer un volume persistant (1 Go suffit généralement)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Conseil :** choisissez une région proche de vous. Options courantes : `lhr` (Londres), `iad` (Virginie), `sjc` (San Jose).

  </Step>

  <Step title="Configurer fly.toml">
    Modifiez `fly.toml` pour qu’il corresponde au nom de votre application et à vos besoins.

    **Remarque de sécurité :** la configuration par défaut expose une URL publique. Pour un déploiement renforcé sans IP publique, voir [Déploiement privé](#private-deployment-hardened) ou utilisez `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Nom de votre application
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Paramètres clés :**

    | Setting                        | Pourquoi                                                                  |
    | ------------------------------ | ------------------------------------------------------------------------- |
    | `--bind lan`                   | Lie à `0.0.0.0` afin que le proxy Fly puisse atteindre la Gateway         |
    | `--allow-unconfigured`         | Démarre sans fichier de configuration (vous en créerez un après)         |
    | `internal_port = 3000`         | Doit correspondre à `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) pour les vérifications de santé Fly |
    | `memory = "2048mb"`            | 512 Mo est trop faible ; 2 Go recommandés                                |
    | `OPENCLAW_STATE_DIR = "/data"` | Rend l’état persistant sur le volume                                     |

  </Step>

  <Step title="Définir les secrets">
    ```bash
    # Requis : jeton Gateway (pour une liaison non loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Clés API du fournisseur de modèles
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Facultatif : autres fournisseurs
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Jetons de canal
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Remarques :**

    - Les liaisons non loopback (`--bind lan`) nécessitent un chemin d’authentification Gateway valide. Cet exemple Fly.io utilise `OPENCLAW_GATEWAY_TOKEN`, mais `gateway.auth.password` ou un déploiement `trusted-proxy` non loopback correctement configuré satisfont aussi cette exigence.
    - Traitez ces jetons comme des mots de passe.
    - **Préférez les variables d’environnement au fichier de configuration** pour toutes les clés API et tous les jetons. Cela garde les secrets hors de `openclaw.json`, où ils pourraient être exposés ou journalisés par accident.

  </Step>

  <Step title="Déployer">
    ```bash
    fly deploy
    ```

    Le premier déploiement construit l’image Docker (~2 à 3 minutes). Les déploiements suivants sont plus rapides.

    Après le déploiement, vérifiez :

    ```bash
    fly status
    fly logs
    ```

    Vous devriez voir :

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Créer le fichier de configuration">
    Connectez-vous en SSH à la machine pour créer une configuration correcte :

    ```bash
    fly ssh console
    ```

    Créez le répertoire et le fichier de configuration :

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Remarque :** avec `OPENCLAW_STATE_DIR=/data`, le chemin de configuration est `/data/openclaw.json`.

    **Remarque :** remplacez `https://my-openclaw.fly.dev` par l’origine réelle de votre application Fly. Le démarrage de la Gateway amorce les origines locales de Control UI à partir des valeurs d’exécution `--bind` et `--port`, de sorte que le premier démarrage puisse se poursuivre avant l’existence de la configuration, mais l’accès navigateur via Fly nécessite toujours que l’origine HTTPS exacte soit listée dans `gateway.controlUi.allowedOrigins`.

    **Remarque :** le jeton Discord peut provenir de :

    - Variable d’environnement : `DISCORD_BOT_TOKEN` (recommandé pour les secrets)
    - Fichier de configuration : `channels.discord.token`

    Si vous utilisez une variable d’environnement, inutile d’ajouter le jeton à la configuration. La Gateway lit automatiquement `DISCORD_BOT_TOKEN`.

    Redémarrez pour appliquer :

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Accéder à la Gateway">
    ### Control UI

    Ouvrez dans le navigateur :

    ```bash
    fly open
    ```

    Ou visitez `https://my-openclaw.fly.dev/`

    Authentifiez-vous avec le secret partagé configuré. Ce guide utilise le jeton Gateway
    provenant de `OPENCLAW_GATEWAY_TOKEN` ; si vous êtes passé à l’authentification par mot de passe, utilisez
    ce mot de passe à la place.

    ### Journaux

    ```bash
    fly logs              # Journaux en direct
    fly logs --no-tail    # Journaux récents
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Dépannage

### "App is not listening on expected address"

La Gateway se lie à `127.0.0.1` au lieu de `0.0.0.0`.

**Correctif :** ajoutez `--bind lan` à la commande du processus dans `fly.toml`.

### Vérifications de santé en échec / connexion refusée

Fly ne peut pas atteindre la Gateway sur le port configuré.

**Correctif :** assurez-vous que `internal_port` correspond au port Gateway (définissez `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Problèmes de mémoire

Le conteneur redémarre sans cesse ou est tué. Signes : `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, ou redémarrages silencieux.

**Correctif :** augmentez la mémoire dans `fly.toml` :

```toml
[[vm]]
  memory = "2048mb"
```

Ou mettez à jour une machine existante :

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Remarque :** 512 Mo est trop faible. 1 Go peut fonctionner mais provoquer un OOM sous charge ou avec une journalisation verbeuse. **2 Go sont recommandés.**

### Problèmes de verrou Gateway

La Gateway refuse de démarrer avec des erreurs du type "already running".

Cela se produit lorsque le conteneur redémarre mais que le fichier de verrou PID persiste sur le volume.

**Correctif :** supprimez le fichier de verrou :

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Le fichier de verrou se trouve dans `/data/gateway.*.lock` (pas dans un sous-répertoire).

### La configuration n’est pas lue

`--allow-unconfigured` contourne uniquement la protection de démarrage. Il ne crée ni ne répare `/data/openclaw.json`, donc assurez-vous que votre configuration réelle existe et inclut `gateway.mode="local"` lorsque vous voulez un démarrage local normal de la Gateway.

Vérifiez que la configuration existe :

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Écriture de la configuration via SSH

La commande `fly ssh console -C` ne prend pas en charge la redirection shell. Pour écrire un fichier de configuration :

```bash
# Utiliser echo + tee (pipeline du local vers le distant)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Ou utiliser sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Remarque :** `fly sftp` peut échouer si le fichier existe déjà. Supprimez-le d’abord :

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### L’état n’est pas persistant

Si vous perdez les profils d’authentification, l’état des canaux/fournisseurs ou les sessions après un redémarrage,
le répertoire d’état écrit dans le système de fichiers du conteneur.

**Correctif :** assurez-vous que `OPENCLAW_STATE_DIR=/data` est défini dans `fly.toml`, puis redéployez.

## Mises à jour

```bash
# Récupérer les derniers changements
git pull

# Redéployer
fly deploy

# Vérifier l’état
fly status
fly logs
```

### Mise à jour de la commande de la machine

Si vous devez modifier la commande de démarrage sans redéploiement complet :

```bash
# Obtenir l’ID de la machine
fly machines list

# Mettre à jour la commande
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Ou avec augmentation mémoire
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Remarque :** après `fly deploy`, la commande de la machine peut revenir à ce qui figure dans `fly.toml`. Si vous avez effectué des modifications manuelles, réappliquez-les après le déploiement.

## Déploiement privé (renforcé)

Par défaut, Fly alloue des IP publiques, ce qui rend votre Gateway accessible à `https://your-app.fly.dev`. C’est pratique, mais cela signifie aussi que votre déploiement est détectable par les scanners Internet (Shodan, Censys, etc.).

Pour un déploiement renforcé **sans exposition publique**, utilisez le modèle privé.

### Quand utiliser un déploiement privé

- Vous effectuez uniquement des appels/messages **sortants** (pas de Webhooks entrants)
- Vous utilisez des tunnels **ngrok ou Tailscale** pour d’éventuels rappels Webhook
- Vous accédez à la Gateway via **SSH, proxy ou WireGuard** plutôt que depuis un navigateur
- Vous souhaitez que le déploiement soit **caché aux scanners Internet**

### Configuration

Utilisez `fly.private.toml` au lieu de la configuration standard :

```bash
# Déployer avec la configuration privée
fly deploy -c fly.private.toml
```

Ou convertissez un déploiement existant :

```bash
# Lister les IP actuelles
fly ips list -a my-openclaw

# Libérer les IP publiques
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Basculer vers la configuration privée afin que les futurs déploiements ne réallouent pas d’IP publiques
# (supprimez [http_service] ou déployez avec le modèle privé)
fly deploy -c fly.private.toml

# Allouer une IPv6 privée uniquement
fly ips allocate-v6 --private -a my-openclaw
```

Après cela, `fly ips list` ne doit afficher qu’une IP de type `private` :

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accéder à un déploiement privé

Comme il n’y a pas d’URL publique, utilisez l’une de ces méthodes :

**Option 1 : proxy local (le plus simple)**

```bash
# Rediriger le port local 3000 vers l’application
fly proxy 3000:3000 -a my-openclaw

# Puis ouvrir http://localhost:3000 dans le navigateur
```

**Option 2 : VPN WireGuard**

```bash
# Créer une configuration WireGuard (une seule fois)
fly wireguard create

# Importer dans le client WireGuard, puis accéder via l’IPv6 interne
# Exemple : http://[fdaa:x:x:x:x::x]:3000
```

**Option 3 : SSH uniquement**

```bash
fly ssh console -a my-openclaw
```

### Webhooks avec déploiement privé

Si vous avez besoin de rappels Webhook (Twilio, Telnyx, etc.) sans exposition publique :

1. **Tunnel ngrok** - exécutez ngrok dans le conteneur ou en sidecar
2. **Tailscale Funnel** - exposez des chemins spécifiques via Tailscale
3. **Sortie uniquement** - certains fournisseurs (Twilio) fonctionnent très bien pour les appels sortants sans Webhooks

Exemple de configuration d’appel vocal avec ngrok :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Le tunnel ngrok s’exécute dans le conteneur et fournit une URL Webhook publique sans exposer l’application Fly elle-même. Définissez `webhookSecurity.allowedHosts` sur le nom d’hôte du tunnel public afin que les en-têtes d’hôte transférés soient acceptés.

### Avantages de sécurité

| Aspect            | Public       | Privé      |
| ----------------- | ------------ | ---------- |
| Scanners Internet | Détectable   | Caché      |
| Attaques directes | Possibles    | Bloquées   |
| Accès Control UI  | Navigateur   | Proxy/VPN  |
| Livraison Webhook | Directe      | Via tunnel |

## Remarques

- Fly.io utilise une **architecture x86** (pas ARM)
- Le Dockerfile est compatible avec les deux architectures
- Pour l’intégration WhatsApp/Telegram, utilisez `fly ssh console`
- Les données persistantes vivent sur le volume dans `/data`
- Signal nécessite Java + signal-cli ; utilisez une image personnalisée et gardez 2 Go+ de mémoire.

## Coût

Avec la configuration recommandée (`shared-cpu-2x`, 2 Go de RAM) :

- ~10 à 15 $/mois selon l’utilisation
- Le niveau gratuit inclut une certaine allocation

Voir [Tarification Fly.io](https://fly.io/docs/about/pricing/) pour plus de détails.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer la Gateway : [Configuration de la Gateway](/fr/gateway/configuration)
- Garder OpenClaw à jour : [Mise à jour](/fr/install/updating)

## Liens connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Hetzner](/fr/install/hetzner)
- [Docker](/fr/install/docker)
- [Hébergement VPS](/fr/vps)
