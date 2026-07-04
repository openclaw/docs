---
read_when:
    - Sie müssen Core-Helfer aus einem Plugin aufrufen (TTS, STT, Bildgenerierung, Websuche, Subagent, Nodes)
    - Sie möchten verstehen, was api.runtime bereitstellt
    - Sie greifen aus Plugin-Code auf Konfigurations-, Agent- oder Medien-Helfer zu
sidebarTitle: Runtime helpers
summary: api.runtime -- die injizierten Runtime-Hilfsfunktionen, die Plugins zur Verfügung stehen
title: Plugin-Runtime-Helfer
x-i18n:
    generated_at: "2026-07-04T20:29:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referenz für das `api.runtime`-Objekt, das während der Registrierung in jedes Plugin injiziert wird. Verwenden Sie diese Hilfsfunktionen, statt Host-Interna direkt zu importieren.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/de/plugins/sdk-channel-plugins">
    Schritt-für-Schritt-Anleitung, die diese Hilfsfunktionen im Kontext für Channel-Plugins verwendet.
  </Card>
  <Card title="Provider plugins" href="/de/plugins/sdk-provider-plugins">
    Schritt-für-Schritt-Anleitung, die diese Hilfsfunktionen im Kontext für Provider-Plugins verwendet.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Laden und Schreiben der Konfiguration

Bevorzugen Sie Konfiguration, die bereits an den aktiven Aufrufpfad übergeben wurde, zum Beispiel `api.config` während der Registrierung oder ein `cfg`-Argument in Channel-/Provider-Callbacks. So fließt ein Prozess-Snapshot durch die Arbeit, statt Konfiguration auf Hot Paths erneut zu parsen.

Verwenden Sie `api.runtime.config.current()` nur, wenn ein langlebiger Handler den aktuellen Prozess-Snapshot benötigt und keine Konfiguration an diese Funktion übergeben wurde. Der zurückgegebene Wert ist schreibgeschützt; klonen Sie ihn oder verwenden Sie vor dem Bearbeiten eine Mutations-Hilfsfunktion.

