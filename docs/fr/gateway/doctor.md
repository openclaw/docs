---
read_when:
    - Ajout ou modification des migrations doctor
    - Introduire des changements de configuration incompatibles
sidebarTitle: Doctor
summary: 'Commande Doctor : contrôles d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-05-11T20:36:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration pour OpenClaw. Il corrige les configurations et états obsolètes, vérifie l’état de santé et fournit des étapes de réparation applicables.

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

    Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation de redémarrage, service ou bac à sable le cas échéant).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applique les réparations recommandées sans demander de confirmation (réparations et redémarrages lorsque c’est sûr).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Applique aussi les réparations agressives (écrase les configurations personnalisées du superviseur).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    S’exécute sans invite et applique uniquement les migrations sûres (normalisation de configuration et déplacements d’état sur disque). Ignore les actions de redémarrage, service ou bac à sable qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

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
    - Mise à jour préliminaire facultative pour les installations git (interactive uniquement).
    - Vérification de fraîcheur du protocole d’interface utilisateur (reconstruit Control UI lorsque le schéma du protocole est plus récent).
    - Vérification de santé et invite de redémarrage.
    - Résumé de l’état des Skills (éligibles/manquants/bloqués) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de configuration pour les valeurs héritées.
    - Migration de la configuration Talk depuis les champs plats hérités `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les configurations héritées de l’extension Chrome et la disponibilité Chrome MCP.
    - Avertissements de remplacement du fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements de masquage OAuth Codex (`models.providers.openai-codex`).
    - Vérification des prérequis TLS OAuth pour les profils OpenAI Codex OAuth.
    - Avertissements de liste d’autorisation de plugins/outils lorsque `plugins.allow` est restrictive mais que la politique d’outils demande encore des outils génériques ou appartenant à un plugin.
    - Migration d’état hérité sur disque (sessions/répertoire d’agent/authentification WhatsApp).
    - Migration des clés de contrat de manifeste de plugin héritées (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration du magasin Cron hérité (`jobId`, `schedule.cron`, champs de livraison/charge utile de premier niveau, `provider` de charge utile, tâches Webhook de repli simples `notify: true`).
    - Nettoyage de la politique d’exécution héritée au niveau de l’agent entier ; la politique d’exécution fournisseur/modèle est le sélecteur de route actif.
    - Nettoyage de configuration de plugin obsolète lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugin obsolètes sont traitées comme une configuration de confinement inerte et sont conservées.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches de réécriture d’invite dupliquées créées par les builds 2026.4.24 affectés.
    - Détection des pierres tombales de récupération au redémarrage pour les sous-agents bloqués, avec prise en charge de `--fix` pour effacer les indicateurs de récupération abandonnée obsolètes afin que le démarrage ne continue pas à traiter l’enfant comme abandonné au redémarrage.
    - Vérifications d’intégrité d’état et d’autorisations (sessions, transcriptions, répertoire d’état).
    - Vérifications des permissions du fichier de configuration (chmod 600) lors d’une exécution locale.
    - Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de refroidissement/désactivation des profils d’authentification.
    - Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image de bac à sable lorsque le bac à sable est activé.
    - Migration des services hérités et détection de Gateway supplémentaire.
    - Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution du Gateway (service installé mais non lancé ; libellé launchd mis en cache).
    - Avertissements d’état des canaux (sondés depuis le Gateway en cours d’exécution).
    - Les vérifications d’autorisations propres aux canaux se trouvent sous `openclaw channels capabilities` ; par exemple, les autorisations de canal vocal Discord sont auditées avec `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Vérifications de réactivité WhatsApp pour une santé dégradée de la boucle d’événements du Gateway avec des clients TUI locaux encore en cours d’exécution ; `--fix` arrête uniquement les clients TUI locaux vérifiés.
    - Réparation de route Codex pour les références de modèle héritées `openai-codex/*` dans les modèles principaux, replis, remplacements heartbeat/sous-agent/compaction, hooks, remplacements de modèle de canal et épingles de route de session ; `--fix` les réécrit en `openai/*`, supprime les épingles d’exécution de session/agent entier obsolètes et laisse les références canoniques d’agent OpenAI sur le harnais Codex par défaut.
    - Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement de proxy intégré pour les services Gateway ayant capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` pendant l’installation ou la mise à jour.
    - Vérifications des bonnes pratiques d’exécution du Gateway (Node vs Bun, chemins de gestionnaires de version).
    - Diagnostics de collision de port du Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et appairage">
    - Avertissements de sécurité pour les politiques de messages privés ouverts.
    - Vérifications d’authentification du Gateway pour le mode jeton local (propose la génération d’un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations SecretRef de jeton).
    - Détection des problèmes d’appairage d’appareil (demandes de premier appairage en attente, mises à niveau de rôle/portée en attente, dérive obsolète du cache local de jeton d’appareil et dérive d’authentification des enregistrements appairés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Vérification de linger systemd sous Linux.
    - Vérification de la taille des fichiers d’amorçage d’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Vérification de disponibilité des Skills pour l’agent par défaut ; signale les Skills autorisées avec binaires, environnement, configuration ou exigences d’OS manquants, et `--fix` peut désactiver les Skills indisponibles dans `skills.entries`.
    - Vérification de l’état de la complétion shell et installation/mise à niveau automatique.
    - Vérification de disponibilité du fournisseur d’embeddings de recherche mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Vérifications d’installation depuis les sources (incompatibilité d’espace de travail pnpm, ressources d’interface utilisateur manquantes, binaire tsx manquant).
    - Écrit la configuration et les métadonnées d’assistant mises à jour.

  </Accordion>
</AccordionGroup>

## Remplissage rétroactif et réinitialisation de l’interface Dreams

La scène Dreams de Control UI inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le flux de travail Dreaming ancré. Ces actions utilisent des méthodes RPC de style doctor du Gateway, mais elles ne font **pas** partie de la réparation/migration CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM ancrée et écrit des entrées de remplissage rétroactif réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de remplissage rétroactif marquées dans `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées court terme préparées, ancrées uniquement, provenant de la relecture historique et n’ayant pas encore accumulé de rappel en direct ni de prise en charge quotidienne.

