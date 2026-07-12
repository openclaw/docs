---
read_when:
    - Configuration d’une nouvelle machine
    - Vous voulez bénéficier des toutes dernières fonctionnalités sans perturber votre configuration personnelle
summary: Configuration avancée et workflows de développement pour OpenClaw
title: Configuration
x-i18n:
    generated_at: "2026-07-12T15:51:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd35e9ab99de49a14f3d8673b2d11abe46aace18cc7edac43987826bbd1fd857
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si vous effectuez la configuration pour la première fois, commencez par [Bien démarrer](/fr/start/getting-started).
Pour en savoir plus sur l’intégration, consultez [Intégration (CLI)](/fr/start/wizard).
</Note>

## En bref

Choisissez une procédure de configuration selon la fréquence à laquelle vous souhaitez effectuer les mises à jour et selon que vous voulez ou non exécuter vous-même le Gateway :

- **La personnalisation reste en dehors du dépôt :** conservez votre configuration et votre espace de travail dans `~/.openclaw/openclaw.json` et `~/.openclaw/workspace/` afin que les mises à jour du dépôt ne les modifient pas.
- **Procédure stable (recommandée dans la plupart des cas) :** installez l’application macOS et laissez-la exécuter le Gateway intégré.
- **Procédure à la pointe du développement (dev) :** exécutez vous-même le Gateway avec `pnpm gateway:watch`, puis laissez l’application macOS s’y connecter en mode Local.

## Prérequis (depuis les sources)

- Node 24 recommandé (Node 22 LTS, actuellement `22.19+`, reste pris en charge)
- `pnpm` est requis pour les extractions du code source. En mode développement, OpenClaw charge les plugins intégrés depuis les paquets de l’espace de travail pnpm
  `extensions/*` ; par conséquent, l’exécution de `npm install` à la racine ne
  prépare pas l’intégralité de l’arborescence des sources.
- Docker (facultatif ; uniquement pour la configuration conteneurisée et les tests e2e — consultez [Docker](/fr/install/docker))

## Stratégie de personnalisation (pour éviter les problèmes lors des mises à jour)

Si vous souhaitez une configuration « 100 % adaptée à mes besoins » _et_ des mises à jour faciles, conservez vos personnalisations dans :

- **Configuration :** `~/.openclaw/openclaw.json` (JSON/plus ou moins JSON5)
- **Espace de travail :** `~/.openclaw/workspace` (skills, invites, mémoires ; faites-en un dépôt git privé)

Initialisez une fois les dossiers de configuration et d’espace de travail, sans exécuter l’assistant d’intégration complet :

```bash
openclaw setup --baseline
```

Vous n’avez pas encore effectué d’installation globale ? Exécutez plutôt la commande depuis ce dépôt :

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` seul, sans `--baseline`, est un alias de `openclaw onboard` et exécute l’assistant interactif complet.)

## Exécuter le Gateway depuis ce dépôt

Après `pnpm build`, vous pouvez exécuter directement la CLI empaquetée :

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Procédure stable (application macOS en premier)

1. Installez et lancez **OpenClaw.app** (barre des menus).
2. Suivez la liste de contrôle d’intégration et d’autorisations (invites TCC).
3. Vérifiez que le Gateway est en mode **Local** et qu’il est en cours d’exécution (l’application le gère).
4. Associez les interfaces (par exemple, WhatsApp) :

```bash
openclaw channels login
```

5. Effectuez une vérification rapide :

```bash
openclaw health
```

Si l’intégration n’est pas disponible dans votre build :

- Exécutez `openclaw setup`, puis `openclaw channels login`, puis démarrez manuellement le Gateway (`openclaw gateway`).

## Procédure à la pointe du développement (Gateway dans un terminal)

Objectif : travailler sur le Gateway TypeScript, bénéficier du rechargement à chaud et garder l’interface de l’application macOS connectée.

### 0) (Facultatif) Exécuter également l’application macOS depuis les sources

Si vous souhaitez aussi utiliser la version à la pointe du développement de l’application macOS :

```bash
./scripts/restart-mac.sh
```

### 1) Démarrer le Gateway de développement

```bash
pnpm install
# Première exécution uniquement (ou après la réinitialisation de la configuration ou de l’espace de travail OpenClaw local)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` démarre ou redémarre le processus de surveillance du Gateway dans une session tmux
nommée (`openclaw-gateway-watch-main`) et s’y connecte automatiquement depuis les
terminaux interactifs. Les shells non interactifs restent détachés et affichent
`tmux attach -t openclaw-gateway-watch-main` ; utilisez
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` pour maintenir détachée une exécution
interactive, ou `pnpm gateway:watch:raw` pour le mode de surveillance au premier plan. Le processus de surveillance
recharge le Gateway lorsque les sources, la configuration ou les métadonnées des plugins intégrés concernées sont modifiées. Si le
Gateway surveillé se ferme pendant le démarrage, `gateway:watch` exécute une fois
`openclaw doctor --fix --non-interactive`, puis réessaie ; définissez
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` pour désactiver cette passe de réparation réservée au développement.
`pnpm gateway:watch` ne reconstruit pas `dist/control-ui` ; réexécutez donc `pnpm ui:build` après toute modification de `ui/` ou utilisez `pnpm ui:dev` pendant le développement de l’interface de contrôle.

