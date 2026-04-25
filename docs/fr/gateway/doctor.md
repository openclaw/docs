---
read_when:
    - Ajout ou modification de migrations doctor
    - Introduction de modifications de configuration incompatibles
summary: 'Commande Doctor : contrôles d’intégrité, migrations de configuration et étapes de réparation'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:46:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` est l’outil de réparation + migration d’OpenClaw. Il corrige la
configuration/l’état obsolètes, vérifie l’intégrité et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Headless / automatisation

```bash
openclaw doctor --yes
```

Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation de redémarrage/service/sandbox lorsque cela s’applique).

```bash
openclaw doctor --repair
```

Applique les réparations recommandées sans demander de confirmation (réparations + redémarrages lorsque c’est sûr).

```bash
openclaw doctor --repair --force
```

Applique aussi les réparations agressives (écrase les configurations de superviseur personnalisées).

```bash
openclaw doctor --non-interactive
```

Exécute sans invites et applique uniquement les migrations sûres (normalisation de configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine.
Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

```bash
openclaw doctor --deep
```

Analyse les services système à la recherche d’installations supplémentaires de gateway (launchd/systemd/schtasks).

Si vous voulez examiner les changements avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

- Mise à jour préalable facultative pour les installations git (mode interactif uniquement).
- Vérification de fraîcheur du protocole d’interface utilisateur (reconstruit l’interface utilisateur de contrôle lorsque le schéma du protocole est plus récent).
- Vérification d’intégrité + invite de redémarrage.
- Résumé d’état des Skills (éligibles/manquants/bloqués) et état des plugins.
- Normalisation de configuration pour les valeurs héritées.
- Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
- Vérifications de migration du navigateur pour les anciennes configurations d’extension Chrome et l’état de préparation Chrome MCP.
- Avertissements sur les remplacements de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avertissements sur le masquage OAuth Codex (`models.providers.openai-codex`).
- Vérification des prérequis TLS OAuth pour les profils OpenAI Codex OAuth.
- Migration d’état hérité sur disque (sessions/répertoire d’agent/authentification WhatsApp).
- Migration des anciennes clés de contrat de manifeste de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration de l’ancien stockage Cron (`jobId`, `schedule.cron`, champs de distribution/charge utile de niveau supérieur, `provider` de charge utile, tâches Webhook de repli simples `notify: true`).
- Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
- Vérifications d’intégrité et de permissions de l’état (sessions, transcriptions, répertoire d’état).
- Vérifications des permissions du fichier de configuration (chmod 600) lors d’une exécution locale.
- Intégrité de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de cooldown/désactivation des profils d’authentification.
- Détection de répertoires d’espace de travail supplémentaires (`~/openclaw`).
- Réparation de l’image sandbox lorsque le sandboxing est activé.
- Migration de service héritée et détection de gateways supplémentaires.
- Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
- Vérifications du runtime Gateway (service installé mais non démarré ; étiquette launchd en cache).
- Avertissements d’état des canaux (sondés depuis la gateway en cours d’exécution).
- Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
- Vérifications des bonnes pratiques du runtime Gateway (Node vs Bun, chemins de gestionnaire de versions).
- Diagnostics de collision de port Gateway (par défaut `18789`).
- Avertissements de sécurité pour les politiques de messages privés ouvertes.
- Vérifications d’authentification Gateway pour le mode jeton local (propose la génération d’un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations SecretRef de jeton).
- Détection des problèmes d’appairage d’appareils (premières demandes d’appairage en attente, mises à niveau de rôle/portée en attente, dérive de cache local obsolète de jeton d’appareil, et dérive d’authentification des enregistrements appairés).
- Vérification de linger systemd sur Linux.
- Vérification de la taille des fichiers bootstrap de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
- Vérification de l’état de la complétion du shell et installation/mise à niveau automatiques.
- Vérification d’état de préparation du fournisseur d’embeddings pour la recherche mémoire (modèle local, clé API distante ou binaire QMD).
- Vérifications d’installation depuis les sources (incohérence d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
- Écrit la configuration mise à jour + les métadonnées de l’assistant.

## Rétro-remplissage et réinitialisation de l’interface Dreams

La scène Dreams de l’interface utilisateur de contrôle inclut les actions **Backfill**, **Reset** et **Clear Grounded**
pour le workflow de Dreaming ancré. Ces actions utilisent des méthodes RPC de type
doctor de gateway, mais elles ne font **pas** partie de la réparation/migration CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` de l’espace de travail
  actif, exécute le passage du journal REM ancré et écrit des entrées de rétro-remplissage réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de rétro-remplissage marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées à court terme ancrées uniquement et mises en attente qui
  proviennent d’une relecture historique et n’ont pas encore accumulé de rappel en direct ni de support
  quotidien.

