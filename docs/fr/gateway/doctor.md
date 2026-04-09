---
read_when:
    - Ajouter ou modifier des migrations doctor
    - Introduire des changements de configuration incompatibles
summary: 'Commande Doctor : vérifications d’état, migrations de configuration et étapes de réparation'
title: Doctor
x-i18n:
    generated_at: "2026-04-09T01:29:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75d321bd1ad0e16c29f2382e249c51edfc3a8d33b55bdceea39e7dbcd4901fce
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` est l’outil de réparation + migration pour OpenClaw. Il corrige les
configurations/états obsolètes, vérifie l’état du système et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Sans interface / automatisation

```bash
openclaw doctor --yes
```

Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation de redémarrage/service/sandbox lorsque c’est applicable).

```bash
openclaw doctor --repair
```

Applique les réparations recommandées sans demander de confirmation (réparations + redémarrages lorsque cela est sûr).

```bash
openclaw doctor --repair --force
```

Applique aussi les réparations agressives (écrase les configurations de superviseur personnalisées).

```bash
openclaw doctor --non-interactive
```

S’exécute sans invites et applique uniquement les migrations sûres (normalisation de la configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine.
Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

```bash
openclaw doctor --deep
```

Analyse les services système pour détecter des installations Gateway supplémentaires (launchd/systemd/schtasks).

Si vous voulez examiner les modifications avant l’écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce que fait la commande (résumé)

- Mise à jour préalable facultative pour les installations git (interactif uniquement).
- Vérification de fraîcheur du protocole UI (reconstruit la Control UI lorsque le schéma de protocole est plus récent).
- Vérification d’état + invite de redémarrage.
- Résumé de l’état des Skills (éligibles/manquants/bloqués) et état des plugins.
- Normalisation de la configuration pour les valeurs héritées.
- Migration de la configuration Talk depuis les champs plats hérités `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
- Vérifications de migration du navigateur pour les anciennes configurations d’extension Chrome et de préparation Chrome MCP.
- Avertissements sur les remplacements de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avertissements de masquage OAuth Codex (`models.providers.openai-codex`).
- Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
- Migration d’état héritée sur disque (sessions/répertoire d’agent/authentification WhatsApp).
- Migration des anciennes clés de contrat de manifeste de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration de l’ancien magasin cron (`jobId`, `schedule.cron`, champs delivery/payload de niveau supérieur, `provider` dans payload, tâches de secours webhook simples `notify: true`).
- Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
- Vérifications d’intégrité et de permissions de l’état (sessions, transcriptions, répertoire d’état).
- Vérifications des permissions du fichier de configuration (`chmod 600`) lors d’une exécution en local.
- État de l’authentification des modèles : vérifie l’expiration OAuth, peut rafraîchir les jetons proches de l’expiration et signale les états de délai d’attente/désactivation des profils d’authentification.
- Détection de répertoires d’espace de travail supplémentaires (`~/openclaw`).
- Réparation de l’image sandbox lorsque le sandboxing est activé.
- Migration des anciens services et détection de passerelles supplémentaires.
- Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
- Vérifications d’exécution Gateway (service installé mais non démarré ; libellé launchd mis en cache).
- Avertissements sur l’état des canaux (testés depuis la passerelle en cours d’exécution).
- Audit de la configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
- Vérifications de bonnes pratiques d’exécution Gateway (Node vs Bun, chemins de gestionnaires de versions).
- Diagnostic de collision de port Gateway (par défaut `18789`).
- Avertissements de sécurité pour les politiques DM ouvertes.
- Vérifications d’authentification Gateway pour le mode jeton local (propose la génération d’un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations `SecretRef` de jeton).
- Vérification de persistance systemd sur Linux.
- Vérification de la taille des fichiers bootstrap de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
- Vérification de l’état des complétions shell et installation/mise à niveau automatiques.
- Vérification de préparation du fournisseur d’embeddings pour la recherche mémoire (modèle local, clé API distante ou binaire QMD).
- Vérifications d’installation source (incohérence d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
- Écrit la configuration mise à jour + les métadonnées de l’assistant.

## Dreams UI : backfill et réinitialisation

La scène Dreams de la Control UI inclut des actions **Backfill**, **Reset** et **Clear Grounded**
pour le flux de travail de grounded dreaming. Ces actions utilisent des
méthodes RPC de style doctor de la passerelle, mais elles ne font **pas** partie de la réparation/migration CLI
de `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail
  actif, exécute le passage de journal REM grounded et écrit des entrées de backfill réversibles
  dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de backfill marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées à court terme staged, grounded-only,
  issues de la relecture historique et qui n’ont pas encore accumulé de rappel en direct ni
  de support quotidien.

Ce qu’elles ne font **pas** à elles seules :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne placent pas automatiquement les candidats grounded dans le magasin de promotion
  actif à court terme sauf si vous exécutez explicitement d’abord le chemin CLI staged

Si vous voulez que la relecture historique grounded influence la voie normale de promotion profonde,
utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela place des candidats durables grounded dans le magasin de dreaming à court terme tout en
conservant `DREAMS.md` comme surface de révision.

## Comportement détaillé et justification

### 0) Mise à jour facultative (installations git)

S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose de
mettre à jour (fetch/rebase/build) avant d’exécuter doctor.

### 1) Normalisation de la configuration

Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction`
sans remplacement spécifique à un canal), doctor les normalise selon le schéma
actuel.

