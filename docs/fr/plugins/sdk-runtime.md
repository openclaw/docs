---
read_when:
    - Vous devez appeler des fonctions utilitaires du noyau depuis un Plugin (TTS, STT, génération d’images, recherche web, sous-agent, nœuds)
    - Vous souhaitez comprendre ce qu’expose api.runtime
    - Vous accédez aux fonctions utilitaires de configuration, d’agent ou de médias depuis du code de plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- les fonctions d’aide d’exécution injectées disponibles pour les plugins
title: Fonctions d’aide de l’environnement d’exécution du Plugin
x-i18n:
    generated_at: "2026-05-11T20:49:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d94d9f69c51711800e557274299b0e84679deda4e48c743bf193b7f32fe8d71
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Référence pour l’objet `api.runtime` injecté dans chaque plugin pendant l’enregistrement. Utilisez ces assistants au lieu d’importer directement les éléments internes de l’hôte.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/fr/plugins/sdk-channel-plugins">
    Guide étape par étape qui utilise ces assistants en contexte pour les plugins de canal.
  </Card>
  <Card title="Plugins de fournisseur" href="/fr/plugins/sdk-provider-plugins">
    Guide étape par étape qui utilise ces assistants en contexte pour les plugins de fournisseur.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Chargement et écritures de configuration

Préférez la configuration qui a déjà été transmise au chemin d’appel actif, par exemple `api.config` pendant l’enregistrement ou un argument `cfg` dans les callbacks de canal/fournisseur. Cela garde un instantané de processus unique qui traverse le travail au lieu de réanalyser la configuration dans les chemins critiques.

Utilisez `api.runtime.config.current()` uniquement lorsqu’un gestionnaire de longue durée a besoin de l’instantané actuel du processus et qu’aucune configuration n’a été transmise à cette fonction. La valeur renvoyée est en lecture seule ; clonez-la ou utilisez un assistant de mutation avant de la modifier.

Les fabriques d’outils reçoivent `ctx.runtimeConfig` ainsi que `ctx.getRuntimeConfig()`. Utilisez le getter dans le callback `execute` d’un outil de longue durée lorsque la configuration peut changer après la création de la définition de l’outil.

Persistez les changements avec `api.runtime.config.mutateConfigFile(...)` ou `api.runtime.config.replaceConfigFile(...)`. Chaque écriture doit choisir une stratégie `afterWrite` explicite :

- `afterWrite: { mode: "auto" }` laisse la décision au rechargement du planificateur du Gateway.
- `afterWrite: { mode: "restart", reason: "..." }` force un redémarrage propre lorsque l’auteur de l’écriture sait que le rechargement à chaud n’est pas sûr.
- `afterWrite: { mode: "none", reason: "..." }` supprime le rechargement/redémarrage automatique uniquement lorsque l’appelant possède le suivi.

Les assistants de mutation renvoient `afterWrite` ainsi qu’un résumé typé `followUp`, afin que les appelants puissent journaliser ou tester s’ils ont demandé un redémarrage. Le Gateway reste responsable du moment où ce redémarrage se produit effectivement.

`api.runtime.config.loadConfig()` et `api.runtime.config.writeConfigFile(...)` sont des assistants de compatibilité dépréciés sous `runtime-config-load-write`. Ils avertissent une fois à l’exécution et restent disponibles pour les anciens plugins externes pendant la fenêtre de migration. Les plugins intégrés ne doivent pas les utiliser ; les garde-fous de frontière de configuration échouent si le code d’un plugin les appelle ou importe ces assistants depuis des sous-chemins du SDK de plugin.

Pour les imports directs du SDK, utilisez les sous-chemins de configuration ciblés au lieu du barrel de compatibilité large
`openclaw/plugin-sdk/config-runtime` : `config-contracts` pour les types, `plugin-config-runtime` pour les assertions de configuration déjà chargée et la recherche d’entrée de plugin, `runtime-config-snapshot` pour les instantanés actuels du processus, et `config-mutation` pour les écritures. Les tests de plugins intégrés doivent simuler directement ces sous-chemins ciblés au lieu de simuler le barrel de compatibilité large.