Ce qu’elles ne font **pas** par elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne préparent pas automatiquement les candidats ancrés dans le magasin de promotion court terme en direct, sauf si vous exécutez explicitement le chemin CLI préparé d’abord

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare les candidats durables ancrés dans le magasin de Dreaming court terme tout en conservant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose de mettre à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement propre au canal), doctor les normalise dans le schéma actuel.

    Cela inclut les champs plats Talk hérités. La configuration publique actuelle de parole Talk est `talk.provider` + `talk.providers.<provider>`, et la configuration de voix temps réel est `talk.realtime.*`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la carte fournisseur, et réécrit les anciens sélecteurs temps réel de premier niveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) dans `talk.realtime`.

    Doctor avertit aussi lorsque `plugins.allow` n’est pas vide et que la politique d’outils utilise
    des entrées d’outils génériques ou appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils
    provenant de plugins qui se chargent réellement ; cela ne contourne pas la liste
    d’autorisation exclusive des plugins. Doctor écrit `plugins.bundledDiscovery: "compat"` pour les configurations
    de liste d’autorisation héritées migrées afin de préserver le comportement existant des fournisseurs intégrés, puis
    pointe vers le paramètre plus strict `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrations de clés de configuration héritées">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous demandent de lancer `openclaw doctor`.

    Doctor va :

    - Expliquer quelles clés héritées ont été trouvées.
    - Montrer la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    Le démarrage du Gateway refuse les formats de configuration hérités et vous demande d’exécuter `openclaw doctor --fix` ; il ne réécrit pas `openclaw.json` au démarrage. Les migrations du magasin de tâches Cron sont également prises en charge par `openclaw doctor --fix`.

    Migrations actuelles :

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configs de canaux configurés sans politique de réponse visible → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de premier niveau
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - anciens `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - anciens sélecteurs Talk temps réel de premier niveau (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Pour les canaux avec des `accounts` nommés mais des valeurs de canal de premier niveau à compte unique persistantes, déplacez ces valeurs limitées au compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimer `agents.defaults.llm` ; utilisez `models.providers.<id>.timeoutSeconds` pour les délais d’expiration des fournisseurs/modèles lents
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du gateway ignore aussi les fournisseurs dont `api` est défini sur une valeur d’énumération future ou inconnue au lieu d’échouer fermé)
    - supprimer `plugins.entries.codex.config.codexDynamicToolsProfile` ; le serveur d’application Codex conserve toujours les outils d’espace de travail natifs de Codex comme natifs

    Les avertissements de doctor incluent aussi des consignes de compte par défaut pour les canaux à plusieurs comptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de repli peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, doctor avertit et liste les ID de compte configurés.

  </Accordion>
  <Accordion title="2b. Remplacements de fournisseur OpenCode">
    Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cela remplace le catalogue OpenCode intégré provenant de `@earendil-works/pi-ai`. Cela peut forcer les modèles à utiliser la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et restaurer le routage d’API et les coûts par modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation à Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin supprimé de l’extension Chrome, doctor la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version de Chrome détectée et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage à distance dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer le paramètre côté Chrome pour vous. Chrome MCP local à l’hôte nécessite toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte du gateway/node
    - le navigateur exécuté localement
    - le débogage à distance activé dans ce navigateur
    - l’approbation de la première invite de consentement d’attachement dans le navigateur

    La préparation ici concerne uniquement les prérequis d’attachement local. Existing-session conserve les limites de routes Chrome MCP actuelles ; les routes avancées comme `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, au sandbox, à remote-browser ni aux autres flux headless. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis OAuth TLS">
    Lorsqu’un profil OpenAI Codex OAuth est configuré, doctor sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS locale Node/OpenSSL peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat auto-signé), doctor affiche des consignes de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements de fournisseur OAuth Codex">
    Si vous avez déjà ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin de fournisseur OAuth Codex intégré que les versions récentes utilisent automatiquement. Doctor avertit lorsqu’il voit ces anciens paramètres de transport avec Codex OAuth afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le routage/comportement de repli intégré. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Réparation des routes Codex">
    Doctor vérifie la présence d’anciennes refs de modèle `openai-codex/*`. Le routage natif du harnais Codex utilise les refs de modèle canoniques `openai/*` ; les tours d’agent OpenAI passent par le harnais de serveur d’application Codex au lieu du chemin OpenAI PI d’OpenClaw.

    En mode `--fix` / `--repair`, doctor réécrit les refs affectées de l’agent par défaut et de chaque agent, y compris les modèles principaux, les replis, les remplacements heartbeat/subagent/compaction, les hooks, les remplacements de modèle par canal et l’état de route de session persisté obsolète :

    - `openai-codex/gpt-*` devient `openai/gpt-*`.
    - L’intention Codex est déplacée vers des entrées `agentRuntime.id: "codex"` limitées au fournisseur/modèle pour les refs de modèle d’agent réparées, afin que les profils d’authentification `openai-codex:...` puissent encore être sélectionnés après que la ref de modèle devient `openai/*`.
    - La configuration d’exécution d’agent entière obsolète et les pins d’exécution de session persistés sont supprimés, car la sélection d’exécution est limitée au fournisseur/modèle.
    - La politique d’exécution fournisseur/modèle existante est conservée, sauf si la ref de modèle ancienne réparée nécessite un routage Codex pour conserver l’ancien chemin d’authentification.
    - Les listes de replis de modèles existantes sont conservées avec leurs entrées héritées réécrites ; les paramètres par modèle copiés passent de l’ancienne clé à la clé canonique `openai/*`.
    - Les `modelProvider`/`providerOverride`, `model`/`modelOverride`, avis de repli et pins de profil d’authentification de session persistés sont réparés dans tous les magasins de sessions d’agents découverts.
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

  </Accordion>
  <Accordion title="2g. Nettoyage des routes de session">
    Doctor analyse aussi les magasins de sessions d’agents découverts pour rechercher un état de route obsolète créé automatiquement après que vous avez déplacé les modèles configurés ou l’exécution hors d’une route appartenant à un Plugin, comme Codex.

    `openclaw doctor --fix` peut effacer l’état obsolète créé automatiquement, comme les pins de modèle `modelOverrideSource: "auto"`, les métadonnées de modèle d’exécution, les ID de harnais épinglés, les liaisons de session CLI et les remplacements automatiques de profil d’authentification lorsque leur route propriétaire n’est plus configurée. Les choix explicites d’utilisateur ou de modèle de session hérité sont signalés pour examen manuel et laissés intacts ; changez-les avec `/model ...`, `/new`, ou réinitialisez la session lorsque cette route n’est plus prévue.

  </Accordion>
  <Accordion title="3. Migrations d’état héritées (agencement disque)">
    Doctor peut migrer les anciens agencements sur disque vers la structure actuelle :

    - Magasin de sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire d’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis les anciens `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

    Ces migrations sont au mieux et idempotentes ; doctor émettra des avertissements lorsqu’il laissera d’anciens dossiers en place comme sauvegardes. Le Gateway/CLI migre aussi automatiquement les anciennes sessions + le répertoire d’agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp n’est volontairement migrée que via `openclaw doctor`. La normalisation fournisseur/carte de fournisseurs Talk compare désormais par égalité structurelle, de sorte que les différences limitées à l’ordre des clés ne déclenchent plus de modifications répétées sans effet par `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrations des manifestes de Plugin hérités">
    Doctor analyse tous les manifestes de Plugin installés pour rechercher les clés de capacité de premier niveau obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si la clé `contracts` possède déjà les mêmes valeurs, l’ancienne clé est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations de magasin Cron héritées">
    Doctor vérifie aussi le magasin des tâches cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) pour rechercher les anciennes formes de tâches que le planificateur accepte encore pour compatibilité.

    Les nettoyages cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de payload de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` du payload → `delivery.channel` explicite
    - anciens jobs webhook de repli simples `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement les jobs `notify: true` que lorsqu’il peut le faire sans changer le comportement. Si un job combine l’ancien repli de notification avec un mode de livraison non-webhook existant, doctor émet un avertissement et laisse ce job pour un examen manuel.

    Sous Linux, doctor avertit aussi lorsque la crontab de l’utilisateur invoque encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l’hôte n’est pas maintenu par la version actuelle d’OpenClaw et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque cron ne peut pas atteindre le bus utilisateur systemd. Supprimez l’entrée de crontab obsolète avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les vérifications d’état actuelles.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale : le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort, plus ancien que 30 minutes, ou PID actif dont il peut être prouvé qu’il appartient à un processus non-OpenClaw). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon, il affiche une note et vous indique de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation des branches de transcription de session">
    Doctor analyse les fichiers JSONL de session d’agent à la recherche de la forme de branche dupliquée créée par le bug de réécriture de transcription de prompt du 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne d’OpenClaw plus un frère actif contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier affecté à côté de l’original et réécrit la transcription vers la branche active afin que l’historique du Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Vérifications d’intégrité de l’état (persistance de session, routage et sécurité)">
    Le répertoire d’état est le centre opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte catastrophique de l’état, propose de recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Permissions du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les permissions (et émet une indication `chown` lorsqu’une incohérence de propriétaire/groupe est détectée).
    - **Répertoire d’état synchronisé avec le cloud sur macOS** : avertit lorsque l’état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins adossés à la synchronisation peuvent ralentir les E/S et provoquer des courses verrou/synchronisation.
    - **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires adossées à SD ou eMMC peuvent être plus lentes et user plus vite le support lors des écritures de session et d’identifiants.
    - **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont requis pour persister l’historique et éviter les plantages `ENOENT`.
    - **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers de transcription manquants.
    - **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale ne contient qu’une seule ligne (l’historique ne s’accumule pas).
    - **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se répartir entre les installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe ou par tout le monde et propose de le restreindre à `600`.

  </Accordion>
  <Accordion title="5. État de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque des jetons arrivent à expiration ou ont expiré, et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin setup-token Anthropic. Les invites d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou lorsqu’un fournisseur vous demande de vous reconnecter), doctor indique qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale également les profils d’authentification temporairement inutilisables en raison de :

    - courts délais d’attente (limites de débit/expirations/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au catalogue et à la liste d’autorisation, et avertit lorsqu’elle ne se résoudra pas ou n’est pas autorisée.
  </Accordion>
  <Accordion title="7. Réparation de l’image de sandbox">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou de basculer vers des noms hérités si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Nettoyage de l’installation des Plugins">
    Doctor supprime l’état hérité de préparation des dépendances de Plugin généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Cela couvre les racines de dépendances générées obsolètes, les anciens répertoires d’étape d’installation, les débris locaux au paquet provenant du code précédent de réparation des dépendances de Plugins groupés, ainsi que les copies npm gérées orphelines ou récupérées des Plugins `@openclaw/*` groupés qui peuvent masquer le manifeste groupé actuel.

    Doctor peut également réinstaller les Plugins téléchargeables manquants lorsque la configuration les référence mais que le registre de Plugins local ne peut pas les trouver. Les exemples incluent les `plugins.entries` matériels, les paramètres configurés de canal/fournisseur/recherche et les runtimes d’agent configurés. Lors des mises à jour de paquet, doctor évite d’exécuter la réparation de Plugin par gestionnaire de paquets pendant que le paquet principal est remplacé ; relancez `openclaw doctor --fix` après la mise à jour si un Plugin configuré doit encore être récupéré. Le démarrage du Gateway et le rechargement de configuration n’exécutent pas de gestionnaires de paquets ; les installations de Plugins restent des opérations explicites doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrations du service Gateway et indications de nettoyage">
    Doctor détecte les services Gateway hérités (launchd/systemd/schtasks) et propose de les supprimer puis d’installer le service OpenClaw avec le port Gateway actuel. Il peut aussi rechercher des services supplémentaires de type Gateway et afficher des indications de nettoyage. Les services Gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service Gateway au niveau utilisateur est manquant mais qu’un service Gateway OpenClaw au niveau système existe, doctor n’installe pas automatiquement un deuxième service au niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système possède le cycle de vie du Gateway.

  </Accordion>
  <Accordion title="8b. Migration Matrix au démarrage">
    Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable, doctor (en mode `--fix` / `--repair`) crée un instantané avant migration, puis exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation de l’état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont consignées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage des appareils et dérive d’authentification">
    Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage normal de santé.

    Ce qu’il signale :

    - demandes de premier appairage en attente
    - mises à niveau de rôle en attente pour des appareils déjà appairés
    - mises à niveau de portée en attente pour des appareils déjà appairés
    - réparations d’incohérence de clé publique où l’id d’appareil correspond encore mais où l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - enregistrements appairés sans jeton actif pour un rôle approuvé
    - jetons appairés dont les portées dérivent hors de la base d’appairage approuvée
    - entrées locales mises en cache de jetons d’appareil pour la machine actuelle qui précèdent une rotation de jeton côté Gateway ou portent des métadonnées de portée obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage et ne fait pas tourner automatiquement les jetons d’appareil. Il affiche plutôt les prochaines étapes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela ferme la faille courante « déjà appairé mais appairage toujours requis » : doctor distingue désormais le premier appairage des mises à niveau de rôle/portée en attente et de la dérive de jeton/identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux DM sans liste d’autorisation, ou lorsqu’une stratégie est configurée de façon dangereuse.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    S’il s’exécute comme service utilisateur systemd, doctor s’assure que le maintien de session est activé afin que le Gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (Skills, Plugins et répertoires hérités)">
    Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les Skills éligibles, aux exigences manquantes et bloquées par liste d’autorisation.
    - **Répertoires d’espace de travail hérités** : avertit lorsque `~/openclaw` ou d’autres répertoires d’espace de travail hérités existent à côté de l’espace de travail actuel.
    - **État des Plugins** : compte les Plugins activés/désactivés/en erreur ; liste les ID de Plugin pour toutes les erreurs ; signale les capacités des Plugins groupés.
    - **Avertissements de compatibilité des Plugins** : signale les Plugins qui ont des problèmes de compatibilité avec le runtime actuel.
    - **Diagnostics des Plugins** : fait remonter tout avertissement ou toute erreur au chargement émis par le registre de Plugins.

  </Accordion>
  <Accordion title="11b. Taille du fichier de bootstrap">
    Doctor vérifie si les fichiers de bootstrap de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches du budget de caractères configuré ou le dépassent. Il signale, par fichier, le nombre de caractères bruts par rapport aux caractères injectés, le pourcentage de troncature, la cause de troncature (`max/file` ou `max/total`) et le total des caractères injectés comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des Plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un Plugin de canal manquant, il supprime aussi la configuration orpheline à portée canal qui référençait ce Plugin : entrées `channels.<id>`, cibles Heartbeat qui nommaient le canal et surcharges `agents.*.models["<channel>/*"]`. Cela empêche les boucles de démarrage du Gateway où le runtime de canal a disparu mais où la configuration demande encore au Gateway de s’y lier.
  </Accordion>
  <Accordion title="11c. Complétion du shell">
    Doctor vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil de shell utilise un motif de complétion dynamique lent (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide par fichier mis en cache.
    - Si la complétion est configurée dans le profil mais que le fichier de cache est manquant, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

  </Accordion>
  <Accordion title="12. Vérifications d’authentification du Gateway (jeton local)">
    Doctor vérifie que l’authentification par jeton du gateway local est prête.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l’écrase pas avec du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucune SecretRef de jeton n’est configurée.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule compatibles avec SecretRef">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide à l’exécution.

    - `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour les réparations de configuration ciblées.
    - Exemple : la réparation de Telegram `allowFrom` / `groupAllowFrom` `@username` essaie d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor indique que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification d’état du Gateway + redémarrage">
    Doctor exécute une vérification d’état et propose de redémarrer le gateway lorsqu’il semble défaillant.
  </Accordion>
  <Accordion title="13b. Préparation de la recherche mémoire">
    Doctor vérifie si le fournisseur d’embeddings de recherche mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : vérifie si le binaire `qmd` est disponible et peut être démarré. Sinon, affiche des conseils de correction incluant le paquet npm et une option de chemin de binaire manuel.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distante/téléchargeable reconnue. S’il est manquant, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé d’API est présente dans l’environnement ou le magasin d’authentification. Affiche des pistes de correction actionnables si elle est manquante.
    - **Fournisseur auto** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde du gateway mis en cache est disponible (le gateway était sain au moment de la vérification), doctor croise son résultat avec la configuration visible par la CLI et signale toute divergence. Doctor ne lance pas de nouveau ping d’embeddings dans le chemin par défaut ; utilisez la commande d’état mémoire approfondi lorsque vous voulez une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le gateway est sain, doctor exécute une sonde d’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Doctor vérifie la configuration du superviseur installée (launchd/systemd/schtasks) pour détecter les valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd network-online et le délai de redémarrage). Lorsqu’il trouve une divergence, il recommande une mise à jour et peut réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

    Notes :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` garde doctor en lecture seule pour le cycle de vie du service gateway. Il signale toujours l’état du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service, les réécritures de configuration du superviseur et le nettoyage des anciens services, car un superviseur externe possède ce cycle de vie.
    - Sous Linux, doctor ne réécrit pas les métadonnées de commande/point d’entrée tant que l’unité systemd gateway correspondante est active. Il ignore également les unités inactives supplémentaires non héritées de type gateway pendant l’analyse des services en double afin que les fichiers de service compagnons ne créent pas de bruit de nettoyage.
    - Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service par doctor valide la SecretRef mais ne persiste pas les valeurs de jeton en clair résolues dans les métadonnées d’environnement du service superviseur.
    - Doctor détecte les valeurs d’environnement de service gérées par `.env`/SecretRef que d’anciennes installations LaunchAgent, systemd ou Windows Scheduled Task avaient intégrées en ligne, puis réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution au lieu de la définition du superviseur.
    - Doctor détecte lorsque la commande de service fixe encore un ancien `--port` après des changements de `gateway.port` et réécrit les métadonnées du service avec le port actuel.
    - Si l’authentification par jeton nécessite un jeton et que la SecretRef de jeton configurée n’est pas résolue, doctor bloque le chemin d’installation/réparation avec des conseils actionnables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités Linux user-systemd, les vérifications de dérive des jetons par doctor incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service par doctor refusent de réécrire, d’arrêter ou de redémarrer un service gateway provenant d’un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Voir [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics d’exécution + port du Gateway">
    Doctor inspecte l’exécution du service (PID, dernier état de sortie) et avertit lorsque le service est installé mais ne tourne pas réellement. Il vérifie également les collisions de port sur le port du gateway (par défaut `18789`) et signale les causes probables (gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Doctor avertit lorsque le service gateway s’exécute sur Bun ou sur un chemin Node géré par version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node, et les chemins de gestionnaire de versions peuvent casser après des mises à niveau, car le service ne charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif, afin que les binaires système gérés par Homebrew restent disponibles tandis que Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaire de versions ne modifient pas le Node que les processus enfants résolvent. Les services Linux conservent toujours les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires user-bin stables, mais les répertoires de secours supposés des gestionnaires de versions ne sont écrits dans le PATH du service que lorsque ces répertoires existent sur le disque.

  </Accordion>
  <Accordion title="18. Écriture de configuration + métadonnées de l’assistant">
    Doctor persiste tout changement de configuration et marque les métadonnées de l’assistant pour enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système de mémoire)">
    Doctor suggère un système de mémoire d’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Connexe

- [Runbook du Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