### 2) Connecter l’application macOS à votre Gateway en cours d’exécution

Dans **OpenClaw.app** :

- Connection Mode: **Local**
  L’application se connectera au Gateway en cours d’exécution sur le port configuré.

### 3) Vérifier

- Dans l’application, l’état du Gateway doit indiquer **"Using existing gateway …"**
- Ou avec la CLI :

```bash
openclaw health
```

### Pièges courants

- **Port incorrect :** le WebSocket du Gateway utilise par défaut `ws://127.0.0.1:18789` ; configurez le même port pour l’application et la CLI.
- **Emplacement des données d’état :**
  - État des canaux et fournisseurs : `~/.openclaw/credentials/`
  - Profils d’authentification des modèles : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions et transcriptions : `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Artefacts de session hérités ou archivés : `~/.openclaw/agents/<agentId>/sessions/`
  - Journaux : `/tmp/openclaw/`

## Carte de stockage des identifiants

Utilisez cette carte pour déboguer l’authentification ou déterminer les éléments à sauvegarder :

- **WhatsApp** : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Jeton du bot Telegram** : configuration/variable d’environnement ou `channels.telegram.tokenFile` (fichier ordinaire uniquement ; liens symboliques refusés)
- **Jeton du bot Discord** : configuration/variable d’environnement ou SecretRef (fournisseurs env/file/exec)
- **Jetons Slack** : configuration/variable d’environnement (`channels.slack.*`)
- **Listes d’autorisation d’association** :
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (compte par défaut)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (comptes autres que celui par défaut)
- **Profils d’authentification des modèles** : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Contenu des secrets stocké dans un fichier (facultatif)** : `~/.openclaw/secrets.json`
- **Importation OAuth héritée** : `~/.openclaw/credentials/oauth.json`
  Plus de détails : [Sécurité](/fr/gateway/security#credential-storage-map).

## Mettre à jour sans endommager votre configuration

- Considérez `~/.openclaw/workspace` et `~/.openclaw/` comme « vos données » ; ne placez pas vos invites ou configurations personnelles dans le dépôt `openclaw`.
- Pour mettre à jour les sources : `git pull` + `pnpm install` + continuez à utiliser `pnpm gateway:watch`.

## Linux (service utilisateur systemd)

Les installations Linux utilisent un service **utilisateur** systemd. Par défaut, systemd arrête les
services utilisateur lors de la déconnexion ou de l’inactivité, ce qui interrompt le Gateway. L’intégration tente d’activer
la persistance de la session utilisateur pour vous (une demande de mot de passe sudo peut s’afficher). Si elle est toujours désactivée, exécutez :

```bash
sudo loginctl enable-linger $USER
```

Pour les serveurs toujours actifs ou multi-utilisateurs, envisagez plutôt un service
**système** qu’un service utilisateur (aucune persistance de session nécessaire). Consultez le [guide d’exploitation du Gateway](/fr/gateway) pour les remarques concernant systemd.

## Documentation associée

- [Guide d’exploitation du Gateway](/fr/gateway) (options, supervision, ports)
- [Configuration du Gateway](/fr/gateway/configuration) (schéma de configuration et exemples)
- [Discord](/fr/channels/discord) et [Telegram](/fr/channels/telegram) (balises de réponse et paramètres replyToMode)
- [Configuration de l’assistant OpenClaw](/fr/start/openclaw)
- [Application macOS](/fr/platforms/macos) (cycle de vie du Gateway)
