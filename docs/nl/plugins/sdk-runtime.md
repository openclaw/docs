---
read_when:
    - Je moet core-helpers aanroepen vanuit een plugin (TTS, STT, beeldgeneratie, zoeken op het web, subagent, knooppunten)
    - Je wilt begrijpen wat api.runtime beschikbaar stelt
    - Je gebruikt config-, agent- of mediahelpers vanuit plugincode
sidebarTitle: Runtime helpers
summary: api.runtime -- de geïnjecteerde runtime-helpers die beschikbaar zijn voor plugins
title: Plugin-runtimehelpers
x-i18n:
    generated_at: "2026-06-30T14:15:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referentie voor het `api.runtime`-object dat tijdens registratie in elke plugin wordt geïnjecteerd. Gebruik deze helpers in plaats van host-internals rechtstreeks te importeren.

<CardGroup cols={2}>
  <Card title="Kanaalplugins" href="/nl/plugins/sdk-channel-plugins">
    Stapsgewijze gids die deze helpers in context gebruikt voor kanaalplugins.
  </Card>
  <Card title="Providerplugins" href="/nl/plugins/sdk-provider-plugins">
    Stapsgewijze gids die deze helpers in context gebruikt voor providerplugins.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Configuratie laden en wegschrijven

Geef de voorkeur aan configuratie die al aan het actieve aanroeppad is doorgegeven, bijvoorbeeld `api.config` tijdens registratie of een `cfg`-argument op kanaal-/providercallbacks. Zo blijft er één processnapshot door het werk stromen in plaats van configuratie opnieuw te parsen op hot paths.

Gebruik `api.runtime.config.current()` alleen wanneer een langlevende handler de huidige processnapshot nodig heeft en er geen configuratie aan die functie is doorgegeven. De geretourneerde waarde is alleen-lezen; kloon deze of gebruik een mutatiehelper voordat je wijzigingen aanbrengt.

