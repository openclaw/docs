---
read_when:
    - Déployer OpenClaw sur Fly.io
    - Configurer les volumes Fly, les secrets et la configuration de premier lancement
summary: Déploiement Fly.io pas à pas pour OpenClaw avec stockage persistant et HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:38:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**Objectif :** OpenClaw Gateway exécuté sur une machine [Fly.io](https://fly.io) avec stockage persistant, HTTPS automatique et accès Discord/canal.

## Ce dont vous avez besoin

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) installée
- Compte Fly.io (l'offre gratuite fonctionne)
- Authentification du modèle : clé API pour le fournisseur de modèle choisi
- Identifiants de canal : jeton de bot Discord, jeton Telegram, etc.

## Parcours rapide pour débutants

1. Cloner le dépôt → personnaliser `fly.toml`
2. Créer l'application + le volume → définir les secrets
3. Déployer avec `fly deploy`
4. Se connecter en SSH pour créer la configuration ou utiliser l'interface de contrôle

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Astuce :** Choisissez une région proche de vous. Options courantes : `lhr` (Londres), `iad` (Virginie), `sjc` (San Jose).

  </Step>

  <Step title="Configure fly.toml">
    Modifiez `fly.toml` pour qu'il corresponde au nom de votre application et à vos besoins.

    **Note de sécurité :** La configuration par défaut expose une URL publique. Pour un déploiement renforcé sans IP publique, consultez [Déploiement privé](#private-deployment-hardened) ou utilisez `deploy/fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
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

    L'image Docker OpenClaw utilise `tini` comme point d'entrée. Les commandes de processus Fly remplacent le `CMD` Docker sans remplacer l'`ENTRYPOINT`, donc le processus s'exécute toujours sous `tini`.

    **Paramètres clés :**

    | Paramètre                      | Pourquoi                                                                   |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | Se lie à `0.0.0.0` afin que le proxy Fly puisse atteindre le Gateway        |
    | `--allow-unconfigured`         | Démarre sans fichier de configuration (vous en créerez un ensuite)         |
    | `internal_port = 3000`         | Doit correspondre à `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) pour les vérifications d'état Fly |
    | `memory = "2048mb"`            | 512 Mo est insuffisant ; 2 Go recommandés                                  |
    | `OPENCLAW_STATE_DIR = "/data"` | Conserve l'état sur le volume                                              |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **Notes :**

    - Les liaisons non-loopback (`--bind lan`) nécessitent un chemin d'authentification Gateway valide. Cet exemple Fly.io utilise `OPENCLAW_GATEWAY_TOKEN`, mais `gateway.auth.password` ou un déploiement non-loopback `trusted-proxy` correctement configuré répondent aussi à cette exigence.
    - Traitez ces jetons comme des mots de passe.
    - **Préférez les variables d'environnement au fichier de configuration** pour toutes les clés API et tous les jetons. Cela garde les secrets hors de `openclaw.json`, où ils pourraient être exposés ou journalisés accidentellement.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    Le premier déploiement construit l'image Docker (~2 à 3 minutes). Les déploiements suivants sont plus rapides.

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

  <Step title="Create config file">
    Connectez-vous en SSH à la machine pour créer une configuration appropriée :

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

    **Note :** Avec `OPENCLAW_STATE_DIR=/data`, le chemin de configuration est `/data/openclaw.json`.

    **Note :** Remplacez `https://my-openclaw.fly.dev` par l'origine réelle de votre application Fly. Le démarrage du Gateway initialise les origines locales de l'interface de contrôle à partir des valeurs d'exécution `--bind` et `--port`, afin que le premier démarrage puisse se poursuivre avant que la configuration existe, mais l'accès navigateur via Fly nécessite toujours que l'origine HTTPS exacte soit listée dans `gateway.controlUi.allowedOrigins`.

    **Note :** Le jeton Discord peut provenir de l'une des deux sources suivantes :

    - Variable d'environnement : `DISCORD_BOT_TOKEN` (recommandé pour les secrets)
    - Fichier de configuration : `channels.discord.token`

    Si vous utilisez une variable d'environnement, il n'est pas nécessaire d'ajouter le jeton à la configuration. Le Gateway lit automatiquement `DISCORD_BOT_TOKEN`.

    Redémarrez pour appliquer :

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Interface de contrôle

    Ouvrez dans le navigateur :

    ```bash
    fly open
    ```

    Ou consultez `https://my-openclaw.fly.dev/`

    Authentifiez-vous avec le secret partagé configuré. Ce guide utilise le jeton Gateway provenant de `OPENCLAW_GATEWAY_TOKEN` ; si vous êtes passé à l'authentification par mot de passe, utilisez plutôt ce mot de passe.

    ### Journaux

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Dépannage

### « L'application n'écoute pas à l'adresse attendue »

Le Gateway se lie à `127.0.0.1` au lieu de `0.0.0.0`.

**Correction :** Ajoutez `--bind lan` à votre commande de processus dans `fly.toml`.

### Échec des vérifications d'état / connexion refusée

Fly ne peut pas atteindre le Gateway sur le port configuré.

**Correction :** Assurez-vous que `internal_port` correspond au port du Gateway (définissez `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Problèmes de mémoire

Le conteneur continue de redémarrer ou est arrêté. Signes : `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` ou redémarrages silencieux.

**Correction :** Augmentez la mémoire dans `fly.toml` :

```toml
[[vm]]
  memory = "2048mb"
```

Ou mettez à jour une machine existante :

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Note :** 512 Mo est insuffisant. 1 Go peut fonctionner, mais peut provoquer un OOM sous charge ou avec une journalisation verbeuse. **2 Go sont recommandés.**

### Problèmes de verrouillage du Gateway

Le Gateway refuse de démarrer avec des erreurs « already running ».

Cela se produit lorsque le conteneur redémarre mais que le fichier de verrouillage PID persiste sur le volume.

**Correction :** Supprimez le fichier de verrouillage :

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Le fichier de verrouillage se trouve à `/data/gateway.*.lock` (pas dans un sous-répertoire).

### La configuration n'est pas lue

`--allow-unconfigured` contourne seulement la garde de démarrage. Il ne crée ni ne répare `/data/openclaw.json`, donc assurez-vous que votre configuration réelle existe et inclut `gateway.mode="local"` lorsque vous voulez un démarrage normal du Gateway local.

Vérifiez que la configuration existe :

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Écrire la configuration via SSH

La commande `fly ssh console -C` ne prend pas en charge la redirection shell. Pour écrire un fichier de configuration :

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Note :** `fly sftp` peut échouer si le fichier existe déjà. Supprimez-le d'abord :

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### L'état ne persiste pas

Si vous perdez les profils d'authentification, l'état des canaux/fournisseurs ou les sessions après un redémarrage, le répertoire d'état écrit dans le système de fichiers du conteneur.

**Correction :** Assurez-vous que `OPENCLAW_STATE_DIR=/data` est défini dans `fly.toml` et redéployez.

## Mises à jour

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Mettre à jour la commande de la machine

Si vous devez modifier la commande de démarrage sans redéploiement complet :

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Note :** Après `fly deploy`, la commande de la machine peut être réinitialisée à celle de `fly.toml`. Si vous avez effectué des modifications manuelles, réappliquez-les après le déploiement.

## Déploiement privé (renforcé)

Par défaut, Fly alloue des IP publiques, ce qui rend votre Gateway accessible à `https://your-app.fly.dev`. C'est pratique, mais cela signifie que votre déploiement peut être découvert par des scanners Internet (Shodan, Censys, etc.).

Pour un déploiement renforcé avec **aucune exposition publique**, utilisez le modèle privé.

### Quand utiliser un déploiement privé

- Vous effectuez uniquement des appels/messages **sortants** (aucun Webhook entrant)
- Vous utilisez des tunnels **ngrok ou Tailscale** pour tous les rappels Webhook
- Vous accédez au Gateway via **SSH, proxy ou WireGuard** au lieu du navigateur
- Vous voulez que le déploiement soit **masqué aux scanners Internet**

### Configuration

Utilisez `deploy/fly.private.toml` au lieu de la configuration standard :

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Ou convertissez un déploiement existant :

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Après cela, `fly ips list` devrait afficher uniquement une IP de type `private` :

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accéder à un déploiement privé

Comme il n'y a pas d'URL publique, utilisez l'une de ces méthodes :

**Option 1 : Proxy local (le plus simple)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Option 2 : VPN WireGuard**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3 : SSH uniquement**

```bash
fly ssh console -a my-openclaw
```

### Webhooks avec un déploiement privé

Si vous avez besoin de callbacks Webhook (Twilio, Telnyx, etc.) sans exposition publique :

1. **Tunnel ngrok** - Exécutez ngrok dans le conteneur ou en tant que sidecar
2. **Tailscale Funnel** - Exposez des chemins spécifiques via Tailscale
3. **Sortant uniquement** - Certains fournisseurs (Twilio) fonctionnent correctement pour les appels sortants sans webhooks

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

Le tunnel ngrok s’exécute dans le conteneur et fournit une URL de Webhook publique sans exposer l’application Fly elle-même. Définissez `webhookSecurity.allowedHosts` sur le nom d’hôte public du tunnel afin que les en-têtes d’hôte transférés soient acceptés.

### Avantages de sécurité

| Aspect               | Public       | Privé        |
| -------------------- | ------------ | ------------ |
| Scanners Internet    | Détectable   | Masqué       |
| Attaques directes    | Possibles    | Bloquées     |
| Accès à l’UI Control | Navigateur   | Proxy/VPN    |
| Livraison Webhook    | Directe      | Via tunnel   |

## Notes

- Fly.io utilise une **architecture x86** (pas ARM)
- Le Dockerfile est compatible avec les deux architectures
- Pour l’onboarding WhatsApp/Telegram, utilisez `fly ssh console`
- Les données persistantes résident sur le volume dans `/data`
- Signal nécessite Java + signal-cli ; utilisez une image personnalisée et gardez la mémoire à 2 Go ou plus.

## Coût

Avec la configuration recommandée (`shared-cpu-2x`, 2 Go de RAM) :

- Environ 10 à 15 $/mois selon l’utilisation
- L’offre gratuite inclut un certain quota

Consultez [la tarification Fly.io](https://fly.io/docs/about/pricing/) pour plus de détails.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Hetzner](/fr/install/hetzner)
- [Docker](/fr/install/docker)
- [Hébergement VPS](/fr/vps)
