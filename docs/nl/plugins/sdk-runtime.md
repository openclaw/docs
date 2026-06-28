---
read_when:
    - Je moet core-helpers aanroepen vanuit een plugin (TTS, STT, afbeeldingsgeneratie, webzoekopdracht, subagent, nodes)
    - Je wilt begrijpen wat api.runtime beschikbaar stelt
    - Je opent configuratie-, agent- of mediahelpers vanuit Plugincode
sidebarTitle: Runtime helpers
summary: api.runtime -- de geïnjecteerde runtime-helpers die beschikbaar zijn voor plugins
title: Plugin-runtimehelpers
x-i18n:
    generated_at: "2026-06-28T20:44:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
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

## Configuratie laden en schrijven

Geef de voorkeur aan configuratie die al aan het actieve aanroeppad is doorgegeven, bijvoorbeeld `api.config` tijdens registratie of een `cfg`-argument op channel/provider-callbacks. Zo stroomt één processnapshot door het werk in plaats van configuratie opnieuw te parsen op hot paths.

Gebruik `api.runtime.config.current()` alleen wanneer een langlevende handler de huidige processnapshot nodig heeft en er geen configuratie aan die functie is doorgegeven. De geretourneerde waarde is alleen-lezen; kloon deze of gebruik een mutatiehelper voordat je bewerkingen uitvoert.

