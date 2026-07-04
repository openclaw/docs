---
read_when:
    - Vous devez appeler des helpers du noyau depuis un Plugin (TTS, STT, génération d’images, recherche web, sous-agent, nœuds)
    - Vous voulez comprendre ce que api.runtime expose
    - Vous accédez à la configuration, à l’agent ou aux assistants multimédias depuis le code du Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- les assistants d’exécution injectés disponibles pour les plugins
title: Utilitaires d’exécution du Plugin
x-i18n:
    generated_at: "2026-07-04T20:30:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Référence pour l'objet `api.runtime` injecté dans chaque plugin pendant l'inscription. Utilisez ces helpers plutôt que d'importer directement les éléments internes de l'hôte.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/fr/plugins/sdk-channel-plugins">
    Guide pas à pas qui utilise ces helpers en contexte pour les Plugins de canal.
  </Card>
  <Card title="Plugins de fournisseur" href="/fr/plugins/sdk-provider-plugins">
    Guide pas à pas qui utilise ces helpers en contexte pour les Plugins de fournisseur.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Chargement et écritures de configuration

Préférez la configuration qui a déjà été transmise au chemin d'appel actif, par exemple `api.config` pendant l'inscription ou un argument `cfg` dans les callbacks de canal/fournisseur. Cela permet de faire circuler un seul instantané de processus dans le travail au lieu de réanalyser la configuration sur les chemins critiques.

Utilisez `api.runtime.config.current()` uniquement lorsqu'un gestionnaire de longue durée a besoin de l'instantané actuel du processus et qu'aucune configuration n'a été transmise à cette fonction. La valeur renvoyée est en lecture seule ; clonez-la ou utilisez un helper de mutation avant de la modifier.

Les fabriques d'outils reçoivent `ctx.runtimeConfig` ainsi que `ctx.getRuntimeConfig()`. Utilisez le getter dans le callback `execute` d'un outil de longue durée lorsque la configuration peut changer après la création de la définition de l'outil.

Persistez les modifications avec `api.runtime.config.mutateConfigFile(...)` ou `api.runtime.config.replaceConfigFile(...)`. Chaque écriture doit choisir une politique `afterWrite` explicite :

- `afterWrite: { mode: "auto" }` laisse le planificateur de rechargement du Gateway décider.
- `afterWrite: { mode: "restart", reason: "..." }` force un redémarrage propre lorsque l'auteur de l'écriture sait que le rechargement à chaud n'est pas sûr.
- `afterWrite: { mode: "none", reason: "..." }` supprime le rechargement/redémarrage automatique uniquement lorsque l'appelant prend en charge le suivi.

Les helpers de mutation renvoient `afterWrite` ainsi qu'un résumé typé `followUp` afin que les appelants puissent journaliser ou tester s'ils ont demandé un redémarrage. Le Gateway reste responsable du moment où ce redémarrage se produit réellement.

`api.runtime.config.loadConfig()` et `api.runtime.config.writeConfigFile(...)` sont des helpers de compatibilité obsolètes sous `runtime-config-load-write`. Ils émettent un avertissement une fois à l'exécution et restent disponibles pour les anciens plugins externes pendant la fenêtre de migration. Les plugins groupés ne doivent pas les utiliser ; les gardes de frontière de configuration échouent si le code d'un plugin les appelle ou importe ces helpers depuis des sous-chemins du SDK de plugin.

Pour les imports directs du SDK, utilisez les sous-chemins de configuration ciblés au lieu du barrel de compatibilité large
`openclaw/plugin-sdk/config-runtime` : `config-contracts` pour les
types, `plugin-config-runtime` pour les assertions de configuration déjà chargée et la recherche
d'entrée de plugin, `runtime-config-snapshot` pour les instantanés du processus actuel, et
`config-mutation` pour les écritures. Les tests de plugins groupés doivent simuler directement ces sous-chemins
ciblés au lieu de simuler le barrel de compatibilité large.

Le code d'exécution interne d'OpenClaw suit la même direction : charger la configuration une fois à la frontière de la CLI, du Gateway ou du processus, puis transmettre cette valeur. Les écritures de mutation réussies actualisent l'instantané de configuration d'exécution du processus et incrémentent sa révision interne ; les caches de longue durée doivent s'indexer sur la clé de cache détenue par l'exécution au lieu de sérialiser localement la configuration. Les modules d'exécution de longue durée disposent d'un scanner à tolérance zéro pour les appels ambiants à `loadConfig()` ; utilisez un `cfg` transmis, un `context.getRuntimeConfig()` de requête ou `getRuntimeConfig()` à une frontière de processus explicite.

