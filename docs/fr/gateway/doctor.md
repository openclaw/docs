---
read_when:
    - Ajout ou modification des migrations doctor
    - Introduire des changements de configuration incompatibles
sidebarTitle: Doctor
summary: 'Commande doctor : contrôles d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-05-12T08:45:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration d’OpenClaw. Il corrige les configurations et états obsolètes, vérifie l’état de santé et fournit des étapes de réparation actionnables.

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

    Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de redémarrage, service ou réparation du bac à sable, le cas échéant).

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

    S’exécute sans invite et n’applique que les migrations sûres (normalisation de la configuration et déplacements d’état sur disque). Ignore les actions de redémarrage, de service et de bac à sable qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système à la recherche d’installations de gateway supplémentaires (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si vous voulez examiner les modifications avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

<AccordionGroup>
  <Accordion title="Santé, UI et mises à jour">
    - Mise à jour préalable facultative pour les installations git (interactif uniquement).
    - Vérification de la fraîcheur du protocole UI (reconstruit Control UI lorsque le schéma de protocole est plus récent).
    - Vérification de santé + invite de redémarrage.
    - Résumé de l’état des Skills (éligibles/manquantes/bloquées) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de la configuration pour les valeurs héritées.
    - Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les anciennes configurations d’extension Chrome et la disponibilité de Chrome MCP.
    - Avertissements sur les remplacements de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements d’occultation OAuth Codex (`models.providers.openai-codex`).
    - Vérification des prérequis OAuth TLS pour les profils OAuth OpenAI Codex.
    - Avertissements de liste d’autorisation de plugins/outils lorsque `plugins.allow` est restrictive mais que la politique d’outils demande encore le caractère générique ou des outils appartenant à un plugin.
    - Migration de l’état hérité sur disque (sessions/répertoire d’agent/authentification WhatsApp).
    - Migration des anciennes clés de contrat de manifeste de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration de l’ancien magasin Cron (`jobId`, `schedule.cron`, champs de livraison/charge utile de premier niveau, `provider` de charge utile, tâches de repli webhook simples `notify: true`).
    - Nettoyage de l’ancienne politique d’exécution globale de l’agent ; la politique d’exécution fournisseur/modèle est le sélecteur de route actif.
    - Nettoyage des configurations de plugin obsolètes lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugins obsolètes sont traitées comme une configuration de confinement inerte et sont conservées.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection du fichier de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches de réécriture de prompt dupliquées créées par les builds 2026.4.24 affectés.
    - Détection des pierres tombales de récupération après redémarrage de sous-agent bloqué, avec prise en charge de `--fix` pour effacer les indicateurs obsolètes de récupération abandonnée afin que le démarrage ne continue pas à traiter l’enfant comme abandonné au redémarrage.
    - Vérifications d’intégrité de l’état et des autorisations (sessions, transcriptions, répertoire d’état).
    - Vérifications des autorisations du fichier de configuration (chmod 600) lors d’une exécution locale.
    - Santé de l’authentification du modèle : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de délai de récupération/désactivation des profils d’authentification.
    - Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image de bac à sable lorsque le bac à sable est activé.
    - Migration des services hérités et détection de gateways supplémentaires.
    - Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution du Gateway (service installé mais non en cours d’exécution ; libellé launchd mis en cache).
    - Avertissements d’état des canaux (sondés depuis le gateway en cours d’exécution).
    - Les vérifications d’autorisations propres aux canaux se trouvent sous `openclaw channels capabilities` ; par exemple, les autorisations de canal vocal Discord sont auditées avec `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Vérifications de réactivité WhatsApp pour un état dégradé de la boucle d’événements du Gateway avec des clients TUI locaux encore en cours d’exécution ; `--fix` arrête uniquement les clients TUI locaux vérifiés.
    - Réparation de route Codex pour les anciennes références de modèle `openai-codex/*` dans les modèles principaux, les replis, les remplacements heartbeat/sous-agent/compaction, les hooks, les remplacements de modèle par canal et les épingles de route de session ; `--fix` les réécrit en `openai/*`, supprime les anciennes épingles d’exécution de session/agent global et laisse les références canoniques d’agent OpenAI sur le harnais Codex par défaut.
    - Audit de la configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement de proxy intégré pour les services Gateway qui ont capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` lors de l’installation ou de la mise à jour.
    - Vérifications des bonnes pratiques d’exécution du Gateway (Node ou Bun, chemins de gestionnaire de versions).
    - Diagnostics de collision de port du Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et association">
    - Avertissements de sécurité pour les politiques de DM ouverts.
    - Vérifications d’authentification du Gateway pour le mode jeton local (propose la génération d’un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations de jeton SecretRef).
    - Détection des problèmes d’association d’appareils (demandes de première association en attente, mises à niveau de rôle/portée en attente, dérive obsolète du cache local de jetons d’appareil et dérive d’authentification des enregistrements associés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Vérification de linger systemd sous Linux.
    - Vérification de la taille du fichier d’amorçage de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Vérification de disponibilité des Skills pour l’agent par défaut ; signale les Skills autorisées avec binaires, environnement, configuration ou prérequis d’OS manquants, et `--fix` peut désactiver les Skills indisponibles dans `skills.entries`.
    - Vérification de l’état de la complétion shell et installation/mise à niveau automatique.
    - Vérification de disponibilité du fournisseur d’embeddings de recherche mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Vérifications d’installation depuis les sources (incompatibilité d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Remplissage rétroactif et réinitialisation de l’UI Dreams

La scène Dreams de Control UI inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de dreaming ancré. Ces actions utilisent des méthodes RPC de style gateway doctor, mais elles ne font **pas** partie de la réparation/migration CLI de `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM ancrée et écrit des entrées de remplissage rétroactif réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de remplissage rétroactif marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées court terme préparées et exclusivement ancrées qui proviennent de la relecture historique et n’ont pas encore accumulé de rappel en direct ni de support quotidien.

Ce qu’elles ne font **pas** par elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne préparent pas automatiquement les candidats ancrés dans le magasin de promotion court terme en direct, sauf si vous exécutez explicitement d’abord le chemin CLI de préparation

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare les candidats durables ancrés dans le magasin de dreaming court terme tout en gardant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute de façon interactive, il propose une mise à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de la configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement propre au canal), doctor les normalise dans le schéma actuel.

    Cela inclut les anciens champs plats Talk. La configuration publique actuelle de synthèse vocale Talk est `talk.provider` + `talk.providers.<provider>`, et la configuration vocale temps réel est `talk.realtime.*`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la carte des fournisseurs, et réécrit les anciens sélecteurs temps réel de premier niveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) dans `talk.realtime`.

    Doctor avertit aussi lorsque `plugins.allow` n’est pas vide et que la politique d’outils utilise
    des entrées d’outils génériques ou appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils
    provenant des plugins qui se chargent réellement ; il ne contourne pas la liste d’autorisation exclusive
    des plugins. Doctor écrit `plugins.bundledDiscovery: "compat"` pour les configurations
    héritées de liste d’autorisation migrées afin de préserver le comportement existant des fournisseurs groupés, puis
    pointe vers le réglage plus strict `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrations des clés de configuration héritées">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous demandent d’exécuter `openclaw doctor`.

    Doctor va :

    - Expliquer quelles clés héritées ont été trouvées.
    - Afficher la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    Le démarrage du Gateway refuse les formats de configuration hérités et vous demande d’exécuter `openclaw doctor --fix` ; il ne réécrit pas `openclaw.json` au démarrage. Les migrations du magasin de tâches Cron sont également gérées par `openclaw doctor --fix`.

    Migrations actuelles :

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configs de canaux configurés sans politique de réponse visible → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Pour les canaux avec des `accounts` nommés mais des valeurs de canal de niveau supérieur à compte unique encore présentes, déplacer ces valeurs propres au compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimer `agents.defaults.llm` ; utiliser `models.providers.<id>.timeoutSeconds` pour les délais d’expiration des fournisseurs/modèles lents
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du gateway ignore aussi les fournisseurs dont `api` est défini sur une valeur d’énumération future ou inconnue au lieu d’échouer en mode fermé)
    - supprimer `plugins.entries.codex.config.codexDynamicToolsProfile` ; le serveur d’application Codex conserve toujours les outils d’espace de travail natifs Codex comme natifs

    Les avertissements de doctor incluent aussi des conseils de compte par défaut pour les canaux à plusieurs comptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de repli peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, doctor avertit et liste les ID de compte configurés.

  </Accordion>
  <Accordion title="2b. Remplacements du fournisseur OpenCode">
    Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cela remplace le catalogue OpenCode intégré provenant de `@earendil-works/pi-ai`. Cela peut forcer des modèles vers la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et restaurer le routage API ainsi que les coûts par modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation à Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin d’extension Chrome supprimé, doctor la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version de Chrome détectée et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage à distance dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer le paramètre côté Chrome pour vous. Chrome MCP local à l’hôte nécessite toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
    - le navigateur exécuté localement
    - le débogage à distance activé dans ce navigateur
    - l’approbation de la première invite de consentement d’attachement dans le navigateur

    La préparation ici ne concerne que les prérequis d’attachement local. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, sandbox, remote-browser ni aux autres flux headless. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis OAuth TLS">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS Node/OpenSSL locale peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat autosigné), doctor affiche des conseils de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements du fournisseur OAuth Codex">
    Si vous avez précédemment ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin de fournisseur OAuth Codex intégré que les versions plus récentes utilisent automatiquement. Doctor avertit lorsqu’il voit ces anciens paramètres de transport avec OAuth Codex afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le comportement intégré de routage/repli. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Réparation des routes Codex">
    Doctor vérifie la présence d’anciennes références de modèle `openai-codex/*`. Le routage du harnais Codex natif utilise des références de modèle canoniques `openai/*` ; les tours d’agent OpenAI passent par le harnais du serveur d’application Codex au lieu du chemin OpenClaw PI OpenAI.

    En mode `--fix` / `--repair`, doctor réécrit les références d’agent par défaut et par agent concernées, y compris les modèles principaux, replis, remplacements heartbeat/subagent/compaction, hooks, remplacements de modèles de canal et état de route de session persisté obsolète :

    - `openai-codex/gpt-*` devient `openai/gpt-*`.
    - L’intention Codex est déplacée vers des entrées `agentRuntime.id: "codex"` portées par le fournisseur/modèle pour les références de modèle d’agent réparées, afin que les profils d’authentification `openai-codex:...` puissent toujours être sélectionnés après que la référence de modèle devient `openai/*`.
    - La configuration d’exécution d’agent entière obsolète et les épingles d’exécution de session persistées sont supprimées, car la sélection d’exécution est portée par le fournisseur/modèle.
    - La politique d’exécution fournisseur/modèle existante est conservée, sauf si l’ancienne référence de modèle réparée a besoin du routage Codex pour conserver l’ancien chemin d’authentification.
    - Les listes de repli de modèle existantes sont conservées avec leurs entrées héritées réécrites ; les paramètres par modèle copiés sont déplacés de l’ancienne clé vers la clé canonique `openai/*`.
    - Les `modelProvider`/`providerOverride`, `model`/`modelOverride`, avis de repli et épingles de profil d’authentification de session persistés sont réparés dans tous les magasins de sessions d’agent découverts.
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

  </Accordion>
  <Accordion title="2g. Nettoyage des routes de session">
    Doctor analyse aussi les magasins de sessions d’agent découverts à la recherche d’un état de route obsolète créé automatiquement après le déplacement de modèles configurés ou de l’exécution hors d’une route détenue par un Plugin, comme Codex.

    `openclaw doctor --fix` peut effacer l’état obsolète créé automatiquement, comme les épingles de modèle `modelOverrideSource: "auto"`, les métadonnées de modèle d’exécution, les ID de harnais épinglés, les liaisons de session CLI et les remplacements automatiques de profil d’authentification lorsque leur route propriétaire n’est plus configurée. Les choix explicites d’utilisateur ou de modèle de session hérité sont signalés pour examen manuel et laissés intacts ; changez-les avec `/model ...`, `/new` ou réinitialisez la session lorsque cette route n’est plus prévue.

  </Accordion>
  <Accordion title="3. Migrations d’état héritées (agencement disque)">
    Doctor peut migrer d’anciens agencements sur disque vers la structure actuelle :

    - Magasin de sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire d’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

    Ces migrations sont en mode meilleur effort et idempotentes ; doctor émettra des avertissements lorsqu’il laisse d’anciens dossiers comme sauvegardes. Le Gateway/CLI migre aussi automatiquement l’ancien répertoire de sessions + agent au démarrage, afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp n’est intentionnellement migrée que via `openclaw doctor`. La normalisation du fournisseur/de la carte de fournisseurs Talk compare désormais par égalité structurelle, de sorte que les différences portant uniquement sur l’ordre des clés ne déclenchent plus de changements `doctor --fix` no-op répétés.

  </Accordion>
  <Accordion title="3a. Migrations d’anciens manifests de Plugins">
    Doctor analyse tous les manifests de Plugins installés à la recherche de clés de capacités de niveau supérieur obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifest sur place. Cette migration est idempotente ; si la clé `contracts` possède déjà les mêmes valeurs, l’ancienne clé est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations d’anciens magasins cron">
    Doctor vérifie aussi l’ancien magasin de tâches cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) à la recherche d’anciennes formes de tâches que le planificateur accepte encore pour compatibilité.

    Les nettoyages cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de charge utile de premier niveau (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de premier niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` dans la charge utile → `delivery.channel` explicite
    - anciens jobs webhook de repli simples `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement les jobs `notify: true` que lorsqu’il peut le faire sans modifier le comportement. Si un job combine l’ancien repli notify avec un mode de livraison non-webhook existant, doctor avertit et laisse ce job pour examen manuel.

    Sous Linux, doctor avertit aussi lorsque la crontab de l’utilisateur invoque encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l’hôte n’est pas maintenu par OpenClaw actuel et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque Cron ne peut pas joindre le bus utilisateur systemd. Supprimez l’entrée crontab obsolète avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les vérifications de santé actuelles.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale : le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort, plus ancien que 30 minutes, ou PID actif dont il peut être prouvé qu’il appartient à un processus non-OpenClaw). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon, il affiche une note et vous demande de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation de branche de transcription de session">
    Doctor analyse les fichiers JSONL de session d’agent pour détecter la forme de branche dupliquée créée par le bug de réécriture de transcription de prompt du 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne OpenClaw, plus un frère actif contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier affecté à côté de l’original et réécrit la transcription vers la branche active afin que l’historique du Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Contrôles d’intégrité d’état (persistance de session, routage et sécurité)">
    Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration (sauf si vous disposez de sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Autorisations du répertoire d’état** : vérifie qu’il est accessible en écriture ; propose de réparer les autorisations (et émet une indication `chown` lorsqu’une incompatibilité propriétaire/groupe est détectée).
    - **Répertoire d’état synchronisé avec le cloud sous macOS** : avertit lorsque l’état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins adossés à la synchronisation peuvent provoquer des E/S plus lentes et des courses de verrouillage/synchronisation.
    - **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires adossées à SD ou eMMC peuvent être plus lentes et s’user plus rapidement lors des écritures de sessions et d’identifiants.
    - **Répertoires de session manquants** : `sessions/` et le répertoire de stockage de session sont requis pour conserver l’historique et éviter les plantages `ENOENT`.
    - **Incompatibilité de transcription** : avertit lorsque des entrées de session récentes ont des fichiers de transcription manquants.
    - **Session principale “JSONL sur 1 ligne”** : signale lorsque la transcription principale ne contient qu’une seule ligne (l’historique ne s’accumule pas).
    - **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se répartir entre les installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter sur l’hôte distant (l’état y réside).
    - **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe/le monde et propose de les restreindre à `600`.

  </Accordion>
  <Accordion title="5. Santé de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le stockage d’authentification, avertit lorsque des jetons expirent ou sont expirés, et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin de jeton de configuration Anthropic. Les prompts d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou lorsqu’un fournisseur vous demande de vous reconnecter), doctor signale qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale également les profils d’authentification temporairement inutilisables en raison de :

    - courtes périodes de récupération (limites de débit/expirations de délai/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au catalogue et à la liste d’autorisation, et avertit lorsqu’elle ne peut pas être résolue ou qu’elle est interdite.
  </Accordion>
  <Accordion title="7. Réparation d’image sandbox">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou de basculer vers d’anciens noms si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Nettoyage d’installation de Plugin">
    Doctor supprime l’ancien état de staging des dépendances de plugins généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Cela couvre les racines de dépendances générées obsolètes, les anciens répertoires d’étape d’installation, les débris locaux aux packages issus de l’ancien code de réparation des dépendances de plugins groupés, ainsi que les copies npm gérées orphelines ou récupérées de plugins `@openclaw/*` groupés qui peuvent masquer le manifeste groupé actuel. Doctor relie également le package hôte `openclaw` dans les plugins npm gérés qui déclarent `peerDependencies.openclaw`, afin que les imports d’exécution locaux au package comme `openclaw/plugin-sdk/*` continuent de se résoudre après les mises à jour ou réparations npm.

    Doctor peut également réinstaller les plugins téléchargeables manquants lorsque la configuration les référence mais que le registre local des plugins ne les trouve pas. Les exemples incluent les `plugins.entries` matériels, les paramètres de canal/fournisseur/recherche configurés et les environnements d’exécution d’agent configurés. Pendant les mises à jour de package, doctor évite d’exécuter la réparation de plugins par gestionnaire de packages pendant que le package cœur est remplacé ; exécutez à nouveau `openclaw doctor --fix` après la mise à jour si un plugin configuré doit encore être récupéré. Le démarrage du Gateway et le rechargement de la configuration n’exécutent pas de gestionnaires de packages ; les installations de plugins restent un travail explicite de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrations de service Gateway et indications de nettoyage">
    Doctor détecte les anciens services gateway (launchd/systemd/schtasks) et propose de les supprimer puis d’installer le service OpenClaw avec le port gateway actuel. Il peut également rechercher des services supplémentaires de type gateway et afficher des indications de nettoyage. Les services gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service gateway de niveau utilisateur est manquant mais qu’un service gateway OpenClaw de niveau système existe, doctor n’installe pas automatiquement un deuxième service de niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système possède le cycle de vie du gateway.

  </Accordion>
  <Accordion title="8b. Migration Startup Matrix">
    Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou actionnable, doctor (en mode `--fix` / `--repair`) crée un instantané pré-migration, puis exécute les étapes de migration au mieux : migration de l’ancien état Matrix et préparation de l’ancien état chiffré. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage d’appareils et dérive d’authentification">
    Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage de santé normal.

    Ce qu’il signale :

    - demandes de premier appairage en attente
    - mises à niveau de rôle en attente pour des appareils déjà appairés
    - mises à niveau de portée en attente pour des appareils déjà appairés
    - réparations d’incompatibilité de clé publique où l’identifiant de l’appareil correspond toujours mais où l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - enregistrements appairés sans jeton actif pour un rôle approuvé
    - jetons appairés dont les portées dérivent hors de la base de référence d’appairage approuvée
    - entrées locales mises en cache de jeton d’appareil pour la machine actuelle qui précèdent une rotation de jeton côté gateway ou portent des métadonnées de portée obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage et ne fait pas tourner automatiquement les jetons d’appareil. Il affiche plutôt les étapes suivantes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela comble la lacune courante « déjà appairé mais l’appairage est toujours requis » : doctor distingue désormais le premier appairage des mises à niveau de rôle/portée en attente et de la dérive de jeton/identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux DM sans liste d’autorisation, ou lorsqu’une politique est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    S’il s’exécute en tant que service utilisateur systemd, doctor s’assure que la persistance est activée afin que le gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (Skills, plugins et anciens répertoires)">
    Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les Skills éligibles, aux exigences manquantes et bloquées par la liste d’autorisation.
    - **Anciens répertoires d’espace de travail** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail existent à côté de l’espace de travail actuel.
    - **État des Plugins** : compte les plugins activés/désactivés/en erreur ; liste les ID de plugins pour toutes les erreurs ; signale les capacités des plugins groupés.
    - **Avertissements de compatibilité des Plugins** : signale les plugins qui présentent des problèmes de compatibilité avec l’exécution actuelle.
    - **Diagnostics des Plugins** : expose tout avertissement ou toute erreur au chargement émis par le registre des plugins.

  </Accordion>
  <Accordion title="11b. Taille du fichier d’amorçage">
    Doctor vérifie si les fichiers d’amorçage de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-dessus du budget de caractères configuré. Il signale par fichier les nombres de caractères bruts et injectés, le pourcentage de troncation, la cause de troncation (`max/file` ou `max/total`) et le total de caractères injectés en fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des Plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un plugin de canal manquant, il supprime également la configuration pendante limitée au canal qui référençait ce plugin : entrées `channels.<id>`, cibles Heartbeat qui nommaient le canal et remplacements `agents.*.models["<channel>/*"]`. Cela évite les boucles de démarrage du Gateway où l’exécution du canal a disparu mais où la configuration demande encore au gateway de s’y lier.
  </Accordion>
  <Accordion title="11c. Complétion du shell">
    Doctor vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil shell utilise un modèle de complétion dynamique lent (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide avec fichier mis en cache.
    - Si la complétion est configurée dans le profil mais que le fichier de cache est absent, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

  </Accordion>
  <Accordion title="12. Vérifications d’authentification du Gateway (jeton local)">
    Doctor vérifie que l’authentification par jeton du Gateway local est prête.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor émet un avertissement et ne le remplace pas par du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule compatibles avec SecretRef">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide à l’exécution.

    - `openclaw doctor --fix` utilise désormais le même modèle de résumé SecretRef en lecture seule que les commandes de la famille status pour les réparations ciblées de configuration.
    - Exemple : la réparation `@username` Telegram `allowFrom` / `groupAllowFrom` tente d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou d’indiquer à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification d’intégrité du Gateway + redémarrage">
    Doctor exécute une vérification d’intégrité et propose de redémarrer le Gateway lorsqu’il semble en mauvais état.
  </Accordion>
  <Accordion title="13b. Préparation de la recherche mémoire">
    Doctor vérifie si le fournisseur d’embeddings de recherche mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : sonde si le binaire `qmd` est disponible et peut démarrer. Sinon, affiche des conseils de correction incluant le paquet npm et une option de chemin manuel vers le binaire.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distant/téléchargeable reconnue. S’il est manquant, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est présente dans l’environnement ou le magasin d’authentification. Affiche des indications de correction exploitables si elle est manquante.
    - **Fournisseur automatique** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde du Gateway mis en cache est disponible (le Gateway était sain au moment de la vérification), doctor compare son résultat avec la configuration visible par la CLI et signale toute divergence. Doctor ne lance pas de nouveau ping d’embedding sur le chemin par défaut ; utilisez la commande d’état mémoire approfondi lorsque vous voulez une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le Gateway est sain, doctor exécute une sonde d’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Doctor vérifie la configuration du superviseur installé (launchd/systemd/schtasks) à la recherche de valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd network-online et le délai de redémarrage). Lorsqu’il trouve une divergence, il recommande une mise à jour et peut réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

    Notes :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` remplace les configurations personnalisées du superviseur.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` garde doctor en lecture seule pour le cycle de vie du service Gateway. Il signale toujours l’intégrité du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/le bootstrap du service, les réécritures de configuration du superviseur et le nettoyage des anciens services, car un superviseur externe possède ce cycle de vie.
    - Sous Linux, doctor ne réécrit pas les métadonnées de commande/point d’entrée tant que l’unité systemd Gateway correspondante est active. Il ignore aussi les unités supplémentaires inactives non héritées ressemblant à un Gateway pendant l’analyse des services dupliqués, afin que les fichiers de service compagnons ne créent pas de bruit de nettoyage.
    - Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service par doctor valide le SecretRef mais ne persiste pas les valeurs de jeton en texte clair résolues dans les métadonnées d’environnement du service superviseur.
    - Doctor détecte les valeurs d’environnement de service gérées par `.env`/SecretRef que d’anciennes installations LaunchAgent, systemd ou Windows Scheduled Task intégraient en ligne, et réécrit les métadonnées de service pour que ces valeurs soient chargées depuis la source d’exécution au lieu de la définition du superviseur.
    - Doctor détecte lorsque la commande du service fixe encore un ancien `--port` après une modification de `gateway.port` et réécrit les métadonnées du service vers le port actuel.
    - Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des conseils exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités Linux user-systemd, les vérifications de dérive des jetons de doctor incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service de doctor refusent de réécrire, d’arrêter ou de redémarrer un service Gateway depuis un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics d’exécution + port du Gateway">
    Doctor inspecte l’exécution du service (PID, dernier code de sortie) et avertit lorsque le service est installé mais ne s’exécute pas réellement. Il vérifie aussi les collisions de port sur le port du Gateway (`18789` par défaut) et signale les causes probables (Gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Doctor avertit lorsque le service Gateway s’exécute sur Bun ou sur un chemin Node géré par version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node, et les chemins de gestionnaires de versions peuvent casser après les mises à niveau parce que le service ne charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif, afin que les binaires système gérés par Homebrew restent disponibles tandis que Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaires de versions ne changent pas le Node résolu par les processus enfants. Les services Linux conservent toujours les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires user-bin stables, mais les répertoires de repli estimés de gestionnaires de versions ne sont écrits dans le PATH du service que lorsque ces répertoires existent sur le disque.

  </Accordion>
  <Accordion title="18. Écriture de la configuration + métadonnées de l’assistant">
    Doctor persiste toutes les modifications de configuration et estampille les métadonnées de l’assistant pour enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système de mémoire)">
    Doctor suggère un système de mémoire d’espace de travail lorsqu’il est manquant et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet sur la structure de l’espace de travail et la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Associé

- [Runbook Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
