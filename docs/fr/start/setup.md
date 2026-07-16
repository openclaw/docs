---
read_when:
    - Configuration d’une nouvelle machine
    - Vous voulez « le nec plus ultra » sans perturber votre configuration personnelle
summary: Configuration avancée et workflows de développement pour OpenClaw
title: Configuration
x-i18n:
    generated_at: "2026-07-16T13:51:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si vous effectuez la configuration pour la première fois, commencez par [Bien démarrer](/fr/start/getting-started).
Pour plus de détails sur l’intégration initiale, consultez [Intégration initiale (CLI)](/fr/start/wizard).
</Note>

## En bref

Choisissez un processus de configuration selon la fréquence souhaitée des mises à jour et selon que vous souhaitez exécuter vous-même le Gateway :

- **Les personnalisations se trouvent hors du dépôt :** conservez votre configuration et votre espace de travail dans `~/.openclaw/openclaw.json` et `~/.openclaw/workspace/` afin que les mises à jour du dépôt ne les modifient pas.
- **Processus stable (recommandé dans la plupart des cas) :** installez l’app macOS et laissez-la exécuter le Gateway fourni.
- **Processus de pointe (développement) :** exécutez vous-même le Gateway via `pnpm gateway:watch`, puis laissez l’app macOS s’y connecter en mode Local.

## Prérequis (depuis les sources)

- Node 24.15+ recommandé (Node 22 LTS, actuellement `22.22.3+`, reste pris en charge)
- `pnpm` requis pour les extractions du code source. OpenClaw charge les plugins fournis depuis les
  paquets d’espace de travail pnpm `extensions/*` en mode développement ; le `npm install` racine ne
  prépare donc pas l’intégralité de l’arborescence source.
- Docker (facultatif ; uniquement pour la configuration conteneurisée ou les tests e2e — consultez [Docker](/fr/install/docker))

## Stratégie de personnalisation (pour éviter que les mises à jour ne posent problème)

Si vous souhaitez une configuration « 100 % adaptée à mes besoins » _et_ des mises à jour faciles, conservez vos personnalisations dans :

- **Configuration :** `~/.openclaw/openclaw.json` (JSON/JSON5 approximatif)
- **Espace de travail :** `~/.openclaw/workspace` (Skills, prompts, mémoires ; faites-en un dépôt git privé)

Initialisez une seule fois les dossiers de configuration et d’espace de travail, sans exécuter l’assistant complet d’intégration initiale :

```bash
openclaw setup --baseline
```

Aucune installation globale pour le moment ? Exécutez plutôt la commande depuis ce dépôt :

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` seul, sans `--baseline`, est un alias de `openclaw onboard` et exécute l’assistant interactif complet.)

## Exécuter le Gateway depuis ce dépôt

Après `pnpm build`, vous pouvez exécuter directement la CLI empaquetée :

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Processus stable (app macOS en premier)

1. Installez et lancez **OpenClaw.app** (barre des menus).
2. Suivez la liste de contrôle de l’intégration initiale et des autorisations (invites TCC).
3. Vérifiez que le Gateway est en mode **Local** et en cours d’exécution (l’app le gère).
4. Associez les interfaces (par exemple, WhatsApp) :

```bash
openclaw channels login
```

5. Vérification rapide :

```bash
openclaw health
```

Si l’intégration initiale n’est pas disponible dans votre build :

- Exécutez `openclaw setup`, puis `openclaw channels login`, puis démarrez manuellement le Gateway (`openclaw gateway`).

## Processus de pointe (Gateway dans un terminal)

Objectif : travailler sur le Gateway TypeScript, bénéficier du rechargement à chaud et maintenir l’interface de l’app macOS connectée.

### 0) (Facultatif) Exécuter également l’app macOS depuis les sources

Si vous souhaitez également utiliser la version de pointe de l’app macOS :

```bash
./scripts/restart-mac.sh
```

### 1) Démarrer le Gateway de développement

```bash
pnpm install
# Uniquement lors de la première exécution (ou après la réinitialisation de la configuration ou de l’espace de travail OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` démarre ou redémarre le processus de surveillance du Gateway dans une session tmux
nommée (`openclaw-gateway-watch-main`) et s’y connecte automatiquement depuis les
terminaux interactifs. Les shells non interactifs restent détachés et affichent
`tmux attach -t openclaw-gateway-watch-main` ; utilisez
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` pour maintenir une exécution interactive
détachée, ou `pnpm gateway:watch:raw` pour le mode de surveillance au premier plan. Le processus de surveillance
arrête le service Gateway installé du profil actif avant de prendre le contrôle de son
port configuré ou par défaut, empêchant ainsi le superviseur de services de remplacer le
processus source. Le service reste installé ; exécutez `pnpm openclaw gateway start`
lorsque vous avez terminé la surveillance. Le volet tmux reste disponible après un échec de démarrage
afin qu’un autre terminal ou agent puisse s’y connecter ou capturer ses journaux. Le processus de surveillance
recharge lors des modifications pertinentes des sources, de la configuration et des métadonnées des plugins fournis. Si le
Gateway surveillé se ferme pendant le démarrage, `gateway:watch` exécute
`openclaw doctor --fix --non-interactive` une fois, puis réessaie ; définissez
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` pour désactiver cette passe de réparation réservée au développement.
`pnpm gateway:watch` ne reconstruit pas `dist/control-ui` ; réexécutez donc `pnpm ui:build` après les modifications de `ui/`, ou utilisez `pnpm ui:dev` pendant le développement de l’interface de contrôle.

