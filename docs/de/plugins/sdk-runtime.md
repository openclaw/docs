---
read_when:
    - Sie müssen Kern-Hilfsfunktionen aus einem Plugin heraus aufrufen (TTS, STT, Bildgenerierung, Websuche, Subagent, Nodes)
    - Sie möchten verstehen, was api.runtime bereitstellt
    - Sie greifen von Plugin-Code aus auf Konfigurations-, Agent- oder Medien-Hilfsfunktionen zu
sidebarTitle: Runtime helpers
summary: api.runtime -- die injizierten Runtime-Hilfsfunktionen, die Plugins zur Verfügung stehen
title: Plugin-Runtime-Hilfsfunktionen
x-i18n:
    generated_at: "2026-04-30T07:08:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referenz für das `api.runtime`-Objekt, das während der Registrierung in jedes Plugin injiziert wird. Verwenden Sie diese Helfer, statt Host-Interna direkt zu importieren.

<CardGroup cols={2}>
  <Card title="Kanal-Plugins" href="/de/plugins/sdk-channel-plugins">
    Schritt-für-Schritt-Anleitung, die diese Helfer im Kontext von Kanal-Plugins verwendet.
  </Card>
  <Card title="Provider-Plugins" href="/de/plugins/sdk-provider-plugins">
    Schritt-für-Schritt-Anleitung, die diese Helfer im Kontext von Provider-Plugins verwendet.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Laden und Schreiben der Konfiguration

Bevorzugen Sie Konfiguration, die bereits in den aktiven Aufrufpfad übergeben wurde, zum Beispiel `api.config` während der Registrierung oder ein `cfg`-Argument in Channel-/Provider-Callbacks. So fließt ein Prozess-Snapshot durch die Arbeit, statt Konfiguration auf Hot Paths erneut zu parsen.

Verwenden Sie `api.runtime.config.current()` nur, wenn ein langlebiger Handler den aktuellen Prozess-Snapshot benötigt und keine Konfiguration an diese Funktion übergeben wurde. Der zurückgegebene Wert ist schreibgeschützt; klonen Sie ihn oder verwenden Sie vor dem Bearbeiten einen Mutationshelfer.

