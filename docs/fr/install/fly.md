---
read_when:
    - Déployer OpenClaw sur Fly.io
    - Configuration des volumes Fly, des secrets et de la configuration initiale
summary: Déploiement pas à pas d’OpenClaw sur Fly.io avec stockage persistant et HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T02:56:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Objectif :** exécuter le Gateway OpenClaw sur une machine [Fly.io](https://fly.io) avec un stockage persistant, le HTTPS automatique et un accès à Discord/aux canaux.

## Prérequis

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) installée
- Compte Fly.io (l’offre gratuite convient)
- Authentification du modèle : clé d’API pour le fournisseur de modèle choisi
- Identifiants des canaux : jeton de bot Discord, jeton Telegram, etc.

## Parcours rapide pour débuter

1. Clonez le dépôt et personnalisez `fly.toml`
2. Créez l’application et le volume, puis définissez les secrets
3. Déployez avec `fly deploy`
4. Connectez-vous en SSH pour créer la configuration, ou utilisez l’interface de contrôle

<Steps>
  <Step title="Créer l’application Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # choisissez votre propre nom
    fly apps create my-openclaw

    # 1 Go suffit généralement
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Choisissez une région proche de vous. Options courantes : `lhr` (Londres), `iad` (Virginie), `sjc` (San José).

  </Step>

  <Step title="Configurer fly.toml">
    Modifiez `fly.toml` pour qu’il corresponde au nom de votre application et à vos besoins. Le fichier `fly.toml` suivi dans le dépôt est le modèle public présenté ci-dessous ; `deploy/fly.private.toml` est la variante renforcée sans adresse IP publique (voir [Déploiement privé](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # nom de votre application
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

    Le point d’entrée de l’image Docker OpenClaw est `tini`, qui exécute `node openclaw.mjs gateway` par défaut. La section Fly `[processes]` remplace la commande Docker `CMD` (ici, elle exécute directement `node dist/index.js gateway ...`, le même point d’entrée compilé) sans modifier `ENTRYPOINT` ; le processus continue donc de s’exécuter sous `tini`.

    **Paramètres principaux :**

    | Paramètre                      | Raison                                                                                   |
    | ------------------------------ | ---------------------------------------------------------------------------------------- |
    | `--bind lan`                   | Effectue la liaison sur `0.0.0.0` afin que le proxy de Fly puisse atteindre le Gateway   |
    | `--allow-unconfigured`         | Démarre sans fichier de configuration (vous le créez ensuite)                            |
    | `internal_port = 3000`         | Doit correspondre à `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) pour les contrôles de santé Fly |
    | `memory = "2048mb"`            | 512 Mo sont insuffisants ; 2 Go sont recommandés                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Conserve l’état sur le volume                                                            |

  </Step>

  <Step title="Définir les secrets">
    ```bash
    # obligatoire : jeton d’authentification du Gateway pour une liaison hors local loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # clés d’API des fournisseurs de modèles
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # facultatif : autres fournisseurs
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # jetons des canaux
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Les liaisons hors local loopback (`--bind lan`) nécessitent un mécanisme d’authentification valide pour le Gateway. Cet exemple utilise `OPENCLAW_GATEWAY_TOKEN`, mais `gateway.auth.password` ou un déploiement avec proxy de confiance hors local loopback correctement configuré satisfont également cette exigence. Consultez [Gestion des secrets](/fr/gateway/secrets) pour connaître le contrat SecretRef.

    Traitez ces jetons comme des mots de passe. Pour les clés d’API et les jetons, préférez les variables d’environnement/`fly secrets` au fichier de configuration afin que les secrets ne soient pas stockés dans `openclaw.json`.

  </Step>

  <Step title="Déployer">
    ```bash
    fly deploy
    ```

    Le premier déploiement construit l’image Docker. Vérifiez le résultat après le déploiement :

    ```bash
    fly status
    fly logs
    ```

    Les journaux de démarrage du Gateway affichent `gateway ready` lorsque l’écouteur HTTP/WebSocket est opérationnel. Le contrôle de santé propre à Fly surveille `internal_port = 3000` conformément à `fly.toml` ; la directive Docker `HEALTHCHECK` de l’image interroge également `/healthz` sur son port par défaut 18789, qui n’est pas utilisé ici puisque ce déploiement remplace le port du Gateway par `--port 3000`.

  </Step>

  <Step title="Créer le fichier de configuration">
    Connectez-vous à la machine en SSH pour créer une configuration appropriée :

    ```bash
    fly ssh console
    ```

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

    Avec `OPENCLAW_STATE_DIR=/data`, le chemin du fichier de configuration est `/data/openclaw.json`.

    Remplacez `https://my-openclaw.fly.dev` par l’origine réelle de votre application Fly. Au démarrage, le Gateway initialise les origines locales de l’interface de contrôle à partir des valeurs d’exécution `--bind` et `--port`, afin que le premier démarrage puisse se poursuivre avant que la configuration n’existe. Toutefois, l’accès depuis un navigateur par l’intermédiaire de Fly nécessite toujours que l’origine HTTPS exacte figure dans `gateway.controlUi.allowedOrigins`.

    Le jeton Discord peut provenir de l’une des sources suivantes :

    - Variable d’environnement `DISCORD_BOT_TOKEN` (recommandée pour les secrets) ; inutile de l’ajouter à la configuration, car le Gateway la lit automatiquement
    - Fichier de configuration `channels.discord.token`

    Redémarrez pour appliquer les modifications :

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Accéder au Gateway">
    ### Interface de contrôle

    ```bash
    fly open
    ```

    Vous pouvez également consulter `https://my-openclaw.fly.dev/`.

    Authentifiez-vous avec le secret partagé configuré : le jeton du Gateway provenant de `OPENCLAW_GATEWAY_TOKEN`, ou votre mot de passe si vous avez adopté l’authentification par mot de passe.

    ### Journaux

    ```bash
    fly logs              # journaux en direct
    fly logs --no-tail    # journaux récents
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Résolution des problèmes

### « L’application n’écoute pas à l’adresse attendue »

Le Gateway effectue sa liaison sur `127.0.0.1` au lieu de `0.0.0.0`.

**Correction :** ajoutez `--bind lan` à la commande du processus dans `fly.toml`.

### Échec des contrôles de santé/refus de connexion

Fly ne peut pas atteindre le Gateway sur le port configuré.

**Correction :** vérifiez que `internal_port` correspond au port du Gateway (`--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### Problèmes de mémoire insuffisante/OOM

Le conteneur redémarre sans cesse ou est arrêté de force. Signes : `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` ou redémarrages silencieux.

**Correction :** augmentez la mémoire dans `fly.toml` :

```toml
[[vm]]
  memory = "2048mb"
```

Ou mettez à jour une machine existante :

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 Mo sont insuffisants. 1 Go peut fonctionner, mais risque de provoquer une erreur OOM sous charge ou avec une journalisation détaillée. 2 Go sont recommandés.

### Problèmes de verrouillage du Gateway

Le Gateway refuse de démarrer en signalant des erreurs « déjà en cours d’exécution » après le redémarrage d’un conteneur.

Le fichier de verrouillage de l’instance unique se trouve dans `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (sous Linux : `/tmp/openclaw-<uid>/gateway.<hash>.lock`), et non sur le volume persistant `/data`. Un redémarrage complet du conteneur le supprime donc normalement avec le reste du système de fichiers du conteneur. Si le verrou persiste (par exemple après un `fly machine restart` qui conserve le système de fichiers du conteneur) et empêche le démarrage, supprimez-le manuellement :

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### La configuration n’est pas lue

`--allow-unconfigured` contourne uniquement la protection au démarrage. Cette option ne crée ni ne répare `/data/openclaw.json`. Vérifiez donc que votre configuration réelle existe et qu’elle contient `"gateway": { "mode": "local" }` pour un démarrage local normal du Gateway.

Vérifiez que la configuration existe :

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Écriture de la configuration par SSH

`fly ssh console -C` ne prend pas en charge les redirections de l’interpréteur de commandes. Pour écrire un fichier de configuration :

```bash
# echo + tee (transmission du poste local vers la machine distante)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# ou sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` peut échouer si le fichier existe déjà ; supprimez-le d’abord :

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### L’état n’est pas conservé

Si vous perdez les profils d’authentification, l’état des canaux/fournisseurs ou les sessions après un redémarrage, le répertoire d’état est écrit dans le système de fichiers du conteneur plutôt que sur le volume.

**Correction :** vérifiez que `OPENCLAW_STATE_DIR=/data` est défini dans `fly.toml`, puis redéployez.

## Mise à jour

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` constitue ici le parcours supervisé : il reconstruit l’image à partir du Dockerfile, de sorte que la version de la CLI/du Gateway, l’image du système d’exploitation de base et toutes les modifications du Dockerfile soient mises à jour ensemble. L’exécution de `openclaw update` dans le conteneur actif ne correspond pas à la même opération, car l’image est fournie sous la forme d’une arborescence `dist/` construite avec Docker, sans copie de travail `.git` ni installation globale gérée par npm qu’elle pourrait détecter ; consultez [Mise à jour](/fr/install/updating) pour connaître ce processus sur les installations de type machine virtuelle.

### Mise à jour de la commande de la machine

Pour modifier la commande de démarrage sans effectuer un redéploiement complet :

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# ou avec une augmentation de la mémoire
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Un `fly deploy` ultérieur rétablit la commande de la machine définie dans `fly.toml` ; appliquez de nouveau les modifications manuelles après le redéploiement.

## Déploiement privé (renforcé)

Par défaut, Fly attribue des adresses IP publiques. Votre Gateway est donc accessible à l’adresse `https://your-app.fly.dev` et peut être découvert par les scanners Internet (Shodan, Censys, etc.).

Utilisez `deploy/fly.private.toml` pour un déploiement renforcé **sans adresse IP publique** : ce fichier omet `[http_service]`, de sorte qu’aucun point d’entrée public n’est attribué.

### Quand utiliser un déploiement privé

- Uniquement des appels/messages sortants (aucun Webhook entrant)
- Des tunnels ngrok ou Tailscale gèrent les éventuels rappels de Webhook
- L’accès au Gateway s’effectue par SSH, proxy ou WireGuard plutôt que depuis un navigateur
- Le déploiement doit rester caché aux scanners Internet

### Configuration

```bash
fly deploy -c deploy/fly.private.toml
```

Ou convertissez un déploiement existant :

```bash
# répertorier les adresses IP actuelles
fly ips list -a my-openclaw

# libérer les adresses IP publiques
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# passer à la configuration privée afin que les futurs déploiements ne réattribuent pas d’adresses IP publiques
fly deploy -c deploy/fly.private.toml

# attribuer une adresse IPv6 privée uniquement
fly ips allocate-v6 --private -a my-openclaw
```

Après cela, `fly ips list` ne devrait afficher qu’une adresse IP de type `private` :

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accès à un déploiement privé

**Option 1 : proxy local (le plus simple)**

```bash
fly proxy 3000:3000 -a my-openclaw
# ouvrir http://localhost:3000 dans un navigateur
```

**Option 2 : VPN WireGuard**

```bash
fly wireguard create
# importer dans un client WireGuard, puis accéder via l’adresse IPv6 interne
# exemple : http://[fdaa:x:x:x:x::x]:3000
```

**Option 3 : SSH uniquement**

```bash
fly ssh console -a my-openclaw
```

### Webhooks avec un déploiement privé

Pour les rappels de webhook (Twilio, Telnyx, etc.) sans exposition publique :

1. **Tunnel ngrok** : exécutez ngrok dans le conteneur ou en tant que conteneur auxiliaire
2. **Tailscale Funnel** : exposez des chemins spécifiques via Tailscale
3. **Trafic sortant uniquement** : certains fournisseurs (Twilio) permettent les appels sortants sans webhooks

Exemple de configuration des appels vocaux avec ngrok, sous `plugins.entries.voice-call.config` :

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

Le tunnel ngrok s’exécute dans le conteneur et fournit une URL de webhook publique sans exposer l’application Fly elle-même. Définissez `webhookSecurity.allowedHosts` sur le nom d’hôte du tunnel afin que les en-têtes d’hôte transférés soient acceptés.

### Compromis en matière de sécurité

| Aspect                  | Public       | Privé          |
| ----------------------- | ------------ | -------------- |
| Scanners Internet       | Détectable   | Masqué         |
| Attaques directes       | Possibles    | Bloquées       |
| Accès à l’interface de contrôle | Navigateur | Proxy/VPN |
| Livraison des webhooks  | Directe      | Via un tunnel  |

## Remarques

- Fly.io utilise l’architecture x86 ; le fichier Dockerfile est compatible avec x86 et ARM.
- Pour la configuration initiale de WhatsApp/Telegram, utilisez `fly ssh console`.
- Les données persistantes résident sur le volume à l’emplacement `/data`.
- Signal nécessite signal-cli (une CLI basée sur Java) dans l’image ; utilisez une image personnalisée et conservez au moins 2 Go de mémoire.

## Coût

Avec la configuration recommandée (`shared-cpu-2x`, 2 Go de RAM), prévoyez environ 10 à 15 $ par mois selon l’utilisation ; l’offre gratuite couvre une partie de l’allocation de base. Consultez les [tarifs de Fly.io](https://fly.io/docs/about/pricing/) pour connaître les tarifs actuels.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Hetzner](/fr/install/hetzner)
- [Docker](/fr/install/docker)
- [Hébergement sur VPS](/fr/vps)
