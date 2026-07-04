---
read_when:
    - Je moet core-helpers aanroepen vanuit een Plugin (TTS, STT, afbeeldingsgeneratie, webzoekopdracht, subagent, nodes)
    - U wilt begrijpen wat api.runtime beschikbaar stelt
    - Je gebruikt configuratie-, agent- of mediahelpers vanuit Plugin-code
sidebarTitle: Runtime helpers
summary: api.runtime -- de geïnjecteerde runtimehelpers die beschikbaar zijn voor plugins
title: Plugin-runtimehelpers
x-i18n:
    generated_at: "2026-07-04T20:38:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referentie voor het `api.runtime`-object dat tijdens registratie in elke plugin wordt geinjecteerd. Gebruik deze helpers in plaats van host-internals rechtstreeks te importeren.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/nl/plugins/sdk-channel-plugins">
    Stapsgewijze handleiding die deze helpers in context gebruikt voor kanaalplugins.
  </Card>
  <Card title="Provider plugins" href="/nl/plugins/sdk-provider-plugins">
    Stapsgewijze handleiding die deze helpers in context gebruikt voor providerplugins.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Configuratie laden en schrijven

Geef de voorkeur aan configuratie die al is doorgegeven aan het actieve aanroeppad, bijvoorbeeld `api.config` tijdens registratie of een `cfg`-argument bij kanaal-/providercallbacks. Zo blijft er een processnapshot door het werk stromen in plaats van configuratie opnieuw te parsen op prestatiekritieke paden.

Gebruik `api.runtime.config.current()` alleen wanneer een langlevende handler de huidige processnapshot nodig heeft en er geen configuratie aan die functie is doorgegeven. De geretourneerde waarde is alleen-lezen; kloon deze of gebruik een mutatiehelper voordat je bewerkingen uitvoert.

