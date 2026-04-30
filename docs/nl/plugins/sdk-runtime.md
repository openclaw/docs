---
read_when:
    - Je moet core-helpers aanroepen vanuit een Plugin (TTS, STT, beeldgeneratie, zoeken op het web, subagent, nodes)
    - Je wilt begrijpen wat api.runtime blootstelt
    - Je gebruikt configuratie-, agent- of mediahelpers vanuit Plugin-code
sidebarTitle: Runtime helpers
summary: api.runtime -- de geïnjecteerde runtimehelpers die beschikbaar zijn voor plugins
title: Plugin-runtimehulpfuncties
x-i18n:
    generated_at: "2026-04-30T09:40:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
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

## Configuratie Laden En Schrijven

Geef de voorkeur aan configuratie die al aan het actieve aanroeppad is doorgegeven, bijvoorbeeld `api.config` tijdens registratie of een `cfg`-argument op kanaal-/provider-callbacks. Zo blijft één processnapshot door het werk stromen in plaats van configuratie opnieuw te parsen op hot paths.

Gebruik `api.runtime.config.current()` alleen wanneer een langlevende handler de huidige processnapshot nodig heeft en er geen configuratie aan die functie is doorgegeven. De geretourneerde waarde is readonly; kloon deze of gebruik een mutatiehelper voordat je bewerkt.

Tool-factories ontvangen `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Gebruik de getter binnen de `execute`-callback van een langlevende tool wanneer configuratie kan veranderen nadat de tooldefinitie is aangemaakt.

Sla wijzigingen op met `api.runtime.config.mutateConfigFile(...)` of `api.runtime.config.replaceConfigFile(...)`. Elke schrijfactie moet een expliciet `afterWrite`-beleid kiezen:

- `afterWrite: { mode: "auto" }` laat de herlaadplanner van de Gateway beslissen.
- `afterWrite: { mode: "restart", reason: "..." }` dwingt een schone herstart af wanneer de writer weet dat hot reload onveilig is.
- `afterWrite: { mode: "none", reason: "..." }` onderdrukt automatisch herladen/herstarten alleen wanneer de caller eigenaar is van de opvolging.

De mutatiehelpers retourneren `afterWrite` plus een getypeerde `followUp`-samenvatting, zodat callers kunnen loggen of testen of ze een herstart hebben aangevraagd. De Gateway blijft bepalen wanneer die herstart daadwerkelijk plaatsvindt.

`api.runtime.config.loadConfig()` en `api.runtime.config.writeConfigFile(...)` zijn verouderde compatibiliteitshelpers onder `runtime-config-load-write`. Ze waarschuwen eenmaal tijdens runtime en blijven beschikbaar voor oude externe plugins tijdens het migratievenster. Gebundelde plugins mogen ze niet gebruiken; de configuratiegrenscontroles falen als plugincode ze aanroept of die helpers importeert uit plugin-SDK-subpaden.

Gebruik voor rechtstreekse SDK-imports de gerichte configuratiesubpaden in plaats van de brede compatibiliteitsbarrel
`openclaw/plugin-sdk/config-runtime`: `config-types` voor
types, `plugin-config-runtime` voor assertions op al geladen configuratie en het opzoeken van plugin-entry's, `runtime-config-snapshot` voor huidige processnapshots, en
`config-mutation` voor schrijfacties. Tests voor gebundelde plugins moeten deze gerichte
subpaden rechtstreeks mocken in plaats van de brede compatibiliteitsbarrel te mocken.

Interne runtimecode van OpenClaw volgt dezelfde richting: laad configuratie eenmaal aan de CLI-, Gateway- of procesgrens en geef die waarde daarna door. Succesvolle mutatieschrijfacties verversen de process-runtime-snapshot en verhogen de interne revisie; langlevende caches moeten zich baseren op de runtime-beheerde cachesleutel in plaats van configuratie lokaal te serialiseren. Langlevende runtimemodules hebben een zero-tolerance scanner voor ambient `loadConfig()`-aanroepen; gebruik een doorgegeven `cfg`, een request-`context.getRuntimeConfig()` of `getRuntimeConfig()` aan een expliciete procesgrens.

Uitvoeringspaden van providers en kanalen moeten de actieve runtime-configuratiesnapshot gebruiken, niet een bestandssnapshot die is geretourneerd voor het teruglezen of bewerken van configuratie. Bestandssnapshots behouden bronwaarden zoals SecretRef-markeringen voor UI en schrijfacties; provider-callbacks hebben de opgeloste runtimeweergave nodig. Wanneer een helper kan worden aangeroepen met de actieve bronsnapshot of de actieve runtimesnapshot, routeer dan via `selectApplicableRuntimeConfig()` voordat je credentials leest.

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

    `runEmbeddedAgent(...)` is de neutrale helper voor het starten van een normale OpenClaw-agentbeurt vanuit plugincode. Deze gebruikt dezelfde provider-/modelresolutie en agent-harnessselectie als door kanalen getriggerde antwoorden.

    `runEmbeddedPiAgent(...)` blijft beschikbaar als compatibiliteitsalias.

    `resolveThinkingPolicy(...)` retourneert de door de provider/het model ondersteunde denkniveaus en de optionele standaardwaarde. Providerplugins zijn eigenaar van het modelspecifieke profiel via hun thinking-hooks, dus toolplugins moeten deze runtimehelper aanroepen in plaats van providerlijsten te importeren of te dupliceren.

    `normalizeThinkingLevel(...)` zet gebruikerstekst zoals `on`, `x-high` of `extra high` om naar het canonieke opgeslagen niveau voordat dit wordt gecontroleerd tegen het opgeloste beleid.

    **Sessiestorehelpers** staan onder `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Standaardmodel- en providerconstanten:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Start en beheer subagentruns op de achtergrond.

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
    Modeloverrides (`provider`/`model`) vereisen operator-opt-in via `plugins.entries.<id>.subagent.allowModelOverride: true` in configuratie. Niet-vertrouwde plugins kunnen nog steeds subagents uitvoeren, maar override-verzoeken worden geweigerd.
    </Warning>

    `deleteSession(...)` kan sessies verwijderen die door dezelfde plugin zijn aangemaakt via `api.runtime.subagent.run(...)`. Het verwijderen van willekeurige gebruikers- of operatorsessies vereist nog steeds een admin-scoped Gateway-request.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Maak een lijst van verbonden nodes en roep een node-hostcommand aan vanuit door de Gateway geladen plugincode of vanuit plugin-CLI-commands. Gebruik dit wanneer een plugin eigenaar is van lokaal werk op een gekoppeld apparaat, bijvoorbeeld een browser- of audiobridge op een andere Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Binnen de Gateway draait deze runtime in-process. In plugin-CLI-commands roept deze de geconfigureerde Gateway aan via RPC, zodat commands zoals `openclaw googlemeet recover-tab` gekoppelde nodes vanuit de terminal kunnen inspecteren. Node-commands lopen nog steeds via normale Gateway-nodepairing, command-allowlists, plugin-node-invoke-beleid en node-lokale commandafhandeling.

    Plugins die gevaarlijke node-hostcommands blootstellen, moeten een node-invoke-beleid registreren met `api.registerNodeInvokePolicy(...)`. Het beleid draait in de Gateway na command-allowlistcontroles en voordat het command naar de node wordt doorgestuurd, zodat rechtstreekse `node.invoke`-aanroepen en hogere plugin-tools hetzelfde handhavingspad delen.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Bind een Task Flow-runtime aan een bestaande OpenClaw-sessiesleutel of vertrouwde toolcontext en maak en beheer vervolgens Task Flows zonder bij elke aanroep een eigenaar door te geven.

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

    Gebruik `bindSession({ sessionKey, requesterOrigin })` wanneer je al een vertrouwde OpenClaw-sessiesleutel hebt vanuit je eigen bindingslaag. Bind niet vanuit ruwe gebruikersinvoer.

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

    Gebruikt core-`messages.tts`-configuratie en providerselectie. Retourneert PCM-audiobuffer + samplefrequentie.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Beeld-, audio- en videoanalyse.

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

    Retourneert `{ text: undefined }` wanneer er geen uitvoer wordt geproduceerd (bijv. overgeslagen invoer).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` blijft als compatibiliteitsalias voor `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    Mediatools op laag niveau.

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
    Huidige momentopname van de runtimeconfiguratie en transactionele configuratieschrijfacties. Geef de voorkeur aan
    configuratie die al aan het actieve aanroeppad is doorgegeven; gebruik
    `current()` alleen wanneer de handler de procesmomentopname direct nodig heeft.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` en `replaceConfigFile(...)` retourneren een `followUp`
    waarde, bijvoorbeeld `{ mode: "restart", requiresRestart: true, reason }`,
    die de intentie van de schrijver vastlegt zonder de herstartcontrole over te nemen van de
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Hulpprogramma's op systeemniveau.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
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
    Logging.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Authenticatieresolutie voor model en provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolutie van de statusmap en door SQLite ondersteunde sleutelopslag.

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

    Sleutelopslagen overleven herstarts en zijn geïsoleerd op basis van de runtime-gebonden plugin-id. Limieten: `maxEntries` per namespace, 1.000 live rijen per plugin, JSON-waarden onder 64 KB en optioneel TTL-verloop.

    <Warning>
    Alleen gebundelde plugins in deze release.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Factory's voor geheugentools en CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Kanaalspecifieke runtimehelpers (beschikbaar wanneer een kanaalplugin is geladen).

    `api.runtime.channel.mentions` is het gedeelde inbound vermeldingbeleid-oppervlak voor gebundelde kanaalplugins die runtime-injectie gebruiken:

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

    Beschikbare vermeldinghelpers:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` stelt de oudere `resolveMentionGating*`-compatibiliteitshelpers bewust niet beschikbaar. Geef de voorkeur aan het genormaliseerde `{ facts, policy }`-pad.

  </Accordion>
