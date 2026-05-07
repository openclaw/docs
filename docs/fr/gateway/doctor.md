---
read_when:
    - Ajout ou modification de migrations doctor
    - Introduction de changements de configuration incompatibles
sidebarTitle: Doctor
summary: 'Commande Doctor : vérifications d’intégrité, migrations de configuration et étapes de réparation'
title: Diagnostic
x-i18n:
    generated_at: "2026-05-07T13:18:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` est l’outil de réparation et de migration d’OpenClaw. Il corrige les configurations/états obsolètes, vérifie la santé et fournit des étapes de réparation actionnables.

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

    Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation de redémarrage/service/sandbox lorsque cela s’applique).

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

    S’exécute sans invites et applique uniquement les migrations sûres (normalisation de la configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine. Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analyse les services système à la recherche d’installations de Gateway supplémentaires (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si vous voulez examiner les changements avant l’écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

<AccordionGroup>
  <Accordion title="Santé, UI et mises à jour">
    - Mise à jour préliminaire facultative pour les installations git (mode interactif uniquement).
    - Vérification de fraîcheur du protocole UI (reconstruit Control UI lorsque le schéma de protocole est plus récent).
    - Vérification de santé + invite de redémarrage.
    - Résumé de l’état des Skills (éligibles/manquants/bloqués) et état des plugins.

  </Accordion>
  <Accordion title="Configuration et migrations">
    - Normalisation de la configuration pour les valeurs héritées.
    - Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
    - Vérifications de migration du navigateur pour les anciennes configurations d’extension Chrome et la disponibilité de Chrome MCP.
    - Avertissements de remplacements du fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avertissements de masquage OAuth Codex (`models.providers.openai-codex`).
    - Vérification des prérequis OAuth TLS pour les profils OAuth OpenAI Codex.
    - Avertissements de liste d’autorisation de plugins/outils lorsque `plugins.allow` est restrictive mais que la politique d’outils demande encore un caractère générique ou des outils appartenant à un plugin.
    - Migration de l’ancien état sur disque (sessions/répertoire d’agent/authentification WhatsApp).
    - Migration des anciennes clés de contrat de manifeste de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migration de l’ancien magasin Cron (`jobId`, `schedule.cron`, champs delivery/payload de niveau supérieur, payload `provider`, jobs de secours Webhook simples `notify: true`).
    - Migration de l’ancienne politique d’exécution d’agent vers `agents.defaults.agentRuntime` et `agents.list[].agentRuntime`.
    - Nettoyage de la configuration de plugin obsolète lorsque les plugins sont activés ; lorsque `plugins.enabled=false`, les références de plugin obsolètes sont traitées comme une configuration de confinement inerte et sont conservées.

  </Accordion>
  <Accordion title="État et intégrité">
    - Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
    - Réparation des transcriptions de session pour les branches de réécriture d’invite dupliquées créées par les builds 2026.4.24 affectés.
    - Détection des tombstones de récupération après redémarrage de sous-agents bloqués, avec prise en charge de `--fix` pour effacer les indicateurs obsolètes de récupération abandonnée afin que le démarrage ne continue pas à traiter l’enfant comme abandonné au redémarrage.
    - Vérifications d’intégrité d’état et d’autorisations (sessions, transcriptions, répertoire d’état).
    - Vérifications des autorisations du fichier de configuration (chmod 600) lors de l’exécution locale.
    - Santé de l’authentification du modèle : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de délai de refroidissement/désactivation des profils d’authentification.
    - Détection de répertoire d’espace de travail supplémentaire (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services et superviseurs">
    - Réparation de l’image sandbox lorsque le sandboxing est activé.
    - Migration d’ancien service et détection de Gateway supplémentaire.
    - Migration de l’ancien état du canal Matrix (en mode `--fix` / `--repair`).
    - Vérifications d’exécution du Gateway (service installé mais non démarré ; étiquette launchd mise en cache).
    - Avertissements d’état des canaux (sondés depuis le Gateway en cours d’exécution).
    - Les vérifications d’autorisations spécifiques aux canaux se trouvent sous `openclaw channels capabilities` ; par exemple, les autorisations des canaux vocaux Discord sont auditées avec `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Vérifications de réactivité WhatsApp pour une santé dégradée de la boucle d’événements du Gateway avec des clients TUI locaux encore en cours d’exécution ; `--fix` arrête uniquement les clients TUI locaux vérifiés.
    - Réparation des routes Codex pour les références de modèle héritées `openai-codex/*` dans les modèles principaux, fallbacks, remplacements heartbeat/sous-agent/compaction, hooks, remplacements de modèle de canal et épingles de route de session ; `--fix` les réécrit en `openai/*` et sélectionne `agentRuntime.id: "codex"` uniquement lorsque le plugin Codex est installé, activé, contribue le harnais `codex` et dispose d’un OAuth utilisable. Sinon, il sélectionne `agentRuntime.id: "pi"`.
    - Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
    - Nettoyage de l’environnement proxy intégré pour les services Gateway qui ont capturé les valeurs shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` lors de l’installation ou de la mise à jour.
    - Vérifications des bonnes pratiques d’exécution du Gateway (Node vs Bun, chemins de gestionnaire de versions).
    - Diagnostics de collision de port du Gateway (par défaut `18789`).

  </Accordion>
  <Accordion title="Authentification, sécurité et appairage">
    - Avertissements de sécurité pour les politiques de DM ouvertes.
    - Vérifications d’authentification du Gateway pour le mode jeton local (propose la génération de jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations de jeton SecretRef).
    - Détection des problèmes d’appairage d’appareil (demandes de premier appairage en attente, mises à niveau de rôle/portée en attente, dérive du cache local de jeton d’appareil obsolète et dérive d’authentification des enregistrements appairés).

  </Accordion>
  <Accordion title="Espace de travail et shell">
    - Vérification de systemd linger sous Linux.
    - Vérification de la taille du fichier de bootstrap de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
    - Vérification de disponibilité des Skills pour l’agent par défaut ; signale les skills autorisées dont les binaires, variables d’environnement, configurations ou prérequis d’OS sont manquants, et `--fix` peut désactiver les skills indisponibles dans `skills.entries`.
    - Vérification de l’état de la complétion shell et installation/mise à niveau automatique.
    - Vérification de disponibilité du fournisseur d’embeddings de recherche mémoire (modèle local, clé d’API distante ou binaire QMD).
    - Vérifications d’installation depuis les sources (incompatibilité d’espace de travail pnpm, assets UI manquants, binaire tsx manquant).
    - Écrit la configuration mise à jour + les métadonnées de l’assistant.

  </Accordion>
</AccordionGroup>

## Rattrapage et réinitialisation de l’UI Dreams

La scène Dreams de Control UI inclut les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de Dreaming ancré. Ces actions utilisent des méthodes RPC de style doctor du Gateway, mais elles ne font **pas** partie de la réparation/migration CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail actif, exécute la passe de journal REM ancré et écrit des entrées de rattrapage réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de rattrapage marquées dans `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées à court terme, préparées et uniquement ancrées, issues d’une relecture historique et qui n’ont pas encore accumulé de rappel en direct ni de support quotidien.

Ce qu’elles ne font **pas** par elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne préparent pas automatiquement les candidats ancrés dans le magasin de promotion à court terme en direct, sauf si vous exécutez explicitement le chemin CLI préparé d’abord

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare les candidats durables ancrés dans le magasin de Dreaming à court terme tout en conservant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

<AccordionGroup>
  <Accordion title="0. Mise à jour facultative (installations git)">
    S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose une mise à jour (fetch/rebase/build) avant d’exécuter doctor.
  </Accordion>
  <Accordion title="1. Normalisation de la configuration">
    Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans remplacement spécifique au canal), doctor les normalise dans le schéma actuel.

    Cela inclut les anciens champs plats Talk. La configuration publique actuelle de parole Talk est `talk.provider` + `talk.providers.<provider>`, et la configuration de voix en temps réel est `talk.realtime.*`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la carte des fournisseurs, et réécrit les anciens sélecteurs de premier niveau en temps réel (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) dans `talk.realtime`.

    Doctor avertit aussi lorsque `plugins.allow` est non vide et que la politique d’outils utilise
    des entrées d’outils génériques ou appartenant à un plugin. `tools.allow: ["*"]` ne correspond qu’aux outils
    des plugins qui se chargent réellement ; il ne contourne pas la liste d’autorisation exclusive des plugins.
    Doctor écrit `plugins.bundledDiscovery: "compat"` pour les configurations héritées de liste d’autorisation migrées afin de préserver le comportement existant des fournisseurs groupés, puis
    pointe vers le paramètre plus strict `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrations d’anciennes clés de configuration">
    Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous demandent de lancer `openclaw doctor`.

    Doctor va :

    - Expliquer quelles anciennes clés ont été trouvées.
    - Afficher la migration appliquée.
    - Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

    Le démarrage du Gateway refuse les anciens formats de configuration et vous demande d’exécuter `openclaw doctor --fix` ; il ne réécrit pas `openclaw.json` au démarrage. Les migrations du magasin de jobs Cron sont aussi gérées par `openclaw doctor --fix`.

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
    - anciens sélecteurs Talk realtime de niveau supérieur (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Pour les canaux avec des `accounts` nommés mais des valeurs de canal de niveau supérieur à compte unique restantes, déplacer ces valeurs limitées au compte vers le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - supprimer `agents.defaults.llm` ; utiliser `models.providers.<id>.timeoutSeconds` pour les délais d’expiration de fournisseurs/modèles lents
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)
    - ancien `models.providers.*.api: "openai"` → `"openai-completions"` (le démarrage du Gateway ignore aussi les fournisseurs dont `api` est défini sur une valeur d’énumération future ou inconnue au lieu d’échouer de manière fermée)

    Les avertissements du Doctor incluent également des recommandations de compte par défaut pour les canaux multicomptes :

    - Si deux entrées `channels.<channel>.accounts` ou plus sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, Doctor avertit que le routage de secours peut choisir un compte inattendu.
    - Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, Doctor avertit et répertorie les ID de comptes configurés.

  </Accordion>
  <Accordion title="2b. Remplacements du fournisseur OpenCode">
    Si vous avez ajouté `models.providers.opencode`, `opencode-zen` ou `opencode-go` manuellement, cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`. Cela peut forcer les modèles sur la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous puissiez supprimer le remplacement et restaurer le routage API + les coûts par modèle.
  </Accordion>
  <Accordion title="2c. Migration du navigateur et préparation à Chrome MCP">
    Si votre configuration de navigateur pointe encore vers le chemin de l’extension Chrome supprimée, Doctor la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

    - `browser.profiles.*.driver: "extension"` devient `"existing-session"`
    - `browser.relayBindHost` est supprimé

    Doctor audite également le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

    - vérifie si Google Chrome est installé sur le même hôte pour les profils par défaut à connexion automatique
    - vérifie la version détectée de Chrome et avertit lorsqu’elle est inférieure à Chrome 144
    - vous rappelle d’activer le débogage distant dans la page d’inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    Doctor ne peut pas activer ce paramètre côté Chrome pour vous. Chrome MCP local à l’hôte nécessite toujours :

    - un navigateur basé sur Chromium 144+ sur l’hôte du gateway/node
    - le navigateur exécuté localement
    - le débogage distant activé dans ce navigateur
    - l’approbation de la première invite de consentement à l’attachement dans le navigateur

    Ici, la préparation concerne uniquement les prérequis d’attachement local. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lot nécessitent toujours un navigateur géré ou un profil CDP brut.

    Cette vérification ne s’applique **pas** aux flux Docker, sandbox, remote-browser ni aux autres flux headless. Ceux-ci continuent d’utiliser CDP brut.

  </Accordion>
  <Accordion title="2d. Prérequis TLS OAuth">
    Lorsqu’un profil OpenAI Codex OAuth est configuré, Doctor sonde le point de terminaison d’autorisation OpenAI pour vérifier que la pile TLS Node/OpenSSL locale peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, un certificat expiré ou un certificat auto-signé), Doctor affiche des recommandations de correction propres à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute même si le gateway est sain.
  </Accordion>
  <Accordion title="2e. Remplacements du fournisseur Codex OAuth">
    Si vous aviez précédemment ajouté d’anciens paramètres de transport OpenAI sous `models.providers.openai-codex`, ils peuvent masquer le chemin de fournisseur Codex OAuth intégré que les versions plus récentes utilisent automatiquement. Doctor avertit lorsqu’il voit ces anciens paramètres de transport avec Codex OAuth afin que vous puissiez supprimer ou réécrire le remplacement de transport obsolète et récupérer le comportement intégré de routage/secours. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.
  </Accordion>
  <Accordion title="2f. Réparation de la route Codex">
    Doctor vérifie les références de modèles héritées `openai-codex/*`. Le routage natif du harnais Codex utilise des références de modèles canoniques `openai/*` ; les tours d’agent OpenAI passent par le harnais du serveur d’application Codex au lieu du chemin OpenClaw PI OpenAI.

    En mode `--fix` / `--repair`, Doctor réécrit les références affectées de l’agent par défaut et par agent, y compris les modèles principaux, les fallbacks, les remplacements heartbeat/subagent/compaction, les hooks, les remplacements de modèle par canal et l’état de route de session persisté obsolète :

    - `openai-codex/gpt-*` devient `openai/gpt-*`.
    - Le runtime d’agent correspondant devient `agentRuntime.id: "codex"` uniquement lorsque Codex est installé, activé, fournit le harnais `codex` et dispose d’OAuth utilisable.
    - Sinon, le runtime d’agent correspondant devient `agentRuntime.id: "pi"`.
    - Les listes de fallback de modèles existantes sont conservées avec leurs entrées héritées réécrites ; les paramètres par modèle copiés passent de l’ancienne clé à la clé canonique `openai/*`.
    - Les `modelProvider`/`providerOverride`, `model`/`modelOverride`, avis de fallback, épingles de profils d’authentification et épingles de harnais Codex des sessions persistées sont réparés dans tous les magasins de sessions d’agent découverts.
    - `/codex ...` signifie « contrôler ou lier une conversation Codex native depuis le chat ».
    - `/acp ...` ou `runtime: "acp"` signifie « utiliser l’adaptateur externe ACP/acpx ».

  </Accordion>
  <Accordion title="2g. Nettoyage des routes de session">
    Doctor analyse également les magasins de sessions d’agent découverts pour rechercher un état de route obsolète créé automatiquement après le déplacement de modèles configurés ou du runtime hors d’une route détenue par un Plugin, comme Codex.

    `openclaw doctor --fix` peut effacer l’état obsolète créé automatiquement, comme les épingles de modèle `modelOverrideSource: "auto"`, les métadonnées de modèle de runtime, les ID de harnais épinglés, les liaisons de session CLI et les remplacements automatiques de profil d’authentification lorsque leur route propriétaire n’est plus configurée. Les choix explicites d’utilisateur ou de modèle de session héritée sont signalés pour examen manuel et laissés intacts ; modifiez-les avec `/model ...`, `/new` ou réinitialisez la session lorsque cette route n’est plus prévue.

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

    Ces migrations sont faites au mieux et idempotentes ; Doctor émettra des avertissements lorsqu’il laisse des dossiers hérités derrière lui comme sauvegardes. Le Gateway/CLI migre aussi automatiquement l’ancien magasin de sessions + répertoire d’agent au démarrage afin que l’historique/l’authentification/les modèles aboutissent dans le chemin par agent sans exécution manuelle de Doctor. L’authentification WhatsApp n’est intentionnellement migrée que via `openclaw doctor`. La normalisation du fournisseur/de la table de fournisseurs Talk compare désormais par égalité structurelle, donc les différences limitées à l’ordre des clés ne déclenchent plus de changements `doctor --fix` répétés sans effet.

  </Accordion>
  <Accordion title="3a. Migrations d’anciens manifestes de Plugin">
    Doctor analyse tous les manifestes de Plugin installés à la recherche de clés de capacités de niveau supérieur obsolètes (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Lorsqu’il en trouve, il propose de les déplacer dans l’objet `contracts` et de réécrire le fichier manifeste sur place. Cette migration est idempotente ; si la clé `contracts` contient déjà les mêmes valeurs, l’ancienne clé est supprimée sans dupliquer les données.
  </Accordion>
  <Accordion title="3b. Migrations d’ancien magasin cron">
    Doctor vérifie également le magasin des tâches cron (`~/.openclaw/cron/jobs.json` par défaut, ou `cron.store` lorsqu’il est remplacé) pour les anciennes formes de tâches que le planificateur accepte encore par compatibilité.

    Les nettoyages cron actuels incluent :

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - champs de payload de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
    - champs de livraison de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de livraison `provider` du payload → `delivery.channel` explicite
    - simples anciennes tâches de fallback webhook `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

    Doctor ne migre automatiquement que les tâches `notify: true` lorsqu’il peut le faire sans modifier le comportement. Si une tâche combine l’ancien repli de notification avec un mode de livraison non-webhook existant, doctor émet un avertissement et laisse cette tâche pour une revue manuelle.

    Sous Linux, doctor avertit aussi lorsque la crontab de l’utilisateur invoque encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh`. Ce script local à l’hôte n’est pas maintenu par OpenClaw actuel et peut écrire de faux messages `Gateway inactive` dans `~/.openclaw/logs/whatsapp-health.log` lorsque cron ne peut pas joindre le bus utilisateur systemd. Supprimez l’entrée crontab obsolète avec `crontab -e` ; utilisez `openclaw channels status --probe`, `openclaw doctor` et `openclaw gateway status` pour les contrôles d’état actuels.

  </Accordion>
  <Accordion title="3c. Nettoyage des verrous de session">
    Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés derrière lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale : le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est considéré comme obsolète (PID mort ou plus de 30 minutes). En mode `--fix` / `--repair`, il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon, il affiche une note et vous indique de relancer avec `--fix`.
  </Accordion>
  <Accordion title="3d. Réparation des branches de transcript de session">
    Doctor analyse les fichiers JSONL de session d’agent à la recherche de la forme de branche dupliquée créée par le bogue de réécriture du transcript de prompt du 2026.4.24 : un tour utilisateur abandonné avec le contexte d’exécution interne OpenClaw, plus un frère actif contenant le même prompt utilisateur visible. En mode `--fix` / `--repair`, doctor sauvegarde chaque fichier affecté à côté de l’original et réécrit le transcript vers la branche active afin que l’historique du Gateway et les lecteurs de mémoire ne voient plus de tours dupliqués.
  </Accordion>
  <Accordion title="4. Contrôles d’intégrité de l’état (persistance de session, routage et sécurité)">
    Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

    Doctor vérifie :

    - **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
    - **Permissions du répertoire d’état** : vérifie l’écriture ; propose de réparer les permissions (et émet un indice `chown` lorsqu’une incompatibilité propriétaire/groupe est détectée).
    - **Répertoire d’état macOS synchronisé avec le cloud** : avertit lorsque l’état se résout sous iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, car les chemins adossés à la synchronisation peuvent provoquer des E/S plus lentes et des courses de verrouillage/synchronisation.
    - **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`, car les E/S aléatoires adossées à SD ou eMMC peuvent être plus lentes et s’user plus vite lors des écritures de sessions et d’identifiants.
    - **Répertoires de session manquants** : `sessions/` et le répertoire du magasin de sessions sont requis pour persister l’historique et éviter les plantages `ENOENT`.
    - **Incompatibilité de transcript** : avertit lorsque des entrées de session récentes ont des fichiers de transcript manquants.
    - **Session principale « JSONL sur 1 ligne »** : signale lorsque le transcript principal ne comporte qu’une seule ligne (l’historique ne s’accumule pas).
    - **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se diviser entre installations).
    - **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter sur l’hôte distant (l’état y réside).
    - **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est lisible par le groupe/monde et propose de le restreindre à `600`.

  </Accordion>
  <Accordion title="5. État de l’authentification des modèles (expiration OAuth)">
    Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque des jetons expirent ou ont expiré, et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton Anthropic est obsolète, il suggère une clé d’API Anthropic ou le chemin de configuration par jeton Anthropic. Les prompts d’actualisation n’apparaissent que lors d’une exécution interactive (TTY) ; `--non-interactive` ignore les tentatives d’actualisation.

    Lorsqu’une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`, `invalid_grant`, ou un fournisseur qui vous demande de vous reconnecter), doctor indique qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...` à exécuter.

    Doctor signale aussi les profils d’authentification temporairement inutilisables à cause de :

    - courts délais d’attente (limites de débit/délais d’expiration/échecs d’authentification)
    - désactivations plus longues (échecs de facturation/crédit)

  </Accordion>
  <Accordion title="6. Validation du modèle des hooks">
    Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au catalogue et à la liste d’autorisation, et avertit lorsqu’elle ne se résout pas ou est interdite.
  </Accordion>
  <Accordion title="7. Réparation de l’image de sandbox">
    Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire l’image ou de basculer vers les anciens noms si l’image actuelle est manquante.
  </Accordion>
  <Accordion title="7b. Nettoyage des installations de Plugins">
    Doctor supprime l’ancien état de staging des dépendances de Plugins généré par OpenClaw en mode `openclaw doctor --fix` / `openclaw doctor --repair`. Cela couvre les racines de dépendances générées obsolètes, les anciens répertoires d’étape d’installation, les débris locaux au package provenant d’un ancien code de réparation des dépendances de Plugins groupés, ainsi que les copies npm gérées orphelines ou récupérées de Plugins `@openclaw/*` groupés qui peuvent masquer le manifeste groupé actuel.

    Doctor peut aussi réinstaller les Plugins téléchargeables manquants lorsque la configuration les référence mais que le registre local de Plugins ne les trouve pas. Les exemples incluent des `plugins.entries` matériels, des paramètres de canal/fournisseur/recherche configurés et des runtimes d’agent configurés. Pendant les mises à jour de package, doctor évite d’exécuter la réparation de Plugins par gestionnaire de packages pendant le remplacement du package principal ; relancez `openclaw doctor --fix` après la mise à jour si un Plugin configuré nécessite encore une récupération. Le démarrage du Gateway et le rechargement de la configuration n’exécutent pas de gestionnaires de packages ; les installations de Plugins restent un travail explicite de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrations du service Gateway et conseils de nettoyage">
    Doctor détecte les anciens services Gateway (launchd/systemd/schtasks) et propose de les supprimer puis d’installer le service OpenClaw en utilisant le port Gateway actuel. Il peut aussi analyser les services supplémentaires ressemblant à des Gateway et afficher des conseils de nettoyage. Les services Gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas signalés comme « supplémentaires ».

    Sous Linux, si le service Gateway de niveau utilisateur est manquant mais qu’un service Gateway OpenClaw de niveau système existe, doctor n’installe pas automatiquement un second service de niveau utilisateur. Inspectez avec `openclaw gateway status --deep` ou `openclaw doctor --deep`, puis supprimez le doublon ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un superviseur système possède le cycle de vie du Gateway.

  </Accordion>
  <Accordion title="8b. Migration au démarrage de Matrix">
    Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable, doctor (en mode `--fix` / `--repair`) crée un instantané pré-migration puis exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation de l’état chiffré hérité. Les deux étapes sont non fatales ; les erreurs sont journalisées et le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), ce contrôle est entièrement ignoré.
  </Accordion>
  <Accordion title="8c. Appairage des appareils et dérive de l’authentification">
    Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage d’état normal.

    Ce qu’il signale :

    - demandes de premier appairage en attente
    - mises à niveau de rôle en attente pour les appareils déjà appairés
    - mises à niveau de portée en attente pour les appareils déjà appairés
    - réparations d’incompatibilité de clé publique où l’identifiant de l’appareil correspond encore mais où l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
    - enregistrements appairés sans jeton actif pour un rôle approuvé
    - jetons appairés dont les portées dérivent hors de la référence d’appairage approuvée
    - entrées locales mises en cache de jetons d’appareil pour la machine actuelle qui sont antérieures à une rotation de jeton côté Gateway ou qui portent des métadonnées de portée obsolètes

    Doctor n’approuve pas automatiquement les demandes d’appairage et ne fait pas automatiquement tourner les jetons d’appareil. Il affiche plutôt les prochaines étapes exactes :

    - inspecter les demandes en attente avec `openclaw devices list`
    - approuver la demande exacte avec `openclaw devices approve <requestId>`
    - générer un nouveau jeton avec rotation via `openclaw devices rotate --device <deviceId> --role <role>`
    - supprimer puis réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

    Cela comble le trou courant « déjà appairé mais appairage encore requis » : doctor distingue désormais le premier appairage des mises à niveau de rôle/portée en attente et de la dérive de jeton/identité d’appareil obsolète.

  </Accordion>
  <Accordion title="9. Avertissements de sécurité">
    Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux messages directs sans liste d’autorisation, ou lorsqu’une stratégie est configurée de manière dangereuse.
  </Accordion>
  <Accordion title="10. Persistance systemd (Linux)">
    S’il s’exécute comme service utilisateur systemd, doctor s’assure que la persistance est activée afin que le gateway reste actif après la déconnexion.
  </Accordion>
  <Accordion title="11. État de l’espace de travail (skills, Plugins et anciens répertoires)">
    Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

    - **État des Skills** : compte les Skills éligibles, à exigences manquantes et bloquées par liste d’autorisation.
    - **Anciens répertoires d’espace de travail** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail existent à côté de l’espace de travail actuel.
    - **État des Plugins** : compte les Plugins activés/désactivés/en erreur ; liste les identifiants de Plugins pour toute erreur ; signale les capacités des Plugins groupés.
    - **Avertissements de compatibilité des Plugins** : signale les Plugins qui ont des problèmes de compatibilité avec le runtime actuel.
    - **Diagnostics des Plugins** : expose les avertissements ou erreurs au chargement émis par le registre de Plugins.

  </Accordion>
  <Accordion title="11b. Taille du fichier de bootstrap">
    Doctor vérifie si les fichiers de bootstrap de l’espace de travail (par exemple `AGENTS.md`, `CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches du budget de caractères configuré ou le dépassent. Il signale, par fichier, les nombres de caractères bruts et injectés, le pourcentage de troncature, la cause de troncature (`max/file` ou `max/total`) et le total de caractères injectés comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars` et `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Nettoyage des Plugins de canal obsolètes">
    Lorsque `openclaw doctor --fix` supprime un Plugin de canal manquant, il supprime aussi la configuration pendante à portée de canal qui référençait ce Plugin : entrées `channels.<id>`, cibles Heartbeat qui nommaient le canal et remplacements `agents.*.models["<channel>/*"]`. Cela empêche les boucles de démarrage du Gateway où le runtime de canal a disparu mais où la configuration demande encore au gateway de s’y lier.
  </Accordion>
  <Accordion title="11c. Complétion du shell">
    Doctor vérifie si la complétion par tabulation est installée pour le shell actuel (zsh, bash, fish ou PowerShell) :

    - Si le profil shell utilise un motif de complétion dynamique lent (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide par fichier mis en cache.
    - Si la complétion est configurée dans le profil mais que le fichier de cache est manquant, doctor régénère automatiquement le cache.
    - Si aucune complétion n’est configurée, doctor propose de l’installer (mode interactif uniquement ; ignoré avec `--non-interactive`).

    Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

  </Accordion>
  <Accordion title="12. Contrôles d’authentification du Gateway (jeton local)">
    Doctor vérifie la préparation de l’authentification par jeton du gateway local.

    - Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
    - Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne le remplace pas par du texte en clair.
    - `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

  </Accordion>
  <Accordion title="12b. Réparations en lecture seule tenant compte de SecretRef">
    Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide à l’exécution.

    - `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour les réparations ciblées de configuration.
    - Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` `@username` tente d’utiliser les identifiants du bot configurés lorsqu’ils sont disponibles.
    - Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor indique que l’identifiant est configuré mais indisponible, et ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

  </Accordion>
  <Accordion title="13. Vérification de santé du Gateway + redémarrage">
    Doctor exécute une vérification de santé et propose de redémarrer le Gateway lorsqu’il semble défaillant.
  </Accordion>
  <Accordion title="13b. Préparation de la recherche en mémoire">
    Doctor vérifie si le fournisseur d’embeddings de recherche en mémoire configuré est prêt pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

    - **Backend QMD** : sonde si le binaire `qmd` est disponible et démarrable. Sinon, affiche des conseils de correction incluant le package npm et une option de chemin de binaire manuel.
    - **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distant/téléchargeable reconnue. S’il manque, suggère de basculer vers un fournisseur distant.
    - **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est présente dans l’environnement ou le stockage d’authentification. Affiche des conseils de correction exploitables si elle manque.
    - **Fournisseur automatique** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

    Lorsqu’un résultat de sonde Gateway mis en cache est disponible (le Gateway était sain au moment de la vérification), doctor recoupe son résultat avec la configuration visible par la CLI et signale toute divergence. Doctor ne lance pas de nouvelle requête d’embedding dans le chemin par défaut ; utilisez la commande d’état mémoire approfondie lorsque vous voulez une vérification en direct du fournisseur.

    Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

  </Accordion>
  <Accordion title="14. Avertissements d’état des canaux">
    Si le Gateway est sain, doctor exécute une sonde d’état des canaux et signale les avertissements avec les corrections suggérées.
  </Accordion>
  <Accordion title="15. Audit + réparation de la configuration du superviseur">
    Doctor vérifie la configuration du superviseur installée (launchd/systemd/schtasks) pour détecter les valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd network-online et le délai de redémarrage). Lorsqu’il trouve une incohérence, il recommande une mise à jour et peut réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

    Remarques :

    - `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
    - `openclaw doctor --yes` accepte les invites de réparation par défaut.
    - `openclaw doctor --repair` applique les corrections recommandées sans invite.
    - `openclaw doctor --repair --force` remplace les configurations personnalisées du superviseur.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` maintient doctor en lecture seule pour le cycle de vie du service Gateway. Il signale toujours la santé du service et exécute les réparations hors service, mais ignore l’installation/le démarrage/le redémarrage/l’amorçage du service, les réécritures de configuration du superviseur et le nettoyage des anciens services, car un superviseur externe possède ce cycle de vie.
    - Sur Linux, doctor ne réécrit pas les métadonnées de commande/point d’entrée tant que l’unité systemd Gateway correspondante est active. Il ignore également les unités supplémentaires inactives non héritées de type Gateway pendant l’analyse des services en doublon, afin que les fichiers de service compagnons ne créent pas de bruit de nettoyage.
    - Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service par doctor valide le SecretRef mais ne persiste pas les valeurs de jeton en clair résolues dans les métadonnées d’environnement du service superviseur.
    - Doctor détecte les valeurs d’environnement de service gérées par `.env`/SecretRef que les anciennes installations LaunchAgent, systemd ou Windows Scheduled Task intégraient en ligne, et réécrit les métadonnées du service afin que ces valeurs soient chargées depuis la source d’exécution plutôt que depuis la définition du superviseur.
    - Doctor détecte quand la commande de service épingle encore un ancien `--port` après des changements de `gateway.port` et réécrit les métadonnées du service vers le port actuel.
    - Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des conseils exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
    - Pour les unités Linux user-systemd, les vérifications de dérive de jeton de doctor incluent désormais les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
    - Les réparations de service doctor refusent de réécrire, d’arrêter ou de redémarrer un service Gateway provenant d’un ancien binaire OpenClaw lorsque la configuration a été écrite pour la dernière fois par une version plus récente. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostics d’exécution + port du Gateway">
    Doctor inspecte l’exécution du service (PID, dernier état de sortie) et avertit lorsque le service est installé mais ne fonctionne pas réellement. Il vérifie aussi les collisions de port sur le port du Gateway (par défaut `18789`) et signale les causes probables (Gateway déjà en cours d’exécution, tunnel SSH).
  </Accordion>
  <Accordion title="17. Bonnes pratiques d’exécution du Gateway">
    Doctor avertit lorsque le service Gateway s’exécute sur Bun ou sur un chemin Node géré par version (`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram exigent Node, et les chemins de gestionnaire de versions peuvent casser après les mises à niveau, car le service ne charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle est disponible (Homebrew/apt/choco).

    Les LaunchAgents macOS nouvellement installés ou réparés utilisent un PATH système canonique (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) au lieu de copier le PATH du shell interactif, afin que Volta, asdf, fnm, pnpm et les autres répertoires de gestionnaire de versions ne changent pas la résolution des processus enfants Node. Les services Linux conservent toujours les racines d’environnement explicites (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) et les répertoires utilisateur-bin stables, mais les répertoires de secours supposés des gestionnaires de versions ne sont écrits dans le PATH du service que lorsqu’ils existent sur le disque.

  </Accordion>
  <Accordion title="18. Écriture de configuration + métadonnées de l’assistant">
    Doctor persiste toute modification de configuration et marque les métadonnées de l’assistant pour enregistrer l’exécution de doctor.
  </Accordion>
  <Accordion title="19. Conseils d’espace de travail (sauvegarde + système de mémoire)">
    Doctor suggère un système de mémoire d’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde si l’espace de travail n’est pas déjà sous git.

    Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).

  </Accordion>
</AccordionGroup>

## Associé

- [Runbook du Gateway](/fr/gateway)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
