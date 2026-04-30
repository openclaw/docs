---
read_when:
    - Vous devez appeler des fonctions d’aide du noyau depuis un plugin (TTS, STT, génération d’images, recherche web, sous-agent, nœuds)
    - Vous voulez comprendre ce qu’expose api.runtime
    - Vous accédez à des fonctions utilitaires de configuration, d’agent ou de média depuis le code du Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- les assistants d’exécution injectés disponibles pour les plugins
title: Fonctions d’aide de l’environnement d’exécution Plugin
x-i18n:
    generated_at: "2026-04-30T07:41:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Référence pour l’objet `api.runtime` injecté dans chaque plugin pendant l’enregistrement. Utilisez ces assistants au lieu d’importer directement les éléments internes de l’hôte.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/fr/plugins/sdk-channel-plugins">
    Guide pas à pas qui utilise ces assistants en contexte pour les plugins de canal.
  </Card>
  <Card title="Plugins de fournisseur" href="/fr/plugins/sdk-provider-plugins">
    Guide pas à pas qui utilise ces assistants en contexte pour les plugins de fournisseur.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Chargement et écritures de la configuration

Préférez la configuration qui a déjà été passée dans le chemin d’appel actif, par exemple `api.config` pendant l’enregistrement ou un argument `cfg` dans les rappels de canal/fournisseur. Cela permet de faire circuler un instantané de processus unique dans le travail au lieu de réanalyser la configuration sur les chemins critiques.

Utilisez `api.runtime.config.current()` uniquement lorsqu’un gestionnaire longue durée a besoin de l’instantané de processus actuel et qu’aucune configuration n’a été passée à cette fonction. La valeur renvoyée est en lecture seule ; clonez-la ou utilisez un assistant de mutation avant modification.