</AccordionGroup>

## Runtimeverwijzingen opslaan

Gebruik `createPluginRuntimeStore` om de runtimeverwijzing op te slaan voor gebruik buiten de `register`-callback:

<Steps>
  <Step title="De store aanmaken">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="In het toegangspunt aansluiten">
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
Geef de voorkeur aan `pluginId` voor de identiteit van de runtime-store. De lager-niveau `key`-vorm is bedoeld voor zeldzame gevallen waarin één plugin bewust meer dan één runtimeslot nodig heeft.
</Note>

## Andere `api`-velden op topniveau

Naast `api.runtime` biedt het API-object ook:

<ParamField path="api.id" type="string">
  Plugin-id.
</ParamField>
<ParamField path="api.name" type="string">
  Weergavenaam van de plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Huidige configuratiemomentopname (actieve runtime-momentopname in het geheugen wanneer beschikbaar).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Plugin-specifieke configuratie uit `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Gescopeerde logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Huidige laadmodus; `"setup-runtime"` is het lichte opstart-/installatievenster voorafgaand aan de volledige entry.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Los een pad op relatief aan de pluginroot.
</ParamField>

## Gerelateerd

- [Plugin-internals](/nl/plugins/architecture) — capaciteitsmodel en register
- [SDK-toegangspunten](/nl/plugins/sdk-entrypoints) — `definePluginEntry`-opties
- [SDK-overzicht](/nl/plugins/sdk-overview) — subpadreferentie
