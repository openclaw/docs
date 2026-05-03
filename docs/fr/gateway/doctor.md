---
read_when:
    - Ajout ou modification des migrations de diagnostic
    - Introduire des changements de configuration incompatibles
sidebarTitle: Doctor
summary: 'Commande doctor : contrôles d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-05-03T21:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration pour OpenClaw. Il corrige les configurations et états obsolètes, vérifie la santé et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Modes headless et d’automatisation

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accepte les valeurs par défaut sans invite (y compris les étapes de réparation de redémarrage, service et sandbox lorsque applicable).

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

    S’exécute sans invites et applique uniquement les migrations sûres (normalisation de la configuration + déplacements d’état sur disque). Ignore les actions de redémarrage, service et sandbox qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système à la recherche d’installations gateway supplémentaires (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si vous voulez examiner les changements avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Mise à jour préalable facultative pour les installations git (mode interactif uniquement).
    - Vérification de fraîcheur du protocole d’interface utilisateur (reconstruit Control UI lorsque le schéma de protocole est plus récent).
    - Vérification de santé + invite de redémarrage.
    - Résumé de l’état des Skills (éligibles/manquantes/bloquées) et état des plugins.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalisation de la configuration pour les valeurs héritées.
    - Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les configurations héritées de l’extension Chrome et la disponibilité de Chrome MCP.
    - Avertissements sur les remplacements du fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements sur l’occultation OAuth de Codex (`models.providers.openai-codex`).
    - Vérification des prérequis OAuth TLS pour les profils OAuth OpenAI Codex.
    - Avertissements sur la liste d’autorisation des plugins/outils lorsque `plugins.allow` est restrictive mais que la politique d’outils demande encore un joker ou des outils appartenant à un plugin.
    - Migration de l’état hérité sur disque (sessions/répertoire d’agent/authentification WhatsApp).
    - Migration des clés de contrat du manifeste de plugin hérité (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration du magasin cron hérité (`jobId`, `schedule.cron`, champs de livraison/charge utile de premier niveau, `provider` de charge utile, tâches webhook de secours simples `notify: true`).
    - Migration de la politique d’exécution d’agent héritée vers `agents.defaults.agentRuntime` et `agents.list[].agentRuntime`.
    - Nettoyage des configurations de plugin obsolètes lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugin obsolètes sont traitées comme une configuration de confinement inerte et sont conservées.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches de réécriture de prompt dupliquées créées par les builds 2026.4.24 affectés.
    - Détection des tombstones de reprise au redémarrage des sous-agents bloqués, avec prise en charge de `--fix` pour effacer les indicateurs de reprise interrompue obsolètes afin que le démarrage ne continue pas à traiter l’enfant comme interrompu au redémarrage.
    - Vérifications de l’intégrité de l’état et des permissions (sessions, transcriptions, répertoire d’état).
    - Vérifications des permissions du fichier de configuration (chmod 600) lors de l’exécution locale.
    - Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration, et signale les états de délai de récupération/désactivation des profils d’authentification.
    - Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Réparation de l’image sandbox lorsque le sandboxing est activé.
    - Migration des services hérités et détection de Gateway supplémentaire.
    - Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution du Gateway (service installé mais non démarré ; étiquette launchd mise en cache).
    - Avertissements d’état des canaux (sondés depuis le Gateway en cours d’exécution).
    - Audit de la configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement proxy intégré pour les services Gateway qui ont capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` lors de l’installation ou de la mise à jour.
    - Vérifications des bonnes pratiques d’exécution du Gateway (Node vs Bun, chemins de gestionnaire de versions).
    - Diagnostics de collision de port du Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Avertissements de sécurité pour les politiques de DM ouvertes.
    - Vérifications d’authentification du Gateway pour le mode jeton local (propose la génération de jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations SecretRef de jeton).
    - Détection des problèmes d’association d’appareil (demandes de première association en attente, mises à niveau de rôle/périmètre en attente, dérive obsolète du cache local de jeton d’appareil, et dérive d’authentification des enregistrements associés).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Vérification systemd linger sous Linux.
    - Vérification de la taille du fichier d’amorçage de l’espace de travail (avertissements de troncation/proximité de limite pour les fichiers de contexte).
    - Vérification de disponibilité des Skills pour l’agent par défaut ; signale les skills autorisées avec binaires, environnement, configuration ou exigences OS manquants, et `--fix` peut désactiver les skills indisponibles dans `skills.entries`.
    - Vérification de l’état de la complétion shell et installation/mise à niveau automatique.
    - Vérification de disponibilité du fournisseur d’embeddings de recherche mémoire (modèle local, clé API distante ou binaire QMD).
    - Vérifications des installations depuis les sources (incohérence d’espace de travail pnpm, ressources d’interface utilisateur manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Backfill et réinitialisation de l’interface Dreams

La scène Dreams de Control UI inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de dreaming ancré. Ces actions utilisent des méthodes RPC de style doctor côté Gateway, mais elles ne font **pas** partie de la réparation/migration CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe du journal REM ancré et écrit des entrées de backfill réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de backfill marquées dans `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées court terme préparées et strictement ancrées qui proviennent d’une relecture historique et n’ont pas encore accumulé de rappel en direct ou de prise en charge quotidienne.

Ce qu’elles ne font **pas** par elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations complètes de doctor
- elles ne préparent pas automatiquement les candidats ancrés dans le magasin de promotion court terme en direct, sauf si vous exécutez explicitement le chemin CLI préparé d’abord

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare des candidats durables ancrés dans le magasin de dreaming court terme tout en conservant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose une mise à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement propre au canal), doctor les normalise dans le schéma actuel.

    Cela inclut les anciens champs plats Talk. La configuration publique Talk actuelle est `talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la carte des fournisseurs.

    Doctor avertit aussi lorsque `plugins.allow` n’est pas vide et que la politique d’outils utilise
    des entrées joker ou des entrées d’outils appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils
    provenant des plugins qui se chargent réellement ; cela ne contourne pas la liste d’autorisation
    exclusive des plugins.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous demandent d’exécuter `openclaw doctor`.

    Doctor va :

    - Expliquer quelles clés héritées ont été trouvées.
    - Montrer la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    Le Gateway exécute aussi automatiquement les migrations de doctor au démarrage lorsqu’il détecte un format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle. Les migrations du magasin de tâches Cron sont gérées par `openclaw doctor --fix`.

    Migrations actuelles :

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - configurations de canaux configurés sans stratégie de réponse visible → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de niveau supérieur
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
    - Pour les canaux avec des `accounts` nommés mais des valeurs de canal de niveau supérieur à compte unique restantes, déplacez ces valeurs limitées au compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut existante correspondante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimer `agents.defaults.llm` ; utilisez `models.providers.<id>.timeoutSeconds` pour les délais d’expiration des fournisseurs/modèles lents
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du Gateway ignore aussi les fournisseurs dont `api` est défini sur une valeur d’énumération future ou inconnue au lieu d’échouer de manière fermée)

    Les avertissements de doctor incluent aussi des recommandations de compte par défaut pour les canaux multi-comptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, doctor avertit et liste les ID de comptes configurés.

  </Accordion>
  <Accordion title="2b. Remplacements du fournisseur OpenCode">
    Si vous avez ajouté `models.providers.opencode`, `opencode-zen` ou `opencode-go` manuellement, cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`. Cela peut forcer les modèles sur la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et restaurer le routage d’API et les coûts par modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation à Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin de l’extension Chrome supprimée, doctor la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version Chrome détectée et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage distant dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer le paramètre côté Chrome à votre place. Chrome MCP local à l’hôte exige toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte Gateway/Node
    - le navigateur exécuté localement
    - le débogage distant activé dans ce navigateur
    - l’approbation de la première invite de consentement à l’attachement dans le navigateur

    Ici, la préparation concerne uniquement les prérequis d’attachement local. Existing-session conserve les limites actuelles de routage Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lots exigent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, sandbox, remote-browser ni aux autres flux headless. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS OAuth">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS locale Node/OpenSSL peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat autosigné), doctor affiche des recommandations de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le Gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements du fournisseur OAuth Codex">
    Si vous avez précédemment ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin du fournisseur OAuth Codex intégré que les versions récentes utilisent automatiquement. Doctor avertit lorsqu’il voit ces anciens paramètres de transport avec OAuth Codex afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le routage/comportement de secours intégré. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Avertissements de route du Plugin Codex">
    Lorsque le Plugin Codex fourni est activé, doctor vérifie aussi si les références de modèle primaire `openai-codex/*` se résolvent encore via l’exécuteur PI par défaut. Cette combinaison est valide lorsque vous voulez l’authentification OAuth/abonnement Codex via PI, mais elle est facile à confondre avec le harnais app-server Codex natif. Doctor avertit et indique la forme app-server explicite : `openai/*` plus `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor ne répare pas cela automatiquement, car les deux routes sont valides :

    - `openai-codex/*` + PI signifie « utiliser l’authentification OAuth/abonnement Codex via l’exécuteur OpenClaw normal ».
    - `openai/*` + `agentRuntime.id: "codex"` signifie « exécuter le tour intégré via l’app-server Codex natif ».
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis la discussion ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur externe ACP/acpx ».

    Si l’avertissement apparaît, choisissez la route voulue et modifiez la configuration manuellement. Conservez l’avertissement tel quel lorsque OAuth Codex via PI est intentionnel.

  </Accordion>
  <Accordion title="3. Migrations d’état héritées (organisation sur disque)">
    Doctor peut migrer les anciennes organisations sur disque vers la structure actuelle :

    - Stockage des sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire de l’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

    Ces migrations sont faites au mieux et idempotentes ; doctor émettra des avertissements lorsqu’il laisse d’anciens dossiers en place comme sauvegardes. Le Gateway/CLI migre aussi automatiquement l’ancien répertoire des sessions + de l’agent au démarrage, afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp n’est intentionnellement migrée que via `openclaw doctor`. La normalisation du fournisseur/de la table des fournisseurs Talk compare maintenant par égalité structurelle, de sorte que les différences portant uniquement sur l’ordre des clés ne déclenchent plus de changements `doctor --fix` répétés sans effet.
  </Accordion>
  <Accordion title="3a. Migrations des manifestes de Plugin hérités">
    Doctor analyse tous les manifestes de Plugin installés à la recherche de clés de capacité de niveau supérieur obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si la clé `contracts` possède déjà les mêmes valeurs, la clé héritée est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations de l’ancien stockage Cron">
    Doctor vérifie aussi le stockage des tâches Cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) à la recherche d’anciennes formes de tâches que le planificateur accepte encore par compatibilité.

    Les nettoyages Cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de charge utile de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` de la charge utile → `delivery.channel` explicite
    - anciennes tâches simples de secours Webhook `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans changer le comportement. Si une tâche combine l’ancien secours de notification avec un mode de livraison non Webhook existant, doctor avertit et laisse cette tâche pour examen manuel.

    Sous Linux, doctor avertit aussi lorsque la crontab de l’utilisateur appelle encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l’hôte n’est pas maintenu par OpenClaw actuel et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque Cron ne peut pas atteindre le bus utilisateur systemd. Supprimez l’entrée crontab obsolète avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les vérifications d’état actuelles.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés derrière lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale : le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort ou plus ancien que 30 minutes). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon, il affiche une note et vous indique de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation des branches de transcription de session">
    Doctor analyse les fichiers JSONL de session d’agent à la recherche de la forme de branche dupliquée créée par le bug de réécriture de transcription d’invite du 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne OpenClaw plus un frère actif contenant la même invite utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier affecté à côté de l’original et réécrit la transcription vers la branche active afin que l’historique du Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Contrôles d’intégrité de l’état (persistance des sessions, routage et sécurité)">
    Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Autorisations du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les autorisations (et émet une indication `chown` lorsqu’une incohérence propriétaire/groupe est détectée).
    - **Répertoire d’état synchronisé avec le cloud sur macOS** : avertit lorsque l’état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins adossés à la synchronisation peuvent provoquer des E/S plus lentes et des courses de verrouillage/synchronisation.
    - **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires adossées à une SD ou à une eMMC peuvent être plus lentes et s’user plus vite lors des écritures de sessions et d’identifiants.
    - **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont requis pour conserver l’historique et éviter les plantages `ENOENT`.
    - **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers de transcription manquants.
    - **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale ne comporte qu’une seule ligne (l’historique ne s’accumule pas).
    - **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se répartir entre installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe ou par tout le monde et propose de les resserrer à `600`.

  </Accordion>
  <Accordion title="5. Santé de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque les jetons arrivent à expiration ou sont expirés, et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin de jeton de configuration Anthropic. Les invites d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou un fournisseur vous indiquant de vous reconnecter), doctor signale qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale aussi les profils d’authentification temporairement inutilisables à cause de :

    - courts temps de récupération (limites de débit/délais d’expiration/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au catalogue et à la liste d’autorisation, puis avertit lorsqu’elle ne peut pas être résolue ou qu’elle est refusée.
  </Accordion>
  <Accordion title="7. Réparation des images de bac à sable">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire l’image ou de basculer vers des noms hérités si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Nettoyage de l’installation des Plugins">
    Doctor supprime l’ancien état de préparation des dépendances de Plugins généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Cela couvre les racines de dépendances générées obsolètes, les anciens répertoires d’étape d’installation et les débris locaux aux paquets issus de l’ancien code de réparation des dépendances des Plugins groupés.

    Doctor peut aussi réinstaller les Plugins téléchargeables configurés lorsque la configuration les référence mais que le registre local de Plugins ne les trouve pas. Pour l’externalisation des Plugins groupés du 2026.5.2, doctor installe automatiquement les Plugins téléchargeables que la configuration existante utilise déjà, puis s’appuie sur `meta.lastTouchedVersion` pour n’exécuter cette passe de publication qu’une seule fois. Le démarrage du Gateway et le rechargement de la configuration n’exécutent pas de gestionnaires de paquets ; les installations de Plugins restent un travail explicite de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrations du service Gateway et indications de nettoyage">
    Doctor détecte les anciens services Gateway (launchd/systemd/schtasks) et propose de les supprimer et d’installer le service OpenClaw avec le port Gateway actuel. Il peut aussi rechercher des services supplémentaires ressemblant au Gateway et afficher des indications de nettoyage. Les services OpenClaw Gateway nommés par profil sont considérés comme de première classe et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service Gateway au niveau utilisateur est manquant mais qu’un service OpenClaw Gateway au niveau système existe, doctor n’installe pas automatiquement un second service au niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système possède le cycle de vie du Gateway.

  </Accordion>
  <Accordion title="8b. Migration Matrix au démarrage">
    Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable, doctor (en mode `--fix` / `--repair`) crée un instantané de pré-migration, puis exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation de l’état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), ce contrôle est entièrement ignoré.
  </Accordion>
  <Accordion title="8c. Appairage d’appareils et dérive d’authentification">
    Doctor inspecte désormais l’état d’appairage des appareils dans le cadre de la passe de santé normale.

    Ce qu’il signale :

    - demandes d’appairage initial en attente
    - mises à niveau de rôle en attente pour les appareils déjà appairés
    - mises à niveau de périmètre en attente pour les appareils déjà appairés
    - réparations de non-correspondance de clé publique où l’identifiant de l’appareil correspond toujours, mais où l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - enregistrements appairés sans jeton actif pour un rôle approuvé
    - jetons appairés dont les périmètres s’écartent de la référence d’appairage approuvée
    - entrées locales mises en cache de jeton d’appareil pour la machine actuelle qui précèdent une rotation de jeton côté Gateway ou qui portent des métadonnées de périmètre obsolètes

    Le diagnostic n’approuve pas automatiquement les demandes d’appairage et ne renouvelle pas automatiquement les jetons d’appareil. Il affiche plutôt les étapes suivantes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - générer un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela ferme la faille courante « déjà appairé mais demande d’appairage toujours requise » : le diagnostic distingue désormais l’appairage initial des mises à niveau de rôle/périmètre en attente et de la dérive de jeton/identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Le diagnostic émet des avertissements lorsqu’un fournisseur est ouvert aux messages privés sans liste d’autorisation, ou lorsqu’une stratégie est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    S’il s’exécute comme service utilisateur systemd, le diagnostic vérifie que le maintien de session est activé afin que le Gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (compétences, plugins et répertoires hérités)">
    Le diagnostic affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les Skills éligibles, à exigences manquantes et bloqués par liste d’autorisation.
    - **Répertoires d’espace de travail hérités** : avertit lorsque `~/openclaw` ou d’autres répertoires d’espace de travail hérités existent à côté de l’espace de travail actuel.
    - **État des plugins** : compte les plugins activés/désactivés/en erreur ; liste les ID de plugins pour toute erreur ; signale les capacités des plugins de bundle.
    - **Avertissements de compatibilité des plugins** : signale les plugins qui présentent des problèmes de compatibilité avec le runtime actuel.
    - **Diagnostics des plugins** : expose tous les avertissements ou erreurs au chargement émis par le registre des plugins.

  </Accordion>
  <Accordion title="11b. Taille du fichier d’amorçage">
    Le diagnostic vérifie si les fichiers d’amorçage de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-dessus du budget de caractères configuré. Il signale, fichier par fichier, les nombres de caractères bruts et injectés, le pourcentage de troncature, la cause de troncature (`max/file` ou `max/total`) et le total des caractères injectés comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, le diagnostic affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un plugin de canal manquant, il supprime également la configuration pendante propre au canal qui référençait ce plugin : entrées `channels.<id>`, cibles de Heartbeat nommant le canal, et remplacements `agents.*.models["<channel>/*"]`. Cela empêche les boucles de démarrage du Gateway où le runtime du canal a disparu mais où la configuration demande toujours au Gateway de s’y lier.
  </Accordion>
  <Accordion title="11c. Complétion du shell">
    Le diagnostic vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil du shell utilise un modèle de complétion dynamique lent (`source <(openclaw completion ...)`), le diagnostic le met à niveau vers la variante plus rapide avec fichier mis en cache.
    - Si la complétion est configurée dans le profil mais que le fichier de cache est manquant, le diagnostic régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, le diagnostic propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

  </Accordion>
  <Accordion title="12. Vérifications d’authentification du Gateway (jeton local)">
    Le diagnostic vérifie que l’authentification locale du Gateway par jeton est prête.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, le diagnostic propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, le diagnostic avertit et ne le remplace pas par du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun jeton SecretRef n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule compatibles SecretRef">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement fail-fast du runtime.

    - `openclaw doctor --fix` utilise désormais le même modèle de résumé SecretRef en lecture seule que les commandes de la famille status pour les réparations de configuration ciblées.
    - Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` `@username` essaie d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, le diagnostic signale que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort le jeton comme manquant.

  </Accordion>
  <Accordion title="13. Contrôle d’état du Gateway + redémarrage">
    Le diagnostic exécute un contrôle d’état et propose de redémarrer le gateway lorsqu’il semble défaillant.
  </Accordion>
  <Accordion title="13b. Disponibilité de la recherche mémoire">
    Le diagnostic vérifie si le fournisseur d’embeddings de recherche mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : vérifie si le binaire `qmd` est disponible et peut démarrer. Sinon, affiche des conseils de correction incluant le paquet npm et une option de chemin manuel vers le binaire.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distant/téléchargeable reconnue. S’il est absent, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est présente dans l’environnement ou dans le magasin d’authentification. Affiche des indications de correction actionnables si elle est absente.
    - **Fournisseur automatique** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde de gateway mis en cache est disponible (le gateway était sain au moment du contrôle), le diagnostic recoupe son résultat avec la configuration visible par la CLI et signale toute divergence. Le diagnostic ne lance pas de nouveau ping d’embedding sur le chemin par défaut ; utilisez la commande d’état mémoire approfondi lorsque vous voulez un contrôle en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la disponibilité des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le gateway est sain, le diagnostic exécute une sonde d’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Le diagnostic vérifie la configuration du superviseur installée (launchd/systemd/schtasks) afin de détecter les valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd network-online et le délai de redémarrage). Lorsqu’il trouve une divergence, il recommande une mise à jour et peut réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

    Notes :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` remplace les configurations de superviseur personnalisées.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` garde le diagnostic en lecture seule pour le cycle de vie du service gateway. Il signale toujours l’état du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/le bootstrap du service, les réécritures de configuration du superviseur et le nettoyage des services hérités, car un superviseur externe possède ce cycle de vie.
    - Sous Linux, le diagnostic ne réécrit pas les métadonnées de commande/point d’entrée tant que l’unité systemd gateway correspondante est active. Il ignore également les unités supplémentaires inactives de type gateway non héritées pendant l’analyse des services en double afin que les fichiers de service compagnons ne créent pas de bruit de nettoyage.
    - Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service par le diagnostic valide la SecretRef mais ne persiste pas les valeurs de jeton en clair résolues dans les métadonnées d’environnement du service superviseur.
    - Le diagnostic détecte les valeurs d’environnement de service gérées adossées à `.env`/SecretRef que les anciennes installations LaunchAgent, systemd ou Windows Scheduled Task intégraient en ligne, puis réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution plutôt que depuis la définition du superviseur.
    - Le diagnostic détecte lorsque la commande du service épingle encore un ancien `--port` après des modifications de `gateway.port` et réécrit les métadonnées du service vers le port actuel.
    - Si l’authentification par jeton exige un jeton et que la SecretRef de jeton configurée n’est pas résolue, le diagnostic bloque le chemin d’installation/de réparation avec des conseils actionnables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, le diagnostic bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités user-systemd Linux, les contrôles de dérive de jeton du diagnostic incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service du diagnostic refusent de réécrire, arrêter ou redémarrer un service gateway depuis un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics d’exécution + de port du Gateway">
    Le diagnostic inspecte l’exécution du service (PID, dernier état de sortie) et avertit lorsque le service est installé mais ne s’exécute pas réellement. Il vérifie également les collisions de port sur le port du gateway (`18789` par défaut) et signale les causes probables (gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Le diagnostic avertit lorsque le service gateway s’exécute sur Bun ou sur un chemin Node géré par version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node, et les chemins de gestionnaire de versions peuvent casser après les mises à niveau, car le service ne charge pas votre initialisation de shell. Le diagnostic propose de migrer vers une installation système de Node lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif ; ainsi, Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaire de versions ne changent pas le Node résolu par les processus enfants. Les services Linux conservent toujours les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires user-bin stables, mais les répertoires de secours supposés des gestionnaires de versions ne sont écrits dans le PATH du service que lorsque ces répertoires existent sur le disque.

  </Accordion>
  <Accordion title="18. Écriture de la configuration + métadonnées de l’assistant">
    Le diagnostic persiste toute modification de configuration et estampille les métadonnées de l’assistant pour enregistrer l’exécution du diagnostic.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système de mémoire)">
    Le diagnostic suggère un système de mémoire d’espace de travail lorsqu’il est manquant et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet sur la structure de l’espace de travail et la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Connexe

- [Runbook du Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
