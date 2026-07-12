---
read_when:
    - Vous recherchez un hôte Linux économique et toujours actif pour le Gateway
    - Vous souhaitez accéder à distance à l’interface de contrôle sans exploiter votre propre VPS
summary: Exécutez le Gateway OpenClaw sur exe.dev (VM + proxy HTTPS) pour un accès à distance
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T02:44:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Objectif :** faire fonctionner le Gateway OpenClaw sur une VM [exe.dev](https://exe.dev), accessible à l’adresse `https://<vm-name>.exe.xyz`.

Ce guide suppose l’utilisation de l’image **exeuntu** par défaut d’exe.dev. Adaptez les paquets en conséquence sur les autres distributions.

## Prérequis

- Un compte exe.dev
- Un accès `ssh exe.dev` aux VM exe.dev (facultatif, pour une configuration manuelle)

## Parcours rapide pour débutants

1. Ouvrez [https://exe.new/openclaw](https://exe.new/openclaw)
2. Renseignez votre clé ou jeton d’authentification selon les besoins
3. Cliquez sur "Agent" à côté de votre VM et attendez que Shelley termine le provisionnement
4. Ouvrez `https://<vm-name>.exe.xyz/` et authentifiez-vous avec le secret partagé configuré (authentification par jeton par défaut ; l’authentification par mot de passe fonctionne également si vous modifiez `gateway.auth.mode`)
5. Approuvez les demandes d’association d’appareils en attente avec `openclaw devices approve <requestId>`

## Installation automatisée avec Shelley

Shelley, l’agent d’exe.dev, peut installer OpenClaw à partir d’une invite :

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Installation manuelle

<Steps>
  <Step title="Create the VM">
    Depuis votre appareil :

    ```bash
    ssh exe.dev new
    ```

    Connectez-vous ensuite :

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Conservez cette VM avec un état **persistant**. OpenClaw stocke `openclaw.json`, les fichiers `auth-profiles.json` propres à chaque agent, les sessions ainsi que l’état des canaux et fournisseurs sous `~/.openclaw/`, et l’espace de travail sous `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Install prerequisites (on the VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Configure nginx to proxy to port 8000">
    Modifiez `/etc/nginx/sites-enabled/default` :

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # WebSocket support
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Standard proxy headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeout settings for long-lived connections
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Remplacez les en-têtes de transfert au lieu de conserver les chaînes fournies par le client. OpenClaw n’accorde sa confiance aux métadonnées d’adresse IP transférées que lorsqu’elles proviennent de proxys explicitement configurés, et les chaînes `X-Forwarded-For` construites par ajout successif sont considérées comme un risque pour le durcissement de la sécurité.

  </Step>

  <Step title="Access OpenClaw and approve devices">
    Ouvrez `https://<vm-name>.exe.xyz/` (consultez la sortie de l’interface de contrôle lors de la configuration initiale). Si une authentification est demandée, collez le secret partagé configuré sur la VM.

    Ce guide utilise l’authentification par jeton par défaut. Récupérez donc `gateway.auth.token` avec `openclaw config get gateway.auth.token`, ou générez-en un nouveau avec `openclaw doctor --n`. Si vous avez configuré le Gateway pour utiliser l’authentification par mot de passe, utilisez plutôt `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.

    Approuvez les appareils avec `openclaw devices list` et `openclaw devices approve <requestId>`. En cas de doute, utilisez Shelley depuis votre navigateur.

  </Step>
</Steps>

## Configuration des canaux à distance

Pour les hôtes distants, privilégiez un seul appel à `config patch` plutôt que de nombreux appels SSH à `config set`. Conservez les véritables jetons dans l’environnement de la VM ou dans `~/.openclaw/.env`, et placez uniquement des SecretRefs dans `openclaw.json`. Consultez [Gestion des secrets](/fr/gateway/secrets) pour connaître le contrat SecretRef complet.

Sur la VM, ajoutez au contexte d’exécution du service les secrets dont il a besoin :

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Depuis votre machine locale, créez un fichier de correctif et transmettez-le à la VM par un tube :

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Utilisez `--replace-path` lorsqu’une liste d’autorisation imbriquée doit correspondre exactement à la valeur du correctif, par exemple pour remplacer la liste d’autorisation d’un canal Discord :

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Consultez [Discord](/fr/channels/discord) et [Slack](/fr/channels/slack) pour obtenir la documentation complète de la configuration des canaux.

## Accès distant

exe.dev gère l’authentification pour l’accès distant. Par défaut, le trafic HTTP du port 8000 est transféré vers `https://<vm-name>.exe.xyz` avec une authentification par e-mail.

## Mise à jour

```bash
openclaw update
```

Consultez [Mise à jour](/fr/install/updating) pour le changement de canal et la récupération manuelle.

## Pages connexes

- [Gateway distant](/fr/gateway/remote)
- [Présentation de l’installation](/fr/install)