Cela inclut les champs plats Talk hérités. La configuration Talk publique actuelle est
`talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` dans la map des fournisseurs.

### 2) Migrations des clés de configuration héritées

Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et demandent
d’exécuter `openclaw doctor`.

Doctor va :

- Expliquer quelles clés héritées ont été trouvées.
- Afficher la migration qu’il a appliquée.
- Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

La Gateway exécute aussi automatiquement les migrations doctor au démarrage lorsqu’elle détecte un
format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle.
Les migrations du magasin de tâches cron sont gérées par `openclaw doctor --fix`.

Migrations actuelles :

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` au niveau supérieur
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- ancien `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Pour les canaux avec des `accounts` nommés mais avec encore des valeurs de canal de niveau supérieur à compte unique, déplacer ces valeurs liées au compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut existante correspondante)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)

Les avertissements doctor incluent aussi des recommandations sur les comptes par défaut pour les canaux multi-comptes :

- Si deux entrées ou plus sont configurées dans `channels.<channel>.accounts` sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu.
- Si `channels.<channel>.defaultAccount` est défini sur un identifiant de compte inconnu, doctor avertit et liste les identifiants de compte configurés.

### 2b) Remplacements de fournisseur OpenCode

Si vous avez ajouté `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manuellement, cela remplace le catalogue OpenCode intégré issu de `@mariozechner/pi-ai`.
Cela peut forcer des modèles vers la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous
puissiez supprimer ce remplacement et restaurer le routage API + les coûts par modèle.

### 2c) Migration du navigateur et préparation Chrome MCP

Si la configuration de votre navigateur pointe encore vers le chemin supprimé de l’extension Chrome, doctor
la normalise vers le modèle d’attachement Chrome MCP local à l’hôte actuel :

- `browser.profiles.*.driver: "extension"` devient `"existing-session"`
- `browser.relayBindHost` est supprimé

Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile:
"user"` ou un profil `existing-session` configuré :

- vérifie si Google Chrome est installé sur le même hôte pour les profils
  d’auto-connexion par défaut
- vérifie la version Chrome détectée et avertit lorsqu’elle est inférieure à Chrome 144
- rappelle d’activer le débogage distant dans la page inspect du navigateur (par
  exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

Doctor ne peut pas activer ce paramètre côté Chrome à votre place. Le Chrome MCP local à l’hôte
requiert toujours :

- un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
- l’exécution locale du navigateur
- le débogage distant activé dans ce navigateur
- l’approbation de la première invite de consentement d’attachement dans le navigateur

La préparation ici concerne uniquement les prérequis d’attachement local. Existing-session conserve
les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF,
l’interception des téléchargements et les actions par lots requièrent toujours un
navigateur géré ou un profil CDP brut.

Cette vérification ne s’applique **pas** à Docker, sandbox, remote-browser ni aux autres
flux headless. Ceux-ci continuent d’utiliser CDP brut.

### 2d) Prérequis TLS OAuth

Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d’autorisation OpenAI
pour vérifier que la pile TLS locale Node/OpenSSL peut
valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par
exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat autosigné),
doctor affiche des indications de correction spécifiques à la plateforme. Sur macOS avec un Node Homebrew, la
correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute
même si la passerelle est saine.

