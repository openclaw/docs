---
read_when:
    - Configuration d’une nouvelle machine
    - Vous voulez « le plus récent et le meilleur » sans casser votre configuration personnelle
summary: Configuration avancée et flux de travail de développement pour OpenClaw
title: Configuration
x-i18n:
    generated_at: "2026-04-30T07:49:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si vous effectuez la configuration pour la première fois, commencez par [Bien démarrer](/fr/start/getting-started).
Pour les détails d’intégration, consultez [Intégration (CLI)](/fr/start/wizard).
</Note>

## TL;DR

Choisissez un flux de configuration selon la fréquence à laquelle vous voulez recevoir les mises à jour et selon que vous voulez exécuter le Gateway vous-même :

- **La personnalisation vit en dehors du dépôt :** conservez votre configuration et votre espace de travail dans `~/.openclaw/openclaw.json` et `~/.openclaw/workspace/` afin que les mises à jour du dépôt n’y touchent pas.
- **Flux stable (recommandé pour la plupart des utilisateurs) :** installez l’application macOS et laissez-la exécuter le Gateway intégré.
- **Flux à la pointe (développement) :** exécutez vous-même le Gateway via `pnpm gateway:watch`, puis laissez l’application macOS s’y attacher en mode local.

## Prérequis (depuis les sources)

- Node 24 recommandé (Node 22 LTS, actuellement `22.14+`, toujours pris en charge)
- `pnpm` recommandé (ou Bun si vous utilisez volontairement le [flux Bun](/fr/install/bun))
- Docker (facultatif ; uniquement pour la configuration conteneurisée/e2e — voir [Docker](/fr/install/docker))

## Stratégie de personnalisation (pour que les mises à jour ne cassent rien)

Si vous voulez une configuration « 100 % adaptée à moi » _et_ des mises à jour faciles, conservez votre personnalisation dans :

- **Configuration :** `~/.openclaw/openclaw.json` (JSON/JSON5 approximatif)
- **Espace de travail :** `~/.openclaw/workspace` (Skills, invites, mémoires ; faites-en un dépôt git privé)

Initialisez une fois :

```bash
openclaw setup
```

Depuis ce dépôt, utilisez l’entrée CLI locale :

```bash
openclaw setup
```

Si vous n’avez pas encore d’installation globale, exécutez-la via `pnpm openclaw setup` (ou `bun run openclaw setup` si vous utilisez le flux Bun).

## Exécuter le Gateway depuis ce dépôt

Après `pnpm build`, vous pouvez exécuter directement la CLI empaquetée :

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flux stable (application macOS d’abord)

1. Installez et lancez **OpenClaw.app** (barre de menus).
2. Terminez la liste de contrôle d’intégration/autorisations (invites TCC).
3. Vérifiez que le Gateway est en mode **local** et en cours d’exécution (l’application le gère).
4. Liez les surfaces (exemple : WhatsApp) :

```bash
openclaw channels login
```

5. Vérification rapide :

```bash
openclaw health
```

Si l’intégration n’est pas disponible dans votre build :

- Exécutez `openclaw setup`, puis `openclaw channels login`, puis démarrez le Gateway manuellement (`openclaw gateway`).

## Flux à la pointe (Gateway dans un terminal)

Objectif : travailler sur le Gateway TypeScript, obtenir le rechargement à chaud, garder l’interface de l’application macOS attachée.

### 0) (Facultatif) Exécuter aussi l’application macOS depuis les sources

Si vous voulez aussi l’application macOS à la pointe :

```bash
./scripts/restart-mac.sh
```