Ce qu’elles ne font **pas** d’elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne mettent pas automatiquement en attente les candidats ancrés dans le stockage de promotion court terme en direct sauf si vous exécutez d’abord explicitement le chemin CLI mis en attente

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde,
utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela met en attente les candidats durables ancrés dans le stockage de Dreaming court terme tout en
conservant `DREAMS.md` comme surface de révision.

## Comportement détaillé et justification

### 0) Mise à jour facultative (installations git)

S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose une
mise à jour (fetch/rebase/build) avant d’exécuter doctor.

### 1) Normalisation de la configuration

Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction`
sans remplacement spécifique à un canal), doctor les normalise vers le schéma actuel.

Cela inclut les anciens champs plats Talk. La configuration publique actuelle de Talk est
`talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` dans la map de fournisseurs.

### 2) Migrations des clés de configuration héritées

Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et demandent
d’exécuter `openclaw doctor`.

Doctor va :

- Expliquer quelles clés héritées ont été trouvées.
- Montrer la migration qu’il a appliquée.
- Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

La Gateway exécute aussi automatiquement les migrations doctor au démarrage lorsqu’elle détecte un
format de configuration hérité, de sorte que les configurations obsolètes sont réparées sans intervention manuelle.
Les migrations du stockage des tâches Cron sont gérées par `openclaw doctor --fix`.

Migrations actuelles :

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de niveau supérieur
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- anciens `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` et `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` et `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` et `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` et `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Pour les canaux avec des `accounts` nommés mais des valeurs de canal de niveau supérieur à compte unique persistantes, déplacer ces valeurs à portée de compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut préserver une cible nommée/par défaut existante correspondante)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)

Les avertissements doctor incluent aussi des conseils sur le compte par défaut pour les canaux multi-comptes :

- Si deux entrées ou plus `channels.<channel>.accounts` sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de repli peut choisir un compte inattendu.
- Si `channels.<channel>.defaultAccount` est défini sur un identifiant de compte inconnu, doctor avertit et liste les identifiants de compte configurés.

### 2b) Remplacements de fournisseur OpenCode

Si vous avez ajouté `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manuellement, cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`.
Cela peut forcer des modèles vers la mauvaise API ou remettre les coûts à zéro. Doctor avertit pour que vous
puissiez supprimer le remplacement et restaurer le routage API + les coûts par modèle.

### 2c) Migration du navigateur et état de préparation Chrome MCP

Si votre configuration de navigateur pointe encore vers le chemin d’extension Chrome supprimé, doctor
la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