Tool-Factories erhalten `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Verwenden Sie den Getter innerhalb des `execute`-Callbacks eines langlebigen Tools, wenn sich die Konfiguration ändern kann, nachdem die Tool-Definition erstellt wurde.

Persistieren Sie Änderungen mit `api.runtime.config.mutateConfigFile(...)` oder `api.runtime.config.replaceConfigFile(...)`. Jeder Schreibvorgang muss eine explizite `afterWrite`-Policy wählen:

- `afterWrite: { mode: "auto" }` überlässt die Entscheidung dem Reload-Planer des Gateway.
- `afterWrite: { mode: "restart", reason: "..." }` erzwingt einen sauberen Neustart, wenn der Schreiber weiß, dass Hot Reload unsicher ist.
- `afterWrite: { mode: "none", reason: "..." }` unterdrückt automatischen Reload/Neustart nur, wenn der Aufrufer die Nachbearbeitung besitzt.

Die Mutations-Hilfsfunktionen geben `afterWrite` plus eine typisierte `followUp`-Zusammenfassung zurück, damit Aufrufer protokollieren oder testen können, ob sie einen Neustart angefordert haben. Das Gateway besitzt weiterhin die Entscheidung, wann dieser Neustart tatsächlich erfolgt.

`api.runtime.config.loadConfig()` und `api.runtime.config.writeConfigFile(...)` sind veraltete Kompatibilitäts-Hilfsfunktionen unter `runtime-config-load-write`. Sie warnen einmal zur Laufzeit und bleiben für alte externe Plugins während des Migrationsfensters verfügbar. Gebündelte Plugins dürfen sie nicht verwenden; die Config-Boundary-Guards schlagen fehl, wenn Plugin-Code sie aufruft oder diese Hilfsfunktionen aus Plugin-SDK-Unterpfaden importiert.

Verwenden Sie für direkte SDK-Importe die fokussierten Konfigurations-Unterpfade statt des breiten
`openclaw/plugin-sdk/config-runtime`-Kompatibilitäts-Barrels: `config-contracts` für
Typen, `plugin-config-runtime` für Assertions zu bereits geladener Konfiguration und Plugin-
Entry-Lookup, `runtime-config-snapshot` für aktuelle Prozess-Snapshots und
`config-mutation` für Schreibvorgänge. Tests gebündelter Plugins sollten diese fokussierten
Unterpfade direkt mocken, statt das breite Kompatibilitäts-Barrel zu mocken.

Interner OpenClaw-Runtime-Code folgt derselben Richtung: Konfiguration einmal an der CLI-, Gateway- oder Prozessgrenze laden und diesen Wert dann weiterreichen. Erfolgreiche Mutations-Schreibvorgänge aktualisieren den Prozess-Runtime-Snapshot und erhöhen seine interne Revision; langlebige Caches sollten den Runtime-eigenen Cache-Key verwenden, statt Konfiguration lokal zu serialisieren. Langlebige Runtime-Module haben einen Null-Toleranz-Scanner für umgebende `loadConfig()`-Aufrufe; verwenden Sie ein übergebenes `cfg`, ein Request-`context.getRuntimeConfig()` oder `getRuntimeConfig()` an einer expliziten Prozessgrenze.

Provider- und Channel-Ausführungspfade müssen den aktiven Runtime-Konfigurations-Snapshot verwenden, nicht einen Datei-Snapshot, der für Config-Readback oder Bearbeitung zurückgegeben wurde. Datei-Snapshots bewahren Quellwerte wie SecretRef-Marker für UI und Schreibvorgänge; Provider-Callbacks benötigen die aufgelöste Runtime-Sicht. Wenn eine Hilfsfunktion entweder mit dem aktiven Quell-Snapshot oder dem aktiven Runtime-Snapshot aufgerufen werden kann, leiten Sie vor dem Lesen von Zugangsdaten über `selectApplicableRuntimeConfig()` weiter.

## Wiederverwendbare Runtime-Dienstprogramme

Verwenden Sie eingehende `botLoopProtection`-Fakten für von Bots verfasste eingehende Nachrichten. Core wendet den gemeinsamen In-Memory-Sliding-Window-Guard vor Session-Datensatz und Dispatch an, ohne die Policy an einen Channel zu binden. Der Guard verfolgt `(scopeId, conversationId, participant pair)`-Keys, zählt beide Richtungen eines Paares zusammen, wendet eine Abkühlzeit an, sobald das Fensterbudget überschritten ist, und bereinigt inaktive Einträge opportunistisch.

Channel-Plugins, die dieses Verhalten für Operatoren bereitstellen, sollten die gemeinsame `channels.defaults.botLoopProtection`-Form für Basisbudgets bevorzugen und dann Channel-/Provider-spezifische Overrides darüberlegen. Die gemeinsame Konfiguration verwendet Sekunden, weil sie benutzerseitig ist:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Übergeben Sie normalisierte Bot-Paar-Fakten mit dem aufgelösten Turn. Core löst Defaults, Einheitenumrechnung und `enabled`-Semantik auf:

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

Verwenden Sie `openclaw/plugin-sdk/pair-loop-guard-runtime` direkt nur für benutzerdefinierte
Zwei-Parteien-Event-Loops, die nicht über den gemeinsamen eingehenden Reply-Runner laufen.

## Runtime-Namespaces

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent-Identität, Verzeichnisse und Session-Verwaltung.

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

    `runEmbeddedAgent(...)` ist die neutrale Hilfsfunktion zum Starten eines normalen OpenClaw-Agent-Turns aus Plugin-Code. Sie verwendet dieselbe Provider-/Modell-Auflösung und Agent-Harness-Auswahl wie durch Channels ausgelöste Antworten.

    `runEmbeddedPiAgent(...)` bleibt als veralteter Kompatibilitätsalias für bestehende Plugins erhalten. Neuer Code sollte `runEmbeddedAgent(...)` verwenden.

    `resolveThinkingPolicy(...)` gibt die vom Provider/Modell unterstützten Denkstufen und optionalen Default zurück. Provider-Plugins besitzen das modellspezifische Profil über ihre Thinking-Hooks, daher sollten Tool-Plugins diese Runtime-Hilfsfunktion aufrufen, statt Provider-Listen zu importieren oder zu duplizieren.

    `normalizeThinkingLevel(...)` konvertiert Benutzereingaben wie `on`, `x-high` oder `extra high` in die kanonisch gespeicherte Stufe, bevor sie gegen die aufgelöste Policy geprüft wird.

    **Session-Store-Hilfsfunktionen** befinden sich unter `api.runtime.agent.session`:

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

    Bevorzugen Sie `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` oder `upsertSessionEntry(...)` für Session-Workflows. Diese Hilfsfunktionen adressieren Sessions über Agent-/Session-Identität, damit Plugins nicht von der alten `sessions.json`-Speicherform abhängen. Verwenden Sie `preserveActivity: true` für reine Metadaten-Patches, die die Session-Aktivität nicht aktualisieren sollen, und `replaceEntry: true` nur, wenn der Callback einen vollständigen Eintrag zurückgibt und gelöschte Felder gelöscht bleiben müssen.

    Verwenden Sie `runWithWorkAdmission(...)`, wenn ein Plugin Arbeit an einer persistierten Session startet. Der Callback weist archivierte oder gleichzeitig ersetzte Sessions zurück, hält Archiv-/Reset-/Löschmutationen bis zum Abschluss koordiniert und erhält ein `AbortSignal`, das an den Agent-Run weitergeleitet werden muss.

    Importieren Sie für Transcript-Lese- und Schreibvorgänge `openclaw/plugin-sdk/session-transcript-runtime` und verwenden Sie `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` oder `withSessionTranscriptWriteLock(...)` mit `{ agentId, sessionKey, sessionId }`. Diese APIs erlauben Plugins, ein Transcript zu identifizieren, seine Events zu lesen, Nachrichten anzuhängen, Updates zu veröffentlichen und zugehörige Operationen unter derselben Transcript-Schreibsperre auszuführen. Das Übergeben von `sessionFile`, die Verwendung von `resolveSessionTranscriptLegacyFileTarget(...)` oder das Importieren der Low-Level-Funktionen `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` aus `openclaw/plugin-sdk/agent-harness-runtime` ist veraltet; diese Pfade existieren nur für Legacy-Code, der bereits ein aktives Transcript-Artefakt erhält.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` und `resolveAndPersistSessionFile(...)` sind veraltete Kompatibilitäts-Hilfsfunktionen für Plugins, die weiterhin absichtlich von der alten Whole-Store- oder Transcript-Dateiform abhängen. Neuer Plugin-Code darf diese Hilfsfunktionen nicht verwenden, und bestehende Aufrufer sollten zu Entry-Hilfsfunktionen und Transcript-Identity-Hilfsfunktionen migrieren.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Default-Modell- und Provider-Konstanten:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Führen Sie eine Host-eigene Textvervollständigung aus, ohne Provider-Interna zu importieren oder
    die OpenClaw-Vorbereitung für Modell/Auth/Basis-URL zu duplizieren.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Die Hilfsfunktion verwendet denselben einfachen Vervollständigungs-Vorbereitungspfad wie die
    integrierte Runtime von OpenClaw und den Host-eigenen Runtime-Konfigurations-Snapshot. Kontext-Engines
    erhalten eine sessiongebundene `llm.complete`-Capability, sodass Modellaufrufe den
    Agent der aktiven Session verwenden und nicht stillschweigend auf den Default-Agent zurückfallen. Das
    Ergebnis enthält Provider-/Modell-/Agent-Zuordnung plus normalisierte Token-,
    Cache- und geschätzte Kostennutzung, sofern verfügbar.

    <Warning>
    Modellüberschreibungen erfordern eine Aktivierung durch den Operator über `plugins.entries.<id>.llm.allowModelOverride: true` in der Konfiguration. Verwenden Sie `plugins.entries.<id>.llm.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken. Agentenübergreifende Completions erfordern `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Starten und verwalten Sie Subagent-Ausführungen im Hintergrund.

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
    Modellüberschreibungen (`provider`/`model`) erfordern eine Aktivierung durch den Operator über `plugins.entries.<id>.subagent.allowModelOverride: true` in der Konfiguration. Nicht vertrauenswürdige Plugins können weiterhin Subagents ausführen, aber Überschreibungsanforderungen werden abgelehnt.
    </Warning>

    `deleteSession(...)` kann Sitzungen löschen, die vom selben Plugin über `api.runtime.subagent.run(...)` erstellt wurden. Das Löschen beliebiger Benutzer- oder Operator-Sitzungen erfordert weiterhin eine admin-skopierte Gateway-Anforderung.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Listen Sie verbundene Nodes auf und rufen Sie einen Node-Host-Befehl aus vom Gateway geladenem Plugin-Code oder aus Plugin-CLI-Befehlen auf. Verwenden Sie dies, wenn ein Plugin lokale Arbeit auf einem gekoppelten Gerät besitzt, zum Beispiel eine Browser- oder Audio-Bridge auf einem anderen Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Innerhalb des Gateway läuft diese Runtime im Prozess. In Plugin-CLI-Befehlen ruft sie das konfigurierte Gateway über RPC auf, sodass Befehle wie `openclaw googlemeet recover-tab` gekoppelte Nodes vom Terminal aus prüfen können. Node-Befehle durchlaufen weiterhin die normale Gateway-Node-Kopplung, Befehls-Allowlists, Plugin-Richtlinien für Node-Aufrufe und die node-lokale Befehlsverarbeitung.

    Plugins, die gefährliche Node-Host-Befehle bereitstellen, sollten mit `api.registerNodeInvokePolicy(...)` eine Richtlinie für Node-Aufrufe registrieren. Die Richtlinie wird im Gateway nach den Befehls-Allowlist-Prüfungen und vor der Weiterleitung des Befehls an die Node ausgeführt, sodass direkte `node.invoke`-Aufrufe und höherwertige Plugin-Tools denselben Durchsetzungspfad nutzen.

    <Warning>
    Das optionale Feld `scopes` fordert Gateway-Operator-Scopes für den Aufruf an. OpenClaw berücksichtigt es nur für gebündelte Plugins und vertrauenswürdige offizielle Plugin-Installationen; Anforderungen von anderen Plugins erhöhen die Berechtigungen des Aufrufs nicht. Verwenden Sie es nur, wenn ein vertrauenswürdiges Plugin einen Node-Befehl mit einem strengeren Gateway-Scope wie `operator.admin` aufrufen muss.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Binden Sie eine Task Flow-Runtime an einen vorhandenen OpenClaw-Sitzungsschlüssel oder vertrauenswürdigen Tool-Kontext, und erstellen und verwalten Sie dann Task Flows, ohne bei jedem Aufruf einen Besitzer zu übergeben.

    Task Flow verfolgt dauerhaften mehrstufigen Workflow-Zustand. Es ist kein Scheduler:
    Verwenden Sie Cron oder `api.session.workflow.scheduleSessionTurn(...)` für zukünftige
    Aktivierungen, und verwenden Sie anschließend `managedFlows` aus dem geplanten Turn, wenn diese Arbeit
    Flow-Zustand, untergeordnete Aufgaben, Wartevorgänge oder Abbruch benötigt.

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

    Verwenden Sie `bindSession({ sessionKey, requesterOrigin })`, wenn Sie bereits einen vertrauenswürdigen OpenClaw-Sitzungsschlüssel aus Ihrer eigenen Bindungsschicht haben. Binden Sie nicht aus rohen Benutzereingaben.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Text-zu-Sprache-Synthese.

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

    Verwendet die Kernkonfiguration `messages.tts` und Provider-Auswahl. Gibt PCM-Audiopuffer + Abtastrate zurück.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Bild-, Audio- und Videoanalyse.

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

    Gibt `{ text: undefined }` zurück, wenn keine Ausgabe erzeugt wird (z. B. bei übersprungener Eingabe).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias für `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` erhalten.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Bilderzeugung.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Websuche.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Low-Level-Medienhilfsfunktionen.

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
    Aktueller Runtime-Konfigurations-Snapshot und transaktionale Konfigurationsschreibvorgänge. Bevorzugen Sie
    Konfiguration, die bereits in den aktiven Aufrufpfad übergeben wurde; verwenden Sie
    `current()` nur, wenn der Handler den Prozess-Snapshot direkt benötigt.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` und `replaceConfigFile(...)` geben einen `followUp`-
    Wert zurück, zum Beispiel `{ mode: "restart", requiresRestart: true, reason }`,
    der die Absicht des Schreibers festhält, ohne dem
    Gateway die Neustartsteuerung zu entziehen.

  </Accordion>
  <Accordion title="api.runtime.system">
    Hilfsfunktionen auf Systemebene.

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

    `runCommandWithTimeout(...)` gibt erfasste `stdout` und `stderr`, optionale
    Kürzungszähler, `code`, `signal`, `killed`, `termination` und
    `noOutputTimedOut` zurück. Timeout- und No-Output-Timeout-Ergebnisse melden `code: 124`,
    wenn der Child-Prozess keinen Exit-Code ungleich null bereitstellt. Signal-Exits
    ohne Timeout können weiterhin `code: null` zurückgeben; verwenden Sie daher `termination` und
    `noOutputTimedOut`, um Timeout-Gründe zu unterscheiden.

  </Accordion>
  <Accordion title="api.runtime.events">
    Ereignisabonnements.

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
    Protokollierung.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Auflösung der Modell- und Provider-Authentifizierung.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Auflösung des Zustandsverzeichnisses und SQLite-gestützter Keyed Storage.

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

    Keyed Stores überstehen Neustarts und sind durch die runtime-gebundene Plugin-ID isoliert. Verwenden Sie `registerIfAbsent(...)` für atomare Deduplizierungs-Claims: Es gibt `true` zurück, wenn der Schlüssel fehlte oder abgelaufen war und registriert wurde, oder `false`, wenn bereits ein aktiver Wert vorhanden ist, ohne dessen Wert, Erstellungszeit oder TTL zu überschreiben. Limits: `maxEntries` pro Namespace, 6.000 aktive Zeilen pro Plugin, JSON-Werte unter 64 KB und optionaler TTL-Ablauf. Wenn ein Schreibvorgang das Zeilenlimit des Plugins überschreiten würde, kann die Runtime die ältesten aktiven Zeilen aus dem Namespace entfernen, in den geschrieben wird; benachbarte Namespaces werden für diesen Schreibvorgang nicht entfernt, und der Schreibvorgang schlägt dennoch fehl, wenn der Namespace nicht genügend Zeilen freigeben kann.

    <Warning>
    In diesem Release nur gebündelte Plugins.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Factorys für Memory-Tools und CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Channelspezifische Runtime-Hilfsfunktionen (verfügbar, wenn ein Channel-Plugin geladen ist).

    `api.runtime.channel.media` ist die bevorzugte Oberfläche für Channel-Mediendownloads und -Speicherung:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Verwenden Sie `saveRemoteMedia(...)`, wenn eine entfernte URL zu OpenClaw-Medien werden soll. Verwenden Sie `saveResponseMedia(...)`, wenn das Plugin bereits eine `Response` mit plugin-eigener Authentifizierung, Weiterleitungs- oder Allowlist-Behandlung abgerufen hat. Verwenden Sie `readRemoteMediaBuffer(...)` nur, wenn das Plugin Rohbytes für Prüfung, Transformationen, Entschlüsselung oder erneutes Hochladen benötigt. `fetchRemoteMedia(...)` bleibt ein veralteter Kompatibilitätsalias für `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` ist die gemeinsame eingehende Oberfläche für Erwähnungsrichtlinien für gebündelte Channel-Plugins, die Runtime-Injection verwenden:

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

    Verfügbare Mention-Hilfsfunktionen:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` stellt die älteren `resolveMentionGating*`-Kompatibilitätshelfer absichtlich nicht bereit. Bevorzugen Sie den normalisierten `{ facts, policy }`-Pfad.

  </Accordion>