Tool-Factories erhalten `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Verwenden Sie den Getter innerhalb des `execute`-Callbacks eines langlebigen Tools, wenn sich die Konfiguration nach dem Erstellen der Tool-Definition ändern kann.

Persistieren Sie Änderungen mit `api.runtime.config.mutateConfigFile(...)` oder `api.runtime.config.replaceConfigFile(...)`. Jeder Schreibvorgang muss eine explizite `afterWrite`-Richtlinie wählen:

- `afterWrite: { mode: "auto" }` lässt den Gateway-Reload-Planner entscheiden.
- `afterWrite: { mode: "restart", reason: "..." }` erzwingt einen sauberen Neustart, wenn der Writer weiß, dass Hot Reload unsicher ist.
- `afterWrite: { mode: "none", reason: "..." }` unterdrückt automatisches Neuladen/Neustarten nur, wenn der Aufrufer die Nachverfolgung übernimmt.

Die Mutationshelfer geben `afterWrite` plus eine typisierte `followUp`-Zusammenfassung zurück, damit Aufrufer protokollieren oder testen können, ob sie einen Neustart angefordert haben. Der Gateway entscheidet weiterhin, wann dieser Neustart tatsächlich erfolgt.

`api.runtime.config.loadConfig()` und `api.runtime.config.writeConfigFile(...)` sind veraltete Kompatibilitätshelfer unter `runtime-config-load-write`. Sie warnen einmal zur Laufzeit und bleiben während des Migrationsfensters für alte externe Plugins verfügbar. Gebündelte Plugins dürfen sie nicht verwenden; die Boundary-Guards für Konfiguration schlagen fehl, wenn Plugin-Code sie aufruft oder diese Helfer aus Plugin-SDK-Unterpfaden importiert.

Verwenden Sie für direkte SDK-Imports die fokussierten Konfigurations-Unterpfade statt des breiten
Kompatibilitäts-Barrels `openclaw/plugin-sdk/config-runtime`: `config-types` für
Typen, `plugin-config-runtime` für Assertions zu bereits geladener Konfiguration und Plugin-
Entry-Lookup, `runtime-config-snapshot` für aktuelle Prozess-Snapshots und
`config-mutation` für Schreibvorgänge. Tests für gebündelte Plugins sollten diese fokussierten
Unterpfade direkt mocken, statt das breite Kompatibilitäts-Barrel zu mocken.

Interner OpenClaw-Runtime-Code folgt derselben Richtung: Konfiguration einmal an der CLI-, Gateway- oder Prozessgrenze laden und diesen Wert dann weiterreichen. Erfolgreiche Mutationsschreibvorgänge aktualisieren den Prozess-Runtime-Snapshot und erhöhen dessen interne Revision; langlebige Caches sollten den Runtime-eigenen Cache-Schlüssel verwenden, statt Konfiguration lokal zu serialisieren. Langlebige Runtime-Module haben einen Null-Toleranz-Scanner für umgebende `loadConfig()`-Aufrufe; verwenden Sie ein übergebenes `cfg`, ein Request-`context.getRuntimeConfig()` oder `getRuntimeConfig()` an einer expliziten Prozessgrenze.

Provider- und Channel-Ausführungspfade müssen den aktiven Runtime-Konfigurations-Snapshot verwenden, nicht einen Datei-Snapshot, der für Konfigurations-Readback oder Bearbeitung zurückgegeben wurde. Datei-Snapshots bewahren Quellwerte wie SecretRef-Marker für UI und Schreibvorgänge; Provider-Callbacks benötigen die aufgelöste Runtime-Sicht. Wenn ein Helfer entweder mit dem aktiven Quell-Snapshot oder dem aktiven Runtime-Snapshot aufgerufen werden kann, leiten Sie vor dem Lesen von Zugangsdaten über `selectApplicableRuntimeConfig()` weiter.

## Runtime-Namespaces

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent-Identität, Verzeichnisse und Sitzungsverwaltung.

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

    `runEmbeddedAgent(...)` ist der neutrale Helfer zum Starten eines normalen OpenClaw-Agent-Turns aus Plugin-Code. Er verwendet dieselbe Provider-/Modellauflösung und Agent-Harness-Auswahl wie durch Channel ausgelöste Antworten.

    `runEmbeddedPiAgent(...)` bleibt als Kompatibilitätsalias erhalten.

    `resolveThinkingPolicy(...)` gibt die vom Provider/Modell unterstützten Denkstufen und einen optionalen Standard zurück. Provider-Plugins besitzen das modellspezifische Profil über ihre Thinking-Hooks, daher sollten Tool-Plugins diesen Runtime-Helfer aufrufen, statt Provider-Listen zu importieren oder zu duplizieren.

    `normalizeThinkingLevel(...)` konvertiert Benutzereingaben wie `on`, `x-high` oder `extra high` in die kanonische gespeicherte Stufe, bevor sie gegen die aufgelöste Richtlinie geprüft wird.

    **Session-Store-Helfer** befinden sich unter `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Standardmodell- und Provider-Konstanten:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Hintergrundläufe von Subagenten starten und verwalten.

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
    Modell-Overrides (`provider`/`model`) erfordern eine Betreiber-Zustimmung über `plugins.entries.<id>.subagent.allowModelOverride: true` in der Konfiguration. Nicht vertrauenswürdige Plugins können weiterhin Subagenten ausführen, Override-Anfragen werden jedoch abgelehnt.
    </Warning>

    `deleteSession(...)` kann Sitzungen löschen, die vom selben Plugin über `api.runtime.subagent.run(...)` erstellt wurden. Das Löschen beliebiger Benutzer- oder Betreiber-Sitzungen erfordert weiterhin eine Gateway-Anfrage mit Admin-Scope.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Verbundene Nodes auflisten und einen Node-Host-Befehl aus Gateway-geladenem Plugin-Code oder aus Plugin-CLI-Befehlen aufrufen. Verwenden Sie dies, wenn ein Plugin lokale Arbeit auf einem gekoppelten Gerät besitzt, zum Beispiel eine Browser- oder Audio-Bridge auf einem anderen Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Innerhalb des Gateway läuft diese Runtime im Prozess. In Plugin-CLI-Befehlen ruft sie den konfigurierten Gateway über RPC auf, sodass Befehle wie `openclaw googlemeet recover-tab` gekoppelte Nodes vom Terminal aus untersuchen können. Node-Befehle laufen weiterhin durch normales Gateway-Node-Pairing, Befehls-Allowlists, Plugin-Node-Invoke-Richtlinien und Node-lokale Befehlsverarbeitung.

    Plugins, die gefährliche Node-Host-Befehle bereitstellen, sollten mit `api.registerNodeInvokePolicy(...)` eine Node-Invoke-Richtlinie registrieren. Die Richtlinie läuft im Gateway nach den Befehls-Allowlist-Prüfungen und bevor der Befehl an den Node weitergeleitet wird, sodass direkte `node.invoke`-Aufrufe und höherstufige Plugin-Tools denselben Durchsetzungspfad nutzen.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Eine Task-Flow-Runtime an einen vorhandenen OpenClaw-Sitzungsschlüssel oder vertrauenswürdigen Tool-Kontext binden und dann Task Flows erstellen und verwalten, ohne bei jedem Aufruf einen Owner zu übergeben.

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

    Verwenden Sie `bindSession({ sessionKey, requesterOrigin })`, wenn Sie bereits einen vertrauenswürdigen OpenClaw-Sitzungsschlüssel aus Ihrer eigenen Binding-Schicht haben. Binden Sie nicht aus roher Benutzereingabe.

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

    Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl. Gibt PCM-Audiopuffer + Abtastrate zurück.

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
    ```

    Gibt `{ text: undefined }` zurück, wenn keine Ausgabe erzeugt wird (z. B. übersprungene Eingabe).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias für `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` erhalten.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Bildgenerierung.

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
    die Konfiguration, die bereits an den aktiven Aufrufpfad übergeben wurde; verwenden Sie
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
    der die Absicht des schreibenden Vorgangs erfasst, ohne dem
    Gateway die Neustartsteuerung zu entziehen.

  </Accordion>
  <Accordion title="api.runtime.system">
    Hilfsfunktionen auf Systemebene.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

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
    Auflösung des Zustandsverzeichnisses und SQLite-gestützter schlüsselbasierter Speicher.

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

    Schlüsselbasierte Speicher überstehen Neustarts und sind durch die runtime-gebundene Plugin-ID isoliert. Limits: `maxEntries` pro Namespace, 1.000 Live-Zeilen pro Plugin, JSON-Werte unter 64 KB und optionaler TTL-Ablauf.

    <Warning>
    In dieser Version nur gebündelte Plugins.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Memory-Tool-Factories und CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Kanalspezifische Runtime-Hilfsfunktionen (verfügbar, wenn ein Kanal-Plugin geladen ist).

    `api.runtime.channel.mentions` ist die gemeinsame Oberfläche für eingehende Erwähnungsrichtlinien für gebündelte Kanal-Plugins, die Runtime-Injektion verwenden:

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

    Verfügbare Erwähnungs-Hilfsfunktionen:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` stellt die älteren `resolveMentionGating*`-Kompatibilitäts-Hilfsfunktionen absichtlich nicht bereit. Bevorzugen Sie den normalisierten `{ facts, policy }`-Pfad.

  </Accordion>
</AccordionGroup>

## Runtime-Referenzen speichern

Verwenden Sie `createPluginRuntimeStore`, um die Runtime-Referenz zur Verwendung außerhalb des `register`-Callbacks zu speichern:

<Steps>
  <Step title="Speicher erstellen">
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
Bevorzugen Sie `pluginId` für die Runtime-Store-Identität. Die Low-Level-Form `key` ist für seltene Fälle gedacht, in denen ein Plugin absichtlich mehr als einen Runtime-Slot benötigt.
</Note>

## Andere Top-Level-Felder von `api`

Zusätzlich zu `api.runtime` stellt das API-Objekt auch Folgendes bereit:

<ParamField path="api.id" type="string">
  Plugin-ID.
</ParamField>
<ParamField path="api.name" type="string">
  Anzeigename des Plugins.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar).
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
  Löst einen Pfad relativ zum Plugin-Stammverzeichnis auf.
</ParamField>

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Registry
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry`-Optionen
- [SDK-Übersicht](/de/plugins/sdk-overview) — Subpath-Referenz
