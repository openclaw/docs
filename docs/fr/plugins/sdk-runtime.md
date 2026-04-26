---
read_when:
    - Vous devez appeler des assistants du cœur depuis un Plugin (TTS, STT, génération d’image, recherche web, sous-agent, nodes)
    - Vous souhaitez comprendre ce que `api.runtime` expose
    - Vous accédez depuis du code Plugin à des assistants de config, d’agent ou de média
sidebarTitle: Runtime helpers
summary: api.runtime — les assistants runtime injectés disponibles pour les Plugins
title: Assistants runtime de Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Référence pour l’objet `api.runtime` injecté dans chaque Plugin lors de l’enregistrement. Utilisez ces assistants au lieu d’importer directement des internes de l’hôte.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/fr/plugins/sdk-channel-plugins">
    Guide pas à pas qui utilise ces assistants dans leur contexte pour les Plugins de canal.
  </Card>
  <Card title="Plugins de fournisseur" href="/fr/plugins/sdk-provider-plugins">
    Guide pas à pas qui utilise ces assistants dans leur contexte pour les Plugins de fournisseur.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Espaces de noms runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identité de l’agent, répertoires et gestion des sessions.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

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

    `runEmbeddedAgent(...)` est l’assistant neutre pour démarrer un tour d’agent OpenClaw normal depuis du code Plugin. Il utilise la même résolution fournisseur/modèle et la même sélection de harness d’agent que les réponses déclenchées par canal.

    `runEmbeddedPiAgent(...)` reste disponible comme alias de compatibilité.

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
    Les substitutions de modèle (`provider`/`model`) nécessitent un opt-in opérateur via `plugins.entries.<id>.subagent.allowModelOverride: true` dans la config. Les Plugins non approuvés peuvent toujours exécuter des sous-agents, mais les demandes de substitution sont rejetées.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Lister les Node connectés et invoquer une commande node-host depuis du code Plugin chargé par le Gateway ou depuis des commandes CLI de Plugin. Utilisez cela lorsqu’un Plugin possède un travail local sur un appareil appairé, par exemple un pont navigateur ou audio sur un autre Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    À l’intérieur du Gateway, ce runtime est en processus. Dans les commandes CLI de Plugin, il appelle le Gateway configuré via RPC, de sorte que des commandes telles que `openclaw googlemeet recover-tab` peuvent inspecter les Node appairés depuis le terminal. Les commandes node passent toujours par l’appairage node normal du Gateway, les allowlists de commandes et la gestion locale des commandes du node.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Lier un runtime TaskFlow à une clé de session OpenClaw existante ou à un contexte d’outil approuvé, puis créer et gérer des TaskFlow sans transmettre un propriétaire à chaque appel.

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

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

    Utilisez `bindSession({ sessionKey, requesterOrigin })` lorsque vous avez déjà une clé de session OpenClaw approuvée issue de votre propre couche de liaison. Ne liez pas à partir d’une entrée utilisateur brute.

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

    Utilise la configuration centrale `messages.tts` et la sélection du fournisseur. Renvoie un tampon audio PCM + taux d’échantillonnage.

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
    ```

    Renvoie `{ text: undefined }` lorsqu’aucune sortie n’est produite (par ex. entrée ignorée).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité pour `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    Chargement et écriture de la config.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

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
    Résolution de l’authentification des modèles et fournisseurs.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Résolution du répertoire d’état.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

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
    Assistants runtime spécifiques au canal (disponibles lorsqu’un Plugin de canal est chargé).

    `api.runtime.channel.mentions` est la surface partagée de politique de mention entrante pour les Plugins de canal inclus qui utilisent l’injection runtime :

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

## Stocker des références runtime

Utilisez `createPluginRuntimeStore` pour stocker la référence runtime afin de l’utiliser en dehors du callback `register` :

<Steps>
  <Step title="Créer le store">
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
Préférez `pluginId` pour l’identité du runtime-store. La forme de plus bas niveau `key` est destinée aux cas peu courants où un même Plugin a intentionnellement besoin de plus d’un emplacement runtime.
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
  Instantané actuel de la config (instantané runtime en mémoire actif lorsqu’il est disponible).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Config spécifique au Plugin depuis `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger à portée (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Résoudre un chemin relatif à la racine du Plugin.
</ParamField>

## Lié

- [Internes des Plugins](/fr/plugins/architecture) — modèle de capacité et registre
- [Points d’entrée SDK](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry`
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence des sous-chemins
