---
read_when:
    - Vous devez appeler les fonctions d’aide du cœur depuis un Plugin (TTS, STT, génération d’images, recherche web, sous-agent, nœuds)
    - Vous voulez comprendre ce qu’expose api.runtime
    - Vous accédez aux assistants de configuration, d’agent ou de médias depuis le code du plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- les helpers d’exécution injectés disponibles pour les Plugins
title: Fonctions d’aide à l’exécution du Plugin
x-i18n:
    generated_at: "2026-06-28T20:44:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Référence pour l’objet `api.runtime` injecté dans chaque plugin lors de l’enregistrement. Utilisez ces helpers au lieu d’importer directement les éléments internes de l’hôte.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/fr/plugins/sdk-channel-plugins">
    Guide pas à pas qui utilise ces helpers en contexte pour les plugins de canal.
  </Card>
  <Card title="Provider plugins" href="/fr/plugins/sdk-provider-plugins">
    Guide pas à pas qui utilise ces helpers en contexte pour les plugins de fournisseur.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Chargement et écritures de configuration

Préférez la configuration qui a déjà été transmise au chemin d’appel actif, par exemple `api.config` pendant l’enregistrement ou un argument `cfg` dans les callbacks de canal/fournisseur. Cela conserve un instantané de processus unique tout au long du travail au lieu de réanalyser la configuration sur les chemins critiques.

Utilisez `api.runtime.config.current()` uniquement lorsqu’un gestionnaire à longue durée de vie a besoin de l’instantané actuel du processus et qu’aucune configuration n’a été transmise à cette fonction. La valeur retournée est en lecture seule ; clonez-la ou utilisez un helper de mutation avant toute modification.

Les fabriques d’outils reçoivent `ctx.runtimeConfig` ainsi que `ctx.getRuntimeConfig()`. Utilisez le getter dans le callback `execute` d’un outil à longue durée de vie lorsque la configuration peut changer après la création de la définition de l’outil.

Persistez les modifications avec `api.runtime.config.mutateConfigFile(...)` ou `api.runtime.config.replaceConfigFile(...)`. Chaque écriture doit choisir une politique `afterWrite` explicite :

- `afterWrite: { mode: "auto" }` laisse le planificateur de rechargement du Gateway décider.
- `afterWrite: { mode: "restart", reason: "..." }` force un redémarrage propre lorsque l’auteur de l’écriture sait que le rechargement à chaud est dangereux.
- `afterWrite: { mode: "none", reason: "..." }` supprime le rechargement/redémarrage automatique uniquement lorsque l’appelant prend en charge le suivi.

Les helpers de mutation retournent `afterWrite` ainsi qu’un résumé `followUp` typé pour que les appelants puissent journaliser ou tester s’ils ont demandé un redémarrage. Le Gateway reste responsable du moment où ce redémarrage se produit réellement.

`api.runtime.config.loadConfig()` et `api.runtime.config.writeConfigFile(...)` sont des helpers de compatibilité obsolètes sous `runtime-config-load-write`. Ils avertissent une fois à l’exécution et restent disponibles pour les anciens plugins externes pendant la fenêtre de migration. Les plugins groupés ne doivent pas les utiliser ; les garde-fous de frontière de configuration échouent si le code de plugin les appelle ou importe ces helpers depuis des sous-chemins du SDK de plugin.

Pour les imports directs du SDK, utilisez les sous-chemins de configuration ciblés plutôt que le barrel de compatibilité large
`openclaw/plugin-sdk/config-runtime` : `config-contracts` pour les
types, `plugin-config-runtime` pour les assertions de configuration déjà chargée et la recherche
d’entrée de plugin, `runtime-config-snapshot` pour les instantanés actuels du processus, et
`config-mutation` pour les écritures. Les tests des plugins groupés doivent mocker directement ces
sous-chemins ciblés plutôt que le barrel de compatibilité large.

Le code interne d’exécution d’OpenClaw suit la même direction : charger la configuration une seule fois à la frontière CLI, Gateway ou processus, puis transmettre cette valeur. Les écritures de mutation réussies actualisent l’instantané d’exécution du processus et avancent sa révision interne ; les caches à longue durée de vie doivent s’appuyer sur la clé de cache détenue par l’exécution au lieu de sérialiser la configuration localement. Les modules d’exécution à longue durée de vie disposent d’un scanner à tolérance zéro pour les appels ambiants à `loadConfig()` ; utilisez un `cfg` transmis, un `context.getRuntimeConfig()` de requête, ou `getRuntimeConfig()` à une frontière explicite de processus.