Toolfactories ontvangen `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Gebruik de getter binnen de `execute`-callback van een langlevende tool wanneer configuratie kan wijzigen nadat de tooldefinitie is gemaakt.

Sla wijzigingen op met `api.runtime.config.mutateConfigFile(...)` of `api.runtime.config.replaceConfigFile(...)`. Elke schrijfactie moet een expliciet `afterWrite`-beleid kiezen:

- `afterWrite: { mode: "auto" }` laat de herlaadplanner van de Gateway beslissen.
- `afterWrite: { mode: "restart", reason: "..." }` forceert een schone herstart wanneer de schrijver weet dat hot reload onveilig is.
- `afterWrite: { mode: "none", reason: "..." }` onderdrukt automatisch herladen/herstarten alleen wanneer de aanroeper eigenaar is van de opvolging.

De mutatiehelpers retourneren `afterWrite` plus een getypte `followUp`-samenvatting, zodat aanroepers kunnen loggen of testen of ze een herstart hebben aangevraagd. De Gateway blijft eigenaar van wanneer die herstart daadwerkelijk plaatsvindt.

`api.runtime.config.loadConfig()` en `api.runtime.config.writeConfigFile(...)` zijn verouderde compatibiliteitshelpers onder `runtime-config-load-write`. Ze waarschuwen eenmalig tijdens runtime en blijven beschikbaar voor oude externe plugins tijdens het migratievenster. Gebundelde plugins mogen ze niet gebruiken; de configuratiegrensbewakers falen als plugincode ze aanroept of die helpers importeert vanuit subpaden van de plugin-SDK.

Gebruik voor rechtstreekse SDK-imports de gerichte configuratiesubpaden in plaats van de brede
`openclaw/plugin-sdk/config-runtime`-compatibiliteitsbarrel: `config-contracts` voor
typen, `plugin-config-runtime` voor assertions op al geladen configuratie en lookup van
plugin-entry's, `runtime-config-snapshot` voor huidige processnapshots, en
`config-mutation` voor schrijfacties. Tests voor gebundelde plugins moeten deze gerichte
subpaden rechtstreeks mocken in plaats van de brede compatibiliteitsbarrel te mocken.

Interne OpenClaw-runtimecode heeft dezelfde richting: laad configuratie eenmalig bij de CLI-, Gateway- of procesgrens, en geef die waarde daarna door. Geslaagde mutatieschrijfacties verversen de procesruntimesnapshot en verhogen de interne revisie; langlevende caches moeten de runtime-eigen cachesleutel gebruiken in plaats van configuratie lokaal te serialiseren. Langlevende runtimemodules hebben een nultolerantiescanner voor omgevingsaanroepen naar `loadConfig()`; gebruik een doorgegeven `cfg`, een request-`context.getRuntimeConfig()`, of `getRuntimeConfig()` aan een expliciete procesgrens.

Provider- en kanaaluitvoeringspaden moeten de actieve runtimeconfiguratiesnapshot gebruiken, niet een bestandssnapshot die is geretourneerd voor configuratieteruglezing of bewerking. Bestandssnapshots behouden bronwaarden zoals SecretRef-markeringen voor UI en schrijfacties; providercallbacks hebben de opgeloste runtimeweergave nodig. Wanneer een helper kan worden aangeroepen met de actieve bronsnapshot of de actieve runtimesnapshot, routeer dan via `selectApplicableRuntimeConfig()` voordat credentials worden gelezen.

## Herbruikbare runtimehulpprogramma's

Gebruik inkomende `botLoopProtection`-feiten voor door bots geschreven inkomende berichten. Core past de gedeelde in-memory sliding-window-bewaker toe voor sessieregistratie en dispatch, zonder het beleid aan een kanaal te koppelen. De bewaker volgt `(scopeId, conversationId, participant pair)`-sleutels, telt beide richtingen van een paar samen, past een cooldown toe zodra het vensterbudget is overschreden, en ruimt opportunistisch inactieve items op.

Kanaalplugins die dit gedrag aan operators blootstellen, moeten bij voorkeur de gedeelde `channels.defaults.botLoopProtection`-vorm gebruiken voor basisbudgetten, en daarbovenop kanaal-/providerspecifieke overrides leggen. De gedeelde configuratie gebruikt seconden omdat deze gebruikersgericht is:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Geef genormaliseerde botpaarfeiten door met de opgeloste beurt. Core lost standaarden, eenheidsconversie en `enabled`-semantiek op:

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
tweepartij-eventloops die niet via de gedeelde inkomende-antwoordrunner lopen.

## Runtime-namespaces

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

    `runEmbeddedAgent(...)` is de neutrale helper om een normale OpenClaw-agentbeurt vanuit plugincode te starten. Deze gebruikt dezelfde provider-/modelresolutie en agent-harnessselectie als door kanalen getriggerde antwoorden.

    `runEmbeddedPiAgent(...)` blijft bestaan als verouderde compatibiliteitsalias voor bestaande plugins. Nieuwe code moet `runEmbeddedAgent(...)` gebruiken.

    `resolveThinkingPolicy(...)` retourneert de door de provider/het model ondersteunde denkniveaus en een optionele standaardwaarde. Providerplugins zijn eigenaar van het modelspecifieke profiel via hun thinking-hooks, dus toolplugins moeten deze runtimehelper aanroepen in plaats van providerlijsten te importeren of te dupliceren.

    `normalizeThinkingLevel(...)` converteert gebruikerstekst zoals `on`, `x-high` of `extra high` naar het canonieke opgeslagen niveau voordat dit wordt gecontroleerd tegen het opgeloste beleid.

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

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    Geef de voorkeur aan `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` of `upsertSessionEntry(...)` voor sessieworkflows. Deze helpers adresseren sessies op basis van agent-/sessie-identiteit, zodat plugins niet afhankelijk zijn van de oude opslagvorm `sessions.json`. Gebruik `preserveActivity: true` voor patches die alleen metadata wijzigen en geen sessieactiviteit mogen verversen, en `replaceEntry: true` alleen wanneer de callback een volledig item retourneert en verwijderde velden verwijderd moeten blijven.

    Gebruik `runWithWorkAdmission(...)` wanneer een plugin werk start op een opgeslagen sessie. De callback wijst gearchiveerde of gelijktijdig vervangen sessies af, houdt archiveer-/reset-/verwijdermutaties gecoordineerd tot voltooiing, en ontvangt een `AbortSignal` dat moet worden doorgestuurd naar de agentrun.

    Importeer voor transcriptlees- en schrijfacties `openclaw/plugin-sdk/session-transcript-runtime` en gebruik `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` of `withSessionTranscriptWriteLock(...)` met `{ agentId, sessionKey, sessionId }`. Met deze API's kunnen plugins een transcript identificeren, de events ervan lezen, berichten toevoegen, updates publiceren en gerelateerde bewerkingen uitvoeren onder dezelfde transcriptschrijflock. Het doorgeven van `sessionFile`, het gebruik van `resolveSessionTranscriptLegacyFileTarget(...)`, of het importeren van low-level `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` uit `openclaw/plugin-sdk/agent-harness-runtime` is verouderd; die paden bestaan alleen voor legacycode die al een actief transcriptartefact ontvangt.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` en `resolveAndPersistSessionFile(...)` zijn verouderde compatibiliteitshelpers voor plugins die nog bewust afhankelijk zijn van de legacyvorm voor de volledige store of het transcriptbestand. Nieuwe plugincode mag die helpers niet gebruiken, en bestaande aanroepers moeten migreren naar entryhelpers en transcriptidentiteitshelpers.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Standaardmodel- en providerconstanten:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Voer een host-eigen tekstaanvulling uit zonder provider-internals te importeren of
    OpenClaw-model-/auth-/basis-URL-voorbereiding te dupliceren.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    De helper gebruikt hetzelfde eenvoudige-aanvullingsvoorbereidingspad als de
    ingebouwde runtime van OpenClaw en de host-eigen runtimeconfiguratiesnapshot. Contextengines
    ontvangen een sessiegebonden `llm.complete`-capability, zodat modelaanroepen de
    agent van de actieve sessie gebruiken en niet stilzwijgend terugvallen op de standaardagent. Het
    resultaat bevat provider-/model-/agenttoeschrijving plus genormaliseerd token-,
    cache- en geschat kostengebruik wanneer beschikbaar.

    <Warning>
    Modeloverschrijvingen vereisen opt-in door de operator via `plugins.entries.<id>.llm.allowModelOverride: true` in de config. Gebruik `plugins.entries.<id>.llm.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-doelen. Cross-agent completions vereisen `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    Modeloverschrijvingen (`provider`/`model`) vereisen opt-in door de operator via `plugins.entries.<id>.subagent.allowModelOverride: true` in de config. Niet-vertrouwde plugins kunnen nog steeds subagents uitvoeren, maar verzoeken om overschrijving worden geweigerd.
    </Warning>

    `deleteSession(...)` kan sessies verwijderen die door dezelfde plugin zijn aangemaakt via `api.runtime.subagent.run(...)`. Het verwijderen van willekeurige gebruikers- of operatorsessies vereist nog steeds een Gateway-verzoek met admin-scope.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Vermeld verbonden nodes en roep een opdracht op de node-host aan vanuit plugincode die door Gateway is geladen of vanuit Plugin CLI-opdrachten. Gebruik dit wanneer een plugin lokaal werk op een gekoppeld apparaat beheert, bijvoorbeeld een browser- of audiobridge op een andere Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Binnen de Gateway draait deze runtime in-process. In Plugin CLI-opdrachten roept deze de geconfigureerde Gateway via RPC aan, zodat opdrachten zoals `openclaw googlemeet recover-tab` gekoppelde nodes vanuit de terminal kunnen inspecteren. Node-opdrachten verlopen nog steeds via normale Gateway-nodekoppeling, allowlists voor opdrachten, pluginbeleid voor node-aanroepen en lokale opdrachtafhandeling op de node.

    Plugins die gevaarlijke node-hostopdrachten aanbieden, moeten een beleid voor node-aanroepen registreren met `api.registerNodeInvokePolicy(...)`. Het beleid draait in de Gateway na controles van de allowlist voor opdrachten en voordat de opdracht naar de node wordt doorgestuurd, zodat directe `node.invoke`-aanroepen en plugintools op hoger niveau hetzelfde handhavingspad delen.

    <Warning>
    Het optionele veld `scopes` vraagt Gateway-operatorscopes aan voor de aanroep. OpenClaw honoreert dit alleen voor gebundelde plugins en vertrouwde officiële plugininstallaties; verzoeken van andere plugins verhogen de rechten van de aanroep niet. Gebruik dit alleen wanneer een vertrouwde plugin een node-opdracht moet aanroepen met een strengere Gateway-scope, zoals `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Bind een Task Flow-runtime aan een bestaande OpenClaw-sessiesleutel of vertrouwde toolcontext, en maak en beheer vervolgens Task Flows zonder bij elke aanroep een eigenaar door te geven.

    Task Flow houdt duurzame workflowstatus met meerdere stappen bij. Het is geen scheduler:
    gebruik Cron of `api.session.workflow.scheduleSessionTurn(...)` voor toekomstige
    wake-ups, en gebruik daarna `managedFlows` vanuit de geplande beurt wanneer dat werk
    flowstatus, child-taken, waits of annulering nodig heeft.

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

    Gebruik `bindSession({ sessionKey, requesterOrigin })` wanneer je al een vertrouwde OpenClaw-sessiesleutel uit je eigen bindingslaag hebt. Bind niet vanuit ruwe gebruikersinvoer.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Tekst-naar-spraak-synthese.

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
    Huidige runtime-configsnapshot en transactionele configschrijfacties. Geef de voorkeur aan
    config die al aan het actieve aanroeppad is doorgegeven; gebruik
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
    die de intentie van de schrijver vastlegt zonder restartcontrole weg te nemen bij de
    gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Hulpprogramma's op systeemniveau.

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
    afkappingsaantallen, `code`, `signal`, `killed`, `termination` en
    `noOutputTimedOut`. Resultaten voor timeout en geen-output-timeout rapporteren `code: 124`
    wanneer het childproces geen niet-nul afsluitcode levert. Signaalafsluitingen
    zonder timeout kunnen nog steeds `code: null` retourneren, dus gebruik `termination` en
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
    Authenticatieresolutie voor modellen en providers.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Oplossing van de statusmap en SQLite-ondersteunde opslag met sleutels.

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

    Opslagplaatsen met sleutels overleven herstarts en zijn geïsoleerd door de runtime-gebonden Plugin-id. Gebruik `registerIfAbsent(...)` voor atomaire deduplicatieclaims: dit retourneert `true` wanneer de sleutel ontbrak of verlopen was en is geregistreerd, of `false` wanneer er al een actieve waarde bestaat zonder de waarde, aanmaaktijd of TTL te overschrijven. Limieten: `maxEntries` per namespace, 6.000 actieve rijen per Plugin, JSON-waarden kleiner dan 64 KB en optionele TTL-vervaldatum. Wanneer een schrijfactie de rijlimiet van de Plugin zou overschrijden, kan de runtime de oudste actieve rijen verwijderen uit de namespace waarnaar wordt geschreven; naastliggende namespaces worden niet voor die schrijfactie verwijderd, en de schrijfactie mislukt alsnog als de namespace niet genoeg rijen kan vrijmaken.

    <Warning>
    Alleen gebundelde plugins in deze release.
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
    Kanaalspecifieke runtime-helpers (beschikbaar wanneer een kanaalplugin is geladen).

    `api.runtime.channel.media` is het voorkeursoppervlak voor downloads en opslag van kanaalmedia:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Gebruik `saveRemoteMedia(...)` wanneer een externe URL OpenClaw-media moet worden. Gebruik `saveResponseMedia(...)` wanneer de plugin al een `Response` heeft opgehaald met plugin-eigen auth-, redirect- of allowlist-afhandeling. Gebruik `readRemoteMediaBuffer(...)` alleen wanneer de plugin ruwe bytes nodig heeft voor inspectie, transformaties, decryptie of opnieuw uploaden. `fetchRemoteMedia(...)` blijft een verouderde compatibiliteitsalias voor `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` is het gedeelde oppervlak voor beleid voor inkomende vermeldingen voor gebundelde kanaalplugins die runtime-injectie gebruiken:

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

    `api.runtime.channel.mentions` stelt bewust niet de oudere compatibiliteitshelpers `resolveMentionGating*` beschikbaar. Geef de voorkeur aan het genormaliseerde pad `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Runtime-referenties opslaan

Gebruik `createPluginRuntimeStore` om de runtime-referentie op te slaan voor gebruik buiten de callback `register`:

<Steps>
  <Step title="De opslag maken">
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
Geef de voorkeur aan `pluginId` voor de identiteit van de runtime-store. De lager-niveau vorm `key` is bedoeld voor ongebruikelijke gevallen waarin één plugin bewust meer dan één runtime-slot nodig heeft.
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
  Huidige configuratiesnapshot (actieve in-memory runtimesnapshot wanneer beschikbaar).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Pluginspecifieke configuratie uit `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Scoped logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/setupvenster vóór de volledige entry.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Los een pad op ten opzichte van de pluginroot.
</ParamField>

## Gerelateerd

- [Plugin-internals](/nl/plugins/architecture) — capaciteitsmodel en registry
- [SDK-entrypoints](/nl/plugins/sdk-entrypoints) — opties voor `definePluginEntry`
- [SDK-overzicht](/nl/plugins/sdk-overview) — subpadreferentie
