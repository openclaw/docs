---
read_when:
    - Déploiement d’OpenClaw sur Fly.io
    - Configurer les volumes Fly, les secrets et la configuration au premier lancement
summary: Déploiement pas à pas d’OpenClaw sur Fly.io avec un stockage persistant et HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-05-06T17:57:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 534a94e4ff69542604ba3112d468b7274492c18b3c5054f47379c21421f518bd
    source_path: install/fly.md
    workflow: 16
---

**Objectif :** OpenClaw Gateway exécuté sur une machine [Fly.io](https://fly.io) avec stockage persistant, HTTPS automatique et accès Discord/canal.

## Ce qu’il vous faut

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) installé
- Compte Fly.io (l’offre gratuite fonctionne)
- Authentification du modèle : clé API pour le fournisseur de modèle choisi
- Identifiants du canal : jeton de bot Discord, jeton Telegram, etc.

## Parcours rapide pour débutants

1. Cloner le dépôt → personnaliser `fly.toml`
2. Créer l’application + le volume → définir les secrets
3. Déployer avec `fly deploy`
4. Se connecter en SSH pour créer la configuration ou utiliser l’interface Control UI

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

    **Astuce :** Choisissez une région proche de vous. Options courantes : `lhr` (Londres), `iad` (Virginie), `sjc` (San José).

  </Step>

  <Step title="Configure fly.toml">
    Modifiez `fly.toml` pour qu’il corresponde au nom de votre application et à vos exigences.

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

    **Paramètres clés :**

    | Paramètre                      | Pourquoi                                                                   |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | Se lie à `0.0.0.0` pour que le proxy de Fly puisse atteindre le Gateway     |
    | `--allow-unconfigured`         | Démarre sans fichier de configuration (vous en créerez un ensuite)         |
    | `internal_port = 3000`         | Doit correspondre à `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) pour les contrôles d’intégrité Fly |
    | `memory = "2048mb"`            | 512 Mo est trop peu ; 2 Go recommandé                                      |
    | `OPENCLAW_STATE_DIR = "/data"` | Persiste l’état sur le volume                                              |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Notes :**

    - Les liaisons non-loopback (`--bind lan`) nécessitent un chemin d’authentification Gateway valide. Cet exemple Fly.io utilise `OPENCLAW_GATEWAY_TOKEN`, mais `gateway.auth.password` ou un déploiement non-loopback `trusted-proxy` correctement configuré satisfait également l’exigence.
    - Traitez ces jetons comme des mots de passe.
    - **Préférez les variables d’environnement au fichier de configuration** pour toutes les clés API et tous les jetons. Cela garde les secrets hors de `openclaw.json`, où ils pourraient être exposés ou journalisés accidentellement.

  </Step>

  <Step title="Deploy">
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

    **Note :** Remplacez `https://my-openclaw.fly.dev` par l’origine réelle de votre application Fly. Le démarrage du Gateway initialise les origines locales de Control UI à partir des valeurs d’exécution `--bind` et `--port` afin que le premier démarrage puisse se poursuivre avant que la configuration existe, mais l’accès navigateur via Fly nécessite tout de même que l’origine HTTPS exacte soit listée dans `gateway.controlUi.allowedOrigins`.

    **Note :** Le jeton Discord peut provenir de l’une ou l’autre source :

    - Variable d’environnement : `DISCORD_BOT_TOKEN` (recommandé pour les secrets)
    - Fichier de configuration : `channels.discord.token`

    Si vous utilisez la variable d’environnement, il n’est pas nécessaire d’ajouter le jeton à la configuration. Le Gateway lit automatiquement `DISCORD_BOT_TOKEN`.

    Redémarrez pour appliquer :

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    Ouvrez dans le navigateur :

    ```bash
    fly open
    ```

    Ou consultez `https://my-openclaw.fly.dev/`

    Authentifiez-vous avec le secret partagé configuré. Ce guide utilise le jeton Gateway depuis `OPENCLAW_GATEWAY_TOKEN` ; si vous êtes passé à l’authentification par mot de passe, utilisez ce mot de passe à la place.

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

### « L’application n’écoute pas sur l’adresse attendue »

Le Gateway se lie à `127.0.0.1` au lieu de `0.0.0.0`.

**Correction :** Ajoutez `--bind lan` à la commande de processus dans `fly.toml`.

### Échecs des contrôles d’intégrité / connexion refusée

Fly ne peut pas atteindre le Gateway sur le port configuré.

