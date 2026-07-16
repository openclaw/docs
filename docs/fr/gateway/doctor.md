---
read_when:
    - Ajout ou modification des migrations de doctor
    - Introduction de modifications incompatibles de la configuration
sidebarTitle: Doctor
summary: 'Commande Doctor : vérifications d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-07-16T13:11:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration d’OpenClaw. Il corrige les configurations et états obsolètes, vérifie l’état de santé et fournit des étapes de réparation concrètes.

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

    Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de redémarrage, de réparation du service et de la sandbox, le cas échéant).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Applique les réparations recommandées sans demander de confirmation (`--repair` est un alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Exécute des contrôles d’état structurés pour la CI ou l’automatisation des vérifications préalables. Lecture seule : aucune
    invite, réparation, migration, aucun redémarrage ni aucune écriture d’état.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Applique également les réparations agressives (écrase les configurations personnalisées du superviseur).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    S’exécute sans invite et applique uniquement les migrations sûres (normalisation de la configuration +
    déplacements de l’état sur disque). Ignore les actions de redémarrage, de service et de sandbox qui nécessitent une
    confirmation humaine. Les migrations d’état hérité s’exécutent toujours automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système à la recherche d’installations supplémentaires du Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Pour examiner les modifications avant toute écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Mode de lint en lecture seule

`openclaw doctor --lint` est l’équivalent adapté à l’automatisation de
`openclaw doctor --fix`. Ils partagent le même registre de règles de Doctor, mais ne
sélectionnent ni n’appliquent les règles de la même manière :

| Mode                     | Invites   | Écrit la configuration/l’état | Sortie                    | Utilisation                              |
| ------------------------ | --------- | ----------------------------- | ------------------------- | ---------------------------------------- |
| `openclaw doctor`        | oui       | non                           | rapport d’état convivial  | vérification de l’état par une personne  |
| `openclaw doctor --fix`  | parfois   | oui, selon la politique de réparation | journal de réparation convivial | application de réparations approuvées |
| `openclaw doctor --lint` | non       | non                           | résultats structurés      | CI, vérifications préalables et contrôles de revue |

Par défaut, `doctor --lint` exécute le profil d’automatisation large et sûr : des contrôles
statiques, locaux et utiles dans les sorties de CI ou de vérification préalable. Il ignore les contrôles facultatifs qui
sont consultatifs, sensibles à l’environnement, dépendants de services actifs, liés à l’inventaire des comptes/espaces de travail
ou au nettoyage historique. Utilisez `doctor --lint --all` pour effectuer
l’audit de lint complet enregistré, y compris ces contrôles facultatifs, ou `--only <id>` pour
un contrôle ciblé.

`doctor --fix` n’utilise pas le profil de lint par défaut et n’accepte pas
`--all`. Il suit le parcours ordonné de réparation de Doctor : les contrôles d’état modernes peuvent fournir
une implémentation facultative de `repair()`, tandis que les zones plus anciennes utilisent encore leur ancien
flux de réparation Doctor. Certains résultats de lint sont intentionnellement uniquement diagnostiques ; ainsi, la présence
d’un contrôle dans `--lint --all` ne signifie pas que `--fix` modifiera cette zone.
Le contrat sépare `detect()` (signale les résultats) de `repair()` (signale
les modifications, différences et effets secondaires), ce qui laisse la voie ouverte à un futur
`doctor --fix --dry-run` sans transformer les contrôles de lint en planificateurs de modifications.

Certains contrôles intégrés sont désactivés par défaut en interne afin de rester disponibles pour
`--all`, `--only` et les flux de réparation Doctor sans intégrer le profil d’automatisation
`doctor --lint` par défaut. La gravité est toujours émise pour chaque
résultat (`info`, `warning` ou `error`) ; la sélection par défaut n’est pas un niveau
de gravité.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Champs de la sortie JSON :

- `ok` : indique si un résultat a atteint le seuil de gravité sélectionné
- `checksRun` / `checksSkipped` : nombres (éléments ignorés par le profil, `--only` ou `--skip`)
- `findings` : diagnostics structurés avec `checkId`, `severity`, `message` et, facultativement, `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Codes de sortie :

| Code | Signification                                                    |
| ---- | ---------------------------------------------------------------- |
| `0`  | aucun résultat égal ou supérieur au seuil sélectionné             |
| `1`  | un ou plusieurs résultats ont atteint le seuil sélectionné         |
| `2`  | échec de la commande ou de l’exécution avant l’émission des résultats |

Options :

- `--severity-min info|warning|error` (valeur par défaut : `warning`) : contrôle à la fois ce qui est affiché et ce qui entraîne un code de sortie non nul.
- `--all` : exécute tous les contrôles de lint enregistrés, y compris les contrôles facultatifs exclus de l’ensemble d’automatisation par défaut.
- `--only <id>` (répétable) : exécute uniquement les identifiants de contrôle nommés ; un identifiant inconnu est signalé comme un résultat d’erreur.
- `--skip <id>` (répétable) : exclut un contrôle tout en maintenant le reste de l’exécution actif.
- `--json`, `--severity-min`, `--all`, `--only` et `--skip` nécessitent `--lint` ; les exécutions simples de `openclaw doctor` et `--fix` les refusent.

## Fonctionnement (résumé)

<AccordionGroup>
  <Accordion title="État de santé, interface et mises à jour">
    - Mise à jour préalable facultative pour les installations git (mode interactif uniquement).
    - Contrôle de fraîcheur du protocole de l’interface (reconstruit l’interface de contrôle lorsque le schéma du protocole est plus récent).
    - Contrôle d’état + invite de redémarrage.
    - Notes sur les Skills et Plugins uniquement en cas de problème ; l’inventaire sain reste dans `openclaw skills check` et `openclaw plugins list`.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de la configuration pour les anciennes formes de valeurs.
    - Migration de la configuration de conversation depuis les anciens champs `talk.*` à plat vers `talk.provider` + `talk.providers.<provider>`.
    - Contrôles de migration du navigateur pour les anciennes configurations de l’extension Chrome et la disponibilité de Chrome MCP.
    - Avertissements relatifs aux substitutions du fournisseur OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migration de l’ancien fournisseur/profil OpenAI Codex (`openai-codex` → `openai`) et avertissements de masquage pour l’ancien `models.providers.openai-codex`.
    - Contrôle des prérequis TLS d’OAuth pour les profils OAuth OpenAI Codex.
    - Avertissements relatifs aux listes d’autorisation des Plugins/outils lorsque `plugins.allow` est restrictif, mais que la politique des outils demande toujours un caractère générique ou des outils appartenant à un Plugin.
    - Migration de l’ancien état sur disque (sessions/répertoire de l’agent/authentification WhatsApp).
    - Migration des anciennes clés de contrat du manifeste de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration de l’ancien stockage Cron (`jobId`, `schedule.cron`, champs de livraison/charge utile de premier niveau, charge utile `provider`, tâches de repli Webhook `notify: true`).
    - Réparation de l’épinglage de l’environnement d’exécution de la CLI Codex (`agentRuntime.id: "codex-cli"` → `"codex"`) dans `agents.defaults`, `agents.list[]` et `models.providers.*` (y compris les entrées propres à chaque modèle).
    - Nettoyage des configurations de Plugin obsolètes lorsque les Plugins sont activés ; avec `plugins.enabled=false`, les références de Plugin obsolètes sont conservées comme configuration de confinement inactive.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches dupliquées de réécriture d’invite créées par les versions 2026.4.24 concernées.
    - Détection des marqueurs de récupération après redémarrage de sous-agents bloqués, avec prise en charge de `--fix` pour effacer les indicateurs obsolètes de récupération abandonnée afin que le démarrage ne continue pas à considérer l’enfant comme abandonné lors du redémarrage.
    - Contrôles de l’intégrité de l’état et des autorisations (sessions, transcriptions, répertoire d’état).
    - Contrôles des autorisations du fichier de configuration (chmod 600) lors d’une exécution locale.
    - État de l’authentification des modèles : vérifie l’expiration d’OAuth, peut actualiser les jetons arrivant à expiration et signale les états de temporisation/désactivation des profils d’authentification.

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image de sandbox lorsque l’isolation est activée.
    - Migration des anciens services et détection de Gateways supplémentaires.
    - Migration de l’ancien état du canal Matrix (en mode `--fix` / `--repair`).
    - Contrôles de l’environnement d’exécution du Gateway (service installé mais arrêté ; étiquette launchd mise en cache).
    - Avertissements sur l’état des canaux (interrogés depuis le Gateway en cours d’exécution).
    - Les contrôles d’autorisation propres aux canaux se trouvent sous `openclaw channels capabilities` ; par exemple, les autorisations des canaux vocaux Discord sont auditées avec `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Contrôles de réactivité de WhatsApp en cas de dégradation de la boucle d’événements du Gateway alors que des clients TUI locaux sont toujours en cours d’exécution ; `--fix` arrête uniquement les clients TUI locaux vérifiés.
    - Réparation des routes Codex pour les anciennes références de modèles `openai-codex/*` dans les modèles principaux, les solutions de repli, les modèles de génération d’images/vidéos, les substitutions Heartbeat/sous-agent/Compaction, les hooks, les substitutions de modèles des canaux et les épinglages de routes de session ; `--fix` les réécrit en `openai/*`, migre les profils/l’ordre d’authentification `openai-codex:*` vers `openai:*`, supprime les épinglages obsolètes d’environnement d’exécution de session/d’agent entier et laisse la route effective réparée déterminer si Codex est compatible.
    - Audit de la configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage des variables d’environnement de proxy intégrées pour les services Gateway qui ont capturé les valeurs `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` du shell lors de l’installation ou de la mise à jour.
    - Contrôles de l’environnement d’exécution du Gateway (anciens services Bun non pris en charge, chemins de gestionnaires de versions).
    - Diagnostics de conflit de port du Gateway (valeur par défaut : `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et association">
    - Avertissements de sécurité concernant les politiques de messages privés ouvertes.
    - Contrôles d’authentification du Gateway pour le mode à jeton local (propose de générer un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations de jeton SecretRef).
    - Détection des problèmes d’association des appareils (demandes de première association en attente, mises à niveau de rôle/portée en attente, dérive obsolète du cache local de jetons d’appareil et dérive d’authentification des enregistrements associés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Contrôle de la persistance systemd sous Linux.
    - Contrôle de la taille des fichiers d’amorçage de l’espace de travail (avertissements de troncature/proximité de la limite pour les fichiers de contexte).
    - Contrôle de disponibilité des Skills pour l’agent par défaut ; signale les Skills autorisés dont les binaires, l’environnement, la configuration ou les prérequis du système d’exploitation sont manquants, et `--fix` peut désactiver les Skills indisponibles dans `skills.entries`.
    - Contrôle de l’état de l’autocomplétion du shell et installation/mise à niveau automatique.
    - Contrôle de disponibilité du fournisseur d’embeddings pour la recherche en mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Contrôles de l’installation depuis les sources (incompatibilité de l’espace de travail pnpm, ressources d’interface manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Rétroremplissage et réinitialisation de l’interface des rêves

La scène Dreams de l’interface de contrôle comprend les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de Dreaming ancré. Celles-ci utilisent des méthodes RPC de type doctor du Gateway, mais ne font **pas** partie de la réparation/migration CLI `openclaw doctor`.

| Action         | Fonction                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | Analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM ancrée et écrit des entrées de rattrapage réversibles dans `DREAMS.md`. |
| Reset          | Supprime uniquement les entrées de journal de rattrapage marquées dans `DREAMS.md`.                                                                         |
| Clear Grounded | Supprime uniquement les entrées à court terme préparées, exclusivement ancrées, issues de la relecture historique et n’ayant pas encore accumulé de rappel actif ni de prise en charge quotidienne. |

Aucune de ces actions ne modifie `MEMORY.md`, n’exécute les migrations doctor complètes ni ne prépare à elle seule les candidats ancrés dans le magasin actif de promotion à court terme. Pour intégrer la relecture historique ancrée au processus normal de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare les candidats durables ancrés dans le magasin de Dreaming à court terme, tandis que `DREAMS.md` reste la surface de révision.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute de manière interactive, il propose d’effectuer une mise à jour (fetch/rebase/build) avant de lancer doctor.
  </Accordion>
  <Accordion title="1. Normalisation de la configuration">
    Doctor normalise les anciennes formes de valeurs selon le schéma actuel. La configuration vocale Talk actuelle est `talk.provider` + `talk.providers.<provider>`, avec la configuration vocale en temps réel sous `talk.realtime.*`. Doctor convertit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la table des fournisseurs, et convertit les anciens sélecteurs de temps réel de premier niveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor avertit également lorsque `plugins.allow` n’est pas vide et que la politique des outils utilise un caractère générique ou des entrées d’outils appartenant à des plugins. `tools.allow: ["*"]` ne correspond qu’aux outils provenant de plugins effectivement chargés ; il ne contourne pas la liste d’autorisation exclusive des plugins.

  </Accordion>
  <Accordion title="2. Migrations des anciennes clés de configuration">
    Lorsque la configuration contient une clé obsolète disposant d’une migration active, les autres commandes refusent de s’exécuter et vous demandent de lancer `openclaw doctor`. Doctor explique quelles anciennes clés ont été trouvées, affiche la migration appliquée et réécrit `~/.openclaw/openclaw.json` avec le schéma mis à jour. Le démarrage du Gateway refuse les anciens formats de configuration et vous demande d’exécuter `openclaw doctor --fix` ; il ne réécrit pas `openclaw.json` au démarrage. Les migrations du magasin des tâches Cron sont également prises en charge par `openclaw doctor --fix`.

    <Note>
      Doctor ne conserve les migrations automatiques que pendant environ deux
      mois après le retrait d’une clé. Les anciennes clés plus anciennes (par
      exemple les clés d’origine `routing.queue`, `routing.bindings`,
      `routing.agents`/`defaultAgentId`, `routing.transcribeAudio`, la clé de
      premier niveau `agent.*` ou la clé de premier niveau
      `identity` de l’ancienne forme de configuration antérieure à la
      prise en charge de plusieurs agents) ne disposent plus d’un chemin de
      migration ; les configurations qui les utilisent échouent désormais à
      la validation au lieu d’être réécrites. Corrigez ces clés manuellement
      en vous reportant à la référence de configuration actuelle avant que
      doctor puisse poursuivre.
    </Note>

    Migrations actives :

    | Ancienne clé                                                                                   | Clé actuelle                                                                  |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | supprimées (WebChat est retiré)                                                |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (et par compte)      | `...threadBindings.idleHours`                                               |
    | anciennes `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | anciens sélecteurs Talk de temps réel de premier niveau (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | champs de locuteur TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (tous les canaux sauf Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (tous les canaux, y compris Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (le démarrage du Gateway ignore également les fournisseurs dont `api` est une valeur d’énumération future/inconnue au lieu d’échouer en mode fermé) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | supprimée (ancien paramètre de relais de l’extension Chrome)                            |
    | `mcp.servers.*.type` (alias natifs de la CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | supprimée (le serveur d’application Codex conserve toujours les outils d’espace de travail natifs de Codex sous leur forme native) |
    | `commands.modelsWrite`                                                                           | supprimée (`/models add` est obsolète)                                      |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | supprimées (la valeur exacte `NO_REPLY` n’est plus convertie en texte de repli visible)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | supprimée (OpenClaw possède l’invite système générée)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | supprimée (utilisez `models.providers.<id>.timeoutSeconds` pour les délais d’expiration des modèles/fournisseurs lents, maintenus sous la limite de délai d’expiration de l’agent/exécution) |
    | `memorySearch` de premier niveau                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (à n’importe quel niveau)                                                            | supprimée (les index de mémoire résident dans la base de données de chaque agent)                       |
    | `heartbeat` de premier niveau                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | identifiants de politique `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | supprimées (obsolètes)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Les lignes `plugins.entries.voice-call.config.*` ci-dessus sont normalisées par
      le plugin Voice Call lui-même à chaque chargement de la configuration,
      et non par `openclaw
      doctor`. Le plugin consigne également au démarrage
      un avertissement renvoyant vers `openclaw
      doctor --fix`, mais doctor ne
      réécrit actuellement pas `openclaw.json` pour ces clés ; c’est la
      normalisation propre au plugin qui applique la modification à
      l’exécution.
    </Note>

    Recommandations relatives au compte par défaut pour les canaux multicomptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de repli peut sélectionner un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un identifiant de compte inconnu, doctor affiche un avertissement et répertorie les identifiants de compte configurés.

  </Accordion>
  <Accordion title="2b. Remplacements du fournisseur OpenCode">
    Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cela remplace le catalogue OpenCode intégré de `openclaw/plugin-sdk/llm`. Cela peut forcer les modèles à utiliser la mauvaise API ou ramener les coûts à zéro. Doctor affiche un avertissement afin que vous puissiez supprimer le remplacement et rétablir le routage d’API et les coûts propres à chaque modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et état de préparation de Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin supprimé de l’extension Chrome, doctor la normalise vers le modèle actuel de connexion Chrome MCP locale à l’hôte (`browser.profiles.*.driver: "extension"` → `"existing-session"` ; `browser.relayBindHost` supprimé).

    Doctor contrôle également le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version de Chrome détectée et affiche un avertissement si elle est antérieure à Chrome 144
    - vous rappelle d’activer le débogage à distance dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer ce réglage côté Chrome à votre place. Chrome MCP local à l’hôte nécessite toujours un navigateur basé sur Chromium 144+ sur l’hôte du Gateway/Node, exécuté localement, avec le débogage à distance activé et la première demande de consentement de connexion approuvée dans le navigateur.

    L’état de préparation ne couvre ici que les prérequis de connexion locale. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’exportation PDF, l’interception des téléchargements et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut. Cette vérification ne s’applique pas à Docker, à la sandbox, au navigateur distant ni aux autres flux sans interface graphique, qui continuent à utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS pour OAuth">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d’autorisation OpenAI afin de vérifier que la pile TLS Node/OpenSSL locale peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, un certificat expiré ou un certificat auto-signé), doctor affiche des instructions de correction propres à la plateforme. Sous macOS avec une installation Node de Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le Gateway fonctionne correctement.
  </Accordion>
  <Accordion title="2e. Remplacements du fournisseur OAuth Codex">
    Si vous avez précédemment ajouté des paramètres de transport OpenAI hérités sous `models.providers.openai-codex`, ils peuvent masquer le chemin intégré du fournisseur OAuth Codex. Doctor affiche un avertissement lorsqu’il détecte ces anciens paramètres de transport avec OAuth Codex, afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et rétablir le comportement de routage actuel. Les proxys personnalisés et les remplacements portant uniquement sur les en-têtes restent pris en charge et ne déclenchent pas cet avertissement, mais ces routes de requête définies manuellement ne sont pas éligibles à la sélection implicite de Codex.
  </Accordion>
  <Accordion title="2f. Réparation des routes Codex">
    Doctor recherche les références de modèle `openai-codex/*` héritées. Le routage natif du harnais Codex utilise les références de modèle canoniques `openai/*`, mais le préfixe seul ne sélectionne jamais Codex. Lorsque la politique d’exécution n’est pas définie ou vaut `auto`, seule une route HTTPS officielle exacte Platform Responses ou ChatGPT Responses, sans remplacement de requête défini manuellement, est éligible. Consultez [Environnement d’exécution d’agent implicite OpenAI](/fr/providers/openai#implicit-agent-runtime).

    En mode `--fix` / `--repair`, doctor réécrit les références concernées de l’agent par défaut et de chaque agent, notamment les modèles principaux, les modèles de secours, les modèles de génération d’images/vidéos, les remplacements de heartbeat/sous-agent/compaction, les hooks, les remplacements de modèle des canaux et l’état obsolète des routes de session persistantes :

    - `openai-codex/gpt-*` devient `openai/gpt-*`.
    - L’intention Codex est déplacée vers les entrées `agentRuntime.id: "codex"` limitées au fournisseur/modèle pour les références de modèle d’agent réparées.
    - La configuration d’exécution obsolète à l’échelle de l’agent et les épinglages persistants de l’environnement d’exécution de session sont supprimés, car la sélection de l’environnement d’exécution s’effectue au niveau du fournisseur/modèle.
    - La politique d’exécution existante du fournisseur/modèle est conservée, sauf si la référence de modèle héritée réparée nécessite le routage Codex pour conserver l’ancien chemin d’authentification.
    - Les listes existantes de modèles de secours sont conservées et leurs entrées héritées sont réécrites ; les paramètres copiés propres à chaque modèle sont déplacés de la clé héritée vers la clé canonique `openai/*`.
    - Les éléments persistants de session `modelProvider`/`providerOverride`, `model`/`modelOverride`, les avis de recours au modèle de secours et les épinglages de profils d’authentification sont réparés dans tous les magasins de sessions d’agent découverts.
    - Doctor répare séparément les épinglages `agentRuntime.id: "codex-cli"` obsolètes (un identifiant d’environnement d’exécution hérité distinct) en les remplaçant par `"codex"` dans les entrées de modèle `agents.defaults`, `agents.list[]` et `models.providers.*`.
    - `/codex ...` signifie « contrôler ou associer une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

  </Accordion>
  <Accordion title="2g. Nettoyage des routes de session">
    Doctor analyse également les magasins de sessions d’agent découverts afin de détecter l’état de routage obsolète créé automatiquement après le déplacement de modèles configurés ou de l’environnement d’exécution hors d’une route détenue par un plugin, comme Codex.

    `openclaw doctor --fix` peut effacer l’état obsolète créé automatiquement, comme les épinglages de modèle `modelOverrideSource: "auto"`, les métadonnées du modèle d’exécution, les identifiants de harnais épinglés, les associations de sessions CLI et les remplacements automatiques de profil d’authentification lorsque la route qui les détient n’est plus configurée. Les choix explicites de modèle de session, effectués par l’utilisateur ou hérités, sont signalés pour examen manuel et laissés intacts ; changez-les avec `/model ...`, `/new`, ou réinitialisez la session lorsque cette route n’est plus souhaitée.

  </Accordion>
  <Accordion title="3. Migrations de l’état hérité (organisation du disque)">
    Doctor peut migrer les anciennes organisations sur disque vers la structure actuelle :

    - Magasin de sessions et transcriptions : de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire de l’agent : de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) : de l’ancien emplacement `~/.openclaw/credentials/*.json` (sauf `oauth.json`) vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

    Ces migrations sont réalisées au mieux et sont idempotentes ; doctor affiche des avertissements lorsqu’il conserve des dossiers hérités comme sauvegardes. Le Gateway/CLI migre également automatiquement les anciennes sessions et le répertoire de l’agent au démarrage, afin que l’historique, l’authentification et les modèles soient placés dans le chemin propre à l’agent sans exécution manuelle de doctor. L’authentification WhatsApp est intentionnellement migrée uniquement via `openclaw doctor`. La normalisation du fournisseur Talk et de la table des fournisseurs utilise l’égalité structurelle pour les comparaisons ; les différences portant uniquement sur l’ordre des clés ne déclenchent donc plus de modifications `doctor --fix` répétées et sans effet.

  </Accordion>
  <Accordion title="3a. Migrations des manifestes de plugins hérités">
    Doctor analyse tous les manifestes de plugins installés afin de détecter les clés de capacité de premier niveau obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations du magasin Cron hérité">
    Doctor vérifie également si le magasin de tâches Cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` en cas de remplacement) contient d’anciennes structures de tâches que le planificateur accepte encore par souci de compatibilité.

    Les nettoyages Cron actuels comprennent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de charge utile de premier niveau (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de premier niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` de la charge utile → `delivery.channel` explicite
    - anciennes tâches de secours Webhook `notify: true` → livraison Webhook explicite depuis `cron.webhook` lorsque cette valeur est définie ; les tâches d’annonce conservent leur livraison par chat et reçoivent `delivery.completionDestination`. Lorsque `cron.webhook` n’est pas défini, le marqueur de premier niveau inactif `notify` est supprimé pour les tâches sans cible (la livraison existante, y compris les annonces, est conservée), car la livraison à l’exécution ne le lit jamais.

    Le Gateway assainit également les lignes Cron mal formées lors du chargement afin que les tâches valides continuent de s’exécuter. Les lignes brutes mal formées sont copiées dans `jobs-quarantine.json`, à côté du magasin actif, avant d’être supprimées de `jobs.json` ; doctor signale les lignes mises en quarantaine afin que vous puissiez les examiner ou les réparer manuellement.

    Au démarrage, le Gateway normalise la projection d’exécution et ignore le marqueur de premier niveau `notify`, mais laisse la configuration Cron persistante à réparer par doctor. Lorsque `cron.webhook` n’est pas défini, doctor supprime le marqueur inactif des tâches sans cible de migration (`delivery.mode` égal à none/absent, cible Webhook inutilisable ou livraison d’annonce/chat existante), sans modifier la livraison existante, de sorte que les exécutions répétées de `doctor --fix` n’affichent plus d’avertissement pour la même tâche. Si `cron.webhook` est défini mais n’est pas une URL HTTP(S) valide, doctor affiche toujours un avertissement et conserve le marqueur afin que vous puissiez corriger l’URL.

    Sous Linux, doctor affiche également un avertissement lorsque la crontab de l’utilisateur appelle encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l’hôte n’est pas maintenu par la version actuelle d’OpenClaw et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque Cron ne peut pas joindre le bus utilisateur systemd. Supprimez l’entrée de crontab obsolète avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les vérifications d’intégrité actuelles.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent afin de détecter les fichiers de verrouillage en écriture obsolètes laissés après l’arrêt anormal d’une session. Pour chaque fichier de verrouillage détecté, il indique : le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort, métadonnées de propriétaire mal formées, âge supérieur à 30 minutes ou PID actif dont il est prouvé qu’il appartient à un processus autre qu’OpenClaw). En mode `--fix` / `--repair`, il supprime automatiquement les verrous dont les propriétaires sont morts, orphelins, recyclés, anciens avec des métadonnées mal formées, ou n’appartiennent pas à OpenClaw. Les anciens verrous encore détenus par un processus OpenClaw actif sont signalés, mais laissés en place afin que doctor n’interrompe pas un processus actif d’écriture de transcription.
  </Accordion>
  <Accordion title="3d. Réparation des branches de transcription de session">
    Doctor analyse les fichiers JSONL des sessions d’agent afin de détecter la structure de branche dupliquée créée par le bogue de réécriture des transcriptions de prompts de la version 2026.4.24 : un tour utilisateur abandonné contenant le contexte d’exécution interne d’OpenClaw, accompagné d’une branche sœur active contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier concerné à côté de l’original et réécrit la transcription vers la branche active, afin que les lecteurs de l’historique et de la mémoire du Gateway ne voient plus les tours en double.
  </Accordion>
  <Accordion title="4. Vérifications de l’intégrité de l’état (persistance des sessions, routage et sécurité)">
    Le répertoire d’état constitue le tronc cérébral opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration, sauf si vous disposez de sauvegardes ailleurs.

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte catastrophique de l’état, propose de recréer le répertoire et rappelle qu’il est impossible de récupérer les données manquantes.
    - **Autorisations du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les autorisations (et émet une indication `chown` lorsqu’une incohérence de propriétaire ou de groupe est détectée).
    - **Répertoire d’état macOS synchronisé avec le cloud** : avertit lorsque l’état se trouve sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins synchronisés peuvent ralentir les E/S et provoquer des conflits de verrouillage ou de synchronisation.
    - **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se trouve sur une source de montage `mmcblk*`, car les E/S aléatoires sur SD/eMMC peuvent être plus lentes et accélérer l’usure lors des écritures de sessions et d’identifiants.
    - **Répertoire d’état Linux volatil** : avertit lorsque l’état se trouve sous `tmpfs` ou `ramfs`, car les sessions, les identifiants, la configuration et l’état SQLite (avec les fichiers annexes WAL/journal) disparaissent au redémarrage. Les montages Docker `overlay` ne sont volontairement pas signalés, car leurs couches accessibles en écriture persistent après les redémarrages de l’hôte tant que le conteneur subsiste.
    - **Répertoires de sessions manquants** : `sessions/` et le répertoire de stockage des sessions sont nécessaires pour conserver l’historique et éviter les plantages `ENOENT`.
    - **Incohérence de transcription** : avertit lorsque des entrées de session récentes n’ont pas de fichier de transcription.
    - **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale ne comporte qu’une seule ligne (l’historique ne s’accumule pas).
    - **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels, ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut être réparti entre plusieurs installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor rappelle de l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe ou par tous les utilisateurs et propose de restreindre les autorisations à `600`.

  </Accordion>
  <Accordion title="5. État de l’authentification du modèle (expiration OAuth)">
    Doctor examine les profils OAuth du magasin d’authentification, avertit lorsque les jetons arrivent à expiration ou ont expiré et peut les actualiser lorsque cela ne présente aucun risque. Si le profil OAuth/de jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le parcours de jeton de configuration Anthropic. Les invites d’actualisation n’apparaissent qu’en exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou lorsqu’un fournisseur demande une nouvelle connexion), doctor indique qu’une nouvelle authentification est requise et affiche la commande `openclaw models auth login --provider ...` exacte à exécuter.

    Doctor signale également les profils d’authentification temporairement inutilisables en raison de courtes périodes de récupération (limites de débit, délais d’attente ou échecs d’authentification) ou de désactivations plus longues (échecs de facturation ou de crédit).

    Les anciens profils OAuth Codex dont les jetons se trouvent dans le trousseau macOS (intégration initiale antérieure à l’organisation en fichiers annexes) ne sont réparés que par doctor. Exécutez `openclaw doctor --fix` une fois depuis un terminal interactif pour migrer directement les anciens jetons stockés dans le trousseau vers `auth-profiles.json` ; les tours intégrés (Telegram, cron, répartition vers des sous-agents) les résoudront ensuite comme des profils OAuth OpenAI canoniques.

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au catalogue et à la liste d’autorisation, puis avertit lorsqu’elle ne peut pas être résolue ou n’est pas autorisée.
  </Accordion>
  <Accordion title="7. Réparation de l’image du bac à sable">
    Lorsque l’isolation en bac à sable est activée, doctor vérifie les images Docker et propose de créer l’image ou de revenir aux anciens noms si l’image actuelle est absente.
  </Accordion>
  <Accordion title="7b. Nettoyage de l’installation des plugins">
    Doctor supprime l’ancien état intermédiaire des dépendances de plugins généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair` : racines de dépendances générées obsolètes, anciens répertoires d’étape d’installation, résidus locaux aux paquets issus d’un ancien code de réparation des dépendances des plugins intégrés, ainsi que copies npm gérées orphelines ou récupérées des plugins `@openclaw/*` intégrés susceptibles de masquer le manifeste intégré actuel. Doctor recrée également le lien du paquet hôte `openclaw` dans les plugins npm gérés qui déclarent `peerDependencies.openclaw`, afin que les importations d’exécution locales au paquet telles que `openclaw/plugin-sdk/*` continuent de fonctionner après les mises à jour ou les réparations npm.

    Doctor peut aussi réinstaller les plugins téléchargeables manquants lorsque la configuration les référence, mais que le registre local des plugins ne les trouve pas (`plugins.entries` substantiel, paramètres de canal/fournisseur/recherche configurés, environnements d’exécution d’agents configurés). Pendant les mises à jour de paquets, doctor évite de réinstaller les paquets de plugins pendant le remplacement du paquet principal ; exécutez de nouveau `openclaw doctor --fix` après la mise à jour si un plugin configuré doit encore être récupéré. En dehors de l’exception de démarrage de l’image de conteneur décrite ci-dessous, le démarrage du Gateway et le rechargement de la configuration n’exécutent aucune réparation de paquet ; les installations de plugins restent des opérations explicites de doctor, d’installation ou de mise à jour.

    Le démarrage d’un Gateway conteneurisé bénéficie d’une exception de mise à niveau limitée : lorsque `openclaw gateway run` démarre avec une nouvelle version d’OpenClaw, il exécute les migrations d’état sûres et la convergence existante des plugins après la mise à jour du cœur avant de se déclarer prêt, puis enregistre un point de contrôle propre à la version. Cette passe de démarrage peut nettoyer les enregistrements obsolètes de plugins intégrés, réparer les liens locaux des plugins, réinstaller les paquets de plugins configurés lorsque le parcours de convergence l’exige et vérifier les charges utiles des plugins actifs. Si le démarrage ne peut pas effectuer la réparation en toute sécurité, exécutez une fois la même image avec `openclaw doctor --fix` sur le même état et la même configuration montés avant de redémarrer normalement le conteneur.

  </Accordion>
  <Accordion title="8. Migrations du service Gateway et indications de nettoyage">
    Doctor détecte les anciens services Gateway (launchd/systemd/schtasks) et propose de les supprimer puis d’installer le service OpenClaw en utilisant le port Gateway actuel. Il peut également rechercher d’autres services semblables à un Gateway et afficher des indications de nettoyage. Les services Gateway OpenClaw nommés d’après un profil sont considérés comme des éléments de premier ordre et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service Gateway au niveau utilisateur est absent, mais qu’un service Gateway OpenClaw existe au niveau système, doctor n’installe pas automatiquement un second service au niveau utilisateur. Examinez la situation avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système gère le cycle de vie du Gateway.

  </Accordion>
  <Accordion title="8b. Migration de Matrix au démarrage">
    Lorsqu’un compte de canal Matrix présente une migration d’état héritée en attente ou réalisable, doctor (en mode `--fix` / `--repair`) crée un instantané préalable à la migration, puis exécute au mieux les étapes de migration : migration de l’ancien état Matrix et préparation de l’ancien état chiffré. Les deux étapes sont non fatales ; les erreurs sont consignées et le démarrage se poursuit. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage des appareils et dérive de l’authentification">
    Doctor examine l’état d’appairage des appareils dans le cadre du contrôle d’intégrité normal et signale :

    - les demandes de premier appairage en attente
    - les mises à niveau de rôle ou de portée en attente pour les appareils déjà appairés
    - les réparations d’incohérence de clé publique lorsque l’identifiant de l’appareil correspond toujours, mais que son identité ne correspond plus à l’enregistrement approuvé
    - les enregistrements appairés auxquels il manque un jeton actif pour un rôle approuvé
    - les jetons appairés dont les portées s’écartent de la référence d’appairage approuvée
    - les entrées locales mises en cache de jetons d’appareil pour la machine actuelle qui sont antérieures à une rotation du jeton côté Gateway ou contiennent des métadonnées de portée obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage et ne renouvelle pas automatiquement les jetons d’appareil. Il affiche les étapes suivantes exactes :

    - examiner les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - générer un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer puis approuver de nouveau un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela distingue le premier appairage des mises à niveau de rôle ou de portée en attente et de la dérive d’un jeton obsolète ou de l’identité d’un appareil, éliminant ainsi le problème courant « déjà appairé, mais l’appairage reste requis ».

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet une note de sécurité uniquement lorsqu’il détecte un avertissement, par exemple un fournisseur ouvert aux messages privés sans liste d’autorisation ou une politique configurée de manière dangereuse. Utilisez `openclaw security audit` pour obtenir l’inventaire complet de sécurité.
  </Accordion>
  <Accordion title="10. Persistance systemd (Linux)">
    En cas d’exécution comme service utilisateur systemd, doctor s’assure que la persistance est activée afin que le Gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (Skills, plugins et TaskFlows)">
    Doctor affiche les problèmes et les actions concernant l’agent par défaut, et non l’inventaire des éléments opérationnels :

    - **Skills** : répertorie les noms de compétences autorisées, mais inutilisables ; utilisez `openclaw skills check` pour connaître les exigences détaillées et les décomptes complets.
    - **Plugins** : signale uniquement les identifiants des plugins en erreur ; utilisez `openclaw plugins list` pour obtenir l’inventaire des plugins chargés, importés, désactivés et intégrés.
    - **Avertissements de compatibilité des plugins** : signale les plugins présentant des problèmes de compatibilité avec l’environnement d’exécution actuel.
    - **Diagnostics des plugins** : présente tous les avertissements ou erreurs émis par le registre des plugins au moment du chargement.
    - **Récupération de TaskFlow** : signale les TaskFlows gérés suspects qui nécessitent une inspection manuelle ou une annulation.
    - **CLI Claude** : signale uniquement les problèmes liés au binaire, à l’authentification, au profil, à l’espace de travail ou au répertoire du projet ; les détails des vérifications concluantes sont omis.

  </Accordion>
  <Accordion title="11b. Taille des fichiers d’amorçage">
    Doctor vérifie si les fichiers d’amorçage de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) approchent ou dépassent le budget de caractères configuré. Il indique pour chaque fichier le nombre de caractères bruts par rapport aux caractères injectés, le pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le nombre total de caractères injectés en proportion du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Complétion de l’interpréteur de commandes">
    Doctor vérifie si la complétion par tabulation est installée pour l’interpréteur de commandes actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil de l’interpréteur utilise un modèle lent de complétion dynamique (`source <(openclaw completion ...)`), doctor le remplace par la variante plus rapide utilisant un fichier mis en cache.
    - Si la complétion est configurée dans le profil, mais que le fichier de cache est absent, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (uniquement en mode interactif ; cette étape est ignorée avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

  </Accordion>
  <Accordion title="11d. Nettoyage des plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un plugin de canal manquant, il supprime également la configuration orpheline propre au canal qui référençait ce plugin : les entrées `channels.<id>`, les cibles de heartbeat qui nommaient le canal et les substitutions `agents.*.models["<channel>/*"]`. Cela évite les boucles de démarrage du Gateway où l’environnement d’exécution du canal a disparu, mais où la configuration demande encore au Gateway de s’y rattacher.
  </Accordion>
  <Accordion title="12. Vérifications de l’authentification du Gateway (jeton local)">
    Doctor vérifie que l’authentification locale du Gateway par jeton est prête.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef, mais indisponible, doctor émet un avertissement et ne le remplace pas par du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule prenant en charge SecretRef">
    Certains parcours de réparation doivent examiner les identifiants configurés sans affaiblir le comportement d’échec immédiat de l’environnement d’exécution.

    - `openclaw doctor --fix` utilise le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour les réparations ciblées de la configuration.
    - Exemple : la réparation de Telegram `allowFrom` / `groupAllowFrom` `@username` tente d’utiliser les identifiants configurés du bot lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor indique que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification de l’état du Gateway et redémarrage">
    Doctor effectue une vérification de l’état et propose de redémarrer le Gateway lorsqu’il semble défaillant.
  </Accordion>
  <Accordion title="13b. Disponibilité de la recherche en mémoire">
    Doctor vérifie si le fournisseur d’embeddings configuré pour la recherche en mémoire est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : vérifie si le binaire `qmd` est disponible et peut être démarré. Dans le cas contraire, affiche des instructions de correction comprenant `npm install -g @tobilu/qmd` (ou l’équivalent Bun) ainsi qu’une option permettant d’indiquer manuellement le chemin du binaire.
    - **Fournisseur local explicite** : recherche un fichier de modèle local ou une URL reconnue de modèle distant ou téléchargeable. S’il est absent, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est présente dans l’environnement ou le magasin d’authentification. Affiche des conseils de correction exploitables si elle est absente.
    - **Ancien fournisseur automatique** : traite `memorySearch.provider: "auto"` comme OpenAI, vérifie la disponibilité d’OpenAI et `doctor --fix` le réécrit en `provider: "openai"`.

    Lorsqu’un résultat de vérification du Gateway est disponible en cache (le Gateway était opérationnel au moment de la vérification), doctor le recoupe avec la configuration visible depuis la CLI et signale toute divergence. Doctor ne lance pas de nouveau ping d’embedding dans le chemin par défaut ; utilisez la commande approfondie d’état de la mémoire pour effectuer une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la disponibilité des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements sur l’état des canaux">
    Si le Gateway est opérationnel, doctor lance une vérification de l’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit et réparation de la configuration du superviseur">
    Doctor vérifie que la configuration du superviseur installé (launchd/systemd/schtasks) ne comporte pas de valeurs par défaut manquantes ou obsolètes (par exemple les dépendances systemd à network-online et le délai de redémarrage). Lorsqu’il détecte une divergence, il recommande une mise à jour et peut réécrire le fichier de service ou la tâche avec les valeurs par défaut actuelles.

    Remarques :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --fix` applique les corrections recommandées sans invite (`--repair` est un alias).
    - `openclaw doctor --fix --force` remplace les configurations personnalisées du superviseur.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` maintient doctor en lecture seule pour le cycle de vie du service Gateway. Il continue de signaler l’état du service et d’effectuer les réparations sans rapport avec celui-ci, mais ignore l’installation, le démarrage, le redémarrage et l’amorçage du service, la réécriture de la configuration du superviseur ainsi que le nettoyage des anciens services, car un superviseur externe gère ce cycle de vie.
    - Sous Linux, doctor ne réécrit pas les métadonnées de commande ou de point d’entrée tant que l’unité systemd correspondante du Gateway est active. Il ignore également les unités supplémentaires inactives, non héritées et semblables à un Gateway lors de la recherche de services en double, afin que les fichiers de services complémentaires ne génèrent pas de bruit de nettoyage.
    - Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation ou la réparation du service par doctor valide le SecretRef, mais ne conserve pas les valeurs de jeton résolues en texte brut dans les métadonnées d’environnement du service du superviseur.
    - Doctor détecte les valeurs d’environnement de service gérées par `.env` ou reposant sur SecretRef que d’anciennes installations de LaunchAgent, systemd ou de tâches planifiées Windows avaient intégrées directement, puis réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution plutôt que depuis la définition du superviseur.
    - Doctor détecte lorsque la commande du service impose encore un ancien `--port` après une modification de `gateway.port`, puis réécrit les métadonnées du service avec le port actuel.
    - Si l’authentification par jeton exige un jeton et que le SecretRef du jeton configuré n’est pas résolu, doctor bloque le chemin d’installation ou de réparation en fournissant des instructions exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation ou la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités systemd utilisateur sous Linux, les vérifications de dérive des jetons par doctor incluent les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service effectuées par doctor refusent de réécrire, d’arrêter ou de redémarrer un service Gateway depuis un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours imposer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostic de l’exécution et du port du Gateway">
    Doctor inspecte l’exécution du service (PID, dernier état de sortie) et émet un avertissement lorsque le service est installé, mais ne s’exécute pas réellement. Il recherche également les conflits de ports sur le port du Gateway (`18789` par défaut) et indique les causes probables (Gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Doctor émet un avertissement lorsque le service Gateway s’exécute avec Bun ou un chemin Node géré par un gestionnaire de versions (`nvm`, `fnm`, `volta`, `asdf`, etc.). Bun ne peut pas ouvrir le magasin d’état `node:sqlite` d’OpenClaw ; les réparations migrent donc les anciens services Bun vers Node. Les chemins de gestionnaires de versions peuvent cesser de fonctionner après une mise à niveau, car le service ne charge pas l’initialisation de votre shell. Doctor propose une migration vers une installation système de Node lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif. Ainsi, les binaires système gérés par Homebrew restent disponibles, tandis que Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaires de versions ne modifient pas la résolution de Node par les processus enfants. Les services Linux conservent toujours des racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et des répertoires stables de binaires utilisateur, mais les répertoires de repli déduits pour les gestionnaires de versions ne sont écrits dans le PATH du service que s’ils existent sur le disque.

  </Accordion>
  <Accordion title="18. Écriture de la configuration et métadonnées de l’assistant">
    Doctor conserve toutes les modifications de configuration et inscrit les métadonnées de l’assistant afin d’enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils pour l’espace de travail (sauvegarde et système de mémoire)">
    Doctor suggère un système de mémoire pour l’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour obtenir un guide complet sur la structure de l’espace de travail et la sauvegarde avec git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Pages associées

- [Guide d’exploitation du Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