Le code d’exécution interne d’OpenClaw suit la même direction : charger la configuration une seule fois à la frontière du CLI, du Gateway ou du processus, puis transmettre cette valeur. Les écritures de mutation réussies actualisent l’instantané d’exécution du processus et avancent sa révision interne ; les caches de longue durée doivent s’appuyer sur la clé de cache détenue par le runtime au lieu de sérialiser localement la configuration. Les modules d’exécution de longue durée ont un scanner à tolérance zéro pour les appels ambiants à `loadConfig()` ; utilisez un `cfg` transmis, un `context.getRuntimeConfig()` de requête, ou `getRuntimeConfig()` à une frontière de processus explicite.

Les chemins d’exécution de fournisseur et de canal doivent utiliser l’instantané actif de configuration d’exécution, et non un instantané de fichier renvoyé pour la relecture ou la modification de la configuration. Les instantanés de fichier préservent les valeurs source comme les marqueurs SecretRef pour l’interface utilisateur et les écritures ; les callbacks de fournisseur ont besoin de la vue d’exécution résolue. Lorsqu’un assistant peut être appelé avec l’instantané source actif ou l’instantané d’exécution actif, passez par `selectApplicableRuntimeConfig()` avant de lire les identifiants.

## Espaces de noms du runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identité de l’agent, répertoires et gestion de session.

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
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` est l’assistant neutre pour démarrer un tour normal d’agent OpenClaw depuis le code d’un plugin. Il utilise la même résolution fournisseur/modèle et la même sélection de harnais d’agent que les réponses déclenchées par canal.

    `runEmbeddedPiAgent(...)` reste disponible comme alias de compatibilité.

    `resolveThinkingPolicy(...)` renvoie les niveaux de raisonnement pris en charge par le fournisseur/modèle et le niveau par défaut facultatif. Les plugins de fournisseur possèdent le profil propre au modèle via leurs hooks de raisonnement, donc les plugins d’outils doivent appeler cet assistant de runtime au lieu d’importer ou de dupliquer des listes de fournisseurs.

    `normalizeThinkingLevel(...)` convertit le texte utilisateur comme `on`, `x-high` ou `extra high` vers le niveau stocké canonique avant de le vérifier par rapport à la stratégie résolue.

    Les **assistants de stockage de session** se trouvent sous `api.runtime.agent.session` :

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Préférez `updateSessionStore(...)` ou `updateSessionStoreEntry(...)` pour les écritures à l’exécution. Ils passent par l’écrivain de stockage de session détenu par le Gateway, préservent les mises à jour concurrentes et réutilisent le cache chaud. `saveSessionStore(...)` reste disponible pour la compatibilité et les réécritures de type maintenance hors ligne.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes de fournisseur et de modèle par défaut :

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Exécute une complétion de texte détenue par l’hôte sans importer les éléments internes du fournisseur ni
    dupliquer la préparation OpenClaw du modèle, de l’authentification ou de l’URL de base.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    L’assistant utilise le même chemin de préparation de complétion simple que le
    runtime intégré d’OpenClaw et l’instantané de configuration d’exécution détenu par l’hôte. Les moteurs de contexte
    reçoivent une capacité `llm.complete` liée à la session, afin que les appels de modèle utilisent
    l’agent de la session active et ne se rabattent pas silencieusement sur l’agent par défaut. Le
    résultat inclut l’attribution fournisseur/modèle/agent ainsi que l’utilisation normalisée des jetons,
    du cache et du coût estimé lorsqu’elle est disponible.

    <Warning>
    Les substitutions de modèle nécessitent l’adhésion explicite de l’opérateur via `plugins.entries.<id>.llm.allowModelOverride: true` dans la configuration. Utilisez `plugins.entries.<id>.llm.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques `provider/model` spécifiques. Les complétions entre agents nécessitent `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Lance et gère les exécutions de sous-agents en arrière-plan.

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

    `deleteSession(...)` peut supprimer les sessions créées par le même plugin via `api.runtime.subagent.run(...)`. La suppression de sessions arbitraires d’utilisateur ou d’opérateur nécessite toujours une requête Gateway avec portée administrateur.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liste les nœuds connectés et invoque une commande hébergée par un nœud depuis du code de plugin chargé par le Gateway ou depuis des commandes CLI de plugin. Utilisez cela lorsqu’un plugin possède du travail local sur un appareil appairé, par exemple un pont navigateur ou audio sur un autre Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dans le Gateway, ce runtime est dans le processus. Dans les commandes CLI de plugin, il appelle le Gateway configuré via RPC, de sorte que des commandes comme `openclaw googlemeet recover-tab` peuvent inspecter les nœuds appairés depuis le terminal. Les commandes de nœud passent toujours par l’appairage normal des nœuds du Gateway, les listes d’autorisation de commandes, les stratégies d’invocation de nœud des plugins et la gestion de commandes locale au nœud.

    Les plugins qui exposent des commandes dangereuses hébergées par un nœud doivent enregistrer une stratégie d’invocation de nœud avec `api.registerNodeInvokePolicy(...)`. La stratégie s’exécute dans le Gateway après les vérifications de liste d’autorisation des commandes et avant que la commande soit transmise au nœud, afin que les appels directs à `node.invoke` et les outils de plugin de plus haut niveau partagent le même chemin d’application.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Lie un runtime Task Flow à une clé de session OpenClaw existante ou à un contexte d’outil de confiance, puis crée et gère des Task Flows sans transmettre un propriétaire à chaque appel.

    Task Flow suit un état de workflow durable à plusieurs étapes. Ce n’est pas un planificateur :
    utilisez Cron ou `api.session.workflow.scheduleSessionTurn(...)` pour les réveils
    futurs, puis utilisez `managedFlows` depuis le tour planifié lorsque ce travail
    a besoin d’un état de flux, de tâches enfants, d’attentes ou d’annulation.

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

    Utilisez `bindSession({ sessionKey, requesterOrigin })` lorsque vous disposez déjà d’une clé de session OpenClaw fiable issue de votre propre couche de liaison. N’effectuez pas de liaison à partir d’une entrée utilisateur brute.

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

    Utilise la configuration principale `messages.tts` et la sélection du fournisseur. Renvoie un tampon audio PCM + la fréquence d’échantillonnage.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analyse d’images, d’audio et de vidéo.

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
    Instantané de la configuration d’exécution actuelle et écritures de configuration transactionnelles. Préférez
    la configuration qui a déjà été transmise au chemin d’appel actif ; utilisez
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
    qui enregistre l’intention de l’auteur sans retirer au gateway le contrôle du redémarrage.

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
    Résolution de l’authentification des modèles et des fournisseurs.

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

    Les stockages clé-valeur survivent aux redémarrages et sont isolés par l’id de Plugin lié à l’exécution. Utilisez `registerIfAbsent(...)` pour les revendications de déduplication atomiques : la méthode renvoie `true` lorsque la clé était absente ou expirée et a été enregistrée, ou `false` lorsqu’une valeur active existe déjà sans écraser sa valeur, son heure de création ni son TTL. Limites : `maxEntries` par espace de noms, 1 000 lignes actives par Plugin, valeurs JSON inférieures à 64 Ko et expiration TTL facultative.

    <Warning>
    Plugins groupés uniquement dans cette version.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Fabriques d’outils mémoire et CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Assistants d’exécution propres aux canaux (disponibles lorsqu’un Plugin de canal est chargé).

    `api.runtime.channel.mentions` est la surface partagée de politique de mention entrante pour les Plugins de canal groupés qui utilisent l’injection d’exécution :

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

## Stockage des références d’exécution

Utilisez `createPluginRuntimeStore` pour stocker la référence d’exécution afin de l’utiliser en dehors du rappel `register` :

<Steps>
  <Step title="Create the store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Wire into the entry point">
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
  <Step title="Access from other files">
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
Préférez `pluginId` pour l’identité du stockage d’exécution. La forme de plus bas niveau `key` est destinée aux cas peu courants où un Plugin a intentionnellement besoin de plusieurs emplacements d’exécution.
</Note>

## Autres champs `api` de premier niveau

Au-delà de `api.runtime`, l’objet API fournit également :

<ParamField path="api.id" type="string">
  Identifiant du Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nom d’affichage du Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Instantané de la configuration actuelle (instantané actif du runtime en mémoire lorsqu’il est disponible).
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

## Associé

- [Internes du Plugin](/fr/plugins/architecture) — modèle de capacités et registre
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry`
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence des sous-chemins
