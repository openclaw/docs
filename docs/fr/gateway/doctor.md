---
read_when:
    - Ajouter ou modifier des migrations de diagnostic
    - Introduction de changements de configuration incompatibles
sidebarTitle: Doctor
summary: 'Commande doctor : contrôles d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-04-30T07:26:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation + migration d’OpenClaw. Il corrige les configurations/états obsolètes, vérifie la santé et fournit des étapes de réparation actionnables.

## Démarrage rapide

```bash
openclaw doctor
```

### Modes sans interface et d’automatisation

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accepte les valeurs par défaut sans invite (y compris les étapes de réparation liées au redémarrage, au service ou au bac à sable, le cas échéant).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applique les réparations recommandées sans invite (réparations + redémarrages lorsque c’est sûr).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Applique aussi les réparations agressives (écrase les configurations de superviseur personnalisées).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    S’exécute sans invite et applique uniquement les migrations sûres (normalisation de la configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/bac à sable qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système à la recherche d’installations Gateway supplémentaires (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si vous voulez examiner les changements avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

<AccordionGroup>
  <Accordion title="Santé, UI et mises à jour">
    - Mise à jour préalable facultative pour les installations git (interactive uniquement).
    - Vérification de fraîcheur du protocole UI (reconstruit Control UI lorsque le schéma de protocole est plus récent).
    - Vérification de santé + invite de redémarrage.
    - Résumé de l’état des Skills (éligibles/manquantes/bloquées) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de la configuration pour les valeurs héritées.
    - Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les configurations héritées de l’extension Chrome et la préparation de Chrome MCP.
    - Avertissements sur les remplacements du fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements de masquage OAuth Codex (`models.providers.openai-codex`).
    - Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
    - Migration de l’état hérité sur disque (sessions/répertoire d’agent/auth WhatsApp).
    - Migration des clés de contrat du manifeste de plugin hérité (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration du magasin Cron hérité (`jobId`, `schedule.cron`, champs delivery/payload de premier niveau, `provider` de payload, tâches webhook de repli simples `notify: true`).
    - Migration de la politique d’exécution d’agent héritée vers `agents.defaults.agentRuntime` et `agents.list[].agentRuntime`.
    - Nettoyage des configurations de plugin obsolètes lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugin obsolètes sont traitées comme une configuration de confinement inerte et sont conservées.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches de réécriture d’invite dupliquées créées par les builds 2026.4.24 affectés.
    - Vérifications d’intégrité et d’autorisations de l’état (sessions, transcriptions, répertoire d’état).
    - Vérifications des autorisations du fichier de configuration (chmod 600) lors de l’exécution locale.
    - Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les tokens arrivant à expiration et signale les états de refroidissement/désactivation des profils d’authentification.
    - Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image de bac à sable lorsque le sandboxing est activé.
    - Migration des services hérités et détection de Gateway supplémentaires.
    - Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution du Gateway (service installé mais non démarré ; libellé launchd mis en cache).
    - Avertissements d’état des canaux (sondés depuis le Gateway en cours d’exécution).
    - Audit de la configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement proxy intégré pour les services Gateway ayant capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` lors de l’installation ou de la mise à jour.
    - Vérifications des bonnes pratiques d’exécution du Gateway (Node vs Bun, chemins de gestionnaires de version).
    - Diagnostics de collision de port Gateway (`18789` par défaut).

  </Accordion>
  <Accordion title="Authentification, sécurité et appairage">
    - Avertissements de sécurité pour les politiques de DM ouvertes.
    - Vérifications d’authentification du Gateway pour le mode token local (propose la génération d’un token lorsqu’aucune source de token n’existe ; n’écrase pas les configurations SecretRef de token).
    - Détection des problèmes d’appairage d’appareils (requêtes de premier appairage en attente, mises à niveau rôle/périmètre en attente, dérive obsolète du cache local de token d’appareil et dérive d’authentification des enregistrements appairés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Vérification systemd linger sous Linux.
    - Vérification de la taille des fichiers d’amorçage de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Vérification de l’état de la complétion shell et installation/mise à niveau automatique.
    - Vérification de préparation du fournisseur d’embeddings de recherche mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Vérifications d’installation depuis les sources (incompatibilité d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Rattrapage et réinitialisation de l’UI Dreams

La scène Dreams de Control UI inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le flux de travail de dreaming ancré. Ces actions utilisent des méthodes RPC de style Gateway doctor, mais elles ne font **pas** partie de la réparation/migration CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM ancrée et écrit des entrées de rattrapage réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de rattrapage marquées depuis `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées à court terme staged ancrées uniquement qui proviennent de la relecture historique et n’ont pas encore accumulé de rappel en direct ni de support quotidien.

Ce qu’elles ne font **pas** par elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne placent pas automatiquement les candidats ancrés dans le magasin de promotion à court terme en direct, sauf si vous exécutez d’abord explicitement le chemin CLI staged

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela place les candidats durables ancrés dans le magasin de dreaming à court terme tout en conservant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute de manière interactive, il propose une mise à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de la configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement propre au canal), doctor les normalise dans le schéma actuel.

    Cela inclut les anciens champs plats Talk. La configuration Talk publique actuelle est `talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la carte des fournisseurs.

  </Accordion>
  <Accordion title="2. Migrations de clés de configuration héritées">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous demandent d’exécuter `openclaw doctor`.

    Doctor va :

    - Expliquer quelles clés héritées ont été trouvées.
    - Afficher la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    Le Gateway exécute aussi automatiquement les migrations doctor au démarrage lorsqu’il détecte un format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle. Les migrations du magasin de tâches Cron sont gérées par `openclaw doctor --fix`.

    Migrations actuelles :

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de premier niveau
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - ancien `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Pour les canaux avec des `accounts` nommés mais des valeurs de canal de premier niveau à compte unique restantes, déplace ces valeurs à portée de compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimer `agents.defaults.llm` ; utilisez `models.providers.<id>.timeoutSeconds` pour les délais d’expiration des fournisseurs/modèles lents
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimer `browser.relayBindHost` (paramètre hérité du relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du Gateway ignore aussi les fournisseurs dont `api` est défini sur une valeur d’énumération future ou inconnue au lieu d’échouer en mode fermé)

    Les avertissements doctor incluent aussi des conseils sur le compte par défaut pour les canaux multi-comptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de repli peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, doctor avertit et liste les ID de compte configurés.

  </Accordion>
  <Accordion title="2b. Remplacements de fournisseurs OpenCode">
    Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`. Cela peut forcer les modèles à utiliser la mauvaise API ou remettre les coûts à zéro. Le diagnostic avertit afin que vous puissiez supprimer le remplacement et restaurer le routage d’API par modèle ainsi que les coûts.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation de Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin supprimé de l’extension Chrome, le diagnostic la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Le diagnostic audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version détectée de Chrome et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage distant dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Le diagnostic ne peut pas activer le réglage côté Chrome pour vous. Chrome MCP local à l’hôte nécessite toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte Gateway/Node
    - le navigateur exécuté localement
    - le débogage distant activé dans ce navigateur
    - l’approbation de la première invite de consentement d’attachement dans le navigateur

    La préparation ici concerne uniquement les prérequis d’attachement local. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF, l’interception de téléchargement et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, au sandbox, au navigateur distant ni aux autres flux headless. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS OAuth">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, le diagnostic sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS Node/OpenSSL locale peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, un certificat expiré ou un certificat auto-signé), le diagnostic affiche des conseils de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le Gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements de fournisseur OAuth Codex">
    Si vous aviez auparavant ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin du fournisseur OAuth Codex intégré que les versions plus récentes utilisent automatiquement. Le diagnostic avertit lorsqu’il voit ces anciens paramètres de transport avec OAuth Codex afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le comportement intégré de routage/repli. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Avertissements de route du Plugin Codex">
    Lorsque le Plugin Codex fourni est activé, le diagnostic vérifie aussi si les références de modèle principales `openai-codex/*` se résolvent encore via l’exécuteur PI par défaut. Cette combinaison est valide lorsque vous voulez l’authentification OAuth/abonnement Codex via PI, mais elle peut facilement être confondue avec le harnais natif de serveur d’application Codex. Le diagnostic avertit et indique la forme explicite de serveur d’application : `openai/*` plus `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    Le diagnostic ne répare pas cela automatiquement, car les deux routes sont valides :

    - `openai-codex/*` + PI signifie « utiliser l’authentification OAuth/abonnement Codex via l’exécuteur OpenClaw normal ».
    - `openai/*` + `runtime: "codex"` signifie « exécuter le tour intégré via le serveur d’application Codex natif ».
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

    Si l’avertissement apparaît, choisissez la route que vous aviez prévue et modifiez la configuration manuellement. Conservez l’avertissement tel quel lorsque OAuth Codex via PI est intentionnel.

  </Accordion>
  <Accordion title="3. Migrations d’état héritées (structure du disque)">
    Le diagnostic peut migrer les anciennes structures sur disque vers la structure actuelle :

    - Stockage des sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire de l’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

    Ces migrations sont faites au mieux et sont idempotentes ; doctor émettra des avertissements lorsqu’il laisse d’anciens dossiers en place comme sauvegardes. Le Gateway/CLI migre aussi automatiquement l’ancien répertoire des sessions + de l’agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp est volontairement migrée uniquement via `openclaw doctor`. La normalisation du fournisseur talk/de la carte des fournisseurs compare désormais par égalité structurelle, donc les différences limitées à l’ordre des clés ne déclenchent plus de changements `doctor --fix` sans effet répétés.

  </Accordion>
  <Accordion title="3a. Migrations des anciens manifestes de Plugin">
    Doctor analyse tous les manifestes de Plugin installés à la recherche de clés de capacité de premier niveau obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si la clé `contracts` possède déjà les mêmes valeurs, l’ancienne clé est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations de l’ancien stockage Cron">
    Doctor vérifie aussi le stockage des tâches Cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) pour repérer les anciennes formes de tâches que le planificateur accepte encore pour compatibilité.

    Les nettoyages Cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de charge utile de premier niveau (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de premier niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` de la charge utile → `delivery.channel` explicite
    - anciennes tâches simples de repli Webhook `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans changer le comportement. Si une tâche combine un ancien repli de notification avec un mode de livraison non Webhook existant, doctor avertit et laisse cette tâche pour examen manuel.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrou d’écriture obsolètes — des fichiers laissés après une fermeture anormale d’une session. Pour chaque fichier de verrou trouvé, il indique : le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort ou plus de 30 minutes). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrou obsolètes ; sinon, il affiche une note et vous demande de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation des branches de transcription de session">
    Doctor analyse les fichiers JSONL de session d’agent à la recherche de la forme de branche dupliquée créée par le bug de réécriture des transcriptions de prompt du 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne d’OpenClaw plus un frère actif contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier affecté à côté de l’original et réécrit la transcription vers la branche active afin que l’historique du Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Vérifications d’intégrité de l’état (persistance des sessions, routage et sécurité)">
    Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Permissions du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les permissions (et émet une indication `chown` lorsqu’une incompatibilité de propriétaire/groupe est détectée).
    - **Répertoire d’état synchronisé avec le cloud sur macOS** : avertit lorsque l’état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins adossés à la synchronisation peuvent provoquer des E/S plus lentes et des courses de verrouillage/synchronisation.
    - **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires adossées à SD ou eMMC peuvent être plus lentes et s’user plus vite avec les écritures de sessions et d’identifiants.
    - **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont requis pour persister l’historique et éviter les plantages `ENOENT`.
    - **Incompatibilité de transcription** : avertit lorsque des entrées de session récentes ont des fichiers de transcription manquants.
    - **Session principale “JSONL sur 1 ligne”** : signale lorsque la transcription principale n’a qu’une seule ligne (l’historique ne s’accumule pas).
    - **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se répartir entre les installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe/tout le monde et propose de le resserrer à `600`.

  </Accordion>
  <Accordion title="5. Santé de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le stockage d’authentification, avertit lorsque les jetons expirent bientôt/sont expirés et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin de jeton de configuration Anthropic. Les prompts d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant` ou un fournisseur qui vous demande de vous reconnecter), doctor indique qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale aussi les profils d’authentification temporairement inutilisables en raison de :

    - courts délais de récupération (limites de débit/expirations de délai/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au catalogue et à la liste d’autorisation, et avertit lorsqu’elle ne se résout pas ou est refusée.
  </Accordion>
  <Accordion title="7. Réparation de l’image de sandbox">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou de basculer vers les anciens noms si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Dépendances d’exécution des Plugin groupés">
    Doctor vérifie les dépendances d’exécution uniquement pour les Plugin groupés qui sont actifs dans la configuration actuelle ou activés par défaut par leur manifeste groupé, par exemple `plugins.entries.discord.enabled: true`, l’ancien `channels.discord.enabled: true`, les références `models.providers.*` / de modèle d’agent configurées, ou un Plugin groupé activé par défaut sans propriété de fournisseur. S’il en manque, doctor signale les packages et les installe en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Les Plugin externes utilisent toujours `openclaw plugins install` / `openclaw plugins update` ; doctor n’installe pas les dépendances pour des chemins de Plugin arbitraires.

    Pendant la réparation par doctor, les installations npm des dépendances d’exécution groupées signalent la progression avec un spinner dans les sessions TTY et avec des lignes de progression périodiques dans la sortie redirigée/sans interface. Le Gateway et la CLI locale peuvent aussi réparer à la demande les dépendances d’exécution des plugins groupés actifs avant d’importer un plugin groupé. Ces installations sont limitées à la racine d’installation d’exécution du plugin, s’exécutent avec les scripts désactivés, n’écrivent pas de verrou de paquet et sont protégées par un verrou de racine d’installation afin que des démarrages concurrents de la CLI ou du Gateway ne modifient pas la même arborescence `node_modules` en même temps.

  </Accordion>
  <Accordion title="8. Migrations des services Gateway et conseils de nettoyage">
    Doctor détecte les anciens services de gateway (launchd/systemd/schtasks) et propose de les supprimer, puis d’installer le service OpenClaw avec le port Gateway actuel. Il peut aussi rechercher d’autres services similaires au gateway et afficher des conseils de nettoyage. Les services de gateway OpenClaw nommés par profil sont considérés comme des services de premier ordre et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service Gateway de niveau utilisateur est absent mais qu’un service Gateway OpenClaw de niveau système existe, doctor n’installe pas automatiquement un second service de niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système gère le cycle de vie du gateway.

  </Accordion>
  <Accordion title="8b. Migration Startup Matrix">
    Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou actionnable, doctor (en mode `--fix` / `--repair`) crée un instantané avant migration, puis exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation de l’état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage des appareils et dérive d’authentification">
    Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage de santé normal.

    Ce qu’il signale :

    - les demandes d’appairage initial en attente
    - les mises à niveau de rôle en attente pour les appareils déjà appairés
    - les mises à niveau de portée en attente pour les appareils déjà appairés
    - les réparations de discordance de clé publique où l’id de l’appareil correspond toujours, mais où l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - les enregistrements appairés sans jeton actif pour un rôle approuvé
    - les jetons appairés dont les portées dérivent hors de la base de référence d’appairage approuvée
    - les entrées locales mises en cache de jeton d’appareil pour la machine actuelle qui sont antérieures à une rotation de jeton côté gateway ou qui portent des métadonnées de portée obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage et ne renouvelle pas automatiquement les jetons d’appareil. Il affiche plutôt les étapes suivantes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - renouveler un jeton frais avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela ferme la faille courante « déjà appairé, mais appairage toujours requis » : doctor distingue désormais l’appairage initial des mises à niveau de rôle/portée en attente et de la dérive de jeton ou d’identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux messages privés sans allowlist, ou lorsqu’une politique est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    S’il s’exécute comme service utilisateur systemd, doctor s’assure que linger est activé afin que le gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (skills, plugins et anciens répertoires)">
    Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les Skills éligibles, aux prérequis manquants et bloquées par allowlist.
    - **Anciens répertoires d’espace de travail** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail existent à côté de l’espace de travail actuel.
    - **État des Plugins** : compte les plugins activés/désactivés/en erreur ; liste les ID de plugin pour toute erreur ; signale les capacités des plugins groupés.
    - **Avertissements de compatibilité des Plugins** : signale les plugins qui ont des problèmes de compatibilité avec l’exécution actuelle.
    - **Diagnostics des Plugins** : expose tout avertissement ou toute erreur au chargement émis par le registre de plugins.

  </Accordion>
  <Accordion title="11b. Taille du fichier de bootstrap">
    Doctor vérifie si les fichiers de bootstrap de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-delà du budget de caractères configuré. Il signale, pour chaque fichier, les nombres de caractères bruts par rapport aux caractères injectés, le pourcentage de troncature, la cause de troncature (`max/file` ou `max/total`) et le total de caractères injectés comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un plugin de canal manquant, il supprime aussi la configuration pendante à portée de canal qui référençait ce plugin : entrées `channels.<id>`, cibles heartbeat qui nommaient le canal et remplacements `agents.*.models["<channel>/*"]`. Cela évite les boucles de démarrage du Gateway où l’exécution du canal a disparu, mais où la configuration demande toujours au gateway de s’y lier.
  </Accordion>
  <Accordion title="11c. Complétion du shell">
    Doctor vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil du shell utilise un modèle de complétion dynamique lent (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide avec fichier mis en cache.
    - Si la complétion est configurée dans le profil mais que le fichier de cache est manquant, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

  </Accordion>
  <Accordion title="12. Vérifications d’authentification Gateway (jeton local)">
    Doctor vérifie la préparation de l’authentification par jeton du gateway local.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne le remplace pas par du texte brut.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule compatibles SecretRef">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide à l’exécution.

    - `openclaw doctor --fix` utilise désormais le même modèle de résumé SecretRef en lecture seule que les commandes de la famille status pour les réparations de configuration ciblées.
    - Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` `@username` tente d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor indique que l’identifiant est configuré mais indisponible et ignore l’auto-résolution au lieu de planter ou de signaler à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification de santé du Gateway + redémarrage">
    Doctor exécute une vérification de santé et propose de redémarrer le gateway lorsqu’il semble non sain.
  </Accordion>
  <Accordion title="13b. Préparation de la recherche mémoire">
    Doctor vérifie si le fournisseur d’embeddings de recherche mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : sonde si le binaire `qmd` est disponible et peut être démarré. Sinon, affiche des conseils de correction incluant le paquet npm et une option de chemin manuel vers le binaire.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distante/téléchargeable reconnue. S’il manque, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé d’API est présente dans l’environnement ou dans le magasin d’authentification. Affiche des conseils de correction actionnables si elle manque.
    - **Fournisseur auto** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde Gateway mis en cache est disponible (le gateway était sain au moment de la vérification), doctor recoupe son résultat avec la configuration visible par la CLI et signale toute divergence. Doctor ne lance pas de nouveau ping d’embedding dans le chemin par défaut ; utilisez la commande d’état mémoire approfondi lorsque vous voulez une vérification de fournisseur en direct.

    Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le gateway est sain, doctor exécute une sonde d’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Doctor vérifie la configuration du superviseur installée (launchd/systemd/schtasks) afin de détecter des valeurs par défaut manquantes ou obsolètes (par exemple les dépendances systemd network-online et le délai de redémarrage). Lorsqu’il trouve une discordance, il recommande une mise à jour et peut réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

    Notes :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` maintient doctor en lecture seule pour le cycle de vie du service Gateway. Il signale toujours la santé du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/le bootstrap du service, les réécritures de configuration du superviseur et le nettoyage des anciens services, car un superviseur externe gère ce cycle de vie.
    - Sous Linux, doctor ne réécrit pas les métadonnées de commande/point d’entrée tant que l’unité systemd Gateway correspondante est active. Il ignore également les unités supplémentaires inactives non héritées de type gateway lors de la recherche de services en double, afin que les fichiers de services compagnons ne génèrent pas de bruit de nettoyage.
    - Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service par doctor valide le SecretRef, mais ne persiste pas les valeurs de jeton en texte brut résolues dans les métadonnées d’environnement du service superviseur.
    - Doctor détecte les valeurs d’environnement de service gérées par `.env`/adossées à SecretRef que les anciens LaunchAgent, systemd ou Windows Scheduled Task intégraient en ligne, et réécrit les métadonnées du service afin que ces valeurs se chargent depuis la source d’exécution plutôt que depuis la définition du superviseur.
    - Doctor détecte lorsque la commande du service épingle encore un ancien `--port` après des changements de `gateway.port` et réécrit les métadonnées du service vers le port actuel.
    - Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des conseils actionnables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités utilisateur-systemd Linux, les vérifications de dérive de jeton de doctor incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service de doctor refusent de réécrire, d’arrêter ou de redémarrer un service Gateway issu d’un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Exécution du Gateway + diagnostics de port">
    Le diagnostic inspecte l’exécution du service (PID, dernier statut de sortie) et avertit lorsque le service est installé mais ne fonctionne pas réellement. Il vérifie aussi les collisions de ports sur le port du Gateway (par défaut `18789`) et signale les causes probables (Gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Le diagnostic avertit lorsque le service Gateway s’exécute sur Bun ou sur un chemin Node géré par un gestionnaire de versions (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node, et les chemins de gestionnaire de versions peuvent casser après des mises à niveau, car le service ne charge pas l’initialisation de votre shell. Le diagnostic propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).

    Les services nouvellement installés ou réparés conservent les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires user-bin stables, mais les répertoires de secours de gestionnaire de versions déduits ne sont écrits dans le PATH du service que lorsqu’ils existent sur le disque. Cela maintient le PATH du superviseur généré aligné avec le même audit de PATH minimal que le diagnostic exécute plus tard.

  </Accordion>
  <Accordion title="18. Écriture de configuration + métadonnées de l’assistant">
    Le diagnostic persiste toutes les modifications de configuration et ajoute des métadonnées d’assistant pour enregistrer l’exécution du diagnostic.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système de mémoire)">
    Le diagnostic suggère un système de mémoire d’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la structure d’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Connexe

- [Runbook du Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
