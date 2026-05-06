---
read_when:
    - Ajout ou modification des migrations doctor
    - Introduire des modifications de configuration avec rupture de compatibilité
sidebarTitle: Doctor
summary: 'Commande doctor : vérifications d’état, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-05-06T17:55:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration d’OpenClaw. Il corrige les configurations/états obsolètes, vérifie l’état de santé et fournit des étapes de réparation actionnables.

## Démarrage rapide

```bash
openclaw doctor
```

### Modes headless et automatisation

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de redémarrage/service/réparation du bac à sable, le cas échéant).

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

    Analyse les services système pour détecter d’autres installations de Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si vous voulez examiner les changements avant l’écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

<AccordionGroup>
  <Accordion title="État de santé, UI et mises à jour">
    - Mise à jour préliminaire facultative pour les installations git (interactif uniquement).
    - Vérification de la fraîcheur du protocole UI (reconstruit l’UI de contrôle lorsque le schéma de protocole est plus récent).
    - Vérification de santé + invite de redémarrage.
    - Résumé d’état des Skills (éligibles/manquants/bloqués) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de la configuration pour les valeurs héritées.
    - Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les anciennes configurations d’extension Chrome et la préparation de Chrome MCP.
    - Avertissements de surcharge du provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements d’occultation OAuth Codex (`models.providers.openai-codex`).
    - Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
    - Avertissements de liste d’autorisation de Plugin/outil lorsque `plugins.allow` est restrictive mais que la politique d’outils demande encore des outils génériques ou appartenant à un plugin.
    - Migration d’ancien état sur disque (sessions/répertoire d’agent/authentification WhatsApp).
    - Migration des clés de contrat d’ancien manifeste de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration de l’ancien stockage Cron (`jobId`, `schedule.cron`, champs de livraison/payload de premier niveau, payload `provider`, tâches Webhook de secours simples `notify: true`).
    - Migration de l’ancienne politique d’exécution d’agent vers `agents.defaults.agentRuntime` et `agents.list[].agentRuntime`.
    - Nettoyage de configuration de plugin obsolète lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugin obsolètes sont traitées comme une configuration de confinement inerte et sont conservées.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches de réécriture de prompt dupliquées créées par les builds 2026.4.24 affectés.
    - Détection des tombstones de récupération au redémarrage des sous-agents bloqués, avec prise en charge de `--fix` pour effacer les indicateurs de récupération abandonnée obsolètes afin que le démarrage ne continue pas à traiter l’enfant comme abandonné au redémarrage.
    - Vérifications d’intégrité d’état et d’autorisations (sessions, transcriptions, répertoire d’état).
    - Vérifications des autorisations du fichier de configuration (chmod 600) lors de l’exécution locale.
    - Santé de l’authentification de modèle : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de cooldown/désactivation des profils d’authentification.
    - Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image de bac à sable lorsque le bac à sable est activé.
    - Migration de service hérité et détection de Gateway supplémentaire.
    - Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution du Gateway (service installé mais non démarré ; étiquette launchd mise en cache).
    - Avertissements d’état des canaux (sondés depuis le Gateway en cours d’exécution).
    - Vérifications de réactivité WhatsApp pour une santé dégradée de la boucle d’événements du Gateway avec des clients TUI locaux encore en cours d’exécution ; `--fix` arrête uniquement les clients TUI locaux vérifiés.
    - Réparation de route Codex pour les références de modèle héritées `openai-codex/*` dans les modèles principaux, les fallbacks, les surcharges Heartbeat/sous-agent/Compaction, les hooks, les surcharges de modèle de canal et les épingles de route de session ; `--fix` les réécrit vers `openai/*` et sélectionne `agentRuntime.id: "codex"` uniquement lorsque le Plugin Codex est installé, activé, fournit le harnais `codex` et dispose d’un OAuth utilisable. Sinon, il sélectionne `agentRuntime.id: "pi"`.
    - Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement proxy intégré pour les services Gateway qui ont capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` pendant l’installation ou la mise à jour.
    - Vérifications des bonnes pratiques d’exécution du Gateway (Node vs Bun, chemins de gestionnaire de version).
    - Diagnostics de collision de port Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et appairage">
    - Avertissements de sécurité pour les politiques de DM ouverts.
    - Vérifications d’authentification Gateway pour le mode jeton local (propose la génération de jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations token SecretRef).
    - Détection des problèmes d’appairage d’appareil (demandes de premier appairage en attente, mises à niveau de rôle/portée en attente, dérive du cache local de jeton d’appareil obsolète et dérive d’authentification d’enregistrement appairé).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Vérification systemd linger sur Linux.
    - Vérification de taille du fichier d’amorçage de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Vérification de préparation des Skills pour l’agent par défaut ; signale les Skills autorisées avec des binaires, env, config ou exigences d’OS manquants, et `--fix` peut désactiver les Skills indisponibles dans `skills.entries`.
    - Vérification d’état de complétion shell et installation/mise à niveau automatique.
    - Vérification de préparation du provider d’embeddings de recherche mémoire (modèle local, clé API distante ou binaire QMD).
    - Vérifications d’installation depuis les sources (incompatibilité d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Rétro-remplissage et réinitialisation de l’UI Dreams

La scène Dreams de l’UI de contrôle inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de Dreaming ancré. Ces actions utilisent des méthodes RPC de style Gateway doctor, mais elles ne font **pas** partie de la réparation/migration CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute le passage de journal REM ancré et écrit des entrées de rétro-remplissage réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de rétro-remplissage marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées court terme en attente, uniquement ancrées, qui proviennent d’une relecture historique et n’ont pas encore accumulé de rappel en direct ou de prise en charge quotidienne.

Ce qu’elles ne font **pas** seules :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne placent pas automatiquement les candidats ancrés dans le stockage de promotion court terme en direct, sauf si vous exécutez explicitement d’abord le chemin CLI préparé

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela place les candidats durables ancrés dans le stockage Dreaming court terme tout en conservant `DREAMS.md` comme surface de révision.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute de façon interactive, il propose de mettre à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de la configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans surcharge spécifique au canal), doctor les normalise dans le schéma actuel.

    Cela inclut les anciens champs plats Talk. La configuration vocale Talk publique actuelle est `talk.provider` + `talk.providers.<provider>`, et la configuration vocale temps réel est `talk.realtime.*`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la map de providers, et réécrit les anciens sélecteurs temps réel de premier niveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) dans `talk.realtime`.

    Doctor avertit également lorsque `plugins.allow` n’est pas vide et que la politique d’outils utilise
    des entrées génériques ou appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils
    des plugins qui se chargent réellement ; cela ne contourne pas la liste d’autorisation exclusive des plugins.
    Doctor écrit `plugins.bundledDiscovery: "compat"` pour les configurations de liste d’autorisation héritées
    migrées afin de préserver le comportement existant des providers groupés, puis
    pointe vers le paramètre `"allowlist"` plus strict.

  </Accordion>
  <Accordion title="2. Migrations d’anciennes clés de configuration">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous demandent d’exécuter `openclaw doctor`.

    Doctor va :

    - Expliquer quelles clés héritées ont été trouvées.
    - Afficher la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    Le démarrage du Gateway refuse les formats de configuration hérités et vous demande d’exécuter `openclaw doctor --fix` ; il ne réécrit pas `openclaw.json` au démarrage. Les migrations du stockage des tâches Cron sont également gérées par `openclaw doctor --fix`.

    Migrations actuelles :

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurations de canaux configurés sans politique de réponse visible → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de niveau supérieur
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - anciens `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - anciens sélecteurs Talk temps réel de niveau supérieur (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Pour les canaux avec des `accounts` nommés mais des valeurs de canal de niveau supérieur à compte unique restantes, déplacez ces valeurs limitées au compte vers le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (outils/élévation/exec/sandbox/sous-agents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimez `agents.defaults.llm` ; utilisez `models.providers.<id>.timeoutSeconds` pour les délais d’expiration des fournisseurs/modèles lents
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimez `browser.relayBindHost` (ancien paramètre de relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du Gateway ignore aussi les fournisseurs dont `api` est défini sur une valeur d’énumération future ou inconnue au lieu d’échouer de manière fermée)

    Les avertissements de Doctor incluent également des conseils de compte par défaut pour les canaux à plusieurs comptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, Doctor avertit que le routage de secours peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, Doctor avertit et liste les ID de compte configurés.

  </Accordion>
  <Accordion title="2b. Remplacements du fournisseur OpenCode">
    Si vous avez ajouté `models.providers.opencode`, `opencode-zen` ou `opencode-go` manuellement, cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`. Cela peut forcer les modèles à utiliser la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et restaurer le routage API + les coûts propres à chaque modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation à Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin supprimé de l’extension Chrome, Doctor la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite également le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils par défaut à connexion automatique
    - vérifie la version Chrome détectée et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage distant dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer le paramètre côté Chrome pour vous. Chrome MCP local à l’hôte nécessite toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte du gateway/nœud
    - le navigateur exécuté localement
    - le débogage distant activé dans ce navigateur
    - l’approbation de la première invite de consentement d’attachement dans le navigateur

    La préparation ici concerne uniquement les prérequis d’attachement local. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF, l’interception de téléchargements et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, au sandbox, au navigateur distant ni aux autres flux sans interface graphique. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS OAuth">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, Doctor interroge le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS Node/OpenSSL locale peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat auto-signé), Doctor affiche des conseils de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements du fournisseur OAuth Codex">
    Si vous avez précédemment ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin du fournisseur OAuth Codex intégré que les versions plus récentes utilisent automatiquement. Doctor avertit lorsqu’il voit ces anciens paramètres de transport avec OAuth Codex afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le comportement intégré de routage/secours. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Réparation des routes Codex">
    Doctor vérifie les références de modèle héritées `openai-codex/*`. Le routage natif du harnais Codex utilise des références de modèle canoniques `openai/*` avec `agentRuntime.id: "codex"` afin que le tour passe par le harnais serveur d’application Codex au lieu du chemin OpenAI OpenClaw PI.

    En mode `--fix` / `--repair`, Doctor réécrit les références affectées de l’agent par défaut et de chaque agent, notamment les modèles principaux, les solutions de secours, les remplacements heartbeat/sous-agent/compaction, les hooks, les remplacements de modèle par canal et l’état de route de session persisté obsolète :

    - `openai-codex/gpt-*` devient `openai/gpt-*`.
    - Le runtime d’agent correspondant devient `agentRuntime.id: "codex"` uniquement lorsque Codex est installé, activé, fournit le harnais `codex` et dispose d’OAuth utilisable.
    - Sinon, le runtime d’agent correspondant devient `agentRuntime.id: "pi"`.
    - Les listes de modèles de secours existantes sont conservées avec leurs anciennes entrées réécrites ; les paramètres par modèle copiés passent de l’ancienne clé à la clé canonique `openai/*`.
    - Les `modelProvider`/`providerOverride`, `model`/`modelOverride`, avis de secours, épingles de profil d’authentification et épingles de harnais Codex des sessions persistées sont réparés dans tous les magasins de sessions d’agent découverts.
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

  </Accordion>
  <Accordion title="2g. Nettoyage des routes de session">
    Doctor analyse également les magasins de sessions d’agent découverts à la recherche d’un état de route obsolète créé automatiquement après le déplacement de modèles configurés ou du runtime hors d’une route appartenant à un Plugin, comme Codex.

    `openclaw doctor --fix` peut effacer un état obsolète créé automatiquement, comme des épingles de modèle `modelOverrideSource: "auto"`, des métadonnées de modèle runtime, des ID de harnais épinglés, des liaisons de session CLI et des remplacements automatiques de profils d’authentification lorsque leur route propriétaire n’est plus configurée. Les choix explicites d’utilisateur ou de modèle de session héritée sont signalés pour examen manuel et laissés intacts ; changez-les avec `/model ...`, `/new` ou réinitialisez la session lorsque cette route n’est plus prévue.

  </Accordion>
  <Accordion title="3. Migrations d’état hérité (disposition sur disque)">
    Doctor peut migrer les anciennes dispositions sur disque vers la structure actuelle :

    - Magasin de sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire d’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

    Ces migrations sont effectuées au mieux et sont idempotentes ; Doctor émettra des avertissements lorsqu’il laisse d’anciens dossiers comme sauvegardes. Le Gateway/CLI migre aussi automatiquement l’ancien répertoire des sessions + de l’agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de Doctor. La migration de l’authentification WhatsApp est intentionnellement effectuée uniquement via `openclaw doctor`. La normalisation du fournisseur/de la carte de fournisseurs Talk compare désormais par égalité structurelle, donc les différences dues uniquement à l’ordre des clés ne déclenchent plus de modifications répétées sans effet avec `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrations des anciens manifestes de Plugin">
    Doctor analyse tous les manifestes de Plugin installés à la recherche de clés de capacité de niveau supérieur obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si la clé `contracts` contient déjà les mêmes valeurs, l’ancienne clé est supprimée sans duplication des données.
  </Accordion>
  <Accordion title="3b. Migrations des anciens magasins Cron">
    Doctor vérifie également le magasin des tâches cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) à la recherche d’anciennes formes de tâches que le planificateur accepte encore pour compatibilité.

    Les nettoyages cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de charge utile de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` de charge utile → `delivery.channel` explicite
    - anciennes tâches simples de repli webhook `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement les tâches `notify: true` que lorsqu'il peut le faire sans modifier le comportement. Si une tâche combine l'ancien repli notify avec un mode de livraison non Webhook existant, doctor avertit et laisse cette tâche pour une revue manuelle.

    Sous Linux, doctor avertit également lorsque la crontab de l'utilisateur invoque encore l'ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l'hôte n'est pas maintenu par OpenClaw actuel et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque cron ne peut pas atteindre le bus utilisateur systemd. Supprimez l'entrée crontab obsolète avec `crontab -e`; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les vérifications d'état actuelles.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d'agent à la recherche de fichiers de verrouillage en écriture obsolètes — des fichiers laissés lorsqu'une session s'est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale : le chemin, le PID, si le PID est toujours actif, l'âge du verrou et s'il est considéré comme obsolète (PID mort ou plus de 30 minutes). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon, il affiche une note et vous indique de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation de branche de transcription de session">
    Doctor analyse les fichiers JSONL de session d'agent à la recherche de la forme de branche dupliquée créée par le bug de réécriture de transcription d'invite de 2026.4.24 : un tour utilisateur abandonné avec le contexte d'exécution interne d'OpenClaw, plus un frère actif contenant la même invite utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier affecté à côté de l'original et réécrit la transcription vers la branche active afin que l'historique Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Vérifications d'intégrité de l'état (persistance des sessions, routage et sécurité)">
    Le répertoire d'état est le tronc cérébral opérationnel. S'il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d'état manquant** : avertit d'une perte d'état catastrophique, propose de recréer le répertoire et rappelle qu'il ne peut pas récupérer les données manquantes.
    - **Autorisations du répertoire d'état** : vérifie la possibilité d'écriture ; propose de réparer les autorisations (et émet une indication `chown` lorsqu'une incohérence de propriétaire/groupe est détectée).
    - **Répertoire d'état synchronisé avec le cloud sous macOS** : avertit lorsque l'état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins adossés à la synchronisation peuvent entraîner des E/S plus lentes et des courses de verrouillage/synchronisation.
    - **Répertoire d'état Linux sur SD ou eMMC** : avertit lorsque l'état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires adossées à SD ou eMMC peuvent être plus lentes et s'user plus vite lors des écritures de session et d'identifiants.
    - **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont requis pour persister l'historique et éviter les plantages `ENOENT`.
    - **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers de transcription manquants.
    - **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale n'a qu'une seule ligne (l'historique ne s'accumule pas).
    - **Plusieurs répertoires d'état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l'historique peut se répartir entre les installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l'exécuter sur l'hôte distant (l'état s'y trouve).
    - **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe/monde et propose de le restreindre à `600`.

  </Accordion>
  <Accordion title="5. Santé de l'authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le stockage d'authentification, avertit lorsque les jetons expirent ou ont expiré, et peut les actualiser lorsque c'est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin de jeton de configuration Anthropic. Les invites d'actualisation n'apparaissent que lors d'une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d'actualisation.

    Lorsqu'une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant` ou un fournisseur vous demandant de vous reconnecter), doctor signale qu'une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale également les profils d'authentification temporairement inutilisables à cause de :

    - courts délais d'attente (limites de débit/délais expirés/échecs d'authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au catalogue et à la liste d'autorisation, et avertit lorsqu'elle ne se résout pas ou qu'elle est interdite.
  </Accordion>
  <Accordion title="7. Réparation de l'image sandbox">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de compiler ou de basculer vers les noms hérités si l'image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Nettoyage de l'installation des Plugins">
    Doctor supprime l'ancien état de staging des dépendances de Plugin généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Cela couvre les racines de dépendances générées obsolètes, les anciens répertoires d'étape d'installation, les débris locaux au package issus du précédent code de réparation des dépendances de Plugins groupés, ainsi que les copies npm gérées orphelines ou récupérées des Plugins `@openclaw/*` groupés qui peuvent masquer le manifeste groupé actuel.

    Doctor peut également réinstaller les Plugins téléchargeables manquants lorsque la configuration les référence mais que le registre local des Plugins ne les trouve pas. Les exemples incluent les `plugins.entries` matériels, les paramètres configurés de canal/fournisseur/recherche et les runtimes d'agent configurés. Pendant les mises à jour de package, doctor évite d'exécuter la réparation de Plugins par gestionnaire de paquets pendant que le package principal est remplacé ; relancez `openclaw doctor --fix` après la mise à jour si un Plugin configuré nécessite encore une récupération. Le démarrage de Gateway et le rechargement de la configuration n'exécutent pas de gestionnaires de paquets ; les installations de Plugins restent un travail explicite de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrations du service Gateway et indications de nettoyage">
    Doctor détecte les anciens services Gateway (launchd/systemd/schtasks) et propose de les supprimer puis d'installer le service OpenClaw avec le port Gateway actuel. Il peut également rechercher des services supplémentaires ressemblant à Gateway et afficher des indications de nettoyage. Les services Gateway OpenClaw nommés par profil sont considérés comme de premier ordre et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service Gateway de niveau utilisateur est manquant mais qu'un service Gateway OpenClaw de niveau système existe, doctor n'installe pas automatiquement un second service de niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu'un superviseur système possède le cycle de vie de Gateway.

  </Accordion>
  <Accordion title="8b. Migration au démarrage de Matrix">
    Lorsqu'un compte de canal Matrix a une migration d'état héritée en attente ou exploitable, doctor (en mode `--fix` / `--repair`) crée un instantané préalable à la migration puis exécute les étapes de migration au mieux : migration de l'état Matrix hérité et préparation de l'état chiffré hérité. Les deux étapes sont non fatales ; les erreurs sont journalisées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage des appareils et dérive d'authentification">
    Doctor inspecte désormais l'état d'appairage des appareils dans le cadre du passage normal de santé.

    Ce qu'il signale :

    - demandes d'appairage initial en attente
    - mises à niveau de rôle en attente pour les appareils déjà appairés
    - mises à niveau de portée en attente pour les appareils déjà appairés
    - réparations d'incohérence de clé publique où l'identifiant d'appareil correspond toujours mais où l'identité de l'appareil ne correspond plus à l'enregistrement approuvé
    - enregistrements appairés sans jeton actif pour un rôle approuvé
    - jetons appairés dont les portées dérivent hors de la référence d'appairage approuvée
    - entrées locales mises en cache de jeton d'appareil pour la machine actuelle qui précèdent une rotation de jeton côté Gateway ou qui portent des métadonnées de portée obsolètes

    Doctor n'approuve pas automatiquement les demandes d'appairage et ne fait pas de rotation automatique des jetons d'appareil. Il affiche plutôt les étapes suivantes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela comble la faille courante « déjà appairé mais reçoit encore une exigence d'appairage » : doctor distingue désormais l'appairage initial des mises à niveau de rôle/portée en attente et de la dérive de jeton/identité d'appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu'un fournisseur est ouvert aux DM sans liste d'autorisation, ou lorsqu'une politique est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    S'il s'exécute comme service utilisateur systemd, doctor s'assure que la persistance est activée afin que Gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l'espace de travail (Skills, Plugins et répertoires hérités)">
    Doctor affiche un résumé de l'état de l'espace de travail pour l'agent par défaut :

    - **État des Skills** : compte les Skills éligibles, à prérequis manquants et bloquées par liste d'autorisation.
    - **Répertoires d'espace de travail hérités** : avertit lorsque `~/openclaw` ou d'autres répertoires d'espace de travail hérités existent à côté de l'espace de travail actuel.
    - **État des Plugins** : compte les Plugins activés/désactivés/en erreur ; liste les identifiants de Plugin pour toute erreur ; signale les capacités des Plugins groupés.
    - **Avertissements de compatibilité des Plugins** : signale les Plugins qui ont des problèmes de compatibilité avec le runtime actuel.
    - **Diagnostics des Plugins** : expose tous les avertissements ou erreurs au chargement émis par le registre des Plugins.

  </Accordion>
  <Accordion title="11b. Taille du fichier d'amorçage">
    Doctor vérifie si les fichiers d'amorçage de l'espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d'autres fichiers de contexte injectés) sont proches du budget de caractères configuré ou le dépassent. Il signale, par fichier, les nombres de caractères bruts par rapport aux caractères injectés, le pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total de caractères injectés comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des Plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un Plugin de canal manquant, il supprime également la configuration pendante limitée au canal qui référençait ce Plugin : entrées `channels.<id>`, cibles Heartbeat qui nommaient le canal et remplacements `agents.*.models["<channel>/*"]`. Cela empêche les boucles de démarrage de Gateway où le runtime du canal a disparu mais où la configuration demande encore à Gateway de s'y lier.
  </Accordion>
  <Accordion title="11c. Complétion shell">
    Doctor vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil shell utilise un modèle de complétion dynamique lent (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide de fichier mis en cache.
    - Si la complétion est configurée dans le profil mais que le fichier de cache est manquant, doctor régénère automatiquement le cache.
    - Si aucune complétion n'est configurée, doctor propose de l'installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

  </Accordion>
  <Accordion title="12. Vérifications d'authentification Gateway (jeton local)">
    Doctor vérifie que l'authentification par jeton Gateway local est prête.

    - Si le mode jeton nécessite un jeton et qu'aucune source de jeton n'existe, doctor propose d'en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l'écrase pas avec du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu'aucune SecretRef de jeton n'est configurée.

  </Accordion>
  <Accordion title="12b. Réparations tenant compte de SecretRef en lecture seule">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide à l’exécution.

    - `openclaw doctor --fix` utilise désormais le même modèle de résumé SecretRef en lecture seule que les commandes de la famille status pour les réparations ciblées de configuration.
    - Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` `@username` essaie d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou d’indiquer à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification de l’état du Gateway + redémarrage">
    Doctor exécute une vérification de l’état et propose de redémarrer le gateway lorsqu’il semble défectueux.
  </Accordion>
  <Accordion title="13b. Disponibilité de la recherche mémoire">
    Doctor vérifie si le fournisseur d’embeddings de recherche mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : vérifie si le binaire `qmd` est disponible et peut démarrer. Sinon, affiche des conseils de correction incluant le paquet npm et une option de chemin manuel vers le binaire.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distant/téléchargeable reconnue. S’il manque, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé d’API est présente dans l’environnement ou le magasin d’authentification. Affiche des conseils de correction actionnables si elle manque.
    - **Fournisseur automatique** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde Gateway mis en cache est disponible (le gateway était sain au moment de la vérification), doctor recoupe son résultat avec la configuration visible par la CLI et signale toute divergence. Doctor ne lance pas de nouveau ping d’embedding sur le chemin par défaut ; utilisez la commande d’état mémoire approfondie lorsque vous voulez une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la disponibilité des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le gateway est sain, doctor exécute une sonde d’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Doctor vérifie la configuration du superviseur installé (launchd/systemd/schtasks) afin de détecter les valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd network-online et le délai de redémarrage). Lorsqu’il trouve une incohérence, il recommande une mise à jour et peut réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

    Notes :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` garde doctor en lecture seule pour le cycle de vie du service gateway. Il signale toujours l’état du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/le bootstrap du service, les réécritures de configuration du superviseur et le nettoyage des anciens services, car un superviseur externe possède ce cycle de vie.
    - Sous Linux, doctor ne réécrit pas les métadonnées de commande/point d’entrée lorsque l’unité systemd gateway correspondante est active. Il ignore aussi les unités supplémentaires inactives de type gateway non héritées pendant l’analyse des services en doublon, afin que les fichiers de service compagnons ne créent pas de bruit de nettoyage.
    - Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service doctor valide le SecretRef mais ne persiste pas les valeurs de jeton en texte clair résolues dans les métadonnées d’environnement du service superviseur.
    - Doctor détecte les valeurs d’environnement de service gérées et adossées à `.env`/SecretRef que d’anciennes installations LaunchAgent, systemd ou Windows Scheduled Task intégraient en ligne, puis réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution au lieu de la définition du superviseur.
    - Doctor détecte lorsque la commande de service épingle encore un ancien `--port` après une modification de `gateway.port` et réécrit les métadonnées du service vers le port actuel.
    - Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des conseils actionnables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités systemd utilisateur Linux, les vérifications de dérive des jetons de doctor incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service doctor refusent de réécrire, d’arrêter ou de redémarrer un service gateway provenant d’un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Voir [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics d’exécution du Gateway + port">
    Doctor inspecte l’exécution du service (PID, dernier état de sortie) et avertit lorsque le service est installé mais ne s’exécute pas réellement. Il vérifie aussi les collisions de port sur le port du gateway (par défaut `18789`) et signale les causes probables (gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Doctor avertit lorsque le service gateway s’exécute sur Bun ou un chemin Node géré par version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram exigent Node, et les chemins de gestionnaire de versions peuvent casser après les mises à niveau, car le service ne charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif, afin que Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaires de versions ne changent pas le Node résolu par les processus enfants. Les services Linux conservent toujours des racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et des répertoires user-bin stables, mais les répertoires de secours devinés des gestionnaires de versions ne sont écrits dans le PATH du service que lorsque ces répertoires existent sur disque.

  </Accordion>
  <Accordion title="18. Écriture de configuration + métadonnées de l’assistant">
    Doctor persiste toute modification de configuration et marque les métadonnées de l’assistant pour enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système de mémoire)">
    Doctor suggère un système de mémoire d’espace de travail lorsqu’il manque et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Connexe

- [Runbook du Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
