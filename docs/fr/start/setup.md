---
read_when:
    - Configuration d’une nouvelle machine
    - Vous voulez le « plus récent et le meilleur » sans casser votre configuration personnelle
summary: Configuration avancée et workflows de développement pour OpenClaw
title: Configuration
x-i18n:
    generated_at: "2026-06-27T18:14:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si vous configurez OpenClaw pour la première fois, commencez par [Bien démarrer](/fr/start/getting-started).
Pour les détails d’onboarding, consultez [Onboarding (CLI)](/fr/start/wizard).
</Note>

## En bref

Choisissez un flux de configuration selon la fréquence à laquelle vous voulez recevoir les mises à jour et selon que vous souhaitez exécuter le Gateway vous-même :

- **La personnalisation vit hors du dépôt :** conservez votre configuration et votre espace de travail dans `~/.openclaw/openclaw.json` et `~/.openclaw/workspace/` afin que les mises à jour du dépôt ne les modifient pas.
- **Flux stable (recommandé pour la plupart des utilisateurs) :** installez l’application macOS et laissez-la exécuter le Gateway intégré.
- **Flux de pointe (dev) :** exécutez le Gateway vous-même via `pnpm gateway:watch`, puis laissez l’application macOS s’y connecter en mode Local.

## Prérequis (depuis les sources)

- Node 24 recommandé (Node 22 LTS, actuellement `22.19+`, reste pris en charge)
- `pnpm` est requis pour les extractions depuis les sources. OpenClaw charge les plugins intégrés depuis les packages d’espace de travail pnpm
  `extensions/*` en mode dev ; donc `npm install` à la racine ne prépare pas
  l’arborescence source complète.
- Docker (facultatif ; uniquement pour la configuration/e2e conteneurisée - voir [Docker](/fr/install/docker))

## Stratégie de personnalisation (pour que les mises à jour ne posent pas problème)

Si vous voulez une configuration « 100 % adaptée à moi » _et_ des mises à jour simples, conservez votre personnalisation dans :

- **Configuration :** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Espace de travail :** `~/.openclaw/workspace` (skills, prompts, memories ; faites-en un dépôt git privé)

Initialisez une fois :

```bash
openclaw setup
```

Depuis ce dépôt, utilisez l’entrée CLI locale :

```bash
openclaw setup
```

Si vous n’avez pas encore d’installation globale, exécutez-la via `pnpm openclaw setup`.

## Exécuter le Gateway depuis ce dépôt

Après `pnpm build`, vous pouvez exécuter directement la CLI empaquetée :

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flux stable (application macOS d’abord)

1. Installez et lancez **OpenClaw.app** (barre de menus).
2. Complétez la checklist d’onboarding/autorisations (invites TCC).
3. Assurez-vous que le Gateway est en mode **Local** et en cours d’exécution (l’application le gère).
4. Associez les surfaces (exemple : WhatsApp) :

```bash
openclaw channels login
```

5. Vérification rapide :

```bash
openclaw health
```

Si l’onboarding n’est pas disponible dans votre build :

- Exécutez `openclaw setup`, puis `openclaw channels login`, puis démarrez le Gateway manuellement (`openclaw gateway`).

## Flux de pointe (Gateway dans un terminal)

Objectif : travailler sur le Gateway TypeScript, obtenir le rechargement à chaud, garder l’interface de l’application macOS connectée.

### 0) (Facultatif) Exécuter aussi l’application macOS depuis les sources

Si vous voulez également l’application macOS sur la version de pointe :

```bash
./scripts/restart-mac.sh
```

### 1) Démarrer le Gateway de développement