Les fabriques d’outils reçoivent `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Utilisez le getter dans le rappel `execute` d’un outil longue durée lorsque la configuration peut changer après la création de la définition de l’outil.

Persistez les changements avec `api.runtime.config.mutateConfigFile(...)` ou `api.runtime.config.replaceConfigFile(...)`. Chaque écriture doit choisir une politique `afterWrite` explicite :

- `afterWrite: { mode: "auto" }` laisse le planificateur de rechargement du gateway décider.
- `afterWrite: { mode: "restart", reason: "..." }` force un redémarrage propre lorsque l’auteur de l’écriture sait que le rechargement à chaud n’est pas sûr.
- `afterWrite: { mode: "none", reason: "..." }` supprime le rechargement/redémarrage automatique uniquement lorsque l’appelant prend en charge le suivi.

Les assistants de mutation renvoient `afterWrite` ainsi qu’un résumé `followUp` typé afin que les appelants puissent journaliser ou tester s’ils ont demandé un redémarrage. Le gateway reste responsable du moment où ce redémarrage a effectivement lieu.

`api.runtime.config.loadConfig()` et `api.runtime.config.writeConfigFile(...)` sont des assistants de compatibilité obsolètes sous `runtime-config-load-write`. Ils émettent un avertissement une fois à l’exécution et restent disponibles pour les anciens plugins externes pendant la fenêtre de migration. Les plugins intégrés ne doivent pas les utiliser ; les gardes de frontière de configuration échouent si le code d’un plugin les appelle ou importe ces assistants depuis des sous-chemins du SDK de plugin.

Pour les importations directes du SDK, utilisez les sous-chemins de configuration ciblés au lieu du large barrel de compatibilité
`openclaw/plugin-sdk/config-runtime` : `config-types` pour les
types, `plugin-config-runtime` pour les assertions de configuration déjà chargée et la
recherche d’entrée de plugin, `runtime-config-snapshot` pour les instantanés de processus actuels, et
`config-mutation` pour les écritures. Les tests de plugins intégrés doivent simuler directement ces
sous-chemins ciblés au lieu de simuler le large barrel de compatibilité.

Le code d’exécution interne d’OpenClaw suit la même direction : charger la configuration une fois à la frontière de la CLI, du gateway ou du processus, puis transmettre cette valeur. Les écritures de mutation réussies actualisent l’instantané d’exécution du processus et avancent sa révision interne ; les caches longue durée doivent s’appuyer sur la clé de cache possédée par l’exécution au lieu de sérialiser la configuration localement. Les modules d’exécution longue durée disposent d’un scanner à tolérance zéro pour les appels ambiants à `loadConfig()` ; utilisez un `cfg` transmis, un `context.getRuntimeConfig()` de requête ou `getRuntimeConfig()` à une frontière de processus explicite.

Les chemins d’exécution des fournisseurs et des canaux doivent utiliser l’instantané de configuration d’exécution actif, et non un instantané de fichier renvoyé pour la relecture ou la modification de configuration. Les instantanés de fichier préservent les valeurs source telles que les marqueurs SecretRef pour l’interface utilisateur et les écritures ; les rappels de fournisseur ont besoin de la vue d’exécution résolue. Lorsqu’un assistant peut être appelé avec l’instantané source actif ou l’instantané d’exécution actif, passez par `selectApplicableRuntimeConfig()` avant de lire les identifiants.

## Espaces de noms d’exécution

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

    `runEmbeddedAgent(...)` est l’assistant neutre pour démarrer un tour d’agent OpenClaw normal depuis le code d’un plugin. Il utilise la même résolution fournisseur/modèle et la même sélection de harnais d’agent que les réponses déclenchées par un canal.

    `runEmbeddedPiAgent(...)` reste un alias de compatibilité.

    `resolveThinkingPolicy(...)` renvoie les niveaux de réflexion pris en charge par le fournisseur/modèle et la valeur par défaut facultative. Les plugins de fournisseur possèdent le profil propre au modèle via leurs hooks de réflexion ; les plugins d’outil doivent donc appeler cet assistant d’exécution au lieu d’importer ou de dupliquer les listes de fournisseurs.

    `normalizeThinkingLevel(...)` convertit un texte utilisateur comme `on`, `x-high` ou `extra high` vers le niveau stocké canonique avant de le vérifier par rapport à la politique résolue.

    Les **assistants de magasin de sessions** se trouvent sous `api.runtime.agent.session` :

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes de modèle et de fournisseur par défaut :

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Lancez et gérez les exécutions de sous-agents en arrière-plan.

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
    Les remplacements de modèle (`provider`/`model`) nécessitent l’adhésion explicite de l’opérateur via `plugins.entries.<id>.subagent.allowModelOverride: true` dans la configuration. Les plugins non approuvés peuvent toujours exécuter des sous-agents, mais les demandes de remplacement sont rejetées.
    </Warning>

    `deleteSession(...)` peut supprimer les sessions créées par le même plugin via `api.runtime.subagent.run(...)`. La suppression de sessions arbitraires d’utilisateur ou d’opérateur nécessite toujours une requête Gateway avec portée administrateur.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Listez les nœuds connectés et invoquez une commande hébergée par un nœud depuis le code de plugin chargé par le Gateway ou depuis les commandes CLI de plugin. Utilisez cela lorsqu’un plugin possède du travail local sur un appareil appairé, par exemple un pont navigateur ou audio sur un autre Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dans le Gateway, cette exécution est dans le processus. Dans les commandes CLI de plugin, elle appelle le Gateway configuré via RPC, afin que des commandes comme `openclaw googlemeet recover-tab` puissent inspecter les nœuds appairés depuis le terminal. Les commandes de nœud passent toujours par l’appairage de nœuds normal du Gateway, les listes d’autorisation de commandes, les politiques node-invoke de plugin et le traitement local des commandes par le nœud.

    Les plugins qui exposent des commandes dangereuses hébergées par un nœud doivent enregistrer une politique node-invoke avec `api.registerNodeInvokePolicy(...)`. La politique s’exécute dans le Gateway après les vérifications de liste d’autorisation de commandes et avant que la commande soit transmise au nœud, de sorte que les appels directs à `node.invoke` et les outils de plugin de niveau supérieur partagent le même chemin d’application.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Liez une exécution Task Flow à une clé de session OpenClaw existante ou à un contexte d’outil approuvé, puis créez et gérez des Task Flows sans passer de propriétaire à chaque appel.

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

    Utilisez `bindSession({ sessionKey, requesterOrigin })` lorsque vous disposez déjà d’une clé de session OpenClaw approuvée depuis votre propre couche de liaison. Ne liez pas depuis une saisie utilisateur brute.

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

    Utilise la configuration cœur `messages.tts` et la sélection de fournisseur. Renvoie un tampon audio PCM + la fréquence d’échantillonnage.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analyse d’image, d’audio et de vidéo.

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
    Recherche web.

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
    Instantané de la configuration d’exécution actuelle et écritures transactionnelles de configuration. Préférez
    la configuration qui a déjà été transmise au chemin d’appel actif ; utilisez
    `current()` uniquement lorsque le gestionnaire doit accéder directement à l’instantané du processus.

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
    qui enregistre l’intention du rédacteur sans retirer le contrôle du redémarrage au
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitaires au niveau système.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
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
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Les magasins clé-valeur survivent aux redémarrages et sont isolés par l’identifiant de Plugin lié à l’exécution. Limites : `maxEntries` par espace de noms, 1 000 lignes actives par Plugin, valeurs JSON inférieures à 64 Ko, et expiration TTL facultative.

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
    Assistants d’exécution propres aux canaux (disponibles lorsqu’un Plugin de canal est chargé).

    `api.runtime.channel.mentions` est la surface partagée de politique de mention entrante pour les Plugins de canal intégrés qui utilisent l’injection d’exécution :

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

Utilisez `createPluginRuntimeStore` pour stocker la référence d’exécution à utiliser en dehors du rappel `register` :

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
Préférez `pluginId` pour l’identité du magasin d’exécution. La forme de plus bas niveau `key` est destinée aux cas peu courants où un même Plugin a volontairement besoin de plusieurs emplacements d’exécution.
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
  Instantané de la configuration actuelle (instantané d’exécution actif en mémoire lorsqu’il est disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuration propre au Plugin depuis `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Journaliseur délimité (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration préalable à l’entrée complète.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Résout un chemin relatif à la racine du Plugin.
</ParamField>

## Connexe

- [Internals des Plugins](/fr/plugins/architecture) — modèle de capacités et registre
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry`
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence des sous-chemins
