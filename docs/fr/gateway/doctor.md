---
read_when:
    - Ajout ou modification de migrations de doctor
    - Introduction de modifications incompatibles de la configuration
sidebarTitle: Doctor
summary: 'Commande doctor : contrôles d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-07-12T15:22:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e6be1fa29f2cc0e9832a4c8e5b0ae3dd2e7de43e2466df20f7067ef5ddf0a8
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration d’OpenClaw. Il corrige les configurations et états obsolètes, vérifie l’intégrité et fournit des étapes de réparation concrètes.

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

    Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation du redémarrage, du service et du bac à sable, le cas échéant).

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

    Exécute des vérifications d’intégrité structurées pour la CI ou l’automatisation préalable. Lecture seule : aucune
    demande de confirmation, réparation, migration, aucun redémarrage ni aucune écriture d’état.

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

    S’exécute sans demander de confirmation, en appliquant uniquement les migrations sûres (normalisation de la configuration +
    déplacements de l’état sur disque). Ignore les actions de redémarrage, de service et de bac à sable nécessitant une
    confirmation humaine. Les migrations d’état hérité s’exécutent toujours automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système à la recherche d’installations supplémentaires du Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Pour examiner les modifications avant l’écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Mode d’analyse en lecture seule

`openclaw doctor --lint` est l’équivalent adapté à l’automatisation de
`openclaw doctor --fix`. Ils partagent le même registre de règles Doctor, mais
ne sélectionnent ni n’appliquent les règles de la même manière :

| Mode                     | Demandes de confirmation | Écriture de la configuration/de l’état | Sortie                            | Utilisation                                      |
| ------------------------ | ------------------------ | -------------------------------------- | --------------------------------- | ------------------------------------------------ |
| `openclaw doctor`        | oui                      | non                                    | rapport d’intégrité convivial     | vérification de l’état par une personne          |
| `openclaw doctor --fix`  | parfois                  | oui, selon la politique de réparation  | journal de réparation convivial   | application des réparations approuvées           |
| `openclaw doctor --lint` | non                      | non                                    | constats structurés               | CI, vérifications préalables et jalons de revue  |

Par défaut, `doctor --lint` exécute le profil d’automatisation général et sûr : des vérifications
statiques, locales et utiles dans les sorties de CI ou de contrôle préalable. Il ignore les vérifications facultatives
qui sont consultatives, sensibles à l’environnement, dépendantes de services actifs, liées à
l’inventaire des comptes/espaces de travail ou au nettoyage historique. Utilisez `doctor --lint --all` pour obtenir
l’audit d’analyse complet enregistré, y compris ces vérifications facultatives, ou `--only <id>` pour
une vérification ciblée.

`doctor --fix` n’utilise pas le profil d’analyse par défaut et n’accepte pas
`--all`. Il suit le parcours de réparation ordonné de Doctor : les vérifications d’intégrité modernes peuvent fournir
une implémentation facultative de `repair()`, tandis que les zones plus anciennes utilisent encore leur flux de réparation
Doctor hérité. Certains constats d’analyse sont volontairement uniquement diagnostiques ; ainsi, la présence
d’une vérification dans `--lint --all` ne signifie pas que `--fix` modifiera cette zone.
Le contrat sépare `detect()` (signale les constats) de `repair()` (signale
les modifications/différences/effets secondaires), ce qui laisse la voie ouverte à un futur
`doctor --fix --dry-run` sans transformer les vérifications d’analyse en planificateurs de modifications.

Certaines vérifications intégrées sont désactivées par défaut en interne afin de rester disponibles pour
`--all`, `--only` et les flux de réparation Doctor sans faire partie du profil d’automatisation
`doctor --lint` par défaut. La gravité reste indiquée pour chaque
constat (`info`, `warning` ou `error`) ; la sélection par défaut n’est pas un niveau de
gravité.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Champs de la sortie JSON :