Les chemins d'exécution des fournisseurs et des canaux doivent utiliser l'instantané actif de configuration d'exécution, et non un instantané de fichier renvoyé pour la relecture ou la modification de configuration. Les instantanés de fichier préservent les valeurs source telles que les marqueurs SecretRef pour l'interface utilisateur et les écritures ; les callbacks de fournisseur ont besoin de la vue d'exécution résolue. Lorsqu'un helper peut être appelé avec l'instantané source actif ou l'instantané d'exécution actif, passez par `selectApplicableRuntimeConfig()` avant de lire les identifiants.

## Utilitaires d'exécution réutilisables

Utilisez les faits entrants `botLoopProtection` pour les messages entrants rédigés par des bots. Le noyau applique le garde-fou partagé en mémoire à fenêtre glissante avant l'enregistrement de session et la distribution, sans lier la politique à un seul canal. Le garde suit les clés `(scopeId, conversationId, participant pair)`, compte ensemble les deux directions d'une paire, applique un temps de récupération lorsque le budget de fenêtre est dépassé, et purge les entrées inactives de façon opportuniste.

Les Plugins de canal qui exposent ce comportement aux opérateurs doivent préférer la forme partagée `channels.defaults.botLoopProtection` pour les budgets de base, puis superposer les remplacements propres au canal/fournisseur. La configuration partagée utilise des secondes parce qu'elle est visible par l'utilisateur :

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Transmettez les faits normalisés de paire de bots avec le tour résolu. Le noyau résout les valeurs par défaut, la conversion d'unités et la sémantique de `enabled` :

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

Utilisez directement `openclaw/plugin-sdk/pair-loop-guard-runtime` uniquement pour les boucles d'événements
personnalisées à deux parties qui ne passent pas par le runner partagé de réponses entrantes.