### 2) Configurer l’app macOS pour utiliser votre Gateway en cours d’exécution

Dans **OpenClaw.app** :

- Connection Mode: **Local**
  L’app se connectera au Gateway en cours d’exécution sur le port configuré.

### 3) Vérifier

- Dans l’app, l’état du Gateway doit indiquer **"Using existing gateway …"**
- Ou via la CLI :

```bash
openclaw health
```

### Erreurs fréquentes

- **Mauvais port :** le WS du Gateway utilise `ws://127.0.0.1:18789` par défaut ; configurez l’app et la CLI sur le même port.
- **Emplacement de l’état :**
  - État des canaux et fournisseurs : `~/.openclaw/credentials/`
  - Profils d’authentification des modèles : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions et transcriptions : `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Artefacts de session hérités ou archivés : `~/.openclaw/agents/<agentId>/sessions/`
  - Journaux : `/tmp/openclaw/`

## Carte de stockage des identifiants

Utilisez cette carte lors du débogage de l’authentification ou pour déterminer les éléments à sauvegarder :

- **WhatsApp** : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Jeton du bot Telegram** : configuration/env ou `channels.telegram.tokenFile` (fichier ordinaire uniquement ; liens symboliques refusés)
- **Jeton du bot Discord** : configuration/env ou SecretRef (fournisseurs env/file/exec)
- **Jetons Slack** : configuration/env (`channels.slack.*`)
- **Listes d’autorisation d’association** :
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (compte par défaut)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (comptes autres que celui par défaut)
- **Profils d’authentification des modèles** : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Charge utile des secrets stockée dans un fichier (facultatif)** : `~/.openclaw/secrets.json`
- **Importation OAuth héritée** : `~/.openclaw/credentials/oauth.json`
  Plus de détails : [Sécurité](/fr/gateway/security#credential-storage-map).

## Mettre à jour (sans compromettre votre configuration)

- Considérez `~/.openclaw/workspace` et `~/.openclaw/` comme « vos éléments » ; ne placez pas vos prompts ou votre configuration personnels dans le dépôt `openclaw`.
- Mise à jour des sources : `git pull` + `pnpm install` + continuez à utiliser `pnpm gateway:watch`.

## Linux (service utilisateur systemd)

Les installations Linux utilisent un service **utilisateur** systemd. Par défaut, systemd arrête les
services utilisateur lors de la déconnexion ou de l’inactivité, ce qui interrompt le Gateway. L’intégration initiale tente d’activer
la persistance pour vous (une invite sudo peut s’afficher). Si elle reste désactivée, exécutez :

```bash
sudo loginctl enable-linger $USER
```

Pour les serveurs toujours actifs ou multi-utilisateurs, envisagez plutôt un service **système**
qu’un service utilisateur (aucune persistance nécessaire). Consultez le [guide d’exploitation du Gateway](/fr/gateway) pour les remarques sur systemd.

## Documentation associée

- [Guide d’exploitation du Gateway](/fr/gateway) (options, supervision, ports)
- [Configuration du Gateway](/fr/gateway/configuration) (schéma de configuration et exemples)
- [Discord](/fr/channels/discord) et [Telegram](/fr/channels/telegram) (balises de réponse et paramètres replyToMode)
- [Configuration de l’assistant OpenClaw](/fr/start/openclaw)
- [App macOS](/fr/platforms/macos) (cycle de vie du Gateway)