</AccordionGroup>

## Runtime-Referenzen speichern

Verwenden Sie `createPluginRuntimeStore`, um die Runtime-Referenz für die Verwendung außerhalb des `register`-Callbacks zu speichern:

<Steps>
  <Step title="Store erstellen">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Mit dem Einstiegspunkt verbinden">
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
  <Step title="Aus anderen Dateien zugreifen">
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
Bevorzugen Sie `pluginId` für die Runtime-Store-Identität. Die niedrigere `key`-Form ist für ungewöhnliche Fälle gedacht, in denen ein Plugin absichtlich mehr als einen Runtime-Slot benötigt.
</Note>

## Andere `api`-Felder auf oberster Ebene

Über `api.runtime` hinaus stellt das API-Objekt außerdem Folgendes bereit:

<ParamField path="api.id" type="string">
  Plugin-ID.
</ParamField>
<ParamField path="api.name" type="string">
  Anzeigename des Plugins.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Aktueller Konfigurations-Snapshot (aktive In-Memory-Runtime-Snapshot, sofern verfügbar).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Start-/Setup-Fenster vor dem vollständigen Einstieg.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Löst einen Pfad relativ zum Plugin-Root auf.
</ParamField>

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Registry
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry`-Optionen
- [SDK-Übersicht](/de/plugins/sdk-overview) — Subpath-Referenz