## Espaces de noms d'exécution

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identité de l'agent, répertoires et gestion des sessions.

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

    `runEmbeddedAgent(...)` est le helper neutre pour démarrer un tour d'agent OpenClaw normal depuis du code de plugin. Il utilise la même résolution fournisseur/modèle et la même sélection du harnais d'agent que les réponses déclenchées par les canaux.

    `runEmbeddedPiAgent(...)` reste un alias de compatibilité obsolète pour les plugins existants. Le nouveau code doit utiliser `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` renvoie les niveaux de raisonnement pris en charge par le fournisseur/modèle et le défaut facultatif. Les Plugins de fournisseur possèdent le profil propre au modèle via leurs hooks de raisonnement ; les Plugins d'outils doivent donc appeler ce helper d'exécution plutôt que d'importer ou de dupliquer les listes de fournisseurs.

    `normalizeThinkingLevel(...)` convertit le texte utilisateur tel que `on`, `x-high` ou `extra high` en niveau stocké canonique avant de le vérifier par rapport à la politique résolue.

    Les **helpers de magasin de sessions** se trouvent sous `api.runtime.agent.session` :

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

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    Préférez `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` ou `upsertSessionEntry(...)` pour les workflows de session. Ces helpers adressent les sessions par identité d'agent/session afin que les plugins ne dépendent pas de la forme de stockage héritée `sessions.json`. Utilisez `preserveActivity: true` pour les patchs qui ne concernent que les métadonnées et ne doivent pas actualiser l'activité de session, et `replaceEntry: true` uniquement lorsque le callback renvoie une entrée complète et que les champs supprimés doivent rester supprimés.

    Utilisez `runWithWorkAdmission(...)` lorsqu'un plugin démarre un travail sur une session persistée. Le callback rejette les sessions archivées ou remplacées simultanément, maintient les mutations d'archive/réinitialisation/suppression coordonnées jusqu'à l'achèvement, et reçoit un `AbortSignal` qui doit être transmis à l'exécution de l'agent.

    Pour les lectures et écritures de transcription, importez `openclaw/plugin-sdk/session-transcript-runtime` et utilisez `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` ou `withSessionTranscriptWriteLock(...)` avec `{ agentId, sessionKey, sessionId }`. Ces API permettent aux plugins d'identifier une transcription, de lire ses événements, d'ajouter des messages, de publier des mises à jour et d'exécuter les opérations liées sous le même verrou d'écriture de transcription. Passer `sessionFile`, utiliser `resolveSessionTranscriptLegacyFileTarget(...)` ou importer les bas niveaux `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` depuis `openclaw/plugin-sdk/agent-harness-runtime` est obsolète ; ces chemins existent uniquement pour le code hérité qui reçoit déjà un artefact de transcription actif.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` et `resolveAndPersistSessionFile(...)` sont des helpers de compatibilité obsolètes pour les plugins qui dépendent encore intentionnellement de l'ancienne forme de magasin complet ou de fichier de transcription. Le nouveau code de plugin ne doit pas utiliser ces helpers, et les appelants existants doivent migrer vers les helpers d'entrée et les helpers d'identité de transcription.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes par défaut de modèle et de fournisseur :

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Exécutez une complétion de texte détenue par l'hôte sans importer les éléments internes du fournisseur ni
    dupliquer la préparation de modèle/authentification/URL de base d'OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Le helper utilise le même chemin de préparation de complétion simple que l'exécution
    intégrée d'OpenClaw et l'instantané de configuration d'exécution détenu par l'hôte. Les moteurs de contexte
    reçoivent une capacité `llm.complete` liée à la session, de sorte que les appels de modèle utilisent
    l'agent de la session active et ne reviennent pas silencieusement à l'agent par défaut. Le
    résultat inclut l'attribution fournisseur/modèle/agent ainsi que l'utilisation normalisée des tokens,
    du cache et du coût estimé lorsqu'elle est disponible.

    <Warning>
    Les substitutions de modèle nécessitent le consentement explicite de l’opérateur via `plugins.entries.<id>.llm.allowModelOverride: true` dans la configuration. Utilisez `plugins.entries.<id>.llm.allowedModels` pour limiter les plugins de confiance à des cibles canoniques `provider/model` spécifiques. Les complétions entre agents nécessitent `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Lancez et gérez des exécutions de sous-agents en arrière-plan.

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
    Les substitutions de modèle (`provider`/`model`) nécessitent le consentement explicite de l’opérateur via `plugins.entries.<id>.subagent.allowModelOverride: true` dans la configuration. Les plugins non approuvés peuvent toujours exécuter des sous-agents, mais les demandes de substitution sont rejetées.
    </Warning>

    `deleteSession(...)` peut supprimer les sessions créées par le même plugin via `api.runtime.subagent.run(...)`. La suppression de sessions utilisateur ou opérateur arbitraires nécessite toujours une requête Gateway avec portée administrateur.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Listez les nœuds connectés et invoquez une commande hébergée sur un nœud depuis du code de plugin chargé par le Gateway ou depuis des commandes CLI de plugin. Utilisez ceci lorsqu’un plugin possède du travail local sur un appareil appairé, par exemple un pont de navigateur ou audio sur un autre Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dans le Gateway, ce runtime est intégré au processus. Dans les commandes CLI de plugin, il appelle le Gateway configuré via RPC, afin que des commandes comme `openclaw googlemeet recover-tab` puissent inspecter les nœuds appairés depuis le terminal. Les commandes de nœud passent toujours par l’appairage normal des nœuds du Gateway, les listes d’autorisations de commandes, les politiques d’invocation de nœud des plugins et le traitement local des commandes sur le nœud.

    Les plugins qui exposent des commandes dangereuses hébergées sur un nœud doivent enregistrer une politique d’invocation de nœud avec `api.registerNodeInvokePolicy(...)`. La politique s’exécute dans le Gateway après les vérifications de liste d’autorisations de commandes et avant le transfert de la commande au nœud, de sorte que les appels directs `node.invoke` et les outils de plugin de plus haut niveau partagent le même chemin d’application.

    <Warning>
    Le champ facultatif `scopes` demande des portées d’opérateur Gateway pour l’invocation. OpenClaw ne les honore que pour les plugins intégrés et les installations de plugins officiels de confiance ; les demandes provenant d’autres plugins n’élèvent pas l’appel. Utilisez-le uniquement lorsqu’un plugin de confiance doit invoquer une commande de nœud avec une portée Gateway plus stricte, comme `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Associez un runtime de flux de tâches à une clé de session OpenClaw existante ou à un contexte d’outil de confiance, puis créez et gérez des flux de tâches sans transmettre de propriétaire à chaque appel.

    Le flux de tâches suit un état durable de workflow à plusieurs étapes. Ce n’est pas un planificateur :
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

    Utilisez `bindSession({ sessionKey, requesterOrigin })` lorsque vous disposez déjà d’une clé de session OpenClaw de confiance provenant de votre propre couche d’association. Ne l’associez pas à partir d’une entrée utilisateur brute.

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

    Utilise la configuration principale `messages.tts` et la sélection de fournisseur. Renvoie un tampon audio PCM + le taux d’échantillonnage.

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
    Utilitaires média de bas niveau.

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
    Instantané de configuration du runtime actuel et écritures transactionnelles de configuration. Préférez
    la configuration déjà transmise au chemin d’appel actif ; utilisez
    `current()` uniquement lorsque le gestionnaire a directement besoin de l’instantané du processus.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` et `replaceConfigFile(...)` renvoient une valeur `followUp`,
    par exemple `{ mode: "restart", requiresRestart: true, reason }`,
    qui enregistre l’intention de l’auteur de l’écriture sans retirer le contrôle du redémarrage au
    Gateway.

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

    `runCommandWithTimeout(...)` renvoie les `stdout` et `stderr` capturés, les nombres facultatifs
    de troncature, `code`, `signal`, `killed`, `termination` et
    `noOutputTimedOut`. Les résultats d’expiration de délai et d’expiration pour absence de sortie signalent `code: 124`
    lorsque le processus enfant ne fournit pas de code de sortie non nul. Les sorties par signal
    hors expiration peuvent toujours renvoyer `code: null`; utilisez donc `termination` et
    `noOutputTimedOut` pour distinguer les raisons d’expiration.

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
    Résolution de l’authentification du modèle et du fournisseur.

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

    Les magasins clé-valeur survivent aux redémarrages et sont isolés par l’id du Plugin lié au runtime. Utilisez `registerIfAbsent(...)` pour des revendications de déduplication atomiques : la fonction renvoie `true` lorsque la clé était absente ou expirée et a été enregistrée, ou `false` lorsqu’une valeur active existe déjà, sans écraser sa valeur, son heure de création ni sa durée de vie. Limites : `maxEntries` par espace de noms, 6 000 lignes actives par Plugin, valeurs JSON inférieures à 64 Ko et expiration TTL facultative. Lorsqu’une écriture dépasserait le plafond de lignes du Plugin, le runtime peut évincer les lignes actives les plus anciennes de l’espace de noms en cours d’écriture ; les espaces de noms voisins ne sont pas évincés pour cette écriture, et l’écriture échoue quand même si l’espace de noms ne peut pas libérer suffisamment de lignes.

    <Warning>
    Plugins groupés uniquement dans cette version.
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
    Assistants de runtime propres aux canaux (disponibles lorsqu’un Plugin de canal est chargé).

    `api.runtime.channel.media` est la surface privilégiée pour les téléchargements et le stockage des médias de canal :

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Utilisez `saveRemoteMedia(...)` lorsqu’une URL distante doit devenir un média OpenClaw. Utilisez `saveResponseMedia(...)` lorsque le Plugin a déjà récupéré une `Response` avec une authentification, des redirections ou une gestion de liste d’autorisation qui lui appartiennent. Utilisez `readRemoteMediaBuffer(...)` uniquement lorsque le Plugin a besoin d’octets bruts pour inspection, transformations, déchiffrement ou téléversement. `fetchRemoteMedia(...)` reste un alias de compatibilité obsolète pour `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` est la surface partagée de politique de mentions entrantes pour les Plugins de canal groupés qui utilisent l’injection de runtime :

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

## Stocker les références de runtime

Utilisez `createPluginRuntimeStore` pour stocker la référence de runtime afin de l’utiliser en dehors du rappel `register` :

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
  <Step title="Raccorder au point d’entrée">
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
Préférez `pluginId` pour l’identité du magasin de runtime. La forme de plus bas niveau `key` est destinée aux cas peu courants où un Plugin a intentionnellement besoin de plusieurs emplacements de runtime.
</Note>

## Autres champs `api` de premier niveau

Au-delà de `api.runtime`, l’objet API fournit également :

<ParamField path="api.id" type="string">
  Id du Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nom d’affichage du Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantané de configuration actuel (instantané de runtime actif en mémoire lorsqu’il est disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuration propre au Plugin provenant de `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Journaliseur à portée limitée (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Résout un chemin relatif à la racine du Plugin.
</ParamField>

## Liens connexes

- [Internes des Plugins](/fr/plugins/architecture) — modèle de capacités et registre
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry`
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence des sous-chemins