Les chemins d’exécution des fournisseurs et des canaux doivent utiliser l’instantané de configuration d’exécution actif, et non un instantané de fichier retourné pour la relecture ou la modification de la configuration. Les instantanés de fichier préservent les valeurs sources comme les marqueurs SecretRef pour l’interface utilisateur et les écritures ; les callbacks de fournisseur ont besoin de la vue d’exécution résolue. Lorsqu’un helper peut être appelé avec l’instantané source actif ou l’instantané d’exécution actif, passez par `selectApplicableRuntimeConfig()` avant de lire les identifiants.

## Utilitaires d’exécution réutilisables

Utilisez les faits `botLoopProtection` entrants pour les messages entrants rédigés par un bot. Le cœur applique la garde partagée en mémoire à fenêtre glissante avant l’enregistrement de session et la distribution, sans lier la politique à un seul canal. La garde suit les clés `(scopeId, conversationId, participant pair)`, compte les deux directions d’une paire ensemble, applique un délai de récupération une fois le budget de la fenêtre dépassé, et élague opportunément les entrées inactives.

Les plugins de canal qui exposent ce comportement aux opérateurs doivent préférer la forme partagée `channels.defaults.botLoopProtection` pour les budgets de base, puis superposer les remplacements propres au canal/fournisseur. La configuration partagée utilise les secondes, car elle est visible par l’utilisateur :

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Transmettez les faits de paire de bots normalisés avec le tour résolu. Le cœur résout les valeurs par défaut, la conversion d’unités et la sémantique `enabled` :

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

Utilisez `openclaw/plugin-sdk/pair-loop-guard-runtime` directement uniquement pour les
boucles d’événements personnalisées à deux parties qui ne passent pas par le runner partagé de réponse entrante.