Tool factories ontvangen `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Gebruik de getter binnen de `execute`-callback van een langlevende tool wanneer configuratie kan wijzigen nadat de tooldefinitie is gemaakt.

Sla wijzigingen persistent op met `api.runtime.config.mutateConfigFile(...)` of `api.runtime.config.replaceConfigFile(...)`. Elke schrijfoperatie moet een expliciet `afterWrite`-beleid kiezen:

- `afterWrite: { mode: "auto" }` laat de Gateway-reloadplanner beslissen.
- `afterWrite: { mode: "restart", reason: "..." }` forceert een schone herstart wanneer de writer weet dat hot reload onveilig is.
- `afterWrite: { mode: "none", reason: "..." }` onderdrukt automatische reload/herstart alleen wanneer de aanroeper eigenaar is van de vervolgactie.

De mutatiehelpers retourneren `afterWrite` plus een getypte `followUp`-samenvatting, zodat aanroepers kunnen loggen of testen of ze een herstart hebben aangevraagd. De Gateway blijft bepalen wanneer die herstart daadwerkelijk plaatsvindt.

`api.runtime.config.loadConfig()` en `api.runtime.config.writeConfigFile(...)` zijn verouderde compatibiliteitshelpers onder `runtime-config-load-write`. Ze geven één keer een waarschuwing tijdens runtime en blijven beschikbaar voor oude externe plugins tijdens het migratievenster. Gebundelde plugins mogen ze niet gebruiken; de config-boundary guards falen als plugincode ze aanroept of die helpers importeert vanuit Plugin SDK-subpaden.

Gebruik voor directe SDK-imports de gerichte configuratiesubpaden in plaats van de brede
`openclaw/plugin-sdk/config-runtime`-compatibiliteitsbarrel: `config-contracts` voor
typen, `plugin-config-runtime` voor al geladen configuratieasserties en plugin-
entrylookup, `runtime-config-snapshot` voor huidige processnapshots, en
`config-mutation` voor schrijfoperaties. Tests voor gebundelde plugins moeten deze gerichte
subpaden rechtstreeks mocken in plaats van de brede compatibiliteitsbarrel te mocken.

Interne OpenClaw-runtimecode volgt dezelfde richting: laad configuratie één keer bij de CLI-, Gateway- of procesgrens en geef die waarde daarna door. Succesvolle mutatieschrijven verversen de procesruntime-snapshot en verhogen de interne revisie; langlevende caches moeten keyen op de runtime-eigen cache key in plaats van configuratie lokaal te serialiseren. Langlevende runtimemodules hebben een zero-tolerance-scanner voor ambient `loadConfig()`-aanroepen; gebruik een doorgegeven `cfg`, een request `context.getRuntimeConfig()`, of `getRuntimeConfig()` bij een expliciete procesgrens.

Provider- en kanaaluitvoeringspaden moeten de actieve runtime-configuratiesnapshot gebruiken, niet een bestandssnapshot die is geretourneerd voor configuratieteruglezing of bewerking. Bestandssnapshots behouden bronwaarden zoals SecretRef-markeringen voor UI en schrijfoperaties; providercallbacks hebben de opgeloste runtimeweergave nodig. Wanneer een helper kan worden aangeroepen met ofwel de actieve bronsnapshot ofwel de actieve runtimesnapshot, routeer dan via `selectApplicableRuntimeConfig()` voordat je referenties leest.

## Herbruikbare runtimehulpmiddelen

Gebruik binnenkomende `botLoopProtection`-feiten voor door bots geschreven binnenkomende berichten. Core past de gedeelde in-memory sliding-window guard toe vóór sessierecord en dispatch, zonder het beleid aan één kanaal te koppelen. De guard volgt `(scopeId, conversationId, participant pair)`-keys, telt beide richtingen van een paar samen, past een cooldown toe zodra het vensterbudget is overschreden, en ruimt inactieve entries opportunistisch op.

Kanaalplugins die dit gedrag aan operators beschikbaar maken, moeten bij voorkeur de gedeelde `channels.defaults.botLoopProtection`-vorm gebruiken voor basisbudgetten, en daarbovenop kanaal-/provider-specifieke overrides leggen. De gedeelde configuratie gebruikt seconden omdat deze gebruikersgericht is:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Geef genormaliseerde botpaarfeiten door met de opgeloste beurt. Core lost defaults, eenheidsconversie en `enabled`-semantiek op:

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

Gebruik `openclaw/plugin-sdk/pair-loop-guard-runtime` alleen rechtstreeks voor aangepaste
tweepartijen-eventloops die niet via de gedeelde binnenkomende reply runner lopen.

## Runtime-naamruimten

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agentidentiteit, mappen en sessiebeheer.

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

    `runEmbeddedAgent(...)` is de neutrale helper om een normale OpenClaw-agentbeurt te starten vanuit plugincode. Deze gebruikt dezelfde provider-/modeloplossing en agent-harnessselectie als door kanalen geactiveerde antwoorden.

    `runEmbeddedPiAgent(...)` blijft bestaan als verouderde compatibiliteitsalias voor bestaande plugins. Nieuwe code moet `runEmbeddedAgent(...)` gebruiken.

    `resolveThinkingPolicy(...)` retourneert de ondersteunde denkniveaus en optionele default van het provider/model. Providerplugins beheren het modelspecifieke profiel via hun thinking hooks, dus toolplugins moeten deze runtimehelper aanroepen in plaats van providerlijsten te importeren of te dupliceren.

    `normalizeThinkingLevel(...)` converteert gebruikerstekst zoals `on`, `x-high` of `extra high` naar het canonieke opgeslagen niveau voordat het wordt gecontroleerd tegen het opgeloste beleid.

    **Sessiestorehelpers** staan onder `api.runtime.agent.session`:

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

    Geef voor sessieworkflows de voorkeur aan `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` of `upsertSessionEntry(...)`. Deze helpers adresseren sessies via agent-/sessie-identiteit, zodat plugins niet afhankelijk zijn van de legacy `sessions.json`-opslagvorm. Gebruik `preserveActivity: true` voor patches met alleen metadata die sessieactiviteit niet moeten verversen, en `replaceEntry: true` alleen wanneer de callback een volledige entry retourneert en verwijderde velden verwijderd moeten blijven.

    Importeer voor transcriptlezingen en -schrijfoperaties `openclaw/plugin-sdk/session-transcript-runtime` en gebruik `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` of `withSessionTranscriptWriteLock(...)` met `{ agentId, sessionKey, sessionId }`. Met deze API's kunnen plugins een transcript identificeren, de events ervan lezen, berichten toevoegen, updates publiceren en gerelateerde bewerkingen uitvoeren onder dezelfde transcript-write lock. Het doorgeven van `sessionFile`, het gebruiken van `resolveSessionTranscriptLegacyFileTarget(...)`, of het importeren van low-level `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` uit `openclaw/plugin-sdk/agent-harness-runtime` is verouderd; die paden bestaan alleen voor legacycode die al een actief transcriptartefact ontvangt.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` en `resolveAndPersistSessionFile(...)` zijn verouderde compatibiliteitshelpers voor plugins die nog steeds bewust afhankelijk zijn van de legacy whole-store- of transcriptbestandvorm. Nieuwe plugincode mag die helpers niet gebruiken, en bestaande aanroepers moeten migreren naar entryhelpers en transcriptidentiteithelpers.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Standaardmodel- en providerconstanten:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Voer een door de host beheerde tekstaanvulling uit zonder provider-internals te importeren of
    OpenClaw-model-/auth-/basis-URL-voorbereiding te dupliceren.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    De helper gebruikt hetzelfde eenvoudige completion-voorbereidingspad als de
    ingebouwde runtime van OpenClaw en de host-eigen runtime-configuratiesnapshot. Context engines
    ontvangen een sessiegebonden `llm.complete`-capability, zodat modelaanroepen de
    agent van de actieve sessie gebruiken en niet stil terugvallen op de standaardagent. Het
    resultaat bevat provider-/model-/agenttoeschrijving plus genormaliseerd token-,
    cache- en geschat kostengebruik wanneer beschikbaar.

    <Warning>
    Modeloverrides vereisen opt-in door de operator via `plugins.entries.<id>.llm.allowModelOverride: true` in configuratie. Gebruik `plugins.entries.<id>.llm.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-targets. Cross-agent completions vereisen `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    Modeloverschrijvingen (`provider`/`model`) vereisen expliciete opt-in van de operator via `plugins.entries.<id>.subagent.allowModelOverride: true` in de configuratie. Niet-vertrouwde plugins kunnen nog steeds subagents uitvoeren, maar overschrijvingsverzoeken worden geweigerd.
    </Warning>

    `deleteSession(...)` kan sessies verwijderen die door dezelfde plugin zijn gemaakt via `api.runtime.subagent.run(...)`. Voor het verwijderen van willekeurige gebruikers- of operatorsessies is nog steeds een Gateway-verzoek met admin-scope vereist.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Geef verbonden nodes weer en roep een node-hostcommando aan vanuit door Gateway geladen plugincode of vanuit plugin-CLI-commando's. Gebruik dit wanneer een plugin lokaal werk op een gekoppeld apparaat beheert, bijvoorbeeld een browser- of audiobridge op een andere Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Binnen de Gateway draait deze runtime in-process. In plugin-CLI-commando's roept deze de geconfigureerde Gateway via RPC aan, zodat commando's zoals `openclaw googlemeet recover-tab` gekoppelde nodes vanuit de terminal kunnen inspecteren. Node-commando's lopen nog steeds via de normale Gateway-nodekoppeling, command allowlists, plugin node-invoke-beleid en node-lokale commandafhandeling.

    Plugins die gevaarlijke node-hostcommando's beschikbaar maken, moeten een node-invoke-beleid registreren met `api.registerNodeInvokePolicy(...)`. Het beleid draait in de Gateway na command allowlist-controles en voordat het commando naar de node wordt doorgestuurd, zodat directe `node.invoke`-aanroepen en hogere plugin-tools hetzelfde afdwingingspad delen.

    <Warning>
    Het optionele veld `scopes` vraagt Gateway-operatorscopes aan voor de aanroep. OpenClaw honoreert dit alleen voor gebundelde plugins en vertrouwde officiële plugininstallaties; verzoeken van andere plugins verhogen de bevoegdheden van de aanroep niet. Gebruik dit alleen wanneer een vertrouwde plugin een node-commando moet aanroepen met een striktere Gateway-scope, zoals `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Koppel een Task Flow-runtime aan een bestaande OpenClaw-sessiesleutel of vertrouwde toolcontext, en maak en beheer vervolgens Task Flows zonder bij elke aanroep een eigenaar door te geven.

    Task Flow houdt duurzame workflowstatus met meerdere stappen bij. Het is geen scheduler:
    gebruik Cron of `api.session.workflow.scheduleSessionTurn(...)` voor toekomstige
    wake-ups, en gebruik daarna `managedFlows` vanuit de geplande turn wanneer dat werk
    flowstatus, child tasks, waits of annulering nodig heeft.

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

    Gebruik `bindSession({ sessionKey, requesterOrigin })` wanneer je al een vertrouwde OpenClaw-sessiesleutel uit je eigen bindingslaag hebt. Bind niet op basis van ruwe gebruikersinvoer.

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

    Gebruikt de coreconfiguratie `messages.tts` en providerselectie. Retourneert PCM-audiobuffer + samplefrequentie.

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

    Retourneert `{ text: undefined }` wanneer er geen output wordt geproduceerd, bijvoorbeeld bij overgeslagen invoer.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` blijft beschikbaar als compatibiliteitsalias voor `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    Zoeken op het web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Low-level mediahulpprogramma's.

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
    Huidige snapshot van runtimeconfiguratie en transactionele configuratieschrijfacties. Geef de voorkeur aan
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
    die de intentie van de schrijver vastlegt zonder de restartcontrole bij de
    Gateway weg te nemen.

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

    `runCommandWithTimeout(...)` retourneert vastgelegde `stdout` en `stderr`, optionele
    truncatietellingen, `code`, `signal`, `killed`, `termination` en
    `noOutputTimedOut`. Resultaten voor timeout en no-output-timeout rapporteren `code: 124`
    wanneer het childproces geen niet-nul exitcode levert. Signaalafsluitingen zonder timeout
    kunnen nog steeds `code: null` retourneren, dus gebruik `termination` en
    `noOutputTimedOut` om timeoutredenen te onderscheiden.

  </Accordion>
  <Accordion title="api.runtime.events">
    Eventabonnementen.

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
    Logging.

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
    Resolutie van statusdirectory en SQLite-ondersteunde keyed storage.

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

    Stores met sleutels overleven herstarts en worden geïsoleerd door de runtime-gebonden Plugin-id. Gebruik `registerIfAbsent(...)` voor atomische dedupe-claims: dit retourneert `true` wanneer de sleutel ontbrak of verlopen was en is geregistreerd, of `false` wanneer er al een livewaarde bestaat zonder de waarde, aanmaaktijd of TTL te overschrijven. Limieten: `maxEntries` per namespace, 6.000 live rijen per Plugin, JSON-waarden onder 64 KB en optionele TTL-verval. Wanneer een schrijfactie de rijlimiet van de Plugin zou overschrijden, kan de runtime de oudste live rijen uit de namespace die wordt beschreven verwijderen; zuster-namespaces worden niet voor die schrijfactie verwijderd, en de schrijfactie mislukt alsnog als de namespace niet genoeg rijen kan vrijmaken.

    <Warning>
    Alleen gebundelde Plugins in deze release.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Fabrieken voor geheugentools en CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Kanaalspecifieke runtime-helpers (beschikbaar wanneer een kanaal-Plugin is geladen).

    `api.runtime.channel.media` is het voorkeursoppervlak voor downloads en opslag van kanaalmedia:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Gebruik `saveRemoteMedia(...)` wanneer een externe URL OpenClaw-media moet worden. Gebruik `saveResponseMedia(...)` wanneer de Plugin al een `Response` heeft opgehaald met door de Plugin beheerde auth-, redirect- of allowlist-afhandeling. Gebruik `readRemoteMediaBuffer(...)` alleen wanneer de Plugin ruwe bytes nodig heeft voor inspectie, transformaties, decryptie of opnieuw uploaden. `fetchRemoteMedia(...)` blijft een verouderde compatibiliteitsalias voor `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` is het gedeelde oppervlak voor inbound vermeldingsbeleid voor gebundelde kanaal-Plugins die runtime-injectie gebruiken:

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

    `api.runtime.channel.mentions` stelt de oudere compatibiliteitshelpers `resolveMentionGating*` bewust niet beschikbaar. Geef de voorkeur aan het genormaliseerde pad `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Runtime-referenties opslaan

Gebruik `createPluginRuntimeStore` om de runtime-referentie op te slaan voor gebruik buiten de callback `register`:

<Steps>
  <Step title="De store maken">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Koppelen aan het entrypoint">
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
  <Step title="Toegang vanuit andere bestanden">
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
Geef de voorkeur aan `pluginId` voor de runtime-store-identiteit. De lagere `key`-vorm is bedoeld voor ongebruikelijke gevallen waarin één Plugin bewust meer dan één runtime-slot nodig heeft.
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
  Huidige configuratiesnapshot (actieve in-memory runtime-snapshot wanneer beschikbaar).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Plugin-specifieke configuratie uit `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Scoped logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Huidige laadmodus; `"setup-runtime"` is het lichte startup/setup-venster vóór volledige invoer.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Los een pad op relatief aan de Plugin-root.
</ParamField>

## Gerelateerd

- [Plugin-internals](/nl/plugins/architecture) — capabilitymodel en registry
- [SDK-entrypoints](/nl/plugins/sdk-entrypoints) — opties voor `definePluginEntry`
- [SDK-overzicht](/nl/plugins/sdk-overview) — subpadreferentie
