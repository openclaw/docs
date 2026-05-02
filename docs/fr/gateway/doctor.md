---
read_when:
    - Ajouter ou modifier des migrations de diagnostic
    - Présentation des changements de configuration incompatibles
sidebarTitle: Doctor
summary: 'Commande doctor : contrôles d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-05-02T20:45:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation + migration pour OpenClaw. Il corrige les configurations/états obsolètes, vérifie l’état de santé et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Modes sans interface et automatisation

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation liées au redémarrage, au service ou au bac à sable, le cas échéant).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applique les réparations recommandées sans demander de confirmation (réparations + redémarrages lorsque c’est sûr).

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

    S’exécute sans invites et applique uniquement les migrations sûres (normalisation de la configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/bac à sable qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

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
  <Accordion title="Santé, interface utilisateur et mises à jour">
    - Mise à jour préalable facultative pour les installations git (interactif uniquement).
    - Vérification de fraîcheur du protocole d’interface utilisateur (reconstruit Control UI lorsque le schéma de protocole est plus récent).
    - Vérification de santé + invite de redémarrage.
    - Résumé de l’état des Skills (éligibles/manquants/bloqués) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de la configuration pour les valeurs héritées.
    - Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les configurations héritées de l’extension Chrome et la préparation de Chrome MCP.
    - Avertissements sur les remplacements du fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements d’occultation OAuth Codex (`models.providers.openai-codex`).
    - Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
    - Avertissements de liste d’autorisation de plugins/outils lorsque `plugins.allow` est restrictive, mais que la politique d’outils demande toujours des outils génériques ou appartenant à un plugin.
    - Migration d’état héritée sur disque (sessions/répertoire d’agent/authentification WhatsApp).
    - Migration des clés de contrat de manifeste de plugin héritées (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration de l’ancien magasin Cron (`jobId`, `schedule.cron`, champs de livraison/charge utile de premier niveau, `provider` de charge utile, tâches Webhook de repli simples `notify: true`).
    - Migration de l’ancienne politique d’exécution d’agent vers `agents.defaults.agentRuntime` et `agents.list[].agentRuntime`.
    - Nettoyage des configurations de plugin obsolètes lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugin obsolètes sont traitées comme une configuration de confinement inerte et sont préservées.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches de réécriture d’invite dupliquées créées par les builds 2026.4.24 affectés.
    - Détection des tombstones de récupération au redémarrage des sous-agents bloqués, avec prise en charge de `--fix` pour effacer les indicateurs de récupération abandonnée obsolètes afin que le démarrage ne continue pas à traiter l’enfant comme abandonné au redémarrage.
    - Vérifications d’intégrité d’état et d’autorisations (sessions, transcriptions, répertoire d’état).
    - Vérifications des autorisations du fichier de configuration (chmod 600) lors d’une exécution locale.
    - Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de délai de récupération/désactivation des profils d’authentification.
    - Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image de bac à sable lorsque le sandboxing est activé.
    - Migration des services hérités et détection des Gateway supplémentaires.
    - Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution Gateway (service installé mais non en cours d’exécution ; libellé launchd mis en cache).
    - Avertissements d’état des canaux (sondés depuis la Gateway en cours d’exécution).
    - Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement proxy intégré pour les services Gateway qui ont capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` pendant l’installation ou la mise à jour.
    - Vérifications des bonnes pratiques d’exécution Gateway (Node vs Bun, chemins des gestionnaires de versions).
    - Diagnostics de collision de port Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et appairage">
    - Avertissements de sécurité pour les politiques de DM ouvertes.
    - Vérifications d’authentification Gateway pour le mode jeton local (propose la génération d’un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations SecretRef de jeton).
    - Détection des problèmes d’appairage d’appareil (demandes de premier appairage en attente, mises à niveau de rôle/portée en attente, dérive obsolète du cache local de jetons d’appareil et dérive d’authentification des enregistrements appairés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Vérification du linger systemd sous Linux.
    - Vérification de la taille du fichier d’amorçage de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Vérification de préparation des Skills pour l’agent par défaut ; signale les compétences autorisées avec bins, environnement, configuration ou exigences d’OS manquants, et `--fix` peut désactiver les Skills indisponibles dans `skills.entries`.
    - Vérification de l’état de la complétion shell et installation/mise à niveau automatique.
    - Vérification de préparation du fournisseur d’embeddings de recherche mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Vérifications d’installation depuis la source (désaccord d’espace de travail pnpm, ressources d’interface utilisateur manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Remplissage rétroactif et réinitialisation de l’interface Dreams

La scène Dreams de Control UI inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de Dreaming ancré. Ces actions utilisent des méthodes RPC de type Gateway doctor, mais elles ne font **pas** partie de la réparation/migration CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM ancré et écrit des entrées de remplissage rétroactif réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de remplissage rétroactif marquées dans `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées court terme préparées, uniquement ancrées, qui proviennent d’une relecture historique et qui n’ont pas encore accumulé de rappel en direct ni de support quotidien.

Ce qu’elles ne font **pas** par elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne préparent pas automatiquement les candidats ancrés dans le magasin de promotion court terme en direct, sauf si vous exécutez explicitement le chemin CLI de préparation d’abord

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion approfondie, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare les candidats durables ancrés dans le magasin Dreaming court terme tout en conservant `DREAMS.md` comme surface de révision.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose de mettre à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de la configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement propre au canal), doctor les normalise dans le schéma actuel.

    Cela inclut les anciens champs plats Talk. La configuration Talk publique actuelle est `talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la carte de fournisseurs.

    Doctor avertit également lorsque `plugins.allow` est non vide et que la politique d’outils utilise
    des entrées d’outils génériques ou appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils
    provenant de plugins qui se chargent réellement ; il ne contourne pas la liste d’autorisation
    exclusive des plugins.

  </Accordion>
  <Accordion title="2. Migrations des clés de configuration héritées">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous demandent de lancer `openclaw doctor`.

    Doctor va :

    - Expliquer quelles clés héritées ont été trouvées.
    - Afficher la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    La Gateway exécute également automatiquement les migrations doctor au démarrage lorsqu’elle détecte un format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle. Les migrations du magasin de tâches Cron sont gérées par `openclaw doctor --fix`.

    Migrations actuelles :

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de premier niveau
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
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Pour les canaux avec des `accounts` nommés mais conservant des valeurs de canal de premier niveau à compte unique, déplacez ces valeurs limitées au compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimer `agents.defaults.llm` ; utilisez `models.providers.<id>.timeoutSeconds` pour les délais d’expiration des fournisseurs/modèles lents
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimer `browser.relayBindHost` (ancien réglage de relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du Gateway ignore également les fournisseurs dont `api` est défini sur une future valeur d’énumération ou une valeur inconnue, au lieu d’échouer en mode fermé)

    Les avertissements de Doctor incluent aussi des recommandations de compte par défaut pour les canaux multi-comptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, Doctor avertit que le routage de repli peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, Doctor avertit et liste les ID de comptes configurés.

  </Accordion>
  <Accordion title="2b. Remplacements de fournisseurs OpenCode">
    Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`. Cela peut forcer les modèles vers la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et restaurer le routage API + les coûts par modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation à Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin supprimé de l’extension Chrome, Doctor la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version détectée de Chrome et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage distant dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer le réglage côté Chrome pour vous. Chrome MCP local à l’hôte nécessite toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte Gateway/Node
    - le navigateur exécuté localement
    - le débogage distant activé dans ce navigateur
    - l’approbation de la première invite de consentement d’attachement dans le navigateur

    La préparation ici concerne uniquement les prérequis d’attachement local. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lot nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, sandbox, remote-browser ni aux autres flux headless. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS OAuth">
    Lorsqu’un profil OpenAI Codex OAuth est configuré, Doctor interroge le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS locale Node/OpenSSL peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat autosigné), Doctor affiche des recommandations de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le Gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements de fournisseur Codex OAuth">
    Si vous aviez précédemment ajouté d’anciens réglages de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin du fournisseur Codex OAuth intégré que les versions récentes utilisent automatiquement. Doctor avertit lorsqu’il détecte ces anciens réglages de transport avec Codex OAuth afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le comportement intégré de routage/repli. Les proxys personnalisés et les remplacements d’en-têtes seuls restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Avertissements de route du Plugin Codex">
    Lorsque le Plugin Codex inclus est activé, Doctor vérifie aussi si les références de modèle principal `openai-codex/*` se résolvent encore via le runner PI par défaut. Cette combinaison est valide lorsque vous voulez l’authentification Codex OAuth/abonnement via PI, mais elle se confond facilement avec le harnais app-server Codex natif. Doctor avertit et indique la forme app-server explicite : `openai/*` plus `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor ne répare pas cela automatiquement, car les deux routes sont valides :

    - `openai-codex/*` + PI signifie « utiliser l’authentification Codex OAuth/abonnement via le runner OpenClaw normal ».
    - `openai/*` + `agentRuntime.id: "codex"` signifie « exécuter le tour intégré via l’app-server Codex natif ».
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

    Si l’avertissement apparaît, choisissez la route prévue et modifiez la configuration manuellement. Conservez l’avertissement tel quel lorsque PI Codex OAuth est intentionnel.

  </Accordion>
  <Accordion title="3. Migrations d’ancien état (organisation du disque)">
    Doctor peut migrer les anciennes organisations sur disque vers la structure actuelle :

    - Stockage des sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire d’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

    Ces migrations sont au mieux de leurs possibilités et idempotentes ; Doctor émettra des avertissements lorsqu’il laisse d’anciens dossiers derrière lui comme sauvegardes. Le Gateway/CLI migre aussi automatiquement l’ancien répertoire des sessions + agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de Doctor. L’authentification WhatsApp est volontairement migrée uniquement via `openclaw doctor`. La normalisation du fournisseur/de la table de fournisseurs Talk compare désormais par égalité structurelle, donc les différences limitées à l’ordre des clés ne déclenchent plus de changements `doctor --fix` répétés sans effet.

  </Accordion>
  <Accordion title="3a. Migrations des anciens manifestes de Plugin">
    Doctor analyse tous les manifestes de Plugin installés à la recherche de clés de capacité de premier niveau obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si la clé `contracts` contient déjà les mêmes valeurs, l’ancienne clé est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations de l’ancien stockage Cron">
    Doctor vérifie également le stockage des tâches Cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) pour détecter les anciennes formes de tâches que le planificateur accepte encore par compatibilité.

    Les nettoyages Cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de charge utile de premier niveau (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de premier niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` dans la charge utile → `delivery.channel` explicite
    - anciennes tâches Webhook simples de repli `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans changer le comportement. Si une tâche combine l’ancien repli notify avec un mode de livraison non-Webhook existant, Doctor avertit et laisse cette tâche pour examen manuel.

    Sous Linux, Doctor avertit aussi lorsque le crontab de l’utilisateur appelle encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l’hôte n’est pas maintenu par l’OpenClaw actuel et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque Cron ne peut pas atteindre le bus utilisateur systemd. Supprimez l’entrée crontab obsolète avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les vérifications d’état actuelles.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Le diagnostic analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes, laissés lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale : le chemin, le PID, si le PID est encore actif, l’âge du verrou, et s’il est considéré comme obsolète (PID mort ou âge supérieur à 30 minutes). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon, il affiche une note et vous demande de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation de branche de transcription de session">
    Le diagnostic analyse les fichiers JSONL de session d’agent pour détecter la forme de branche dupliquée créée par le bogue de réécriture de transcription de prompt du 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne d’OpenClaw, plus un élément frère actif contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, le diagnostic sauvegarde chaque fichier affecté à côté de l’original et réécrit la transcription vers la branche active afin que l’historique du Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Contrôles d’intégrité de l’état (persistance des sessions, routage et sécurité)">
    Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration (sauf si vous disposez de sauvegardes ailleurs).

    Le diagnostic vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Autorisations du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les autorisations (et émet une indication `chown` lorsqu’une incohérence de propriétaire/groupe est détectée).
    - **Répertoire d’état synchronisé avec le cloud sur macOS** : avertit lorsque l’état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins sauvegardés par la synchronisation peuvent provoquer des E/S plus lentes et des courses de verrouillage/synchronisation.
    - **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires sauvegardées par SD ou eMMC peuvent être plus lentes et s’user plus vite lors des écritures de sessions et d’identifiants.
    - **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont requis pour persister l’historique et éviter les plantages `ENOENT`.
    - **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers de transcription manquants.
    - **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale ne contient qu’une seule ligne (l’historique ne s’accumule pas).
    - **Répertoires d’état multiples** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels, ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se répartir entre installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, le diagnostic vous rappelle de l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe/le monde et propose de le restreindre à `600`.

  </Accordion>
  <Accordion title="5. Santé de l’authentification des modèles (expiration OAuth)">
    Le diagnostic inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque les jetons expirent ou ont expiré, et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin de jeton de configuration Anthropic. Les invites d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou un fournisseur qui vous demande de vous reconnecter), le diagnostic indique qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Le diagnostic signale aussi les profils d’authentification temporairement inutilisables en raison de :

    - courts délais de récupération (limites de débit/délais d’attente/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, le diagnostic valide la référence du modèle par rapport au catalogue et à la liste d’autorisation, et avertit lorsqu’elle ne se résoudra pas ou n’est pas autorisée.
  </Accordion>
  <Accordion title="7. Réparation de l’image sandbox">
    Lorsque le sandboxing est activé, le diagnostic vérifie les images Docker et propose de créer ou de basculer vers les anciens noms si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Nettoyage de l’installation des Plugin">
    Le diagnostic supprime l’ancien état de préparation des dépendances de Plugin généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Cela couvre les racines de dépendances générées obsolètes, les anciens répertoires d’étape d’installation et les débris locaux au package issus d’un ancien code de réparation des dépendances des Plugin groupés.

    Le diagnostic peut aussi réinstaller les plugins téléchargeables configurés lorsque la configuration les référence, mais que le registre local des Plugin ne les trouve pas. Pour l’externalisation des Plugin groupés du 2026.5.2, le diagnostic installe automatiquement les plugins téléchargeables que la configuration existante utilise déjà, puis s’appuie sur `meta.lastTouchedVersion` pour n’exécuter cette passe de publication qu’une seule fois. Le démarrage du Gateway et le rechargement de la configuration n’exécutent pas de gestionnaires de packages ; les installations de Plugin restent un travail explicite de diagnostic/installation/mise à jour.

  </Accordion>
  <Accordion title="8. Migrations du service Gateway et indications de nettoyage">
    Le diagnostic détecte les anciens services Gateway (launchd/systemd/schtasks) et propose de les supprimer et d’installer le service OpenClaw en utilisant le port Gateway actuel. Il peut aussi rechercher des services supplémentaires de type Gateway et afficher des indications de nettoyage. Les services Gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service Gateway de niveau utilisateur est manquant mais qu’un service Gateway OpenClaw de niveau système existe, le diagnostic n’installe pas automatiquement un second service de niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système possède le cycle de vie du Gateway.

  </Accordion>
  <Accordion title="8b. Migration du démarrage Matrix">
    Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable, le diagnostic (en mode `--fix` / `--repair`) crée un instantané pré-migration, puis exécute les étapes de migration au mieux : migration de l’ancien état Matrix et préparation de l’ancien état chiffré. Les deux étapes sont non fatales ; les erreurs sont consignées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), ce contrôle est entièrement ignoré.
  </Accordion>
  <Accordion title="8c. Appairage d’appareil et dérive d’authentification">
    Le diagnostic inspecte désormais l’état d’appairage des appareils dans le cadre de la passe de santé normale.

    Ce qu’il signale :

    - demandes de premier appairage en attente
    - mises à niveau de rôle en attente pour les appareils déjà appairés
    - mises à niveau de portée en attente pour les appareils déjà appairés
    - réparations d’incohérence de clé publique où l’identifiant de l’appareil correspond encore, mais où l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - enregistrements appairés sans jeton actif pour un rôle approuvé
    - jetons appairés dont les portées dérivent hors de la référence d’appairage approuvée
    - entrées locales mises en cache de jeton d’appareil pour la machine actuelle qui sont antérieures à une rotation de jeton côté Gateway ou portent des métadonnées de portée obsolètes

    Le diagnostic n’approuve pas automatiquement les demandes d’appairage et ne fait pas automatiquement tourner les jetons d’appareil. Il affiche plutôt les prochaines étapes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela comble la lacune courante « déjà appairé mais appairage toujours requis » : le diagnostic distingue désormais le premier appairage des mises à niveau de rôle/portée en attente et de la dérive de jeton/identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Le diagnostic émet des avertissements lorsqu’un fournisseur est ouvert aux messages directs sans liste d’autorisation, ou lorsqu’une politique est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    S’il s’exécute en tant que service utilisateur systemd, le diagnostic s’assure que la persistance est activée afin que le Gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (Skills, plugins et anciens répertoires)">
    Le diagnostic affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les Skills admissibles, aux exigences manquantes et bloqués par la liste d’autorisation.
    - **Anciens répertoires d’espace de travail** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail existent à côté de l’espace de travail actuel.
    - **État des Plugin** : compte les Plugin activés/désactivés/en erreur ; liste les identifiants de Plugin pour toute erreur ; signale les capacités des Plugin groupés.
    - **Avertissements de compatibilité des Plugin** : signale les Plugin qui ont des problèmes de compatibilité avec l’exécution actuelle.
    - **Diagnostics des Plugin** : expose tout avertissement ou erreur au chargement émis par le registre des Plugin.

  </Accordion>
  <Accordion title="11b. Taille du fichier de démarrage">
    Le diagnostic vérifie si les fichiers de démarrage de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches du budget de caractères configuré ou le dépassent. Il signale, par fichier, les nombres de caractères bruts et injectés, le pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total de caractères injectés sous forme de fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, le diagnostic affiche des conseils pour régler `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des Plugin de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un Plugin de canal manquant, il supprime aussi la configuration pendante à portée de canal qui référençait ce Plugin : entrées `channels.<id>`, cibles Heartbeat qui nommaient le canal et remplacements `agents.*.models["<channel>/*"]`. Cela évite les boucles de démarrage du Gateway où l’exécution du canal a disparu, mais où la configuration demande encore au Gateway de s’y lier.
  </Accordion>
  <Accordion title="11c. Complétion du shell">
    Le diagnostic vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil shell utilise un modèle de complétion dynamique lent (`source <(openclaw completion ...)`), le diagnostic le met à niveau vers la variante plus rapide avec fichier en cache.
    - Si la complétion est configurée dans le profil mais que le fichier de cache est manquant, le diagnostic régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, le diagnostic propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

  </Accordion>
  <Accordion title="12. Contrôles d’authentification du Gateway (jeton local)">
    Le diagnostic vérifie la préparation de l’authentification par jeton du Gateway local.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, le diagnostic propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, le diagnostic avertit et ne l’écrase pas par du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule conscientes de SecretRef">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide de l’exécution.

    - `openclaw doctor --fix` utilise désormais le même modèle de résumé SecretRef en lecture seule que les commandes de la famille status pour les réparations de configuration ciblées.
    - Exemple : la réparation `allowFrom` / `groupAllowFrom` `@username` de Telegram essaie d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, le diagnostic indique que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort le jeton comme manquant.

  </Accordion>
  <Accordion title="13. Vérification de santé du Gateway + redémarrage">
    Doctor exécute une vérification de santé et propose de redémarrer le Gateway lorsqu’il semble défaillant.
  </Accordion>
  <Accordion title="13b. Disponibilité de la recherche mémoire">
    Doctor vérifie si le fournisseur d’embeddings de recherche mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : teste si le binaire `qmd` est disponible et peut démarrer. Sinon, affiche des consignes de correction incluant le package npm et une option de chemin manuel vers le binaire.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distant/téléchargeable reconnue. S’il est absent, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé d’API est présente dans l’environnement ou le magasin d’authentification. Affiche des indications de correction exploitables si elle est absente.
    - **Fournisseur automatique** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde Gateway mis en cache est disponible (le Gateway était sain au moment de la vérification), doctor recoupe son résultat avec la configuration visible par la CLI et signale toute divergence. Doctor ne lance pas de nouveau ping d’embedding sur le chemin par défaut ; utilisez la commande d’état mémoire approfondi lorsque vous voulez une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la disponibilité des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le Gateway est sain, doctor exécute une sonde d’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Doctor vérifie la configuration du superviseur installée (launchd/systemd/schtasks) pour détecter les valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd à network-online et le délai de redémarrage). Lorsqu’il trouve une incompatibilité, il recommande une mise à jour et peut réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

    Notes :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` garde doctor en lecture seule pour le cycle de vie du service Gateway. Il signale toujours la santé du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service, les réécritures de configuration du superviseur et le nettoyage des anciens services, car un superviseur externe possède ce cycle de vie.
    - Sous Linux, doctor ne réécrit pas les métadonnées de commande/point d’entrée tant que l’unité systemd Gateway correspondante est active. Il ignore aussi les unités supplémentaires inactives non héritées ressemblant à un Gateway lors de l’analyse des services dupliqués afin que les fichiers de service compagnons ne créent pas de bruit de nettoyage.
    - Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service par doctor valide le SecretRef mais ne persiste pas les valeurs de jeton en texte brut résolues dans les métadonnées d’environnement du service superviseur.
    - Doctor détecte les valeurs d’environnement de service gérées, basées sur `.env`/SecretRef, que d’anciennes installations LaunchAgent, systemd ou Windows Scheduled Task intégraient en ligne, et réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution plutôt que depuis la définition du superviseur.
    - Doctor détecte lorsque la commande de service fixe encore un ancien `--port` après des changements de `gateway.port` et réécrit les métadonnées du service vers le port actuel.
    - Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des consignes exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités user-systemd Linux, les vérifications de dérive des jetons de doctor incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service de doctor refusent de réécrire, d’arrêter ou de redémarrer un service Gateway depuis un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics d’exécution + de port du Gateway">
    Doctor inspecte l’exécution du service (PID, dernier état de sortie) et avertit lorsque le service est installé mais ne s’exécute pas réellement. Il vérifie aussi les collisions de port sur le port du Gateway (`18789` par défaut) et signale les causes probables (Gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Doctor avertit lorsque le service Gateway s’exécute sur Bun ou sur un chemin Node géré par version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram exigent Node, et les chemins de gestionnaire de versions peuvent casser après les mises à niveau, car le service ne charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif, de sorte que Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaire de versions ne modifient pas le Node résolu par les processus enfants. Les services Linux conservent toujours les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires user-bin stables, mais les répertoires de secours supposés des gestionnaires de versions ne sont écrits dans le PATH du service que lorsque ces répertoires existent sur le disque.

  </Accordion>
  <Accordion title="18. Écriture de la configuration + métadonnées de l’assistant">
    Doctor persiste les changements de configuration et estampille les métadonnées de l’assistant pour enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système mémoire)">
    Doctor suggère un système mémoire d’espace de travail lorsqu’il est absent et affiche une astuce de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Connexe

- [Runbook Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
