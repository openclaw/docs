---
read_when:
    - Je moet kernhulpfuncties vanuit een Plugin aanroepen (TTS, STT, afbeeldingsgeneratie, webzoekfunctie, subagent, knooppunten)
    - Je wilt begrijpen wat api.runtime beschikbaar stelt
    - Je gebruikt configuratie-, agent- of mediahelpers vanuit Plugin-code
sidebarTitle: Runtime helpers
summary: api.runtime -- de geïnjecteerde runtimehelpers die beschikbaar zijn voor plugins
title: Plugin-runtimehulpfuncties
x-i18n:
    generated_at: "2026-05-11T20:43:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d94d9f69c51711800e557274299b0e84679deda4e48c743bf193b7f32fe8d71
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referentie voor het `api.runtime`-object dat tijdens registratie in elke plugin wordt geinjecteerd. Gebruik deze helpers in plaats van host-internals rechtstreeks te importeren.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/nl/plugins/sdk-channel-plugins">
    Stapsgewijze gids die deze helpers in context gebruikt voor kanaalplugins.
  </Card>
  <Card title="Provider plugins" href="/nl/plugins/sdk-provider-plugins">
    Stapsgewijze gids die deze helpers in context gebruikt voor providerplugins.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Config laden en schrijven

Geef de voorkeur aan config die al aan het actieve aanroeppad is doorgegeven, bijvoorbeeld `api.config` tijdens registratie of een `cfg`-argument op kanaal-/providercallbacks. Zo blijft er een processnapshot door het werk stromen in plaats van config opnieuw te parsen op hot paths.

Gebruik `api.runtime.config.current()` alleen wanneer een langlevende handler de huidige processnapshot nodig heeft en er geen config aan die functie is doorgegeven. De geretourneerde waarde is alleen-lezen; kloon deze of gebruik een mutatiehelper voordat je bewerkt.