```bash
pnpm install
# Première exécution uniquement (ou après réinitialisation de la configuration/de l’espace de travail OpenClaw local)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` démarre ou redémarre le processus de surveillance du Gateway dans une session tmux
nommée et s’y attache automatiquement depuis les terminaux interactifs. Les shells non interactifs restent
détachés et affichent `tmux attach -t openclaw-gateway-watch-main` ; utilisez
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` pour garder une exécution interactive
détachée, ou `pnpm gateway:watch:raw` pour le mode de surveillance au premier plan. Le watcher
recharge lors des changements pertinents de sources, de configuration et de métadonnées de plugins intégrés. Si le
Gateway surveillé quitte pendant le démarrage, `gateway:watch` exécute
`openclaw doctor --fix --non-interactive` une fois, puis réessaie ; définissez
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` pour désactiver cette passe de réparation réservée au dev.
`pnpm openclaw setup` est l’étape unique d’initialisation de la configuration/de l’espace de travail local pour une extraction fraîche.
`pnpm gateway:watch` ne reconstruit pas `dist/control-ui` ; réexécutez donc `pnpm ui:build` après des changements dans `ui/`, ou utilisez `pnpm ui:dev` pendant le développement de la Control UI.

### 2) Pointer l’application macOS vers votre Gateway en cours d’exécution

Dans **OpenClaw.app** :

- Mode de connexion : **Local**
  L’application se connectera au gateway en cours d’exécution sur le port configuré.

### 3) Vérifier

- Le statut Gateway dans l’application doit indiquer **« Using existing gateway … »**
- Ou via la CLI :

```bash
openclaw health
```

### Pièges courants

- **Mauvais port :** le WS du Gateway utilise par défaut `ws://127.0.0.1:18789` ; gardez l’application et la CLI sur le même port.
- **Emplacement de l’état :**
  - État des channels/providers : `~/.openclaw/credentials/`
  - Profils d’authentification de modèle : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions : `~/.openclaw/agents/<agentId>/sessions/`
  - Journaux : `/tmp/openclaw/`

## Carte du stockage des identifiants

Utilisez ceci lors du débogage de l’authentification ou pour décider quoi sauvegarder :

- **WhatsApp** : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Jeton de bot Telegram** : configuration/env ou `channels.telegram.tokenFile` (fichier normal uniquement ; liens symboliques rejetés)
- **Jeton de bot Discord** : configuration/env ou SecretRef (providers env/file/exec)
- **Jetons Slack** : configuration/env (`channels.slack.*`)
- **Listes d’autorisation d’appairage** :
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (compte par défaut)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (comptes non par défaut)
- **Profils d’authentification de modèle** : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Charge utile de secrets adossée à un fichier (facultatif)** : `~/.openclaw/secrets.json`
- **Import OAuth hérité** : `~/.openclaw/credentials/oauth.json`
  Plus de détails : [Sécurité](/fr/gateway/security#credential-storage-map).

## Mise à jour (sans casser votre configuration)

- Considérez `~/.openclaw/workspace` et `~/.openclaw/` comme « vos données » ; ne mettez pas vos prompts/configurations personnels dans le dépôt `openclaw`.
- Mise à jour des sources : `git pull` + `pnpm install` + continuez à utiliser `pnpm gateway:watch`.

## Linux (service utilisateur systemd)

Les installations Linux utilisent un service **utilisateur** systemd. Par défaut, systemd arrête les
services utilisateur à la déconnexion/inactivité, ce qui tue le Gateway. L’onboarding tente d’activer
le lingering pour vous (peut demander sudo). S’il est toujours désactivé, exécutez :

```bash
sudo loginctl enable-linger $USER
```

Pour les serveurs toujours actifs ou multi-utilisateurs, envisagez un service **système** plutôt qu’un
service utilisateur (pas besoin de lingering). Consultez le [runbook Gateway](/fr/gateway) pour les notes systemd.

## Docs associées

- [Runbook Gateway](/fr/gateway) (flags, supervision, ports)
- [Configuration du Gateway](/fr/gateway/configuration) (schéma de configuration + exemples)
- [Discord](/fr/channels/discord) et [Telegram](/fr/channels/telegram) (tags de réponse + paramètres replyToMode)
- [Configuration de l’assistant OpenClaw](/fr/start/openclaw)
- [Application macOS](/fr/platforms/macos) (cycle de vie du gateway)
