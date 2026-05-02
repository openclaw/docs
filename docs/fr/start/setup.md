---
read_when:
    - Configurer une nouvelle machine
    - Vous voulez « le plus récent et le meilleur » sans perturber votre configuration personnelle
summary: Configuration avancée et flux de travail de développement pour OpenClaw
title: Configuration
x-i18n:
    generated_at: "2026-05-02T07:19:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si vous effectuez la configuration pour la première fois, commencez par [Bien démarrer](/fr/start/getting-started).
Pour les détails d’intégration, consultez [Intégration (CLI)](/fr/start/wizard).
</Note>

## En bref

Choisissez un flux de configuration selon la fréquence à laquelle vous voulez recevoir les mises à jour et si vous voulez exécuter le Gateway vous-même :

- **La personnalisation vit hors du dépôt :** conservez votre configuration et votre espace de travail dans `~/.openclaw/openclaw.json` et `~/.openclaw/workspace/` afin que les mises à jour du dépôt ne les modifient pas.
- **Flux stable (recommandé pour la plupart des utilisateurs) :** installez l’application macOS et laissez-la exécuter le Gateway inclus.
- **Flux avant-gardiste (développement) :** exécutez vous-même le Gateway via `pnpm gateway:watch`, puis laissez l’application macOS s’y connecter en mode Local.

## Prérequis (depuis les sources)

- Node 24 recommandé (Node 22 LTS, actuellement `22.14+`, toujours pris en charge)
- `pnpm` est requis pour les extractions des sources. OpenClaw charge les plugins inclus depuis les packages d’espace de travail pnpm `extensions/*` en mode développement, donc un `npm install` à la racine ne prépare pas l’arborescence complète des sources.
- Docker (facultatif ; uniquement pour la configuration/e2e conteneurisée — voir [Docker](/fr/install/docker))

## Stratégie de personnalisation (pour que les mises à jour ne posent pas problème)

Si vous voulez une configuration « 100 % adaptée à moi » _et_ des mises à jour faciles, conservez vos personnalisations dans :

- **Configuration :** `~/.openclaw/openclaw.json` (JSON/JSON5 approximatif)
- **Espace de travail :** `~/.openclaw/workspace` (Skills, prompts, mémoires ; faites-en un dépôt git privé)

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
2. Terminez la liste de vérification d’intégration/autorisations (invites TCC).
3. Assurez-vous que le Gateway est en mode **Local** et en cours d’exécution (l’application le gère).
4. Liez les surfaces (exemple : WhatsApp) :

```bash
openclaw channels login
```

5. Vérification de cohérence :

```bash
openclaw health
```

Si l’intégration n’est pas disponible dans votre version :

- Exécutez `openclaw setup`, puis `openclaw channels login`, puis démarrez le Gateway manuellement (`openclaw gateway`).

## Flux avant-gardiste (Gateway dans un terminal)

Objectif : travailler sur le Gateway TypeScript, bénéficier du rechargement à chaud, garder l’interface utilisateur de l’application macOS connectée.

### 0) (Facultatif) Exécuter aussi l’application macOS depuis les sources

Si vous voulez aussi l’application macOS en version avant-gardiste :

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

`gateway:watch` démarre ou redémarre le processus de surveillance du Gateway dans une session tmux nommée et s’y attache automatiquement depuis les terminaux interactifs. Les shells non interactifs restent détachés et affichent `tmux attach -t openclaw-gateway-watch-main` ; utilisez `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` pour garder une exécution interactive détachée, ou `pnpm gateway:watch:raw` pour le mode de surveillance au premier plan. Le processus de surveillance recharge lors des changements pertinents des sources, de la configuration et des métadonnées de plugins inclus.
`pnpm openclaw setup` est l’étape ponctuelle d’initialisation de la configuration/de l’espace de travail local pour une extraction fraîche.
`pnpm gateway:watch` ne reconstruit pas `dist/control-ui`, donc relancez `pnpm ui:build` après des modifications dans `ui/` ou utilisez `pnpm ui:dev` pendant le développement de l’interface utilisateur de contrôle.

### 2) Pointer l’application macOS vers votre Gateway en cours d’exécution

Dans **OpenClaw.app** :

- Mode de connexion : **Local**
  L’application se connectera au Gateway en cours d’exécution sur le port configuré.

### 3) Vérifier

- L’état du Gateway dans l’application doit indiquer **« Utilisation du Gateway existant … »**
- Ou via la CLI :

```bash
openclaw health
```

### Pièges fréquents

- **Mauvais port :** le WS du Gateway utilise par défaut `ws://127.0.0.1:18789` ; gardez l’application et la CLI sur le même port.
- **Emplacement de l’état :**
  - État des canaux/fournisseurs : `~/.openclaw/credentials/`
  - Profils d’authentification de modèle : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions : `~/.openclaw/agents/<agentId>/sessions/`
  - Journaux : `/tmp/openclaw/`

## Carte de stockage des identifiants

Utilisez ceci lors du débogage de l’authentification ou pour décider quoi sauvegarder :

- **WhatsApp** : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Jeton de bot Telegram** : configuration/env ou `channels.telegram.tokenFile` (fichier standard uniquement ; liens symboliques rejetés)
- **Jeton de bot Discord** : configuration/env ou SecretRef (fournisseurs env/file/exec)
- **Jetons Slack** : configuration/env (`channels.slack.*`)
- **Listes d’autorisation d’appairage** :
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (compte par défaut)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (comptes non par défaut)
- **Profils d’authentification de modèle** : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Charge utile de secrets adossée à un fichier (facultatif)** : `~/.openclaw/secrets.json`
- **Import OAuth hérité** : `~/.openclaw/credentials/oauth.json`
  Plus de détails : [Sécurité](/fr/gateway/security#credential-storage-map).

## Mise à jour (sans casser votre configuration)

- Considérez `~/.openclaw/workspace` et `~/.openclaw/` comme « vos affaires » ; ne placez pas de prompts/configuration personnels dans le dépôt `openclaw`.
- Mise à jour des sources : `git pull` + `pnpm install` + continuez à utiliser `pnpm gateway:watch`.

## Linux (service utilisateur systemd)

Les installations Linux utilisent un service **utilisateur** systemd. Par défaut, systemd arrête les services utilisateur à la déconnexion ou en cas d’inactivité, ce qui tue le Gateway. L’intégration tente d’activer la persistance pour vous (peut demander sudo). Si elle est toujours désactivée, exécutez :

```bash
sudo loginctl enable-linger $USER
```

Pour les serveurs toujours actifs ou multi-utilisateurs, envisagez plutôt un service **système** au lieu d’un service utilisateur (aucune persistance nécessaire). Consultez le [runbook du Gateway](/fr/gateway) pour les notes systemd.

## Documentation associée

- [Runbook du Gateway](/fr/gateway) (indicateurs, supervision, ports)
- [Configuration du Gateway](/fr/gateway/configuration) (schéma de configuration + exemples)
- [Discord](/fr/channels/discord) et [Telegram](/fr/channels/telegram) (étiquettes de réponse + paramètres replyToMode)
- [Configuration de l’assistant OpenClaw](/fr/start/openclaw)
- [Application macOS](/fr/platforms/macos) (cycle de vie du Gateway)