Toolfactories ontvangen `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Gebruik de getter binnen de `execute`-callback van een langlevende tool wanneer config kan veranderen nadat de tooldefinitie is gemaakt.

Sla wijzigingen op met `api.runtime.config.mutateConfigFile(...)` of `api.runtime.config.replaceConfigFile(...)`. Elke schrijfactie moet een expliciet `afterWrite`-beleid kiezen:

- `afterWrite: { mode: "auto" }` laat de Gateway-herlaadplanner beslissen.
- `afterWrite: { mode: "restart", reason: "..." }` dwingt een schone herstart af wanneer de schrijver weet dat hot reload onveilig is.
- `afterWrite: { mode: "none", reason: "..." }` onderdrukt automatisch herladen/herstarten alleen wanneer de aanroeper de opvolging bezit.

De mutatiehelpers retourneren `afterWrite` plus een getypeerde `followUp`-samenvatting, zodat aanroepers kunnen loggen of testen of ze een herstart hebben aangevraagd. De Gateway blijft bepalen wanneer die herstart daadwerkelijk plaatsvindt.

`api.runtime.config.loadConfig()` en `api.runtime.config.writeConfigFile(...)` zijn verouderde compatibiliteitshelpers onder `runtime-config-load-write`. Ze waarschuwen eenmaal tijdens runtime en blijven beschikbaar voor oude externe plugins tijdens het migratievenster. Gebundelde plugins mogen ze niet gebruiken; de configgrensbewakers falen als plugincode ze aanroept of die helpers importeert uit Plugin SDK-subpaden.

Gebruik voor rechtstreekse SDK-imports de gerichte configsubpaden in plaats van de brede compatibiliteitsbarrel
`openclaw/plugin-sdk/config-runtime`: `config-contracts` voor
typen, `plugin-config-runtime` voor reeds geladen configasserties en plugin-
entrylookup, `runtime-config-snapshot` voor huidige processnapshots en
`config-mutation` voor schrijfoperaties. Tests van gebundelde plugins moeten deze gerichte
subpaden rechtstreeks mocken in plaats van de brede compatibiliteitsbarrel te mocken.

Interne OpenClaw-runtimecode volgt dezelfde richting: laad config eenmaal aan de CLI-, Gateway- of procesgrens en geef die waarde daarna door. Succesvolle mutatieschrijfacties vernieuwen de procesruntime-snapshot en verhogen de interne revisie; langlevende caches moeten sleutelen op de runtime-eigen cachesleutel in plaats van config lokaal te serialiseren. Langlevende runtimemodules hebben een zero-tolerance scanner voor omgevingsaanroepen naar `loadConfig()`; gebruik een doorgegeven `cfg`, een request-`context.getRuntimeConfig()` of `getRuntimeConfig()` aan een expliciete procesgrens.

Provider- en kanaaluitvoeringspaden moeten de actieve runtime-configsnapshot gebruiken, niet een bestandssnapshot die is geretourneerd voor configteruglezing of bewerking. Bestandssnapshots behouden bronwaarden zoals SecretRef-markeringen voor UI en schrijfoperaties; providercallbacks hebben de opgeloste runtimeweergave nodig. Wanneer een helper kan worden aangeroepen met de actieve bronsnapshot of de actieve runtime-snapshot, routeer dan via `selectApplicableRuntimeConfig()` voordat je credentials leest.

## Runtimenamespaces

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agentidentiteit, directories en sessiebeheer.

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

    `runEmbeddedAgent(...)` is de neutrale helper voor het starten van een normale OpenClaw-agentbeurt vanuit plugincode. Deze gebruikt dezelfde provider-/modelresolutie en agent-harnessselectie als kanaalgetriggerde antwoorden.

    `runEmbeddedPiAgent(...)` blijft beschikbaar als compatibiliteitsalias.

    `resolveThinkingPolicy(...)` retourneert de ondersteunde thinking-niveaus en optionele standaard van de provider/het model. Providerplugins beheren het modelspecifieke profiel via hun thinking-hooks, dus toolplugins moeten deze runtimehelper aanroepen in plaats van providerlijsten te importeren of te dupliceren.

    `normalizeThinkingLevel(...)` zet gebruikerstekst zoals `on`, `x-high` of `extra high` om naar het canonieke opgeslagen niveau voordat dit wordt gecontroleerd tegen het opgeloste beleid.

    **Sessieopslaghelpers** staan onder `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Geef de voorkeur aan `updateSessionStore(...)` of `updateSessionStoreEntry(...)` voor runtime-schrijfoperaties. Ze routeren via de sessieopslagschrijver die eigendom is van de Gateway, behouden gelijktijdige updates en hergebruiken de hot cache. `saveSessionStore(...)` blijft beschikbaar voor compatibiliteit en offline onderhoudsachtige herschrijfacties.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Standaardmodel- en providerconstanten:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Voer een tekstaanduiding uit die eigendom is van de host zonder providerinternals te importeren of
    OpenClaw-model-/auth-/basis-URL-voorbereiding te dupliceren.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    De helper gebruikt hetzelfde eenvoudige completion-voorbereidingspad als de ingebouwde
    runtime van OpenClaw en de runtime-configsnapshot die eigendom is van de host. Contextengines
    ontvangen een sessiegebonden `llm.complete`-capability, zodat modelaanroepen de
    agent van de actieve sessie gebruiken en niet stilzwijgend terugvallen op de standaardagent. Het
    resultaat bevat provider-/model-/agenttoeschrijving plus genormaliseerd token-,
    cache- en geschat kostengebruik wanneer beschikbaar.

    <Warning>
    Modeloverrides vereisen operator-opt-in via `plugins.entries.<id>.llm.allowModelOverride: true` in config. Gebruik `plugins.entries.<id>.llm.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-doelen. Cross-agent-completions vereisen `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Start en beheer subagent-runs op de achtergrond.

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
    Modeloverrides (`provider`/`model`) vereisen operator-opt-in via `plugins.entries.<id>.subagent.allowModelOverride: true` in config. Niet-vertrouwde plugins kunnen nog steeds subagents uitvoeren, maar overrideverzoeken worden geweigerd.
    </Warning>

    `deleteSession(...)` kan sessies verwijderen die door dezelfde plugin zijn gemaakt via `api.runtime.subagent.run(...)`. Het verwijderen van willekeurige gebruikers- of operatorsessies vereist nog steeds een admin-scoped Gateway-request.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Toon verbonden nodes en roep een node-hostcommando aan vanuit door de Gateway geladen plugincode of vanuit Plugin CLI-commando's. Gebruik dit wanneer een plugin lokaal werk bezit op een gekoppeld apparaat, bijvoorbeeld een browser- of audiobridge op een andere Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Binnen de Gateway draait deze runtime in-process. In Plugin CLI-commando's roept deze de geconfigureerde Gateway aan via RPC, zodat commando's zoals `openclaw googlemeet recover-tab` gekoppelde nodes vanuit de terminal kunnen inspecteren. Node-commando's lopen nog steeds via normale Gateway-nodekoppeling, commando-allowlists, plugin-node-invoke-beleid en node-lokale commandoafhandeling.

    Plugins die gevaarlijke node-hostcommando's blootstellen, moeten een node-invoke-beleid registreren met `api.registerNodeInvokePolicy(...)`. Het beleid draait in de Gateway na allowlistcontroles voor commando's en voordat het commando naar de node wordt doorgestuurd, zodat rechtstreekse `node.invoke`-aanroepen en hogere plugin-tools hetzelfde handhavingspad delen.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Bind een Task Flow-runtime aan een bestaande OpenClaw-sessiesleutel of vertrouwde toolcontext en maak en beheer daarna Task Flows zonder bij elke aanroep een eigenaar door te geven.

    Task Flow volgt duurzame workflowstatus over meerdere stappen. Het is geen planner:
    gebruik Cron of `api.session.workflow.scheduleSessionTurn(...)` voor toekomstige
    wakeups en gebruik daarna `managedFlows` vanuit de geplande beurt wanneer dat werk
    flowstatus, child-tasks, waits of annulering nodig heeft.

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

    Gebruik `bindSession({ sessionKey, requesterOrigin })` wanneer je al een vertrouwde OpenClaw-sessiesleutel hebt vanuit je eigen koppelingslaag. Koppel niet vanuit ruwe gebruikersinvoer.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Tekst-naar-spraaksynthese.

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

    Gebruikt de kernconfiguratie `messages.tts` en providerselectie. Retourneert PCM-audiobuffer + samplefrequentie.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analyse van afbeeldingen, audio en video.

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

    Retourneert `{ text: undefined }` wanneer er geen uitvoer wordt geproduceerd (bijvoorbeeld overgeslagen invoer).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` blijft bestaan als compatibiliteitsalias voor `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Afbeeldingen genereren.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Webzoekopdracht.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Laag-niveau mediahulpprogramma's.

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
    Huidige snapshot van de runtimeconfiguratie en transactionele configuratieschrijfbewerkingen. Geef de voorkeur aan
    configuratie die al aan het actieve aanroeppad is doorgegeven; gebruik
    `current()` alleen wanneer de handler de processnapshot direct nodig heeft.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` en `replaceConfigFile(...)` retourneren een `followUp`-
    waarde, bijvoorbeeld `{ mode: "restart", requiresRestart: true, reason }`,
    die de intentie van de schrijver vastlegt zonder de herstartcontrole van de
    Gateway over te nemen.

  </Accordion>
  <Accordion title="api.runtime.system">
    Systeemhulpprogramma's.

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
    Gebeurtenisabonnementen.

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
    Logboekregistratie.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Resolutie van model- en providerauthenticatie.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolutie van de statusmap en SQLite-ondersteunde opslag met sleutels.

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

    Opslagen met sleutels overleven herstarts en zijn geïsoleerd per runtime-gebonden Plugin-id. Gebruik `registerIfAbsent(...)` voor atomaire deduplicatieclaims: dit retourneert `true` wanneer de sleutel ontbrak of verlopen was en is geregistreerd, of `false` wanneer er al een live waarde bestaat zonder de waarde, aanmaaktijd of TTL te overschrijven. Limieten: `maxEntries` per naamruimte, 1.000 live rijen per Plugin, JSON-waarden onder 64 KB en optionele TTL-vervaldatum.

    <Warning>
    Alleen gebundelde plugins in deze release.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Geheugentoolfactories en CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Kanaalspecifieke runtimehelpers (beschikbaar wanneer een kanaalplugin is geladen).

    `api.runtime.channel.mentions` is het gedeelde oppervlak voor inkomend vermeldingsbeleid voor gebundelde kanaalplugins die runtime-injectie gebruiken:

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

    Beschikbare vermeldingshelpers:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` stelt bewust niet de oudere compatibiliteitshelpers `resolveMentionGating*` bloot. Geef de voorkeur aan het genormaliseerde pad `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Runtimeverwijzingen opslaan

Gebruik `createPluginRuntimeStore` om de runtimeverwijzing op te slaan voor gebruik buiten de callback `register`:

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
Geef de voorkeur aan `pluginId` voor de identiteit van de runtime-store. De vorm `key` op lager niveau is bedoeld voor ongebruikelijke gevallen waarin één plugin bewust meer dan één runtimeslot nodig heeft.
</Note>

## Andere top-level `api`-velden

Naast `api.runtime` biedt het API-object ook:

<ParamField path="api.id" type="string">
  Plugin-id.
</ParamField>
<ParamField path="api.name" type="string">
  Weergavenaam van de Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Huidige configuratie-snapshot (actieve runtime-snapshot in het geheugen indien beschikbaar).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Plugin-specifieke configuratie uit `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Scoped logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Huidige laadmodus; `"setup-runtime"` is het lichtgewicht opstart-/setupvenster vóór de volledige entry.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Los een pad op relatief aan de hoofdmap van de plugin.
</ParamField>

## Gerelateerd

- [Interne Plugin-werking](/nl/plugins/architecture) — mogelijkhedenmodel en register
- [SDK-entrypoints](/nl/plugins/sdk-entrypoints) — `definePluginEntry`-opties
- [SDK-overzicht](/nl/plugins/sdk-overview) — subpadreferentie