### 2c) Remplacements de fournisseur OAuth Codex

Si vous avez précédemment ajouté d’anciens paramètres de transport OpenAI sous
`models.providers.openai-codex`, ils peuvent masquer le chemin de fournisseur
OAuth Codex intégré que les versions récentes utilisent automatiquement. Doctor avertit lorsqu’il voit
ces anciens paramètres de transport en même temps que Codex OAuth afin que vous puissiez supprimer ou réécrire
le remplacement de transport obsolète et retrouver le comportement intégré de routage/secours.
Les proxies personnalisés et les remplacements uniquement par en-têtes restent pris en charge et ne
déclenchent pas cet avertissement.

### 3) Migrations d’état héritées (organisation sur disque)

Doctor peut migrer d’anciennes organisations sur disque vers la structure actuelle :

- Magasin de sessions + transcriptions :
  - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
- Répertoire d’agent :
  - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
- État d’authentification WhatsApp (Baileys) :
  - depuis les anciens `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
  - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

Ces migrations sont réalisées au mieux et sont idempotentes ; doctor émet des avertissements lorsqu’il
laisse des dossiers hérités en place comme sauvegardes. La Gateway/CLI migre aussi automatiquement
au démarrage les anciennes sessions + le répertoire d’agent afin que l’historique/l’authentification/les modèles aboutissent dans le chemin
par agent sans exécution manuelle de doctor. L’authentification WhatsApp est volontairement migrée uniquement
via `openclaw doctor`. La normalisation du fournisseur Talk/de la map de fournisseurs compare désormais
par égalité structurelle ; ainsi, les différences d’ordre des clés ne déclenchent plus de
modifications répétées et sans effet avec `doctor --fix`.

### 3a) Migrations héritées de manifeste de plugin

Doctor analyse tous les manifestes de plugins installés pour détecter les clés de capacité de niveau supérieur
obsolètes (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Lorsqu’elles sont trouvées, il propose de les déplacer dans l’objet `contracts`
et de réécrire le fichier manifeste en place. Cette migration est idempotente ;
si la clé `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée
sans dupliquer les données.

### 3b) Migrations héritées du magasin cron

Doctor vérifie aussi le magasin de tâches cron (`~/.openclaw/cron/jobs.json` par défaut,
ou `cron.store` en cas de remplacement) pour détecter d’anciennes formes de tâches que l’ordonnanceur accepte encore
pour compatibilité.

Nettoyages cron actuels :

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- champs payload de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
- champs delivery de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de delivery `provider` dans payload → `delivery.channel` explicite
- tâches de secours webhook héritées simples `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans
modifier le comportement. Si une tâche combine le secours notify hérité avec un mode de
delivery existant non-webhook, doctor avertit et laisse cette tâche pour révision manuelle.

### 3c) Nettoyage des verrous de session

Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés
derrière lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale :
le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est
considéré comme obsolète (PID mort ou plus ancien que 30 minutes). En mode `--fix` / `--repair`,
il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon, il affiche une note et
vous demande de relancer avec `--fix`.

### 4) Vérifications d’intégrité de l’état (persistance des sessions, routage et sécurité)

Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez
les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

Doctor vérifie :

- **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer
  le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
- **Permissions du répertoire d’état** : vérifie l’inscriptibilité ; propose de réparer les permissions
  (et affiche une indication `chown` lorsqu’une incohérence propriétaire/groupe est détectée).
- **Répertoire d’état macOS synchronisé par le cloud** : avertit lorsque l’état se résout sous iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` car les chemins adossés à la synchronisation peuvent causer des E/S plus lentes
  et des courses de verrouillage/synchronisation.