- `browser.profiles.*.driver: "extension"` devient `"existing-session"`
- `browser.relayBindHost` est supprimé

Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile:
"user"` ou un profil `existing-session` configuré :

- vérifie si Google Chrome est installé sur le même hôte pour les profils par défaut
  à connexion automatique
- vérifie la version de Chrome détectée et avertit si elle est inférieure à Chrome 144
- rappelle d’activer le débogage à distance dans la page inspect du navigateur (par
  exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

Doctor ne peut pas activer pour vous le paramètre côté Chrome. Chrome MCP local à l’hôte
nécessite toujours :

- un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
- le navigateur exécuté localement
- le débogage à distance activé dans ce navigateur
- l’approbation de la première invite de consentement d’attachement dans le navigateur

L’état de préparation ici concerne uniquement les prérequis d’attachement local. Existing-session conserve
les limites actuelles de route Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF,
l’interception des téléchargements et les actions par lots nécessitent toujours un navigateur géré
ou un profil CDP brut.

Cette vérification ne s’applique **pas** à Docker, au sandbox, au navigateur distant ni aux autres
flux headless. Ceux-ci continuent d’utiliser CDP brut.

### 2d) Prérequis TLS OAuth

Lorsqu’un profil OpenAI Codex OAuth est configuré, doctor sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS Node/OpenSSL locale peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat auto-signé), doctor affiche des indications de correction spécifiques à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si la gateway est saine.

### 2c) Remplacements de fournisseur Codex OAuth

Si vous avez précédemment ajouté d’anciens paramètres de transport OpenAI sous
`models.providers.openai-codex`, ils peuvent masquer le chemin du fournisseur
Codex OAuth intégré que les versions récentes utilisent automatiquement. Doctor avertit lorsqu’il voit
ces anciens paramètres de transport en même temps que Codex OAuth afin que vous puissiez supprimer ou réécrire
le remplacement de transport obsolète et récupérer le comportement intégré de routage/repli.
Les proxies personnalisés et les remplacements d’en-tête uniquement restent pris en charge et ne
déclenchent pas cet avertissement.

### 3) Migrations d’état héritées (structure disque)

Doctor peut migrer d’anciennes structures sur disque vers la structure actuelle :

- Stockage des sessions + transcriptions :
  - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
- Répertoire d’agent :
  - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
- État d’authentification WhatsApp (Baileys) :
  - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
  - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

Ces migrations sont au mieux de l’effort et idempotentes ; doctor émet des avertissements lorsqu’il
laisse des dossiers hérités comme sauvegardes. La Gateway/CLI migre aussi automatiquement
les anciennes sessions + le répertoire d’agent au démarrage, afin que l’historique/l’authentification/les modèles aboutissent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp n’est intentionnellement migrée que via `openclaw doctor`. La normalisation Talk provider/provider-map compare désormais par égalité structurelle, de sorte que les différences d’ordre de clés à elles seules ne déclenchent plus de changements répétés sans effet de `doctor --fix`.

### 3a) Migrations héritées des manifestes de plugin

Doctor analyse tous les manifestes de plugin installés à la recherche de clés de capacité
obsolètes de niveau supérieur (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Lorsqu’elles sont trouvées, il propose de les déplacer dans l’objet `contracts`
et de réécrire le fichier manifeste sur place. Cette migration est idempotente ;
si la clé `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée
sans dupliquer les données.

### 3b) Migrations héritées du stockage Cron

Doctor vérifie aussi le stockage des tâches Cron (`~/.openclaw/cron/jobs.json` par défaut,
ou `cron.store` lorsqu’il est remplacé) à la recherche d’anciennes formes de tâche que le planificateur
accepte encore pour compatibilité.

Les nettoyages Cron actuels incluent :

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- champs de charge utile de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
- champs de distribution de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de distribution `provider` dans la charge utile → `delivery.channel` explicite
- tâches Webhook de repli simples héritées `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans
changer le comportement. Si une tâche combine le repli hérité de notification avec un mode de
distribution non-Webhook existant, doctor avertit et laisse cette tâche pour révision manuelle.

### 3c) Nettoyage des verrous de session

Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés
après la sortie anormale d’une session. Pour chaque fichier de verrouillage trouvé, il signale :
le chemin, le PID, si le PID est toujours actif, l’âge du verrou, et s’il est
considéré comme obsolète (PID mort ou plus ancien que 30 minutes). En mode `--fix` / `--repair`,
il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon il affiche une note et
vous demande de relancer avec `--fix`.

### 4) Vérifications d’intégrité de l’état (persistance des sessions, routage et sécurité)

Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez
les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

Doctor vérifie :

- **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer
  le répertoire, et rappelle qu’il ne peut pas récupérer les données manquantes.
- **Permissions du répertoire d’état** : vérifie la possibilité d’écriture ; propose de réparer les permissions
  (et émet un conseil `chown` lorsqu’un décalage propriétaire/groupe est détecté).
- **Répertoire d’état macOS synchronisé par le cloud** : avertit lorsque l’état se résout sous iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` car les chemins synchronisés peuvent causer des E/S plus lentes
  et des courses de verrouillage/synchronisation.