Toolfactories ontvangen `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Gebruik de getter binnen de `execute`-callback van een langlevende tool wanneer configuratie kan veranderen nadat de tooldefinitie is gemaakt.

Sla wijzigingen op met `api.runtime.config.mutateConfigFile(...)` of `api.runtime.config.replaceConfigFile(...)`. Elke schrijfactie moet een expliciet `afterWrite`-beleid kiezen:

- `afterWrite: { mode: "auto" }` laat de Gateway-herlaadplanner beslissen.
- `afterWrite: { mode: "restart", reason: "..." }` dwingt een schone herstart af wanneer de schrijver weet dat hot reload onveilig is.
- `afterWrite: { mode: "none", reason: "..." }` onderdrukt automatisch herladen/herstarten alleen wanneer de aanroeper eigenaar is van de follow-up.

De mutatiehelpers retourneren `afterWrite` plus een getypeerde `followUp`-samenvatting, zodat aanroepers kunnen loggen of testen of ze een herstart hebben aangevraagd. De Gateway blijft bepalen wanneer die herstart daadwerkelijk plaatsvindt.

`api.runtime.config.loadConfig()` en `api.runtime.config.writeConfigFile(...)` zijn verouderde compatibiliteitshelpers onder `runtime-config-load-write`. Ze waarschuwen één keer tijdens runtime en blijven beschikbaar voor oude externe plugins tijdens het migratievenster. Gebundelde plugins mogen ze niet gebruiken; de configuratiegrenscontroles falen als plugincode ze aanroept of die helpers importeert vanuit subpaden van de plugin-SDK.

Voor directe SDK-imports gebruik je de gerichte configuratiesubpaden in plaats van de brede compatibiliteitsbarrel
`openclaw/plugin-sdk/config-runtime`: `config-contracts` voor
typen, `plugin-config-runtime` voor assertions op al geladen configuratie en het opzoeken van plugin-entry's, `runtime-config-snapshot` voor huidige processnapshots, en
`config-mutation` voor schrijfoperaties. Tests voor gebundelde plugins moeten deze gerichte
subpaden rechtstreeks mocken in plaats van de brede compatibiliteitsbarrel te mocken.

Interne OpenClaw-runtimecode volgt dezelfde richting: laad configuratie één keer aan de CLI-, Gateway- of procesgrens en geef die waarde daarna door. Succesvolle mutatieschrijfacties verversen de processruntime-snapshot en verhogen de interne revisie ervan; langlevende caches moeten baseren op de runtime-eigen cachesleutel in plaats van configuratie lokaal te serialiseren. Langlevende runtimemodules hebben een nultolerantiescanner voor omgevingsaanroepen naar `loadConfig()`; gebruik een doorgegeven `cfg`, een request-`context.getRuntimeConfig()`, of `getRuntimeConfig()` aan een expliciete procesgrens.

Provider- en kanaaluitvoeringspaden moeten de actieve runtimeconfiguratiesnapshot gebruiken, niet een bestandssnapshot die is geretourneerd voor configuratie-teruglezing of bewerking. Bestandssnapshots behouden bronwaarden zoals SecretRef-markers voor UI en schrijfoperaties; provider-callbacks hebben de opgeloste runtimeweergave nodig. Wanneer een helper kan worden aangeroepen met de actieve bronsnapshot of de actieve runtimesnapshot, routeer dan via `selectApplicableRuntimeConfig()` voordat je credentials leest.

## Herbruikbare runtimehulpmiddelen

Gebruik binnenkomende `botLoopProtection`-feiten voor door bots geschreven inkomende berichten. Core past de gedeelde in-memory sliding-window-guard toe vóór sessierecord en dispatch, zonder het beleid aan één kanaal te koppelen. De guard volgt `(scopeId, conversationId, participant pair)`-sleutels, telt beide richtingen van een paar samen, past een cooldown toe zodra het windowbudget is overschreden en ruimt inactieve entries opportunistisch op.

Kanaalplugins die dit gedrag aan operators blootstellen, moeten de gedeelde `channels.defaults.botLoopProtection`-vorm gebruiken voor baselinebudgetten en daarbovenop kanaal-/providerspecifieke overrides plaatsen. De gedeelde configuratie gebruikt seconden omdat deze gebruikersgericht is:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Geef genormaliseerde bot-pair-feiten mee met de opgeloste turn. Core lost defaults, eenheidsconversie en `enabled`-semantiek op:

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

Gebruik `openclaw/plugin-sdk/pair-loop-guard-runtime` rechtstreeks alleen voor aangepaste
two-party-eventloops die niet via de gedeelde inbound reply runner gaan.

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

    `runEmbeddedAgent(...)` is de neutrale helper om vanuit plugincode een normale OpenClaw-agentturn te starten. Deze gebruikt dezelfde provider-/modelresolutie en agent-harnessselectie als door kanalen getriggerde antwoorden.

    `runEmbeddedPiAgent(...)` blijft bestaan als verouderde compatibiliteitsalias voor bestaande plugins. Nieuwe code moet `runEmbeddedAgent(...)` gebruiken.

    `resolveThinkingPolicy(...)` retourneert de ondersteunde denkniveaus van het provider/model en een optionele default. Providerplugins zijn eigenaar van het modelspecifieke profiel via hun thinking hooks, dus toolplugins moeten deze runtimehelper aanroepen in plaats van providerlijsten te importeren of te dupliceren.

    `normalizeThinkingLevel(...)` converteert gebruikerstekst zoals `on`, `x-high` of `extra high` naar het canonieke opgeslagen niveau voordat het tegen het opgeloste beleid wordt gecontroleerd.

    **Sessie-storehelpers** staan onder `api.runtime.agent.session`:

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

    Geef voor sessieworkflows de voorkeur aan `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` of `upsertSessionEntry(...)`. Deze helpers adresseren sessies via agent-/sessie-identiteit, zodat plugins niet afhankelijk zijn van de verouderde opslagvorm `sessions.json`. Gebruik `preserveActivity: true` voor metadata-only patches die sessieactiviteit niet mogen verversen, en `replaceEntry: true` alleen wanneer de callback een volledige entry retourneert en verwijderde velden verwijderd moeten blijven.

    Voor transcriptlees- en schrijfacties importeer je `openclaw/plugin-sdk/session-transcript-runtime` en gebruik je `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` of `withSessionTranscriptWriteLock(...)` met `{ agentId, sessionKey, sessionId }`. Met deze API's kunnen plugins een transcript identificeren, events ervan lezen, berichten toevoegen, updates publiceren en gerelateerde bewerkingen uitvoeren onder dezelfde transcript-schrijfvergrendeling. Het doorgeven van `sessionFile`, het gebruik van `resolveSessionTranscriptLegacyFileTarget(...)`, of het importeren van low-level `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` uit `openclaw/plugin-sdk/agent-harness-runtime` is verouderd; die paden bestaan alleen voor legacycode die al een actief transcriptartefact ontvangt.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` en `resolveAndPersistSessionFile(...)` zijn verouderde compatibiliteitshelpers voor plugins die nog steeds bewust afhankelijk zijn van de verouderde whole-store- of transcript-file-vorm. Nieuwe plugincode mag deze helpers niet gebruiken, en bestaande aanroepers moeten migreren naar entryhelpers en transcriptidentiteithelpers.

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
    de voorbereiding van OpenClaw-model/auth/base-URL te dupliceren.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    De helper gebruikt hetzelfde voorbereidingspad voor eenvoudige aanvullingen als de
    ingebouwde runtime van OpenClaw en de host-eigen runtimeconfiguratiesnapshot. Context-engines
    ontvangen een sessiegebonden `llm.complete`-capability, zodat modelaanroepen de
    agent van de actieve sessie gebruiken en niet stilzwijgend terugvallen op de standaardagent. Het
    resultaat bevat provider-/model-/agentattributie plus genormaliseerd token-,
    cache- en geschat kostengebruik wanneer beschikbaar.

    <Warning>
    Modeloverrides vereisen opt-in door de operator via `plugins.entries.<id>.llm.allowModelOverride: true` in configuratie. Gebruik `plugins.entries.<id>.llm.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-doelen. Cross-agent-aanvullingen vereisen `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Start en beheer achtergrondruns van subagenten.

    ```typescript
    // Start een subagent-run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optionele override
      model: "gpt-4.1-mini", // optionele override
      deliver: false,
    });

    // Wacht op voltooiing
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Lees sessieberichten
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Verwijder een sessie
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Model-overrides (`provider`/`model`) vereisen opt-in door de operator via `plugins.entries.<id>.subagent.allowModelOverride: true` in de configuratie. Niet-vertrouwde plugins kunnen nog steeds subagents uitvoeren, maar override-verzoeken worden geweigerd.
    </Warning>

    `deleteSession(...)` kan sessies verwijderen die door dezelfde plugin zijn gemaakt via `api.runtime.subagent.run(...)`. Het verwijderen van willekeurige gebruikers- of operatorsessies vereist nog steeds een Gateway-verzoek met admin-scope.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Toon verbonden nodes en roep een node-host-opdracht aan vanuit door Gateway geladen plugincode of vanuit plugin-CLI-opdrachten. Gebruik dit wanneer een plugin lokaal werk op een gekoppeld apparaat beheert, bijvoorbeeld een browser- of audiobridge op een andere Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Binnen de Gateway draait deze runtime in-process. In plugin-CLI-opdrachten roept deze de geconfigureerde Gateway aan via RPC, zodat opdrachten zoals `openclaw googlemeet recover-tab` gekoppelde nodes vanuit de terminal kunnen inspecteren. Node-opdrachten lopen nog steeds via normale Gateway-nodekoppeling, opdracht-allowlists, pluginbeleid voor node-aanroepen en node-lokale opdrachtafhandeling.

    Plugins die gevaarlijke node-host-opdrachten blootstellen, moeten een node-aanroepbeleid registreren met `api.registerNodeInvokePolicy(...)`. Het beleid wordt uitgevoerd in de Gateway na opdracht-allowlist-controles en voordat de opdracht naar de node wordt doorgestuurd, zodat directe `node.invoke`-aanroepen en pluginhulpmiddelen op hoger niveau hetzelfde handhavingspad delen.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Bind een Task Flow-runtime aan een bestaande OpenClaw-sessiesleutel of vertrouwde toolcontext, en maak en beheer vervolgens Task Flows zonder bij elke aanroep een eigenaar door te geven.

    Task Flow houdt duurzame workflowstatus met meerdere stappen bij. Het is geen planner:
    gebruik Cron of `api.session.workflow.scheduleSessionTurn(...)` voor toekomstige
    wake-ups en gebruik daarna `managedFlows` vanuit de geplande beurt wanneer dat werk
    flowstatus, child tasks, wachttijden of annulering nodig heeft.

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
    // Standaard-TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Voor telefonie geoptimaliseerde TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Toon beschikbare stemmen
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
    // Beschrijf een afbeelding
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribeer audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optioneel, wanneer MIME niet kan worden afgeleid
    });

    // Beschrijf een video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generieke bestandsanalyse
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Gestructureerde afbeeldingsextractie via een specifieke provider/model.
    // Neem ten minste één afbeelding op; tekstinvoer is aanvullende context.
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

    Retourneert `{ text: undefined }` wanneer er geen uitvoer wordt geproduceerd (bijv. overgeslagen invoer).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` blijft bestaan als compatibiliteitsalias voor `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Afbeeldingsgeneratie.

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
    Low-level mediahulpmiddelen.

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
    `current()` alleen wanneer de handler de processnapshot rechtstreeks nodig heeft.

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
    die de intentie van de schrijver vastlegt zonder restart-controle weg te nemen bij de
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Systeemhulpmiddelen.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Verouderde compatibiliteitsalias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runCommandWithTimeout(...)` retourneert vastgelegde `stdout` en `stderr`, optionele
    aantallen truncaties, `code`, `signal`, `killed`, `termination` en
    `noOutputTimedOut`. Resultaten van time-out en geen-uitvoer-time-out rapporteren `code: 124`
    wanneer het childproces geen niet-nul-exitcode levert. Signaalafsluitingen zonder time-out
    kunnen nog steeds `code: null` retourneren, dus gebruik `termination` en
    `noOutputTimedOut` om time-outredenen te onderscheiden.

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
    Model- en providerauthenticatieresolutie.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolutie van statusdirectory en door SQLite ondersteunde keyed storage.

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

    Keyed stores overleven herstarts en zijn geisoleerd op basis van de plugin-id die aan de runtime is gebonden. Gebruik `registerIfAbsent(...)` voor atomische deduplicatieclaims: dit retourneert `true` wanneer de sleutel ontbrak of was verlopen en is geregistreerd, of `false` wanneer er al een live waarde bestaat zonder de waarde, aanmaaktijd of TTL te overschrijven. Limieten: `maxEntries` per namespace, 6.000 live rijen per plugin, JSON-waarden onder 64 KB, en optionele TTL-vervaldatum. Wanneer een schrijfactie de rijlimiet van de plugin zou overschrijden, kan de runtime de oudste live rijen verwijderen uit de namespace waarnaar wordt geschreven; zuster-namespaces worden voor die schrijfactie niet verwijderd, en de schrijfactie mislukt nog steeds als de namespace niet genoeg rijen kan vrijmaken.

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

    Gebruik `saveRemoteMedia(...)` wanneer een externe URL OpenClaw-media moet worden. Gebruik `saveResponseMedia(...)` wanneer de plugin al een `Response` heeft opgehaald met door de plugin beheerde auth-, redirect- of allowlist-afhandeling. Gebruik `readRemoteMediaBuffer(...)` alleen wanneer de plugin ruwe bytes nodig heeft voor inspectie, transformaties, decryptie of opnieuw uploaden. `fetchRemoteMedia(...)` blijft een verouderde compatibiliteitsalias voor `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` is het gedeelde inkomende oppervlak voor mention-beleid voor gebundelde kanaalplugins die runtime-injectie gebruiken:

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

    Beschikbare mention-helpers:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` stelt de oudere compatibiliteitshelpers `resolveMentionGating*` bewust niet beschikbaar. Geef de voorkeur aan het genormaliseerde `{ facts, policy }`-pad.

  </Accordion>
</AccordionGroup>

## Runtime-referenties opslaan

Gebruik `createPluginRuntimeStore` om de runtime-referentie op te slaan voor gebruik buiten de `register`-callback:

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
Geef de voorkeur aan `pluginId` voor de identiteit van de runtime-store. De vorm op lager niveau, `key`, is bedoeld voor ongebruikelijke gevallen waarin een plugin bewust meer dan een runtimeslot nodig heeft.
</Note>

## Andere top-level `api`-velden

Naast `api.runtime` biedt het API-object ook:

<ParamField path="api.id" type="string">
  Plugin-id.
</ParamField>
<ParamField path="api.name" type="string">
  Weergavenaam van de plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Huidige config-snapshot (actieve in-memory runtime-snapshot wanneer beschikbaar).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Plugin-specifieke config uit `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Scoped logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/setupvenster voorafgaand aan de volledige entry.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Los een pad op relatief aan de plugin-root.
</ParamField>

## Gerelateerd

- [Plugin-internals](/nl/plugins/architecture) — capability-model en registry
- [SDK-entrypoints](/nl/plugins/sdk-entrypoints) — `definePluginEntry`-opties
- [SDK-overzicht](/nl/plugins/sdk-overview) — subpadreferentie
