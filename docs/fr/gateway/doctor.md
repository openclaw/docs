---
read_when:
    - Ajouter ou modifier des migrations doctor
    - Introduire des modifications de configuration incompatibles
sidebarTitle: Doctor
summary: 'Commande doctor : contrôles d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-06-27T17:30:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration pour OpenClaw. Il corrige les configurations/états obsolètes, vérifie la santé et fournit des étapes de réparation exploitables.

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

    Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation liées au redémarrage, au service ou au bac à sable, le cas échéant).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Applique les réparations recommandées sans demander de confirmation (réparations + redémarrages lorsqu’ils sont sûrs).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Exécute des contrôles de santé structurés pour la CI ou l’automatisation de pré-vérification. Ce mode est
    en lecture seule : il ne demande pas de confirmation, ne répare pas, ne migre pas la configuration, ne redémarre pas de services et ne
    touche pas à l’état.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Applique aussi les réparations agressives (écrase les configurations de superviseur personnalisées).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    S’exécute sans invites et applique uniquement les migrations sûres (normalisation de la configuration + déplacements d’état sur disque). Ignore les actions de redémarrage, de service ou de bac à sable qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système à la recherche d’installations Gateway supplémentaires (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si vous voulez examiner les modifications avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Mode lint en lecture seule

`openclaw doctor --lint` est l’équivalent adapté à l’automatisation de
`openclaw doctor --fix`. Les deux utilisent les contrôles de santé de doctor, mais leur posture est
différente :

| Mode                     | Invites   | Écrit la configuration/l’état | Sortie                 | À utiliser pour                 |
| ------------------------ | --------- | ----------------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | oui       | non                           | rapport de santé convivial | un humain qui vérifie l’état |
| `openclaw doctor --fix`  | parfois   | oui, avec politique de réparation | journal de réparation convivial | appliquer des réparations approuvées |
| `openclaw doctor --lint` | non       | non                           | constats structurés    | CI, pré-vérification et barrières de revue |

Les contrôles de santé modernisés peuvent fournir une implémentation optionnelle `repair()`.
`doctor --fix` applique ces réparations lorsqu’elles existent et continue d’utiliser le
flux de réparation doctor existant pour les contrôles qui n’ont pas encore migré.
Le contrat de réparation structuré sépare aussi le rapport de réparation de la détection :
`detect()` signale les constats actuels, tandis que `repair()` peut signaler des changements,
des diffs de configuration/fichiers et des effets de bord non liés aux fichiers. Cela garde ouverte la voie de migration
pour de futures sorties `doctor --fix --dry-run` et de diff, sans faire planifier de mutations aux contrôles lint.

Exemples :

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

La sortie JSON inclut :

- `ok` : indique si un constat visible a atteint le seuil de gravité sélectionné
- `checksRun` : nombre de contrôles de santé exécutés
- `checksSkipped` : contrôles ignorés par le profil sélectionné, `--only` ou `--skip`
- `findings` : diagnostics structurés avec `checkId`, `severity`, `message` et
  éventuellement `path`, `line`, `column`, `ocPath` et `fixHint`

Codes de sortie :

- `0` : aucun constat au seuil sélectionné ou au-dessus
- `1` : un ou plusieurs constats ont atteint le seuil sélectionné
- `2` : échec de commande/d’exécution avant l’émission possible des constats lint

Utilisez `--severity-min info|warning|error` pour contrôler à la fois ce qui est affiché et ce qui
provoque une sortie lint non nulle. Utilisez `--all` pour exécuter l’inventaire lint complet,
y compris les contrôles plus approfondis à activation explicite exclus de l’ensemble d’automatisation par défaut. Utilisez `--only <id>` pour des barrières de pré-vérification ciblées et
`--skip <id>` pour exclure temporairement un contrôle bruyant tout en gardant actif le reste de
l’exécution lint.
Les options de sortie lint telles que `--json`, `--severity-min`, `--all`, `--only` et
`--skip` doivent être associées à `--lint` ; les exécutions doctor et de réparation ordinaires les
rejettent.

## Ce qu’il fait (résumé)

<AccordionGroup>
  <Accordion title="Santé, UI et mises à jour">
    - Pré-vérification de mise à jour optionnelle pour les installations git (interactif uniquement).
    - Contrôle de fraîcheur du protocole UI (reconstruit Control UI lorsque le schéma de protocole est plus récent).
    - Contrôle de santé + invite de redémarrage.
    - Résumé de l’état des Skills (éligibles/manquantes/bloquées) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de la configuration pour les valeurs héritées.
    - Migration de la configuration Talk depuis les champs plats hérités `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Contrôles de migration du navigateur pour les configurations héritées de l’extension Chrome et la préparation de Chrome MCP.
    - Avertissements de remplacements de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Migration de fournisseur/profil OpenAI Codex hérité (`openai-codex` → `openai`) et avertissements de masquage pour `models.providers.openai-codex` obsolète.
    - Contrôle des prérequis OAuth TLS pour les profils OAuth OpenAI Codex.
    - Avertissements de liste d’autorisation de plugins/outils lorsque `plugins.allow` est restrictive mais que la politique d’outils demande toujours des outils wildcard ou appartenant à un plugin.
    - Migration d’état hérité sur disque (sessions/répertoire d’agent/auth WhatsApp).
    - Migration des clés de contrat de manifeste de plugin héritées (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration du stockage cron hérité (`jobId`, `schedule.cron`, champs livraison/payload de premier niveau, payload `provider`, tâches de secours Webhook `notify: true`).
    - Nettoyage de la politique d’exécution agent entier héritée ; la politique d’exécution fournisseur/modèle est le sélecteur de route actif.
    - Nettoyage de configuration de plugin obsolète lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugins obsolètes sont traitées comme configuration de confinement inerte et sont préservées.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation de transcriptions de session pour les branches de réécriture de prompt dupliquées créées par les builds 2026.4.24 affectés.
    - Détection de tombstones de récupération-redémarrage de sous-agent bloqué, avec prise en charge de `--fix` pour effacer les indicateurs de récupération abandonnée obsolètes afin que le démarrage ne continue pas à traiter l’enfant comme abandonné au redémarrage.
    - Contrôles d’intégrité et de permissions de l’état (sessions, transcriptions, répertoire d’état).
    - Contrôles de permissions du fichier de configuration (chmod 600) lors d’une exécution locale.
    - Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les tokens arrivant à expiration et signale les états de délai de récupération/désactivation des profils d’authentification.

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image de bac à sable lorsque le sandboxing est activé.
    - Migration de service hérité et détection de Gateway supplémentaire.
    - Migration d’état hérité du canal Matrix (en mode `--fix` / `--repair`).
    - Contrôles d’exécution Gateway (service installé mais non démarré ; label launchd mis en cache).
    - Avertissements d’état des canaux (sondés depuis le Gateway en cours d’exécution).
    - Les contrôles de permissions propres aux canaux se trouvent sous `openclaw channels capabilities` ; par exemple, les permissions des canaux vocaux Discord sont auditées avec `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Contrôles de réactivité WhatsApp pour une santé dégradée de la boucle d’événements Gateway lorsque des clients TUI locaux sont toujours en cours d’exécution ; `--fix` arrête uniquement les clients TUI locaux vérifiés.
    - Réparation de route Codex pour les références de modèle héritées `openai-codex/*` dans les modèles principaux, les fallbacks, les modèles de génération d’images/vidéos, les remplacements heartbeat/sous-agent/compaction, les hooks, les remplacements de modèle de canal et les épingles de route de session ; `--fix` les réécrit en `openai/*`, migre les profils/l’ordre d’authentification `openai-codex:*` vers `openai:*`, supprime les épingles d’exécution de session/agent entier obsolètes et laisse les références canoniques d’agent OpenAI sur le harnais Codex par défaut.
    - Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation optionnelle.
    - Nettoyage de l’environnement du proxy intégré pour les services Gateway qui ont capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` pendant l’installation ou la mise à jour.
    - Contrôles de bonnes pratiques d’exécution Gateway (Node vs Bun, chemins de gestionnaires de versions).
    - Diagnostics de collision de port Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et appairage">
    - Avertissements de sécurité pour les politiques de DM ouvertes.
    - Contrôles d’authentification Gateway pour le mode token local (propose la génération d’un token lorsqu’aucune source de token n’existe ; n’écrase pas les configurations SecretRef de token).
    - Détection des problèmes d’appairage d’appareil (demandes de premier appairage en attente, mises à niveau de rôle/portée en attente, dérive du cache local de token d’appareil obsolète et dérive d’authentification des enregistrements appairés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Contrôle systemd linger sous Linux.
    - Contrôle de taille des fichiers de bootstrap d’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Contrôle de préparation des Skills pour l’agent par défaut ; signale les skills autorisées avec bins, env, configuration ou exigences d’OS manquants, et `--fix` peut désactiver les skills indisponibles dans `skills.entries`.
    - Contrôle de l’état des complétions shell et installation/mise à niveau automatique.
    - Contrôle de préparation du fournisseur d’embeddings de recherche mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Contrôles d’installation depuis les sources (incompatibilité d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Rattrapage et réinitialisation de l’UI Dreams

La scène Dreams de Control UI inclut des actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de dreaming ancré. Ces actions utilisent des méthodes RPC de style Gateway doctor, mais elles ne font **pas** partie des réparations/migrations de la CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM ancré et écrit des entrées de rattrapage réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de rattrapage marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées de court terme staged et uniquement ancrées qui proviennent d’une relecture historique et n’ont pas encore accumulé de rappel en direct ni de support quotidien.

Ce qu’elles ne font **pas** par elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne préparent pas automatiquement les candidats ancrés dans le magasin de promotion court terme en direct, sauf si vous exécutez explicitement d’abord le chemin CLI staged

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela place les candidats durables ancrés dans le magasin de dreaming court terme tout en gardant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour optionnelle (installations git)">
    Si ceci est un checkout git et que doctor s’exécute de manière interactive, il propose de mettre à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de la configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement propre au canal), doctor les normalise dans le schéma actuel.

    Cela inclut les champs plats Talk hérités. La configuration vocale publique Talk actuelle est `talk.provider` + `talk.providers.<provider>`, et la configuration vocale temps réel est `talk.realtime.*`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la carte de fournisseurs, et réécrit les sélecteurs temps réel hérités de premier niveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) dans `talk.realtime`.

    Doctor avertit également lorsque `plugins.allow` est non vide et que la politique d’outils utilise
    des entrées génériques ou des entrées d’outils appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils
    des plugins qui se chargent réellement ; cela ne contourne pas la liste
    d’autorisation exclusive des plugins.

  </Accordion>
  <Accordion title="2. Migrations des clés de configuration héritées">
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
    - supprimer `channels.webchat` et `gateway.webchat` retirés
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de premier niveau
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - anciens `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - sélecteurs Talk temps réel hérités de premier niveau (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` et `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` et `messages.tts.providers.microsoft`
    - champs de sélection de locuteur TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` et `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` et `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Pour les canaux avec des `accounts` nommés mais des valeurs de canal de premier niveau à compte unique persistantes, déplacer ces valeurs à portée de compte vers le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimer `agents.defaults.llm` ; utilisez `models.providers.<id>.timeoutSeconds` pour les délais d’attente fournisseur/modèle lents, et gardez le délai d’attente d’agent/exécution au-dessus de cette valeur lorsque l’exécution complète doit durer plus longtemps
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du gateway ignore également les fournisseurs dont `api` est défini sur une valeur d’énumération future ou inconnue au lieu d’échouer en mode fermé)
    - supprimer `plugins.entries.codex.config.codexDynamicToolsProfile` ; le serveur d’application Codex conserve toujours les outils d’espace de travail natifs de Codex en natif

    Les avertissements de Doctor incluent également des conseils sur les comptes par défaut pour les canaux multi-comptes :

    - Si au moins deux entrées `channels.<channel>.accounts` sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, doctor avertit et liste les ID de comptes configurés.

  </Accordion>
  <Accordion title="2b. Remplacements de fournisseur OpenCode">
    Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cela remplace le catalogue OpenCode intégré de `openclaw/plugin-sdk/llm`. Cela peut forcer des modèles vers la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et restaurer le routage API + les coûts par modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation de Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin supprimé de l’extension Chrome, doctor la normalise vers le modèle actuel d’attache Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite également le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
    - vérifie la version Chrome détectée et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage distant dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer le paramètre côté Chrome pour vous. Chrome MCP local à l’hôte nécessite toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
    - le navigateur exécuté localement
    - le débogage distant activé dans ce navigateur
    - l’approbation de la première invite de consentement d’attache dans le navigateur

    La préparation ici concerne uniquement les prérequis d’attache locale. Existing-session conserve les limites de route Chrome MCP actuelles ; les routes avancées comme `responsebody`, l’export PDF, l’interception de téléchargements et les actions par lot nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** à Docker, sandbox, remote-browser ni aux autres flux headless. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis OAuth TLS">
    Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS locale Node/OpenSSL peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat auto-signé), doctor affiche des conseils de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements de fournisseur OAuth Codex">
    Si vous aviez précédemment ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin de fournisseur OAuth Codex intégré que les versions plus récentes utilisent automatiquement. Doctor avertit lorsqu’il voit ces anciens paramètres de transport avec OAuth Codex afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le comportement de routage/secours intégré. Les proxies personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Réparation des routes Codex">
    Doctor vérifie les références de modèle héritées `openai-codex/*`. Le routage natif du harnais Codex utilise des références de modèle canoniques `openai/*` ; les tours d’agent OpenAI passent par le harnais de serveur d’application Codex au lieu du chemin fournisseur OpenClaw OpenAI.

    En mode `--fix` / `--repair`, doctor réécrit les références affectées des agents par défaut et par agent, y compris les modèles principaux, les solutions de secours, les modèles de génération d’images/vidéos, les remplacements heartbeat/subagent/compaction, les hooks, les remplacements de modèle par canal et l’état de route de session persisté obsolète :

    - `openai-codex/gpt-*` devient `openai/gpt-*`.
    - L’intention Codex passe à des entrées `agentRuntime.id: "codex"` à portée fournisseur/modèle pour les références de modèle d’agent réparées.
    - La configuration d’exécution d’agent complète obsolète et les épinglages d’exécution de session persistés sont supprimés, car la sélection de l’exécution est à portée fournisseur/modèle.
    - La politique d’exécution fournisseur/modèle existante est conservée, sauf si la référence de modèle héritée réparée nécessite le routage Codex pour conserver l’ancien chemin d’authentification.
    - Les listes de secours de modèle existantes sont conservées avec leurs entrées héritées réécrites ; les paramètres par modèle copiés passent de l’ancienne clé à la clé canonique `openai/*`.
    - Les `modelProvider`/`providerOverride`, `model`/`modelOverride`, avis de secours et épinglages de profil d’authentification de session persistés sont réparés dans tous les stockages de session d’agent découverts.
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur ACP/acpx externe ».

  </Accordion>
  <Accordion title="2g. Nettoyage des routes de session">
    Doctor analyse également les stockages de session d’agent découverts pour repérer l’état de route auto-créé obsolète après le déplacement des modèles configurés ou de l’exécution hors d’une route appartenant à un plugin, comme Codex.

    `openclaw doctor --fix` peut effacer l’état obsolète auto-créé comme les épinglages de modèle `modelOverrideSource: "auto"`, les métadonnées de modèle d’exécution, les ID de harnais épinglés, les liaisons de session CLI et les remplacements automatiques de profil d’authentification lorsque leur route propriétaire n’est plus configurée. Les choix explicites de l’utilisateur ou les choix hérités de modèle de session sont signalés pour examen manuel et laissés intacts ; changez-les avec `/model ...`, `/new`, ou réinitialisez la session lorsque cette route n’est plus prévue.

  </Accordion>
  <Accordion title="3. Migrations d’état hérité (agencement disque)">
    Doctor peut migrer les anciens agencements sur disque vers la structure actuelle :

    - Stockage des sessions + transcriptions :
      - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
    - Répertoire de l’agent :
      - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
    - État d’authentification WhatsApp (Baileys) :
      - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
      - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

    Ces migrations sont au mieux des possibilités et idempotentes ; doctor émettra des avertissements lorsqu’il laisse d’anciens dossiers en place comme sauvegardes. Le Gateway/CLI migre aussi automatiquement les anciennes sessions + le répertoire agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp est intentionnellement migrée uniquement via `openclaw doctor`. La normalisation fournisseur/carte de fournisseurs Talk compare désormais par égalité structurelle, donc les différences limitées à l’ordre des clés ne déclenchent plus de modifications `doctor --fix` répétées et sans effet.

  </Accordion>
  <Accordion title="3a. Migrations des manifestes de Plugin hérités">
    Doctor analyse tous les manifestes de Plugin installés à la recherche de clés de capacités de premier niveau obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier de manifeste sur place. Cette migration est idempotente ; si la clé `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations des stores Cron hérités">
    Doctor vérifie également le store des tâches Cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) pour détecter les anciennes formes de tâches que le planificateur accepte encore par compatibilité.

    Les nettoyages Cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de payload de premier niveau (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de premier niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` du payload → `delivery.channel` explicite
    - anciennes tâches de repli Webhook `notify: true` → livraison Webhook explicite depuis `cron.webhook` lorsqu’il est défini ; les tâches d’annonce conservent leur livraison par chat et reçoivent `delivery.completionDestination`. Lorsque `cron.webhook` n’est pas défini, le marqueur inerte de premier niveau `notify` est supprimé pour les tâches sans cible (la livraison existante, y compris les annonces, est préservée), car la livraison à l’exécution ne le lit jamais

    Le Gateway assainit aussi les lignes Cron mal formées au moment du chargement afin que les tâches valides continuent de s’exécuter. Les lignes brutes mal formées sont copiées dans `jobs-quarantine.json` à côté du store actif avant d’être supprimées de `jobs.json` ; Doctor signale les lignes mises en quarantaine afin que vous puissiez les examiner ou les réparer manuellement.

    Au démarrage, le Gateway normalise la projection d’exécution et ignore le marqueur de premier niveau `notify`, mais laisse la configuration Cron persistée à Doctor pour réparation. Lorsque `cron.webhook` n’est pas défini, Doctor supprime le marqueur inerte pour les tâches sans cible de migration (`delivery.mode` absent/none, une cible Webhook inutilisable, ou une livraison annonce/chat existante), en laissant la livraison existante intacte, de sorte que les exécutions répétées de `doctor --fix` n’émettent plus le même avertissement pour la même tâche. Si `cron.webhook` est défini mais n’est pas une URL HTTP(S) valide, Doctor continue d’avertir et laisse le marqueur afin que vous puissiez corriger l’URL.

    Sous Linux, Doctor avertit également lorsque la crontab de l’utilisateur invoque encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script propre à l’hôte n’est pas maintenu par la version actuelle d’OpenClaw et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque Cron ne peut pas atteindre le bus utilisateur systemd. Supprimez l’entrée crontab obsolète avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les contrôles d’état actuels.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale : le chemin, le PID, si le PID est toujours actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort, métadonnées de propriétaire mal formées, plus de 30 minutes, ou PID actif dont on peut prouver qu’il appartient à un processus non-OpenClaw). En mode `--fix` / `--repair`, il supprime automatiquement les verrous dont les propriétaires sont morts, orphelins, recyclés, anciens et mal formés, ou non-OpenClaw. Les anciens verrous encore détenus par un processus OpenClaw actif sont signalés mais laissés en place afin que Doctor n’interrompe pas un rédacteur de transcript actif.
  </Accordion>
  <Accordion title="3d. Réparation des branches de transcript de session">
    Doctor analyse les fichiers JSONL de session d’agent à la recherche de la forme de branche dupliquée créée par le bug de réécriture des transcripts de prompt du 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne d’OpenClaw, plus un frère actif contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, Doctor sauvegarde chaque fichier affecté à côté de l’original et réécrit le transcript vers la branche active afin que l’historique du Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Contrôles d’intégrité de l’état (persistance des sessions, routage et sécurité)">
    Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, invite à recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Autorisations du répertoire d’état** : vérifie l’accès en écriture ; propose de réparer les autorisations (et émet une indication `chown` lorsqu’une incohérence de propriétaire/groupe est détectée).
    - **Répertoire d’état synchronisé avec le cloud sur macOS** : avertit lorsque l’état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins adossés à la synchronisation peuvent ralentir les E/S et provoquer des courses de verrouillage/synchronisation.
    - **Répertoire d’état sur SD ou eMMC sous Linux** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires adossées à une SD ou eMMC peuvent être plus lentes et user le support plus rapidement sous les écritures de sessions et d’identifiants.
    - **Répertoire d’état volatil sous Linux** : avertit lorsque l’état se résout vers `tmpfs` ou `ramfs`, car les sessions, les identifiants, la configuration et l’état SQLite avec ses fichiers annexes WAL/journal disparaîtront au redémarrage. Les montages Docker `overlay` ne sont volontairement pas signalés, car leurs couches inscriptibles persistent au fil des redémarrages de l’hôte tant que le conteneur demeure.
    - **Répertoires de session manquants** : `sessions/` et le répertoire du store de sessions sont requis pour persister l’historique et éviter les plantages `ENOENT`.
    - **Incohérence de transcript** : avertit lorsque des entrées de session récentes ont des fichiers de transcript manquants.
    - **Session principale "JSONL sur 1 ligne"** : signale lorsque le transcript principal ne contient qu’une seule ligne (l’historique ne s’accumule pas).
    - **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se répartir entre les installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, Doctor vous rappelle de l’exécuter sur l’hôte distant (l’état s’y trouve).
    - **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe/tout le monde et propose de les resserrer à `600`.

  </Accordion>
  <Accordion title="5. Santé de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le store d’authentification, avertit lorsque les jetons arrivent à expiration ou ont expiré, et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le chemin du jeton de configuration Anthropic. Les invites d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou un fournisseur vous indiquant de vous reconnecter), Doctor signale qu’une réauthentification est requise et imprime la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale également les profils d’authentification temporairement inutilisables en raison de :

    - courts délais de récupération (limites de débit/expirations/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

    Les profils OAuth Codex hérités dont les jetons résident dans le trousseau macOS (ancien onboarding antérieur à la disposition avec sidecar basé sur fichier) sont réparés uniquement par doctor. Exécutez `openclaw doctor --fix` une fois depuis un terminal interactif pour migrer les jetons hérités adossés au trousseau directement dans `auth-profiles.json` ; ensuite, les tours intégrés (Telegram, cron, distribution de sous-agents) les résolvent comme profils OAuth OpenAI canoniques.

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au catalogue et à la liste d’autorisation, et avertit lorsqu’elle ne peut pas être résolue ou qu’elle est interdite.
  </Accordion>
  <Accordion title="7. Réparation de l’image sandbox">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire l’image ou de basculer vers les anciens noms si l’image actuelle est absente.
  </Accordion>
  <Accordion title="7b. Nettoyage de l’installation des Plugin">
    Doctor supprime l’ancien état de préparation des dépendances de Plugin généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Cela couvre les racines de dépendances générées obsolètes, les anciens répertoires d’étape d’installation, les résidus locaux au package provenant de l’ancien code de réparation des dépendances de Plugin groupé, ainsi que les copies npm gérées orphelines ou récupérées des plugins `@openclaw/*` groupés qui peuvent masquer le manifeste groupé actuel. Doctor relie également le package hôte `openclaw` dans les plugins npm gérés qui déclarent `peerDependencies.openclaw`, afin que les imports d’exécution locaux au package tels que `openclaw/plugin-sdk/*` continuent de se résoudre après les mises à jour ou les réparations npm.

    Doctor peut également réinstaller les plugins téléchargeables manquants lorsque la configuration les référence mais que le registre local des plugins ne les trouve pas. Les exemples incluent les `plugins.entries` matériels, les paramètres de canal/fournisseur/recherche configurés et les environnements d’exécution d’agent configurés. Pendant les mises à jour de package, doctor évite d’exécuter la réparation de Plugin par le gestionnaire de packages pendant que le package principal est remplacé ; exécutez de nouveau `openclaw doctor --fix` après la mise à jour si un Plugin configuré nécessite encore une récupération. Le démarrage du Gateway et le rechargement de la configuration n’exécutent pas de gestionnaires de packages ; les installations de Plugin restent un travail explicite de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrations du service Gateway et conseils de nettoyage">
    Doctor détecte les anciens services gateway (launchd/systemd/schtasks) et propose de les supprimer puis d’installer le service OpenClaw en utilisant le port Gateway actuel. Il peut aussi rechercher des services supplémentaires semblables à un gateway et afficher des conseils de nettoyage. Les services gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service gateway au niveau utilisateur est absent mais qu’un service gateway OpenClaw au niveau système existe, doctor n’installe pas automatiquement un second service au niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système possède le cycle de vie du Gateway.

  </Accordion>
  <Accordion title="8b. Migration de la Startup Matrix">
    Lorsqu’un compte de canal Matrix a une migration d’état hérité en attente ou exploitable, doctor (en mode `--fix` / `--repair`) crée un instantané avant migration, puis exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation de l’état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification est entièrement ignorée.
  </Accordion>
  <Accordion title="8c. Appairage des appareils et dérive d’authentification">
    Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage de santé normal.

    Ce qu’il signale :

    - demandes de premier appairage en attente
    - mises à niveau de rôle en attente pour des appareils déjà appairés
    - mises à niveau de portée en attente pour des appareils déjà appairés
    - réparations de non-correspondance de clé publique lorsque l’id de l’appareil correspond encore mais que l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - enregistrements appairés auxquels il manque un jeton actif pour un rôle approuvé
    - jetons appairés dont les portées dérivent en dehors de la référence d’appairage approuvée
    - entrées de jeton d’appareil mises en cache localement pour la machine actuelle qui sont antérieures à une rotation de jeton côté Gateway ou qui portent des métadonnées de portée obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage et ne fait pas automatiquement tourner les jetons d’appareil. Il affiche plutôt les prochaines étapes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela ferme la faille courante « déjà appairé, mais l’appairage reste requis » : doctor distingue désormais le premier appairage des mises à niveau de rôle/portée en attente et de la dérive d’un jeton ou d’une identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux DM sans liste d’autorisation, ou lorsqu’une stratégie est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. Maintien systemd (Linux)">
    Lorsqu’il s’exécute comme service utilisateur systemd, doctor s’assure que le maintien est activé afin que le Gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (Skills, plugins et TaskFlows)">
    Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les Skills éligibles, avec exigences manquantes et bloquées par la liste d’autorisation.
    - **État des Plugins** : compte les plugins activés/désactivés/en erreur ; liste les ID de plugin pour toute erreur ; signale les capacités des plugins groupés.
    - **Avertissements de compatibilité des Plugins** : signale les plugins qui présentent des problèmes de compatibilité avec l’environnement d’exécution actuel.
    - **Diagnostics des Plugins** : expose tout avertissement ou toute erreur au chargement émis par le registre des plugins.
    - **Récupération TaskFlow** : expose les TaskFlows gérés suspects qui nécessitent une inspection manuelle ou une annulation.

  </Accordion>
  <Accordion title="11b. Taille du fichier d’amorçage">
    Doctor vérifie si les fichiers d’amorçage de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-delà du budget de caractères configuré. Il indique, par fichier, le nombre de caractères bruts par rapport aux caractères injectés, le pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total des caractères injectés comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un plugin de canal manquant, il supprime aussi la configuration pendante limitée au canal qui référençait ce plugin : les entrées `channels.<id>`, les cibles Heartbeat qui nommaient le canal et les remplacements `agents.*.models["<channel>/*"]`. Cela évite les boucles de démarrage du Gateway où l’environnement d’exécution du canal a disparu, mais où la configuration demande encore au Gateway de s’y lier.
  </Accordion>
  <Accordion title="11c. Complétion du shell">
    Doctor vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil du shell utilise un motif de complétion dynamique lent (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide avec fichier en cache.
    - Si la complétion est configurée dans le profil, mais que le fichier de cache est manquant, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

  </Accordion>
  <Accordion title="12. Vérifications d’authentification du Gateway (jeton local)">
    Doctor vérifie que l’authentification par jeton du Gateway local est prête.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef, mais indisponible, doctor avertit et ne le remplace pas par du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucune SecretRef de jeton n’est configurée.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule compatibles avec SecretRef">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide de l’environnement d’exécution.

    - `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille d’état pour les réparations ciblées de configuration.
    - Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` `@username` tente d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
    - Si le jeton de bot Telegram est configuré via SecretRef, mais indisponible dans le chemin de commande actuel, doctor indique que l’identifiant est configuré mais indisponible, puis ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification de santé du Gateway + redémarrage">
    Doctor exécute une vérification de santé et propose de redémarrer le Gateway lorsqu’il semble défaillant.
  </Accordion>
  <Accordion title="13b. Préparation de la recherche mémoire">
    Doctor vérifie si le fournisseur d’embeddings de recherche mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : teste si le binaire `qmd` est disponible et démarrable. Sinon, affiche des conseils de correction, notamment le package npm et une option de chemin binaire manuel.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distant/téléchargeable reconnue. En cas d’absence, suggère de passer à un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé d’API est présente dans l’environnement ou le magasin d’authentification. Affiche des conseils de correction exploitables en cas d’absence.
    - **Ancien fournisseur auto** : traite `memorySearch.provider: "auto"` comme OpenAI, vérifie la disponibilité d’OpenAI, et `doctor --fix` le réécrit en `provider: "openai"`.

    Lorsqu’un résultat de sonde Gateway mis en cache est disponible (le Gateway était sain au moment de la vérification), doctor recoupe ce résultat avec la configuration visible par la CLI et signale tout écart. Doctor ne lance pas de nouveau ping d’embedding sur le chemin par défaut ; utilisez la commande d’état mémoire approfondie lorsque vous voulez une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la disponibilité des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le Gateway est sain, doctor exécute une sonde d’état des canaux et signale les avertissements avec les corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Doctor vérifie la configuration du superviseur installée (launchd/systemd/schtasks) pour détecter les valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd à network-online et le délai de redémarrage). Lorsqu’il trouve une divergence, il recommande une mise à jour et peut réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

    Notes :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --fix` applique les corrections recommandées sans invite (`--repair` est un alias).
    - `openclaw doctor --fix --force` écrase les configurations de superviseur personnalisées.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` maintient doctor en lecture seule pour le cycle de vie du service Gateway. Il signale toujours la santé du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service, les réécritures de configuration du superviseur et le nettoyage des anciens services, car un superviseur externe possède ce cycle de vie.
    - Sous Linux, doctor ne réécrit pas les métadonnées de commande/point d’entrée pendant que l’unité systemd Gateway correspondante est active. Il ignore aussi les unités supplémentaires inactives non anciennes de type Gateway pendant l’analyse des services en double, afin que les fichiers de service compagnons ne créent pas de bruit de nettoyage.
    - Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service par doctor valide la SecretRef, mais ne persiste pas les valeurs de jeton en texte clair résolues dans les métadonnées d’environnement du service superviseur.
    - Doctor détecte les valeurs d’environnement de service gérées par `.env`/SecretRef que d’anciennes installations LaunchAgent, systemd ou Tâche planifiée Windows ont intégrées en ligne, et réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution plutôt que depuis la définition du superviseur.
    - Doctor détecte lorsque la commande du service fixe encore un ancien `--port` après des modifications de `gateway.port` et réécrit les métadonnées du service vers le port actuel.
    - Si l’authentification par jeton nécessite un jeton et que la SecretRef de jeton configurée n’est pas résolue, doctor bloque le chemin d’installation/réparation avec des conseils exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités Linux user-systemd, les vérifications de dérive de jeton de doctor incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service de doctor refusent de réécrire, d’arrêter ou de redémarrer un service Gateway issu d’un ancien binaire OpenClaw lorsque la configuration a été écrite en dernier par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics de l’environnement d’exécution du Gateway + port">
    Doctor inspecte l’environnement d’exécution du service (PID, dernier état de sortie) et avertit lorsque le service est installé, mais ne s’exécute pas réellement. Il vérifie aussi les collisions de port sur le port du Gateway (`18789` par défaut) et signale les causes probables (Gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Doctor avertit lorsque le service Gateway s’exécute sur Bun ou sur un chemin Node géré par version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node, et les chemins de gestionnaire de versions peuvent casser après les mises à niveau, car le service ne charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).

    Les macOS LaunchAgents nouvellement installés ou réparés utilisent un PATH système canonique (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif, afin que les binaires système gérés par Homebrew restent disponibles tandis que Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaires de versions ne modifient pas le Node résolu par les processus enfants. Les services Linux conservent encore les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires user-bin stables, mais les répertoires de secours supposés des gestionnaires de versions ne sont écrits dans le PATH du service que lorsqu’ils existent sur le disque.

  </Accordion>
  <Accordion title="18. Écriture de la configuration + métadonnées de l’assistant">
    Doctor persiste toute modification de configuration et marque les métadonnées de l’assistant pour enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système de mémoire)">
    Doctor suggère un système de mémoire d’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Associés

- [Runbook Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