## Espaces de noms d’exécution

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identité d’agent, répertoires et gestion de session.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` est le helper neutre pour démarrer un tour d’agent OpenClaw normal depuis le code d’un plugin. Il utilise la même résolution de fournisseur/modèle et la même sélection de harnais d’agent que les réponses déclenchées par canal.

    `runEmbeddedPiAgent(...)` reste un alias de compatibilité obsolète pour les plugins existants. Le nouveau code doit utiliser `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` retourne les niveaux de réflexion pris en charge par le fournisseur/modèle et la valeur par défaut optionnelle. Les plugins de fournisseur détiennent le profil propre au modèle via leurs hooks de réflexion ; les plugins d’outils doivent donc appeler ce helper d’exécution au lieu d’importer ou de dupliquer des listes de fournisseurs.

    `normalizeThinkingLevel(...)` convertit le texte utilisateur comme `on`, `x-high` ou `extra high` en niveau stocké canonique avant de le vérifier par rapport à la politique résolue.

    Les **helpers de stockage de session** se trouvent sous `api.runtime.agent.session` :

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterate session rows without depending on the legacy sessions.json shape.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });
    ```

    Préférez `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` ou `upsertSessionEntry(...)` pour les workflows de session. Ces helpers adressent les sessions par identité agent/session afin que les plugins ne dépendent pas de l’ancienne forme de stockage `sessions.json`. Utilisez `preserveActivity: true` pour les correctifs qui ne portent que sur les métadonnées et ne doivent pas actualiser l’activité de session, et `replaceEntry: true` uniquement lorsque le callback retourne une entrée complète et que les champs supprimés doivent rester supprimés.

    Pour les lectures et écritures de transcription, importez `openclaw/plugin-sdk/session-transcript-runtime` et utilisez `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` ou `withSessionTranscriptWriteLock(...)` avec `{ agentId, sessionKey, sessionId }`. Ces API permettent aux plugins d’identifier une transcription, de lire ses événements, d’ajouter des messages, de publier des mises à jour et d’exécuter des opérations associées sous le même verrou d’écriture de transcription. Transmettre `sessionFile`, utiliser `resolveSessionTranscriptLegacyFileTarget(...)`, ou importer les fonctions bas niveau `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` depuis `openclaw/plugin-sdk/agent-harness-runtime` est obsolète ; ces chemins n’existent que pour le code hérité qui reçoit déjà un artefact de transcription actif.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` et `resolveAndPersistSessionFile(...)` sont des helpers de compatibilité obsolètes pour les plugins qui dépendent encore intentionnellement de l’ancienne forme de magasin complet ou de fichier de transcription. Le nouveau code de plugin ne doit pas utiliser ces helpers, et les appelants existants doivent migrer vers les helpers d’entrée et les helpers d’identité de transcription.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes de fournisseur et de modèle par défaut :

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Exécuter une complétion de texte détenue par l’hôte sans importer les éléments internes du fournisseur ni
    dupliquer la préparation OpenClaw du modèle, de l’authentification ou de l’URL de base.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Le helper utilise le même chemin de préparation de complétion simple que l’exécution
    intégrée d’OpenClaw et l’instantané de configuration d’exécution détenu par l’hôte. Les moteurs de contexte
    reçoivent une capacité `llm.complete` liée à la session, de sorte que les appels de modèle utilisent
    l’agent de la session active et ne retombent pas silencieusement sur l’agent par défaut. Le
    résultat inclut l’attribution fournisseur/modèle/agent ainsi que l’usage normalisé des tokens,
    du cache et du coût estimé lorsque ces informations sont disponibles.

    <Warning>
    Les remplacements de modèle nécessitent l’adhésion explicite de l’opérateur via `plugins.entries.<id>.llm.allowModelOverride: true` dans la configuration. Utilisez `plugins.entries.<id>.llm.allowedModels` pour limiter les plugins de confiance à des cibles canoniques `provider/model` précises. Les complétions inter-agents nécessitent `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Lancer et gérer des exécutions de sous-agent en arrière-plan.

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Les substitutions de modèle (`provider`/`model`) nécessitent l’adhésion explicite de l’opérateur via `plugins.entries.<id>.subagent.allowModelOverride: true` dans la configuration. Les plugins non fiables peuvent toujours exécuter des sous-agents, mais les demandes de substitution sont rejetées.
    </Warning>

    `deleteSession(...)` peut supprimer les sessions créées par le même plugin au moyen de `api.runtime.subagent.run(...)`. La suppression de sessions utilisateur ou opérateur arbitraires nécessite toujours une requête Gateway avec portée administrateur.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Répertoriez les nœuds connectés et invoquez une commande hébergée sur un nœud depuis du code de plugin chargé par le Gateway ou depuis des commandes CLI de plugin. Utilisez cette option lorsqu’un plugin possède du travail local sur un appareil appairé, par exemple un pont navigateur ou audio sur un autre Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dans le Gateway, cet environnement d’exécution est dans le processus. Dans les commandes CLI de plugin, il appelle le Gateway configuré via RPC, afin que des commandes telles que `openclaw googlemeet recover-tab` puissent inspecter les nœuds appairés depuis le terminal. Les commandes Node passent toujours par l’appairage normal des nœuds Gateway, les listes d’autorisation de commandes, les politiques d’invocation de nœuds de plugin et la gestion locale des commandes du nœud.

    Les plugins qui exposent des commandes dangereuses hébergées sur un nœud doivent enregistrer une politique d’invocation de nœud avec `api.registerNodeInvokePolicy(...)`. La politique s’exécute dans le Gateway après les contrôles de liste d’autorisation de commandes et avant que la commande ne soit transmise au nœud, de sorte que les appels directs à `node.invoke` et les outils de plugin de plus haut niveau partagent le même chemin d’application.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Liez un environnement d’exécution de flux de tâches à une clé de session OpenClaw existante ou à un contexte d’outil approuvé, puis créez et gérez des flux de tâches sans transmettre de propriétaire à chaque appel.

    Le flux de tâches suit l’état durable des workflows à plusieurs étapes. Ce n’est pas un planificateur :
    utilisez Cron ou `api.session.workflow.scheduleSessionTurn(...)` pour les réveils
    futurs, puis utilisez `managedFlows` depuis le tour planifié lorsque ce travail
    a besoin d’un état de flux, de tâches enfants, d’attentes ou d’une annulation.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Review new pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Review PR #123",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    Utilisez `bindSession({ sessionKey, requesterOrigin })` lorsque vous disposez déjà d’une clé de session OpenClaw approuvée provenant de votre propre couche de liaison. Ne liez pas à partir d’une entrée utilisateur brute.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Synthèse vocale.

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Utilise la configuration centrale `messages.tts` et la sélection du fournisseur. Renvoie un tampon audio PCM + la fréquence d’échantillonnage.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analyse d’images, d’audio et de vidéos.

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Structured image extraction through a specific provider/model.
    // Include at least one image; text inputs are supplemental context.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    Renvoie `{ text: undefined }` lorsqu’aucune sortie n’est produite (par exemple, entrée ignorée).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité pour `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Génération d’images.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Recherche Web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utilitaires multimédias de bas niveau.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    Instantané de configuration actuel de l’environnement d’exécution et écritures transactionnelles de configuration. Préférez
    la configuration qui a déjà été transmise dans le chemin d’appel actif ; utilisez
    `current()` uniquement lorsque le gestionnaire a besoin directement de l’instantané du processus.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` et `replaceConfigFile(...)` renvoient une valeur
    `followUp`, par exemple `{ mode: "restart", requiresRestart: true, reason }`,
    qui enregistre l’intention de l’auteur de l’écriture sans retirer le contrôle du redémarrage au
    gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitaires au niveau système.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Deprecated compatibility alias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runCommandWithTimeout(...)` renvoie `stdout` et `stderr` capturés, les décomptes de
    troncature facultatifs, `code`, `signal`, `killed`, `termination` et
    `noOutputTimedOut`. Les résultats de délai d’expiration et de délai d’expiration sans sortie signalent `code: 124`
    lorsque le processus enfant ne fournit pas de code de sortie non nul. Les sorties par signal
    hors délai d’expiration peuvent toujours renvoyer `code: null`; utilisez donc `termination` et
    `noOutputTimedOut` pour distinguer les raisons de délai d’expiration.

  </Accordion>
  <Accordion title="api.runtime.events">
    Abonnements aux événements.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Journalisation.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Résolution de l’authentification de modèle et de fournisseur.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Résolution du répertoire d’état et stockage clé-valeur adossé à SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Les magasins indexés par clé survivent aux redémarrages et sont isolés par l’id de plugin lié à l’environnement d’exécution. Utilisez `registerIfAbsent(...)` pour les revendications atomiques de déduplication : il renvoie `true` lorsque la clé était absente ou expirée et a été enregistrée, ou `false` lorsqu’une valeur active existe déjà sans écraser sa valeur, son heure de création ni son TTL. Limites : `maxEntries` par espace de noms, 6 000 lignes actives par plugin, valeurs JSON inférieures à 64 Ko et expiration TTL facultative. Lorsqu’une écriture dépasserait le plafond de lignes du plugin, l’environnement d’exécution peut évincer les lignes actives les plus anciennes de l’espace de noms en cours d’écriture ; les espaces de noms voisins ne sont pas évincés pour cette écriture, et l’écriture échoue quand même si l’espace de noms ne peut pas libérer suffisamment de lignes.

    <Warning>
    Plugins intégrés uniquement dans cette version.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Fabriques d’outils de mémoire et CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Assistants d’exécution propres aux canaux (disponibles lorsqu’un plugin de canal est chargé).

    `api.runtime.channel.media` est la surface recommandée pour les téléchargements et le stockage de médias de canal :

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Utilisez `saveRemoteMedia(...)` lorsqu’une URL distante doit devenir un média OpenClaw. Utilisez `saveResponseMedia(...)` lorsque le plugin a déjà récupéré une `Response` avec une authentification, une gestion des redirections ou une liste d’autorisation propres au plugin. Utilisez `readRemoteMediaBuffer(...)` uniquement lorsque le plugin a besoin des octets bruts pour inspection, transformations, déchiffrement ou téléversement. `fetchRemoteMedia(...)` reste un alias de compatibilité obsolète pour `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` est la surface partagée de politique de mentions entrantes pour les plugins de canal intégrés qui utilisent l’injection par l’environnement d’exécution :

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    Assistants de mention disponibles :

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` n’expose volontairement pas les anciens assistants de compatibilité `resolveMentionGating*`. Préférez le chemin normalisé `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Stocker les références d’environnement d’exécution

Utilisez `createPluginRuntimeStore` pour stocker la référence d’environnement d’exécution afin de l’utiliser en dehors du rappel `register` :

<Steps>
  <Step title="Créer le magasin">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Relier au point d’entrée">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Accéder depuis d’autres fichiers">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Préférez `pluginId` pour l’identité du runtime-store. La forme de niveau inférieur `key` est destinée aux cas peu courants où un plugin a volontairement besoin de plus d’un emplacement d’environnement d’exécution.
</Note>

## Autres champs `api` de premier niveau

Au-delà de `api.runtime`, l’objet API fournit également :

<ParamField path="api.id" type="string">
  Id du plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nom d’affichage du plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantané de configuration actuel (instantané d’environnement d’exécution actif en mémoire lorsqu’il est disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuration propre au plugin provenant de `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Journaliseur à portée limitée (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Résoudre un chemin relatif à la racine du plugin.
</ParamField>

## Articles associés

- [Internes du plugin](/fr/plugins/architecture) — modèle de capacités et registre
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry`
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence des sous-chemins