### 1) Démarrer le Gateway de développement

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` démarre ou redémarre le processus de surveillance du Gateway dans une session tmux nommée et s’y attache automatiquement depuis les terminaux interactifs. Les shells non interactifs restent détachés et affichent `tmux attach -t openclaw-gateway-watch-main` ; utilisez `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` pour garder une exécution interactive détachée, ou `pnpm gateway:watch:raw` pour le mode de surveillance au premier plan. Le surveillant recharge lors des changements pertinents de sources, de configuration et de métadonnées de plugins intégrés.
`pnpm openclaw setup` est l’étape unique d’initialisation de la configuration et de l’espace de travail locaux pour un checkout frais.
`pnpm gateway:watch` ne reconstruit pas `dist/control-ui` ; réexécutez donc `pnpm ui:build` après des changements dans `ui/`, ou utilisez `pnpm ui:dev` pendant le développement de l’interface Control UI.

Si vous utilisez volontairement le flux Bun, les commandes équivalentes sont :

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) Pointer l’application macOS vers votre Gateway en cours d’exécution

Dans **OpenClaw.app** :

- Mode de connexion : **local**
  L’application s’attachera au gateway en cours d’exécution sur le port configuré.

### 3) Vérifier

- Dans l’application, l’état du Gateway doit indiquer **« Utilisation d’un gateway existant … »**
- Ou via la CLI :

```bash
openclaw health
```

### Pièges courants

- **Mauvais port :** le WS du Gateway utilise par défaut `ws://127.0.0.1:18789` ; gardez l’application et la CLI sur le même port.
- **Emplacement de l’état :**
  - État des canaux/fournisseurs : `~/.openclaw/credentials/`
  - Profils d’authentification de modèles : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions : `~/.openclaw/agents/<agentId>/sessions/`
  - Journaux : `/tmp/openclaw/`

## Carte de stockage des identifiants

Utilisez ceci lors du débogage de l’authentification ou pour décider quoi sauvegarder :

- **WhatsApp** : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Jeton de bot Telegram** : configuration/env ou `channels.telegram.tokenFile` (fichier normal uniquement ; liens symboliques rejetés)
- **Jeton de bot Discord** : configuration/env ou SecretRef (fournisseurs env/file/exec)
- **Jetons Slack** : configuration/env (`channels.slack.*`)
- **Listes d’autorisation d’appairage** :
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (compte par défaut)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (comptes non par défaut)
- **Profils d’authentification de modèles** : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Charge utile de secrets adossée à un fichier (facultatif)** : `~/.openclaw/secrets.json`
- **Import OAuth hérité** : `~/.openclaw/credentials/oauth.json`
  Plus de détails : [Sécurité](/fr/gateway/security#credential-storage-map).

## Mise à jour (sans ruiner votre configuration)

- Considérez `~/.openclaw/workspace` et `~/.openclaw/` comme « vos affaires » ; ne placez pas d’invites/configurations personnelles dans le dépôt `openclaw`.
- Mise à jour des sources : `git pull` + l’étape d’installation de votre gestionnaire de paquets choisi (`pnpm install` par défaut ; `bun install` pour le flux Bun) + continuez à utiliser la commande `gateway:watch` correspondante.

## Linux (service utilisateur systemd)

Les installations Linux utilisent un service **utilisateur** systemd. Par défaut, systemd arrête les services utilisateur à la déconnexion ou en cas d’inactivité, ce qui tue le Gateway. L’intégration tente d’activer le maintien de session pour vous (peut demander sudo). Si ce n’est toujours pas activé, exécutez :

```bash
sudo loginctl enable-linger $USER
```

Pour des serveurs toujours actifs ou multi-utilisateurs, envisagez plutôt un service **système** au lieu d’un service utilisateur (aucun maintien de session nécessaire). Voir le [runbook Gateway](/fr/gateway) pour les notes systemd.

## Documentation associée

- [Runbook Gateway](/fr/gateway) (indicateurs, supervision, ports)
- [Configuration du Gateway](/fr/gateway/configuration) (schéma de configuration + exemples)
- [Discord](/fr/channels/discord) et [Telegram](/fr/channels/telegram) (balises de réponse + paramètres replyToMode)
- [Configuration de l’assistant OpenClaw](/fr/start/openclaw)
- [Application macOS](/fr/platforms/macos) (cycle de vie du gateway)