- `ok` : indique si un constat a atteint le seuil de gravité sélectionné
- `checksRun` / `checksSkipped` : nombres de vérifications (ignorées selon le profil, `--only` ou `--skip`)
- `findings` : diagnostics structurés avec `checkId`, `severity`, `message` et, facultativement, `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Codes de sortie :

| Code | Signification                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------- |
| `0`  | aucun constat au seuil sélectionné ou au-dessus                                                   |
| `1`  | un ou plusieurs constats ont atteint le seuil sélectionné                                         |
| `2`  | échec de la commande ou de l’environnement d’exécution avant l’émission possible des constats     |

Options :

- `--severity-min info|warning|error` (valeur par défaut : `warning`) : contrôle à la fois les éléments affichés et ceux qui entraînent un code de sortie non nul.
- `--all` : exécute toutes les vérifications d’analyse enregistrées, y compris les vérifications facultatives exclues de l’ensemble d’automatisation par défaut.
- `--only <id>` (répétable) : exécute uniquement les identifiants de vérification indiqués ; un identifiant inconnu est signalé comme un constat d’erreur.
- `--skip <id>` (répétable) : exclut une vérification tout en maintenant le reste de l’exécution actif.
- `--json`, `--severity-min`, `--all`, `--only` et `--skip` nécessitent `--lint` ; les exécutions simples de `openclaw doctor` et avec `--fix` les refusent.

## Fonctionnement (résumé)

<AccordionGroup>
  <Accordion title="Intégrité, interface utilisateur et mises à jour">
    - Mise à jour préalable facultative pour les installations git (mode interactif uniquement).
    - Vérification de l’actualité du protocole de l’interface utilisateur (reconstruit l’interface utilisateur de contrôle lorsque le schéma du protocole est plus récent).
    - Vérification d’intégrité + demande de redémarrage.
    - Résumé de l’état des Skills (éligibles/manquantes/bloquées) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de la configuration pour les formats de valeurs hérités.
    - Migration de la configuration Talk depuis les champs plats hérités `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les configurations héritées de l’extension Chrome et la disponibilité du MCP Chrome.
    - Avertissements relatifs aux remplacements du fournisseur OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migration du fournisseur/profil OpenAI Codex hérité (`openai-codex` → `openai`) et avertissements de masquage pour `models.providers.openai-codex` obsolète.
    - Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
    - Avertissements relatifs à la liste d’autorisation des plugins/outils lorsque `plugins.allow` est restrictive, mais que la politique des outils demande toujours un caractère générique ou des outils appartenant à un plugin.
    - Migration de l’état hérité sur disque (sessions/répertoire de l’agent/authentification WhatsApp).
    - Migration des clés de contrat héritées du manifeste de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration du stockage Cron hérité (`jobId`, `schedule.cron`, champs de livraison/charge utile de premier niveau, `provider` de la charge utile, tâches Webhook de repli avec `notify: true`).
    - Réparation de l’épinglage de l’environnement d’exécution de la CLI Codex (`agentRuntime.id: "codex-cli"` → `"codex"`) dans `agents.defaults`, `agents.list[]` et `models.providers.*` (y compris les entrées par modèle).
    - Nettoyage des configurations de plugin obsolètes lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugin obsolètes sont conservées comme configuration de confinement inactive.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage des sessions et nettoyage des verrouillages obsolètes.
    - Réparation des transcriptions de session pour les branches dupliquées de réécriture des invites créées par les versions 2026.4.24 concernées.
    - Détection des marqueurs de récupération après redémarrage des sous-agents bloqués, avec prise en charge de `--fix` pour effacer les indicateurs obsolètes de récupération interrompue afin que le démarrage ne continue pas à considérer l’enfant comme interrompu par un redémarrage.
    - Vérifications de l’intégrité de l’état et des autorisations (sessions, transcriptions, répertoire d’état).
    - Vérifications des autorisations du fichier de configuration (chmod 600) lors de l’exécution locale.
    - Intégrité de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les jetons arrivant à expiration et signale les états de temporisation/désactivation des profils d’authentification.

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image du bac à sable lorsque l’isolation en bac à sable est activée.
    - Migration des services hérités et détection des gateways supplémentaires.
    - Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications de l’environnement d’exécution du Gateway (service installé mais non exécuté ; étiquette launchd mise en cache).
    - Avertissements sur l’état des canaux (sondés depuis le gateway en cours d’exécution).
    - Les vérifications d’autorisations propres aux canaux se trouvent sous `openclaw channels capabilities` ; par exemple, les autorisations des canaux vocaux Discord sont auditées avec `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Vérifications de la réactivité de WhatsApp en cas de dégradation de l’intégrité de la boucle d’événements du Gateway lorsque des clients TUI locaux sont encore en cours d’exécution ; `--fix` arrête uniquement les clients TUI locaux vérifiés.
    - Réparation des routes Codex pour les références de modèle héritées `openai-codex/*` dans les modèles principaux, les solutions de repli, les modèles de génération d’images/vidéos, les remplacements de Heartbeat/sous-agent/Compaction, les hooks, les remplacements de modèle des canaux et les épinglages de route des sessions ; `--fix` les réécrit en `openai/*`, migre les profils/l’ordre d’authentification `openai-codex:*` vers `openai:*`, supprime les épinglages obsolètes de l’environnement d’exécution des sessions/de l’ensemble de l’agent et laisse la route effective réparée déterminer la compatibilité avec Codex.
    - Audit de la configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement du proxy intégré pour les services Gateway ayant capturé les valeurs de l’interpréteur de commandes `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` pendant l’installation ou la mise à jour.
    - Vérifications des bonnes pratiques de l’environnement d’exécution du Gateway (Node ou Bun, chemins des gestionnaires de versions).
    - Diagnostics des collisions de ports du Gateway (valeur par défaut : `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et association">
    - Avertissements de sécurité pour les politiques de messages privés ouverts.
    - Vérifications de l’authentification du Gateway pour le mode de jeton local (propose de générer un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations SecretRef des jetons).
    - Détection des problèmes d’association d’appareils (demandes de première association en attente, mises à niveau de rôle/portée en attente, dérive du cache local obsolète des jetons d’appareil et dérive d’authentification des enregistrements associés).

  </Accordion>
  <Accordion title="Espace de travail et interpréteur de commandes">
    - Vérification de la persistance systemd sous Linux.
    - Vérification de la taille des fichiers d’amorçage de l’espace de travail (avertissements de troncature/proximité de la limite pour les fichiers de contexte).
    - Vérification de la disponibilité des Skills pour l’agent par défaut ; signale les Skills autorisées auxquelles il manque des binaires, des variables d’environnement, une configuration ou des prérequis de système d’exploitation, et `--fix` peut désactiver les Skills indisponibles dans `skills.entries`.
    - Vérification de l’état de l’autocomplétion de l’interpréteur de commandes et installation/mise à niveau automatique.
    - Vérification de la disponibilité du fournisseur d’incorporations pour la recherche en mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Vérifications de l’installation depuis les sources (incompatibilité de l’espace de travail pnpm, ressources d’interface utilisateur manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Rétroremplissage et réinitialisation de l’interface utilisateur Dreams

La scène Dreams de l’interface utilisateur de contrôle comprend les actions **Rétroremplir**, **Réinitialiser** et **Effacer les éléments ancrés** pour le flux de travail de Dreaming ancré. Celles-ci utilisent des méthodes RPC de type doctor du Gateway, mais ne font **pas** partie des réparations/migrations de la CLI `openclaw doctor`.

| Action                        | Fonctionnement                                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rétroremplir                  | Analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute le passage du journal REM ancré et écrit des entrées de rétroremplissage réversibles dans `DREAMS.md`.                           |
| Réinitialiser                 | Supprime uniquement les entrées marquées du journal de rétroremplissage dans `DREAMS.md`.                                                                                                                                       |
| Effacer les éléments ancrés   | Supprime uniquement les entrées à court terme mises en attente et réservées aux éléments ancrés issues de la relecture historique, qui n’ont pas encore accumulé de rappel en direct ni de prise en charge quotidienne.          |

  Aucune de ces opérations ne modifie `MEMORY.md`, n’exécute les migrations complètes de doctor ni ne place, à elle seule, les candidats étayés dans le magasin actif de promotion à court terme. Pour intégrer la relecture historique étayée au flux normal de promotion approfondie, utilisez plutôt le flux CLI :

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  Cette commande place les candidats durables étayés dans le magasin de dreaming à court terme, tandis que `DREAMS.md` reste la surface de révision.

  ## Comportement détaillé et justification

  <AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose d’effectuer une mise à jour (fetch/rebase/build) avant de s’exécuter.
  </Accordion>
  <Accordion title="1. Normalisation de la configuration">
    Doctor normalise les anciennes formes de valeurs selon le schéma actuel. La configuration vocale actuelle de Talk est `talk.provider` + `talk.providers.<provider>`, avec la configuration vocale en temps réel sous `talk.realtime.*`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la table des fournisseurs, et réécrit les anciens sélecteurs de premier niveau en temps réel (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) dans `talk.realtime`.

    Doctor émet également un avertissement lorsque `plugins.allow` n’est pas vide et que la politique des outils utilise un caractère générique ou des entrées d’outils appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils des plugins effectivement chargés ; il ne contourne pas la liste d’autorisation exclusive des plugins.

  </Accordion>
  <Accordion title="2. Migrations des anciennes clés de configuration">
    Lorsque la configuration contient une clé obsolète disposant d’une migration active, les autres commandes refusent de s’exécuter et vous demandent d’exécuter `openclaw doctor`. Doctor explique quelles anciennes clés ont été trouvées, affiche la migration appliquée et réécrit `~/.openclaw/openclaw.json` avec le schéma mis à jour. Le démarrage du Gateway refuse les anciens formats de configuration et vous demande d’exécuter `openclaw doctor --fix` ; il ne réécrit pas `openclaw.json` au démarrage. Les migrations du magasin des tâches Cron sont également gérées par `openclaw doctor --fix`.

    <Note>
      Doctor ne conserve les migrations automatiques que pendant environ deux mois après le
      retrait d’une clé. Les anciennes clés plus anciennes (par exemple les clés d’origine
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` au premier niveau ou `identity` au premier niveau
      de l’ancienne forme de configuration antérieure à la gestion de plusieurs agents) ne disposent plus d’un chemin de migration ;
      la validation des configurations qui les utilisent échoue désormais au lieu de les réécrire. Corrigez
      manuellement ces clés en vous reportant à la référence de configuration actuelle avant que doctor
      puisse poursuivre.
    </Note>

    Migrations actives :

    | Ancienne clé                                                                                    | Clé actuelle                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | supprimées (WebChat a été retiré)                                            |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (et par compte)        | `...threadBindings.idleHours`                                               |
    | anciennes clés `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` | `talk.provider` + `talk.providers.<provider>`                               |
    | anciens sélecteurs Talk en temps réel de premier niveau (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | champs de locuteur TTS `voice`/`voiceName`/`voiceId`                                             | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (tous les canaux sauf Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (tous les canaux, y compris Discord)                         | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                     |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (le démarrage du Gateway ignore également les fournisseurs dont la valeur `api` est une valeur d’énumération future/inconnue au lieu d’échouer en mode fermé) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                         |
    | `browser.relayBindHost`                                                                          | supprimée (ancien paramètre de relais de l’extension Chrome)                |
    | `mcp.servers.*.type` (alias natifs de la CLI)                                                    | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | supprimée (le serveur d’application Codex conserve toujours les outils d’espace de travail natifs de Codex comme outils natifs) |
    | `commands.modelsWrite`                                                                           | supprimée (`/models add` est obsolète)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | supprimées (`NO_REPLY` exact n’est plus réécrit en texte de remplacement visible) |
    | `agents.defaults/list[].systemPromptOverride`                                                    | supprimée (OpenClaw contrôle l’invite système générée)                      |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | supprimée (utilisez `models.providers.<id>.timeoutSeconds` pour les délais d’expiration des modèles/fournisseurs lents, maintenus sous le plafond du délai d’expiration de l’agent/de l’exécution) |
    | `memorySearch` au premier niveau                                                                 | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                   |
    | `memorySearch.store.path` (à n’importe quel niveau)                                              | supprimée (les index de mémoire résident dans la base de données de chaque agent) |
    | `heartbeat` au premier niveau                                                                    | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | identifiants de politique `plugins.openai-codex`                                                 | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | supprimées (obsolètes)                                                       |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Les lignes `plugins.entries.voice-call.config.*` ci-dessus sont normalisées par
      le plugin Voice Call lui-même à chaque chargement de la configuration, et non par `openclaw
      doctor`. Le plugin consigne également au démarrage un avertissement renvoyant vers `openclaw
      doctor --fix`, mais doctor ne réécrit actuellement pas
      `openclaw.json` pour ces clés ; c’est la normalisation propre au plugin qui
      applique la modification lors de l’exécution.
    </Note>

    Recommandations sur le compte par défaut pour les canaux à plusieurs comptes :

    - Si au moins deux entrées `channels.<channel>.accounts` sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de secours peut sélectionner un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un identifiant de compte inconnu, doctor émet un avertissement et répertorie les identifiants de compte configurés.

  </Accordion>
  <Accordion title="2b. Remplacements du fournisseur OpenCode">
    Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cette configuration remplace le catalogue OpenCode intégré de `openclaw/plugin-sdk/llm`. Cela peut forcer les modèles à utiliser la mauvaise API ou ramener les coûts à zéro. Doctor émet un avertissement afin que vous puissiez supprimer ce remplacement et rétablir le routage d’API et les coûts propres à chaque modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et disponibilité de Chrome MCP">
    Si la configuration de votre navigateur pointe encore vers le chemin supprimé de l’extension Chrome, Doctor la normalise pour utiliser le modèle actuel de connexion à Chrome MCP local à l’hôte (`browser.profiles.*.driver: "extension"` → `"existing-session"` ; `browser.relayBindHost` supprimé).

    Doctor vérifie également le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version de Chrome détectée et affiche un avertissement si elle est antérieure à Chrome 144
    - vous rappelle d’activer le débogage à distance dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer à votre place le paramètre côté Chrome. Chrome MCP local à l’hôte nécessite toujours un navigateur basé sur Chromium 144+ sur l’hôte du Gateway/Node, exécuté localement, avec le débogage à distance activé et la première invite de consentement à la connexion approuvée dans le navigateur.

    L’état de préparation ne couvre ici que les prérequis de connexion locale. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’exportation PDF, l’interception des téléchargements et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut. Cette vérification ne s’applique pas aux flux Docker, sandbox, de navigateur distant ou autres flux headless, qui continuent d’utiliser le CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS pour OAuth">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d’autorisation OpenAI afin de vérifier que la pile TLS locale de Node/OpenSSL peut valider la chaîne de certificats. Si la sonde échoue en raison d’une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, un certificat expiré ou un certificat autosigné), doctor affiche des instructions de correction propres à la plateforme. Sous macOS avec une installation Homebrew de Node, la correction consiste généralement à exécuter `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le Gateway fonctionne correctement.
  </Accordion>
  <Accordion title="2e. Remplacements du fournisseur OAuth Codex">
    Si vous avez précédemment ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin intégré du fournisseur OAuth Codex. Doctor affiche un avertissement lorsqu’il détecte ces anciens paramètres de transport en parallèle d’OAuth Codex, afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et rétablir le comportement de routage actuel. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement, mais ces routes de requête définies par l’utilisateur ne sont pas éligibles à la sélection implicite de Codex.
  </Accordion>
  <Accordion title="2f. Réparation des routes Codex">
    Doctor recherche les anciennes références de modèle `openai-codex/*`. Le routage natif du harnais Codex utilise les références de modèle canoniques `openai/*`, mais le préfixe seul ne sélectionne jamais Codex. Lorsque la stratégie d’exécution n’est pas définie ou vaut `auto`, seule une route HTTPS officielle exacte Platform Responses ou ChatGPT Responses, sans remplacement de requête défini par l’utilisateur, est éligible. Consultez [environnement d’exécution implicite de l’agent OpenAI](/fr/providers/openai#implicit-agent-runtime).

    En mode `--fix` / `--repair`, doctor réécrit les références concernées de l’agent par défaut et de chaque agent, notamment les modèles principaux, les solutions de repli, les modèles de génération d’images et de vidéos, les remplacements pour Heartbeat, les sous-agents et Compaction, les hooks, les remplacements de modèle des canaux ainsi que l’état obsolète et persistant des routes de session :

    - `openai-codex/gpt-*` devient `openai/gpt-*`.
    - L’intention Codex est déplacée vers des entrées `agentRuntime.id: "codex"` limitées au fournisseur et au modèle pour les références de modèle d’agent réparées.
    - La configuration obsolète de l’environnement d’exécution de l’ensemble de l’agent et les verrouillages persistants de l’environnement d’exécution de session sont supprimés, car la sélection de l’environnement d’exécution est limitée au fournisseur et au modèle.
    - La stratégie d’exécution existante du fournisseur et du modèle est conservée, sauf si la référence de modèle ancienne réparée nécessite le routage Codex pour conserver l’ancien chemin d’authentification.
    - Les listes existantes de modèles de repli sont conservées et leurs anciennes entrées sont réécrites ; les paramètres copiés propres à chaque modèle sont déplacés de l’ancienne clé vers la clé canonique `openai/*`.
    - Les valeurs persistantes de session `modelProvider`/`providerOverride`, `model`/`modelOverride`, les notifications de repli et les verrouillages de profil d’authentification sont réparés dans tous les magasins de sessions d’agents détectés.
    - Doctor répare séparément les verrouillages obsolètes `agentRuntime.id: "codex-cli"` (un identifiant distinct d’ancien environnement d’exécution) en les remplaçant par `"codex"` dans `agents.defaults`, `agents.list[]` et les entrées de modèle `models.providers.*`.
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis la discussion ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

  </Accordion>
  <Accordion title="2g. Nettoyage des routes de session">
    Doctor analyse également les magasins de sessions d’agents détectés pour rechercher un état de route obsolète créé automatiquement après le déplacement des modèles configurés ou de l’environnement d’exécution hors d’une route appartenant à un Plugin, telle que Codex.

    `openclaw doctor --fix` peut effacer un état obsolète créé automatiquement, notamment les verrouillages de modèle `modelOverrideSource: "auto"`, les métadonnées du modèle d’environnement d’exécution, les identifiants de harnais verrouillés, les liaisons de session CLI et les remplacements automatiques de profil d’authentification lorsque la route qui les possède n’est plus configurée. Les choix explicites de modèle de session effectués par l’utilisateur ou hérités sont signalés pour examen manuel et laissés intacts ; modifiez-les avec `/model ...`, `/new`, ou réinitialisez la session lorsque cette route n’est plus souhaitée.

  </Accordion>
  <Accordion title="3. Migrations de l’état hérité (organisation sur disque)">
    Doctor peut migrer les anciennes organisations sur disque vers la structure actuelle :

    - Stockage des sessions + transcriptions : de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire de l’agent : de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) : des anciens fichiers `~/.openclaw/credentials/*.json` (sauf `oauth.json`) vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

    Ces migrations sont effectuées au mieux et sont idempotentes ; Doctor émet des avertissements lorsqu’il conserve des dossiers hérités comme sauvegardes. Le Gateway et la CLI migrent aussi automatiquement l’ancien stockage des sessions et le répertoire de l’agent au démarrage, afin que l’historique, l’authentification et les modèles soient placés dans le chemin propre à l’agent sans exécution manuelle de Doctor. L’authentification WhatsApp n’est intentionnellement migrée que par `openclaw doctor`. La normalisation du fournisseur Talk et de la table des fournisseurs effectue une comparaison par égalité structurelle ; les différences portant uniquement sur l’ordre des clés ne déclenchent donc plus de modifications sans effet répétées avec `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrations des manifestes de Plugin hérités">
    Doctor analyse tous les manifestes de Plugin installés pour rechercher les clés de capacité de niveau supérieur obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée sans duplication des données.
  </Accordion>
  <Accordion title="3b. Migrations du stockage Cron hérité">
    Doctor vérifie également si le stockage des tâches Cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` en cas de remplacement) contient d’anciens formats de tâche que le planificateur accepte encore à des fins de compatibilité.

    Les nettoyages Cron actuels comprennent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de charge utile de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` dans la charge utile → `delivery.channel` explicite
    - anciennes tâches de repli Webhook avec `notify: true` → livraison Webhook explicite à partir de `cron.webhook` lorsqu’il est défini ; les tâches d’annonce conservent leur livraison dans le chat et reçoivent `delivery.completionDestination`. Lorsque `cron.webhook` n’est pas défini, le marqueur inerte `notify` de niveau supérieur est supprimé pour les tâches sans cible (la livraison existante, y compris les annonces, est préservée), car la livraison à l’exécution ne le consulte jamais.

    Le Gateway assainit également les lignes Cron mal formées lors du chargement afin que les tâches valides continuent de s’exécuter. Les lignes brutes mal formées sont copiées dans `jobs-quarantine.json`, à côté du stockage actif, avant leur suppression de `jobs.json` ; Doctor signale les lignes mises en quarantaine afin que vous puissiez les examiner ou les réparer manuellement.

    Au démarrage, le Gateway normalise la projection d’exécution et ignore le marqueur `notify` de niveau supérieur, mais laisse la configuration Cron persistante à Doctor pour réparation. Lorsque `cron.webhook` n’est pas défini, Doctor supprime le marqueur inerte des tâches sans cible de migration (`delivery.mode` absent ou défini sur none, cible Webhook inutilisable ou livraison d’annonce/de chat existante), sans modifier la livraison existante ; les exécutions répétées de `doctor --fix` ne réémettent donc plus d’avertissement pour la même tâche. Si `cron.webhook` est défini mais ne correspond pas à une URL HTTP(S) valide, Doctor émet toujours un avertissement et conserve le marqueur afin que vous puissiez corriger l’URL.

    Sous Linux, Doctor avertit également lorsque la crontab de l’utilisateur appelle encore l’ancien script `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l’hôte n’est pas maintenu par la version actuelle d’OpenClaw et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque Cron ne peut pas accéder au bus utilisateur systemd. Supprimez l’entrée obsolète de la crontab avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les vérifications d’état actuelles.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de sessions d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes laissés par une session qui s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il indique : le chemin, le PID, si le PID est toujours actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort, métadonnées de propriétaire mal formées, âge supérieur à 30 minutes ou PID actif dont il est établi qu’il appartient à un processus autre qu’OpenClaw). En mode `--fix` / `--repair`, il supprime automatiquement les verrous dont les propriétaires sont morts, orphelins, recyclés, anciens avec des métadonnées mal formées ou étrangers à OpenClaw. Les anciens verrous toujours détenus par un processus OpenClaw actif sont signalés mais laissés en place, afin que Doctor n’interrompe pas un processus actif d’écriture de transcription.
  </Accordion>
  <Accordion title="3d. Réparation des branches de transcription de session">
    Doctor analyse les fichiers JSONL des sessions d’agent pour rechercher la structure de branche dupliquée créée par le bogue de réécriture des transcriptions d’invite de la version 2026.4.24 : un tour utilisateur abandonné contenant le contexte d’exécution interne d’OpenClaw, ainsi qu’une branche sœur active contenant la même invite utilisateur visible. En mode `--fix` / `--repair`, Doctor sauvegarde chaque fichier concerné à côté de l’original et réécrit la transcription pour ne conserver que la branche active, afin que les lecteurs de l’historique et de la mémoire du Gateway ne voient plus de tours en double.
  </Accordion>
  <Accordion title="4. Vérifications de l’intégrité de l’état (persistance des sessions, routage et sécurité)">
    Le répertoire d’état constitue le centre nerveux opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration, sauf si vous disposez de sauvegardes ailleurs.

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte catastrophique de l’état, propose de recréer le répertoire et vous rappelle qu’il est impossible de récupérer les données manquantes.
    - **Autorisations du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les autorisations (et affiche une suggestion `chown` lorsqu’une différence de propriétaire ou de groupe est détectée).
    - **Répertoire d’état synchronisé avec le cloud sous macOS** : avertit lorsque l’état se trouve sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins synchronisés peuvent ralentir les E/S et provoquer des conflits de verrouillage ou de synchronisation.
    - **Répertoire d’état sur SD ou eMMC sous Linux** : avertit lorsque l’état se trouve sur une source de montage `mmcblk*`, car les E/S aléatoires sur SD/eMMC peuvent être plus lentes et accélérer l’usure lors des écritures de sessions et d’identifiants.
    - **Répertoire d’état volatil sous Linux** : avertit lorsque l’état se trouve sur `tmpfs` ou `ramfs`, car les sessions, les identifiants, la configuration et l’état SQLite (avec les fichiers annexes WAL/journal) disparaissent au redémarrage. Les montages Docker `overlay` ne sont volontairement pas signalés, car leurs couches inscriptibles persistent après les redémarrages de l’hôte tant que le conteneur subsiste.
    - **Répertoires de sessions manquants** : `sessions/` et le répertoire de stockage des sessions sont requis pour conserver l’historique et éviter les plantages `ENOENT`.
    - **Discordance de transcription** : avertit lorsque des entrées de session récentes n’ont pas de fichier de transcription.
    - **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale ne comporte qu’une seule ligne (l’historique ne s’accumule pas).
    - **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels, ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut être réparti entre les installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe ou tous les utilisateurs et propose de les restreindre à `600`.

  </Accordion>
  <Accordion title="5. État de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth du stockage d’authentification, avertit lorsque les jetons arrivent à expiration ou ont expiré, et peut les actualiser sans risque. Si le profil OAuth/de jeton Anthropic est obsolète, il suggère une clé d’API Anthropic ou le parcours de jeton de configuration Anthropic. Les invites d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou si un fournisseur vous demande de vous reconnecter), doctor indique qu’une nouvelle authentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale également les profils d’authentification temporairement inutilisables en raison de courtes périodes de temporisation (limites de débit/délais d’expiration/échecs d’authentification) ou de désactivations plus longues (échecs de facturation/crédit).

    Les anciens profils OAuth Codex dont les jetons se trouvent dans le trousseau macOS (ancien processus d’intégration antérieur à la disposition avec fichier annexe) sont réparés uniquement par doctor. Exécutez une fois `openclaw doctor --fix` depuis un terminal interactif pour migrer directement les anciens jetons du trousseau vers `auth-profiles.json` ; les tours intégrés (Telegram, cron, répartition vers des sous-agents) les résolvent ensuite comme des profils OAuth OpenAI canoniques.

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au catalogue et à la liste d’autorisation, puis avertit lorsqu’elle ne pourra pas être résolue ou qu’elle est interdite.
  </Accordion>
  <Accordion title="7. Réparation de l’image du bac à sable">
    Lorsque l’exécution en bac à sable est activée, doctor vérifie les images Docker et propose de les construire ou de revenir aux anciens noms si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Nettoyage de l’installation des plugins">
    En mode `openclaw doctor --fix` / `openclaw doctor --repair`, Doctor supprime l’ancien état intermédiaire des dépendances de plugins généré par OpenClaw : racines de dépendances générées obsolètes, anciens répertoires d’étape d’installation, débris locaux aux paquets issus de l’ancien code de réparation des dépendances des plugins intégrés, ainsi que copies npm gérées orphelines ou récupérées des plugins `@openclaw/*` intégrés susceptibles de masquer le manifeste intégré actuel. Doctor recrée également le lien du paquet hôte `openclaw` dans les plugins npm gérés qui déclarent `peerDependencies.openclaw`, afin que les importations d’exécution locales au paquet, telles que `openclaw/plugin-sdk/*`, continuent d’être résolues après les mises à jour ou les réparations npm.

    Doctor peut également réinstaller les plugins téléchargeables manquants lorsque la configuration les référence, mais que le registre local des plugins ne les trouve pas (`plugins.entries` significatifs, paramètres configurés de canal/fournisseur/recherche, environnements d’exécution d’agents configurés). Pendant les mises à jour des paquets, doctor évite de réinstaller les paquets de plugins pendant le remplacement du paquet principal ; exécutez de nouveau `openclaw doctor --fix` après la mise à jour si un plugin configuré doit encore être récupéré. Hormis l’exception de démarrage de l’image de conteneur décrite ci-dessous, le démarrage du Gateway et le rechargement de la configuration n’exécutent aucune réparation de paquet ; les installations de plugins restent des opérations explicites de doctor/installation/mise à jour.

    Le démarrage d’un Gateway conteneurisé comporte une exception de mise à niveau limitée : lorsque `openclaw gateway run` démarre avec une nouvelle version d’OpenClaw, il exécute les migrations d’état sûres et la convergence existante des plugins après la mise à jour du cœur avant d’être prêt, puis enregistre un point de contrôle par version. Cette passe de démarrage peut nettoyer les enregistrements obsolètes de plugins intégrés, réparer les liens locaux des plugins, réinstaller les paquets de plugins configurés lorsque le processus de convergence l’exige et vérifier les charges utiles des plugins actifs. Si le démarrage ne peut pas effectuer la réparation en toute sécurité, exécutez une fois la même image avec `openclaw doctor --fix` sur le même état et la même configuration montés avant de redémarrer normalement le conteneur.

  </Accordion>
  <Accordion title="8. Migrations du service Gateway et conseils de nettoyage">
    Doctor détecte les anciens services Gateway (launchd/systemd/schtasks) et propose de les supprimer puis d’installer le service OpenClaw avec le port Gateway actuel. Il peut également rechercher d’autres services similaires à un Gateway et afficher des conseils de nettoyage. Les services Gateway OpenClaw nommés selon un profil sont considérés comme des services de premier ordre et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service Gateway au niveau utilisateur est manquant, mais qu’un service Gateway OpenClaw existe au niveau système, doctor n’installe pas automatiquement un second service au niveau utilisateur. Inspectez la situation avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système gère le cycle de vie du Gateway.

  </Accordion>
  <Accordion title="8b. Migration Matrix au démarrage">
    Lorsqu’un compte de canal Matrix comporte une migration d’état héritée en attente ou applicable, doctor (en mode `--fix` / `--repair`) crée un instantané préalable à la migration, puis exécute au mieux les étapes de migration : migration de l’ancien état Matrix et préparation de l’ancien état chiffré. Les deux étapes sont non bloquantes ; les erreurs sont journalisées et le démarrage se poursuit. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage des appareils et dérive de l’authentification">
    Doctor inspecte l’état d’appairage des appareils dans le cadre de la vérification normale de l’état de santé et signale :

    - les demandes de premier appairage en attente
    - les mises à niveau de rôle ou de portée en attente pour les appareils déjà appairés
    - les réparations de discordance de clé publique lorsque l’identifiant de l’appareil correspond toujours, mais que son identité ne correspond plus à l’enregistrement approuvé
    - les enregistrements appairés dépourvus d’un jeton actif pour un rôle approuvé
    - les jetons appairés dont les portées s’écartent de la référence d’appairage approuvée
    - les entrées locales mises en cache de jetons d’appareil pour la machine actuelle, antérieures à une rotation de jeton côté Gateway ou comportant des métadonnées de portée obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage et ne renouvelle pas automatiquement les jetons des appareils. Il affiche les étapes suivantes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - générer un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela distingue le premier appairage des mises à niveau de rôle/portée en attente et de la dérive liée à un jeton obsolète ou à l’identité de l’appareil, éliminant ainsi le cas courant « déjà appairé, mais l’appairage reste requis ».

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu’un fournisseur accepte les messages privés sans liste d’autorisation, ou lorsqu’une politique est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. Persistance systemd (Linux)">
    Lorsqu’il est exécuté comme service utilisateur systemd, doctor vérifie que la persistance est activée afin que le Gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (Skills, plugins et TaskFlows)">
    Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les Skills admissibles, ceux auxquels il manque des prérequis et ceux bloqués par la liste d’autorisation.
    - **État des plugins** : compte les plugins activés/désactivés/en erreur ; répertorie les identifiants des plugins en erreur ; indique les capacités des plugins de l’ensemble intégré.
    - **Avertissements de compatibilité des plugins** : signale les plugins présentant des problèmes de compatibilité avec l’environnement d’exécution actuel.
    - **Diagnostics des plugins** : fait apparaître tous les avertissements ou erreurs émis par le registre des plugins lors du chargement.
    - **Récupération de TaskFlow** : fait apparaître les TaskFlows gérés suspects qui nécessitent une inspection manuelle ou une annulation.

  </Accordion>
  <Accordion title="11b. Taille des fichiers d’amorçage">
    Doctor vérifie si les fichiers d’amorçage de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) approchent ou dépassent le budget de caractères configuré. Il indique pour chaque fichier le nombre de caractères bruts par rapport au nombre injecté, le pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le nombre total de caractères injectés par rapport au budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Complétion de l’interpréteur de commandes">
    Doctor vérifie si la complétion par tabulation est installée pour l’interpréteur de commandes actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil de l’interpréteur utilise un modèle de complétion dynamique lent (`source <(openclaw completion ...)`), doctor le remplace par la variante plus rapide utilisant un fichier mis en cache.
    - Si la complétion est configurée dans le profil, mais que le fichier de cache est manquant, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (uniquement en mode interactif ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

  </Accordion>
  <Accordion title="11d. Nettoyage des plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un plugin de canal manquant, il supprime également la configuration orpheline propre au canal qui référençait ce plugin : entrées `channels.<id>`, cibles Heartbeat qui nommaient le canal et substitutions `agents.*.models["<channel>/*"]`. Cela évite les boucles de démarrage du Gateway dans lesquelles l’environnement d’exécution du canal a disparu, mais où la configuration demande toujours au Gateway de s’y lier.
  </Accordion>
  <Accordion title="12. Vérifications de l’authentification du Gateway (jeton local)">
    Doctor vérifie que l’authentification locale du Gateway par jeton est prête.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef, mais indisponible, doctor émet un avertissement et ne le remplace pas par du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule compatibles avec SecretRef">
    Certains processus de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec immédiat de l’environnement d’exécution.

    - `openclaw doctor --fix` utilise le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour les réparations ciblées de la configuration.
    - Exemple : la réparation des `@username` Telegram dans `allowFrom` / `groupAllowFrom` tente d’utiliser les identifiants configurés du bot lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor indique que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification de l’état du Gateway et redémarrage">
    Doctor effectue une vérification de l’état et propose de redémarrer le Gateway lorsqu’il semble défaillant.
  </Accordion>
  <Accordion title="13b. Disponibilité de la recherche en mémoire">
    Doctor vérifie si le fournisseur d’embeddings configuré pour la recherche en mémoire est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : vérifie si le binaire `qmd` est disponible et peut être démarré. Sinon, affiche des instructions de correction comprenant `npm install -g @tobilu/qmd` (ou l’équivalent avec Bun) ainsi qu’une option permettant d’indiquer manuellement le chemin du binaire.
    - **Fournisseur local explicite** : recherche un fichier de modèle local ou une URL de modèle distant/téléchargeable reconnue. S’il est manquant, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé d’API est présente dans l’environnement ou le magasin d’authentification. Affiche des indications de correction exploitables si elle est manquante.
    - **Ancien fournisseur automatique** : traite `memorySearch.provider: "auto"` comme OpenAI, vérifie la disponibilité d’OpenAI, et `doctor --fix` le réécrit en `provider: "openai"`.

    Lorsqu’un résultat de vérification du Gateway mis en cache est disponible (le Gateway était opérationnel au moment de la vérification), doctor recoupe ce résultat avec la configuration visible depuis la CLI et signale toute divergence. Doctor ne lance pas une nouvelle requête de test d’embedding dans le chemin par défaut ; utilisez la commande détaillée d’état de la mémoire si vous souhaitez effectuer une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la disponibilité des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements sur l’état des canaux">
    Si le Gateway est opérationnel, doctor exécute une vérification de l’état des canaux et signale les avertissements avec des corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit et réparation de la configuration du superviseur">
    Doctor vérifie que la configuration installée du superviseur (launchd/systemd/schtasks) ne comporte pas de valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd à network-online et le délai de redémarrage). Lorsqu’il détecte une divergence, il recommande une mise à jour et peut réécrire le fichier de service ou la tâche avec les valeurs par défaut actuelles.

    Remarques :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --fix` applique les corrections recommandées sans invite (`--repair` est un alias).
    - `openclaw doctor --fix --force` remplace les configurations personnalisées du superviseur.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` maintient doctor en lecture seule pour le cycle de vie du service Gateway. Il continue à signaler l’état du service et à effectuer les réparations non liées au service, mais ignore l’installation, le démarrage, le redémarrage et l’amorçage du service, la réécriture de la configuration du superviseur ainsi que le nettoyage des anciens services, car un superviseur externe gère ce cycle de vie.
    - Sous Linux, doctor ne réécrit pas les métadonnées de commande ou de point d’entrée tant que l’unité systemd correspondante du Gateway est active. Il ignore également les unités supplémentaires inactives ressemblant au Gateway et non héritées lors de la recherche des services en double, afin que les fichiers de services compagnons ne génèrent pas de bruit de nettoyage.
    - Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation ou la réparation du service par doctor valide la SecretRef, mais ne conserve pas les valeurs résolues du jeton en texte brut dans les métadonnées d’environnement du service du superviseur.
    - Doctor détecte les valeurs d’environnement du service gérées et adossées à `.env`/SecretRef que d’anciennes installations de LaunchAgent, systemd ou de tâches planifiées Windows avaient intégrées en ligne, puis réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution plutôt que depuis la définition du superviseur.
    - Doctor détecte lorsque la commande du service impose encore un ancien `--port` après une modification de `gateway.port` et réécrit les métadonnées du service avec le port actuel.
    - Si l’authentification par jeton nécessite un jeton et que la SecretRef configurée pour ce jeton n’est pas résolue, doctor bloque le chemin d’installation ou de réparation et fournit des instructions exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés alors que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation ou la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités systemd utilisateur sous Linux, les vérifications de dérive du jeton par doctor incluent les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service par doctor refusent de réécrire, d’arrêter ou de redémarrer un service Gateway depuis un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète avec `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics de l’exécution et du port du Gateway">
    Doctor inspecte l’exécution du service (PID, dernier état de sortie) et avertit lorsque le service est installé, mais ne fonctionne pas réellement. Il recherche également les conflits sur le port du Gateway (`18789` par défaut) et signale les causes probables (Gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Doctor avertit lorsque le service Gateway s’exécute avec Bun ou depuis un chemin Node géré par un gestionnaire de versions (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp et Telegram nécessitent Node, et les chemins des gestionnaires de versions peuvent cesser de fonctionner après une mise à niveau, car le service ne charge pas l’initialisation de votre shell. Doctor propose une migration vers une installation système de Node lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif. Les binaires système gérés par Homebrew restent ainsi disponibles, tandis que les répertoires de Volta, asdf, fnm, pnpm et des autres gestionnaires de versions ne modifient pas la version de Node résolue par les processus enfants. Les services Linux conservent toujours les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires stables des binaires utilisateur, mais les répertoires de secours supposés des gestionnaires de versions ne sont ajoutés au PATH du service que s’ils existent sur le disque.

  </Accordion>
  <Accordion title="18. Écriture de la configuration et métadonnées de l’assistant">
    Doctor conserve toutes les modifications de configuration et inscrit les métadonnées de l’assistant afin d’enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils sur l’espace de travail (sauvegarde et système de mémoire)">
    Doctor suggère un système de mémoire pour l’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà géré par git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour obtenir un guide complet sur la structure de l’espace de travail et la sauvegarde avec git (dépôt GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Liens connexes

- [Guide d’exploitation du Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