- **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`,
  car les E/S aléatoires sur SD ou eMMC peuvent être plus lentes et user
  plus vite sous les écritures de sessions et d’identifiants.
- **Répertoires de sessions manquants** : `sessions/` et le répertoire de stockage des sessions sont
  nécessaires pour conserver l’historique et éviter les plantages `ENOENT`.
- **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers
  de transcription manquants.
- **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale n’a qu’une
  seule ligne (l’historique ne s’accumule pas).
- **Répertoires d’état multiples** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans
  différents répertoires home ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut
  se répartir entre installations).
- **Rappel mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter
  sur l’hôte distant (c’est là que se trouve l’état).
- **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est
  lisible par le groupe/le monde et propose de les resserrer à `600`.

### 5) Intégrité de l’authentification des modèles (expiration OAuth)

Doctor inspecte les profils OAuth dans le stockage d’authentification, avertit lorsque les jetons arrivent à
expiration/sont expirés, et peut les actualiser lorsque c’est sûr. Si le profil
OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le
chemin Anthropic setup-token.
Les invites d’actualisation n’apparaissent qu’en mode interactif (TTY) ; `--non-interactive`
ignore les tentatives d’actualisation.

Lorsqu’une actualisation OAuth échoue de manière permanente (par exemple `refresh_token_reused`,
`invalid_grant`, ou lorsqu’un fournisseur vous demande de vous reconnecter), doctor indique
qu’une réauthentification est nécessaire et affiche la commande exacte `openclaw models auth login --provider ...`
à exécuter.

Doctor signale aussi les profils d’authentification temporairement inutilisables en raison de :

- cooldowns courts (limites de débit/délais/authentifications échouées)
- désactivations plus longues (échecs de facturation/crédit)

### 6) Validation du modèle des hooks

Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au
catalogue et à la liste d’autorisations et avertit lorsqu’elle ne se résoudra pas ou qu’elle n’est pas autorisée.

### 7) Réparation de l’image sandbox

Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou
de revenir à des noms hérités si l’image actuelle est absente.

### 7b) Dépendances d’exécution des plugins inclus

Doctor vérifie les dépendances d’exécution uniquement pour les plugins inclus qui sont actifs dans
la configuration actuelle ou activés par la valeur par défaut de leur manifeste inclus, par exemple
`plugins.entries.discord.enabled: true`, l’ancien
`channels.discord.enabled: true`, ou un fournisseur inclus activé par défaut. Si certaines
sont manquantes, doctor signale les packages et les installe en mode
`openclaw doctor --fix` / `openclaw doctor --repair`. Les plugins externes continuent
d’utiliser `openclaw plugins install` / `openclaw plugins update` ; doctor n’installe pas
les dépendances pour des chemins de plugin arbitraires.

La Gateway et la CLI locale peuvent aussi réparer à la demande les dépendances d’exécution
des plugins inclus actifs avant d’importer un plugin inclus. Ces installations sont
limitées à la racine d’installation d’exécution du plugin, s’exécutent avec les scripts désactivés, n’écrivent
pas de verrouillage de package, et sont protégées par un verrou de racine d’installation afin que des démarrages
CLI ou Gateway concurrents ne modifient pas le même arbre `node_modules` en même temps.

### 8) Migrations de service Gateway et conseils de nettoyage

Doctor détecte les anciens services gateway (launchd/systemd/schtasks) et
propose de les supprimer et d’installer le service OpenClaw avec le port gateway
actuel. Il peut aussi analyser les services supplémentaires de type gateway et afficher des conseils de nettoyage.
Les services gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont
pas signalés comme « supplémentaires ».

### 8b) Migration Matrix au démarrage

Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable,
doctor (en mode `--fix` / `--repair`) crée un instantané pré-migration puis
exécute les étapes de migration au mieux de l’effort : migration de l’état Matrix hérité et préparation de l’état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et le
démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification
est entièrement ignorée.

### 8c) Appairage d’appareil et dérive d’authentification

Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage normal d’intégrité.

Ce qu’il signale :

- demandes initiales d’appairage en attente
- mises à niveau de rôle en attente pour des appareils déjà appairés
- mises à niveau de portée en attente pour des appareils déjà appairés
- réparations de décalage de clé publique lorsque l’identifiant d’appareil correspond encore mais que l’identité de l’appareil
  ne correspond plus à l’enregistrement approuvé
- enregistrements appairés sans jeton actif pour un rôle approuvé
- jetons appairés dont les portées dérivent hors de la base de référence approuvée de l’appairage
- entrées locales en cache de jeton d’appareil pour la machine actuelle qui sont antérieures à une
  rotation de jeton côté gateway ou qui portent des métadonnées de portée obsolètes

Doctor n’approuve pas automatiquement les demandes d’appairage et ne fait pas non plus de rotation automatique des jetons d’appareil. Il
affiche plutôt les étapes exactes à suivre :

- inspecter les demandes en attente avec `openclaw devices list`
- approuver la demande exacte avec `openclaw devices approve <requestId>`
- faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
- supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

Cela corrige le problème courant « déjà appairé mais toujours “pairing required” » :
doctor distingue désormais l’appairage initial des mises à niveau de rôle/portée en attente
et de la dérive d’identité de jeton/appareil obsolète.

### 9) Avertissements de sécurité

Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux messages privés sans liste d’autorisations, ou
lorsqu’une politique est configurée de façon dangereuse.

### 10) systemd linger (Linux)

S’il s’exécute comme service utilisateur systemd, doctor s’assure que lingering est activé afin que la
gateway reste active après la déconnexion.

### 11) État de l’espace de travail (Skills, plugins et répertoires hérités)

Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

- **État des Skills** : compte les Skills éligibles, ceux avec exigences manquantes et ceux bloqués par la liste d’autorisations.
- **Répertoires d’espace de travail hérités** : avertit lorsque `~/openclaw` ou d’autres répertoires d’espace de travail hérités
  existent à côté de l’espace de travail actuel.
- **État des plugins** : compte les plugins chargés/désactivés/en erreur ; liste les identifiants de plugin pour les
  erreurs ; signale les fonctionnalités des plugins inclus.
- **Avertissements de compatibilité de plugin** : signale les plugins qui ont des problèmes de compatibilité avec
  le runtime actuel.
- **Diagnostics de plugin** : fait remonter tout avertissement ou erreur d’exécution émis par le
  registre de plugins.

### 11b) Taille des fichiers bootstrap

Doctor vérifie si les fichiers bootstrap de l’espace de travail (par exemple `AGENTS.md`,
`CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-delà du
budget de caractères configuré. Il indique, par fichier, le nombre brut de caractères par rapport au nombre injecté, le pourcentage de
troncature, la cause de la troncature (`max/file` ou `max/total`), et le total des caractères injectés
comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches
de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars`
et `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Complétion du shell