- **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`,
  car les E/S aléatoires adossées à une carte SD ou à eMMC peuvent être plus lentes et s’user
  plus vite sous les écritures de session et d’identifiants.
- **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont
  requis pour persister l’historique et éviter les plantages `ENOENT`.
- **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des
  fichiers de transcription manquants.
- **Session principale “JSONL sur 1 ligne”** : signale lorsque la transcription principale n’a qu’une seule
  ligne (l’historique ne s’accumule pas).
- **Répertoires d’état multiples** : avertit lorsque plusieurs dossiers `~/.openclaw` existent entre
  des répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut
  se fragmenter entre les installations).
- **Rappel du mode distant** : si `gateway.mode=remote`, doctor rappelle de l’exécuter
  sur l’hôte distant (l’état s’y trouve).
- **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est
  lisible par le groupe ou le monde et propose de le restreindre à `600`.

### 5) État de l’authentification des modèles (expiration OAuth)

Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque les jetons sont
proches de l’expiration ou expirés, et peut les rafraîchir lorsque c’est sûr. Si le profil
OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le
chemin de setup-token Anthropic.
Les invites de rafraîchissement n’apparaissent qu’en mode interactif (TTY) ; `--non-interactive`
ignore les tentatives de rafraîchissement.

Lorsqu’un rafraîchissement OAuth échoue de manière permanente (par exemple `refresh_token_reused`,
`invalid_grant`, ou lorsqu’un fournisseur vous indique de vous reconnecter), doctor signale
qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...`
à exécuter.

Doctor signale aussi les profils d’authentification temporairement inutilisables à cause de :

- courts délais d’attente (limites de débit/timeouts/échecs d’authentification)
- désactivations plus longues (échecs de facturation/crédit)

### 6) Validation du modèle Hooks

Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au
catalogue et à la liste d’autorisation et avertit lorsqu’elle ne se résout pas ou n’est pas autorisée.

### 7) Réparation de l’image sandbox

Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou
de basculer vers d’anciens noms si l’image actuelle est absente.

### 7b) Dépendances d’exécution des plugins intégrés

Doctor vérifie que les dépendances d’exécution des plugins intégrés (par exemple les
packages d’exécution du plugin Discord) sont présentes dans la racine d’installation OpenClaw.
Si certaines sont manquantes, doctor signale les packages et les installe en
mode `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrations des services Gateway et indications de nettoyage

Doctor détecte les anciens services Gateway (launchd/systemd/schtasks) et
propose de les supprimer puis d’installer le service OpenClaw avec le port de passerelle
actuel. Il peut aussi rechercher des services supplémentaires de type passerelle et afficher des indications de nettoyage.
Les services de passerelle OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas
signalés comme « supplémentaires ».

### 8b) Migration Matrix au démarrage

Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable,
doctor (en mode `--fix` / `--repair`) crée un instantané avant migration puis
exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation héritée
de l’état chiffré. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et
le démarrage se poursuit. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification
est entièrement ignorée.

### 9) Avertissements de sécurité

Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux DM sans liste d’autorisation, ou
lorsqu’une politique est configurée de manière dangereuse.

### 10) Persistance systemd (Linux)

En cas d’exécution comme service utilisateur systemd, doctor s’assure que la persistance est activée afin que la
passerelle reste active après la déconnexion.

### 11) État de l’espace de travail (Skills, plugins et répertoires hérités)

Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

- **État des Skills** : compte les Skills éligibles, à prérequis manquants et bloqués par la liste d’autorisation.
- **Répertoires d’espace de travail hérités** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail
  existent à côté de l’espace de travail actuel.
- **État des plugins** : compte les plugins chargés/désactivés/en erreur ; liste les identifiants de plugin pour les
  erreurs ; signale les capacités des plugins bundle.
- **Avertissements de compatibilité de plugins** : signale les plugins qui ont des problèmes de compatibilité avec
  l’exécution actuelle.
- **Diagnostics des plugins** : met en avant tous les avertissements ou erreurs de chargement émis par le
  registre des plugins.

### 11b) Taille du fichier bootstrap

Doctor vérifie si les fichiers bootstrap de l’espace de travail (par exemple `AGENTS.md`,
`CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-delà du budget
de caractères configuré. Il signale, fichier par fichier, le nombre brut de caractères vs. injectés, le pourcentage
de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total des caractères injectés
en fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars`
et `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Complétion shell

Doctor vérifie si la complétion par tabulation est installée pour le shell actuel
(zsh, bash, fish ou PowerShell) :