**Correction :** Assurez-vous que `internal_port` correspond au port du Gateway (définissez `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Problèmes de mémoire

Le conteneur continue de redémarrer ou est tué. Signes : `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` ou redémarrages silencieux.

**Correction :** Augmentez la mémoire dans `fly.toml` :

```toml
[[vm]]
  memory = "2048mb"
```

Ou mettez à jour une machine existante :

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Note :** 512 Mo est trop peu. 1 Go peut fonctionner, mais peut entraîner un OOM sous charge ou avec une journalisation détaillée. **2 Go sont recommandés.**

### Problèmes de verrouillage du Gateway

Le Gateway refuse de démarrer avec des erreurs « already running ».

Cela se produit lorsque le conteneur redémarre, mais que le fichier de verrouillage PID persiste sur le volume.

**Correction :** Supprimez le fichier de verrouillage :

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Le fichier de verrouillage se trouve à `/data/gateway.*.lock` (pas dans un sous-répertoire).

### Configuration non lue

`--allow-unconfigured` contourne uniquement la garde de démarrage. Il ne crée ni ne répare `/data/openclaw.json`, assurez-vous donc que votre configuration réelle existe et inclut `gateway.mode="local"` lorsque vous souhaitez un démarrage normal du Gateway local.

Vérifiez que la configuration existe :

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Écriture de la configuration via SSH

La commande `fly ssh console -C` ne prend pas en charge la redirection shell. Pour écrire un fichier de configuration :

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Note :** `fly sftp` peut échouer si le fichier existe déjà. Supprimez-le d’abord :

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### État non persistant

Si vous perdez les profils d’authentification, l’état de canal/fournisseur ou les sessions après un redémarrage, le répertoire d’état écrit dans le système de fichiers du conteneur.

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

### Mise à jour de la commande de machine

Si vous devez modifier la commande de démarrage sans redéploiement complet :

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Note :** Après `fly deploy`, la commande de la machine peut être réinitialisée à ce qui se trouve dans `fly.toml`. Si vous avez effectué des changements manuels, appliquez-les de nouveau après le déploiement.

## Déploiement privé (renforcé)

Par défaut, Fly alloue des IP publiques, ce qui rend votre Gateway accessible à `https://your-app.fly.dev`. C’est pratique, mais cela signifie que votre déploiement est découvrable par les scanners Internet (Shodan, Censys, etc.).

Pour un déploiement renforcé avec **aucune exposition publique**, utilisez le modèle privé.

### Quand utiliser le déploiement privé

- Vous effectuez uniquement des appels/messages **sortants** (pas de Webhooks entrants)
- Vous utilisez des tunnels **ngrok ou Tailscale** pour les rappels Webhook
- Vous accédez au Gateway via **SSH, proxy ou WireGuard** au lieu du navigateur
- Vous voulez que le déploiement soit **caché des scanners Internet**

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

Après cela, `fly ips list` ne devrait afficher qu’une IP de type `private` :

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accéder à un déploiement privé

Puisqu’il n’y a pas d’URL publique, utilisez l’une de ces méthodes :

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

### Webhooks avec déploiement privé

Si vous avez besoin de rappels Webhook (Twilio, Telnyx, etc.) sans exposition publique :

1. **Tunnel ngrok** - Exécutez ngrok dans le conteneur ou comme sidecar
2. **Tailscale Funnel** - Exposez des chemins spécifiques via Tailscale
3. **Sortant uniquement** - Certains fournisseurs (Twilio) fonctionnent correctement pour les appels sortants sans Webhooks

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

Le tunnel ngrok s’exécute dans le conteneur et fournit une URL Webhook publique sans exposer l’application Fly elle-même. Définissez `webhookSecurity.allowedHosts` sur le nom d’hôte public du tunnel afin que les en-têtes d’hôte transférés soient acceptés.

### Avantages de sécurité

| Aspect             | Public       | Privé          |
| ------------------ | ------------ | -------------- |
| Scanners Internet  | Détectable   | Caché          |
| Attaques directes  | Possibles    | Bloquées       |
| Accès à l’UI de contrôle | Navigateur | Proxy/VPN      |
| Livraison des Webhooks | Directe   | Via un tunnel  |

## Notes

- Fly.io utilise une **architecture x86** (pas ARM)
- Le Dockerfile est compatible avec les deux architectures
- Pour l’onboarding WhatsApp/Telegram, utilisez `fly ssh console`
- Les données persistantes résident sur le volume dans `/data`
- Signal nécessite Java + signal-cli ; utilisez une image personnalisée et conservez 2 Go de mémoire ou plus.

## Coût

Avec la configuration recommandée (`shared-cpu-2x`, 2 Go de RAM) :

- Environ 10 à 15 $/mois selon l’utilisation
- L’offre gratuite inclut une certaine allocation

Consultez les [tarifs Fly.io](https://fly.io/docs/about/pricing/) pour plus de détails.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)

## Associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Hetzner](/fr/install/hetzner)
- [Docker](/fr/install/docker)
- [Hébergement VPS](/fr/vps)