Doctor vérifie si la complétion par tabulation est installée pour le shell actuel
(zsh, bash, fish ou PowerShell) :

- Si le profil de shell utilise un modèle de complétion dynamique lent
  (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide
  à fichier en cache.
- Si la complétion est configurée dans le profil mais que le fichier de cache est absent,
  doctor régénère automatiquement le cache.
- Si aucune complétion n’est configurée, doctor propose de l’installer
  (mode interactif uniquement ; ignoré avec `--non-interactive`).

Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

### 12) Vérifications d’authentification Gateway (jeton local)

Doctor vérifie l’état de préparation de l’authentification par jeton de la gateway locale.

- Si le mode jeton a besoin d’un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
- Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l’écrase pas avec du texte en clair.
- `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

### 12b) Réparations en lecture seule prenant en compte SecretRef

Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement fail-fast à l’exécution.

- `openclaw doctor --fix` utilise désormais le même modèle de résumé SecretRef en lecture seule que les commandes de la famille status pour les réparations ciblées de configuration.
- Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` avec `@username` essaie d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
- Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou d’indiquer à tort que le jeton est absent.

### 13) Vérification d’intégrité Gateway + redémarrage

Doctor exécute une vérification d’intégrité et propose de redémarrer la gateway lorsqu’elle semble
en mauvaise santé.

### 13b) État de préparation de la recherche mémoire

Doctor vérifie si le fournisseur d’embeddings configuré pour la recherche mémoire est prêt
pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

- **Backend QMD** : sonde si le binaire `qmd` est disponible et peut démarrer.
  Sinon, affiche des indications de correction, y compris le package npm et une option de chemin binaire manuel.
- **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une
  URL de modèle distant/téléchargeable reconnue. S’il manque, suggère de passer à un fournisseur distant.
- **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est
  présente dans l’environnement ou dans le stockage d’authentification. Affiche des conseils de correction exploitables si elle manque.
- **Fournisseur auto** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant
  dans l’ordre de sélection automatique.

Lorsqu’un résultat de sonde gateway est disponible (la gateway était saine au moment de la
vérification), doctor croise son résultat avec la configuration visible depuis la CLI et signale
toute divergence.

Utilisez `openclaw memory status --deep` pour vérifier l’état de préparation des embeddings à l’exécution.

### 14) Avertissements d’état des canaux

Si la gateway est saine, doctor exécute une sonde d’état des canaux et signale
les avertissements avec les correctifs suggérés.

### 15) Audit + réparation de la configuration du superviseur

Doctor vérifie la configuration du superviseur installé (launchd/systemd/schtasks) pour
détecter les valeurs par défaut manquantes ou obsolètes (par ex. dépendances systemd sur network-online et
délai de redémarrage). Lorsqu’il trouve une incohérence, il recommande une mise à jour et peut
réécrire le fichier de service/la tâche vers les valeurs par défaut actuelles.

Remarques :

- `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
- `openclaw doctor --yes` accepte les invites de réparation par défaut.
- `openclaw doctor --repair` applique les correctifs recommandés sans invites.
- `openclaw doctor --repair --force` écrase les configurations personnalisées du superviseur.
- Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/réparation du service par doctor valide le SecretRef mais ne conserve pas les valeurs de jeton résolues en texte clair dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des indications exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/réparation jusqu’à ce que le mode soit défini explicitement.
- Pour les unités Linux user-systemd, les vérifications de dérive de jeton par doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
- Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

### 16) Diagnostics du runtime Gateway + du port

Doctor inspecte le runtime du service (PID, dernier statut de sortie) et avertit lorsque le
service est installé mais n’est pas réellement en cours d’exécution. Il vérifie aussi les collisions
de port sur le port de la gateway (par défaut `18789`) et signale les causes probables (gateway déjà
en cours d’exécution, tunnel SSH).

### 17) Bonnes pratiques du runtime Gateway

Doctor avertit lorsque le service gateway s’exécute sur Bun ou sur un chemin Node géré par un gestionnaire de versions
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node,
et les chemins de gestionnaire de versions peuvent casser après des mises à niveau parce que le service ne
charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation système de Node
lorsqu’elle est disponible (Homebrew/apt/choco).

### 18) Écriture de configuration + métadonnées de l’assistant

Doctor conserve toutes les modifications de configuration et marque les métadonnées de l’assistant pour enregistrer
l’exécution de doctor.

### 19) Conseils pour l’espace de travail (sauvegarde + système de mémoire)

Doctor suggère un système de mémoire d’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde
si l’espace de travail n’est pas déjà sous git.

Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la
structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).

## Voir aussi

- [Dépannage de la gateway](/fr/gateway/troubleshooting)
- [Guide opérationnel de la gateway](/fr/gateway)