- Si le profil shell utilise un modèle de complétion dynamique lent
  (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante
  plus rapide par fichier en cache.
- Si la complétion est configurée dans le profil mais que le fichier de cache est manquant,
  doctor régénère automatiquement le cache.
- Si aucune complétion n’est configurée, doctor propose de l’installer
  (mode interactif uniquement ; ignoré avec `--non-interactive`).

Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

### 12) Vérifications d’authentification Gateway (jeton local)

Doctor vérifie l’état de préparation de l’authentification par jeton de la passerelle locale.

- Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
- Si `gateway.auth.token` est géré par `SecretRef` mais indisponible, doctor avertit et ne l’écrase pas avec du texte brut.
- `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun `SecretRef` de jeton n’est configuré.

### 12b) Réparations en lecture seule conscientes de SecretRef

Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement fail-fast à l’exécution.

- `openclaw doctor --fix` utilise désormais le même modèle de résumé `SecretRef` en lecture seule que les commandes de la famille status pour les réparations ciblées de configuration.
- Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` avec `@username` essaie d’utiliser les identifiants du bot configurés lorsqu’ils sont disponibles.
- Si le jeton du bot Telegram est configuré via `SecretRef` mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou d’indiquer à tort que le jeton est manquant.

### 13) Vérification d’état Gateway + redémarrage

Doctor exécute une vérification d’état et propose de redémarrer la passerelle lorsqu’elle semble
défaillante.

### 13b) Préparation de la recherche mémoire

Doctor vérifie si le fournisseur d’embeddings configuré pour la recherche mémoire est prêt
pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

- **Backend QMD** : vérifie si le binaire `qmd` est disponible et peut démarrer.
  Sinon, affiche des indications de correction, y compris le package npm et une option de chemin binaire manuel.
- **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distante/téléchargeable reconnue. S’il manque, suggère de passer à un fournisseur distant.
- **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est
  présente dans l’environnement ou dans le magasin d’authentification. Affiche des indications de correction exploitables si elle manque.
- **Fournisseur automatique** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque
  fournisseur distant dans l’ordre de sélection automatique.

Lorsqu’un résultat de sonde de passerelle est disponible (la passerelle était saine au moment de la
vérification), doctor le recoupe avec la configuration visible côté CLI et note
toute divergence.

Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

### 14) Avertissements sur l’état des canaux

Si la passerelle est saine, doctor exécute une sonde d’état des canaux et signale
les avertissements avec des corrections suggérées.

### 15) Audit de configuration du superviseur + réparation

Doctor vérifie la configuration de superviseur installée (launchd/systemd/schtasks) pour détecter
les valeurs par défaut manquantes ou obsolètes (par ex. dépendances systemd network-online et
délai de redémarrage). Lorsqu’il détecte une incohérence, il recommande une mise à jour et peut
réécrire le fichier service/tâche selon les valeurs par défaut actuelles.

Remarques :

- `openclaw doctor` demande une confirmation avant de réécrire la configuration du superviseur.
- `openclaw doctor --yes` accepte les invites de réparation par défaut.
- `openclaw doctor --repair` applique les corrections recommandées sans invite.
- `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
- Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par `SecretRef`, la validation d’installation/réparation du service vérifie le `SecretRef` mais ne persiste pas les valeurs de jeton en texte brut résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton exige un jeton et que le `SecretRef` de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des indications exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/réparation jusqu’à ce que le mode soit explicitement défini.
- Pour les unités user-systemd Linux, les vérifications d’écart de jeton de doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
- Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

### 16) Diagnostics d’exécution Gateway + port

Doctor inspecte l’exécution du service (PID, dernier statut de sortie) et avertit lorsque le
service est installé mais n’est pas réellement en cours d’exécution. Il vérifie aussi les collisions de port
sur le port Gateway (par défaut `18789`) et signale les causes probables (passerelle déjà
en cours d’exécution, tunnel SSH).

### 17) Bonnes pratiques d’exécution Gateway

Doctor avertit lorsque le service Gateway s’exécute sur Bun ou sur un chemin Node géré par un gestionnaire de versions
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram requièrent Node,
et les chemins de gestionnaire de versions peuvent casser après des mises à niveau car le service ne
charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle
est disponible (Homebrew/apt/choco).

### 18) Écriture de la configuration + métadonnées de l’assistant

Doctor persiste toutes les modifications de configuration et marque les métadonnées de l’assistant pour enregistrer l’exécution
de doctor.

### 19) Conseils pour l’espace de travail (sauvegarde + système mémoire)

Doctor suggère un système de mémoire d’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde
si l’espace de travail n’est pas déjà sous git.

Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet sur la
structure de l’espace de travail et la sauvegarde git (GitHub ou GitLab privé recommandé).
