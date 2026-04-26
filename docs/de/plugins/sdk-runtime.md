---
read_when:
    - Sie müssen aus einem Plugin Core-Helper aufrufen (TTS, STT, Bildgenerierung, Websuche, Subagenten, Nodes)
    - Sie möchten verstehen, was `api.runtime` bereitstellt
    - Sie greifen aus Plugin-Code auf Konfigurations-, Agent- oder Medien-Helper zu
sidebarTitle: Runtime helpers
summary: api.runtime -- die injizierten Laufzeit-Helper, die Plugins zur Verfügung stehen
title: Plugin-Laufzeit-Helper
x-i18n:
    generated_at: "2026-04-26T11:36:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Referenz für das `api.runtime`-Objekt, das während der Registrierung in jedes Plugin injiziert wird. Verwenden Sie diese Helper, anstatt Host-Interna direkt zu importieren.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/de/plugins/sdk-channel-plugins">
    Schritt-für-Schritt-Anleitung, die diese Helper im Kontext von Channel-Plugins verwendet.
  </Card>
  <Card title="Provider plugins" href="/de/plugins/sdk-provider-plugins">
    Schritt-für-Schritt-Anleitung, die diese Helper im Kontext von Provider-Plugins verwendet.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Laufzeit-Namespaces

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent-Identität, Verzeichnisse und Sitzungsverwaltung.

    ```typescript
    // Arbeitsverzeichnis des Agenten auflösen
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Agent-Workspace auflösen
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Agent-Identität abrufen
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Standard-Thinking-Level abrufen
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

    // Agent-Timeout abrufen
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Sicherstellen, dass der Workspace existiert
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Einen eingebetteten Agent-Turn ausführen
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

    `runEmbeddedAgent(...)` ist der neutrale Helper zum Starten eines normalen OpenClaw-Agent-Turns aus Plugin-Code. Er verwendet dieselbe Provider-/Modellauflösung und dieselbe Auswahl des Agent-Harness wie kanalgetriggerte Antworten.

    `runEmbeddedPiAgent(...)` bleibt als Kompatibilitätsalias erhalten.

    **Sitzungsspeicher-Helper** befinden sich unter `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Standardkonstanten für Modell und Provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // z. B. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // z. B. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Hintergrund-Subagent-Ausführungen starten und verwalten.

    ```typescript
    // Eine Subagent-Ausführung starten
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optionale Überschreibung
      model: "gpt-4.1-mini", // optionale Überschreibung
      deliver: false,
    });

    // Auf Abschluss warten
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Sitzungsnachrichten lesen
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Eine Sitzung löschen
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Modellüberschreibungen (`provider`/`model`) erfordern ein Opt-in des Betreibers über `plugins.entries.<id>.subagent.allowModelOverride: true` in der Konfiguration. Nicht vertrauenswürdige Plugins können weiterhin Subagenten ausführen, aber Überschreibungsanfragen werden abgelehnt.
    </Warning>

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

    Innerhalb des Gateway ist diese Laufzeit in-process. In Plugin-CLI-Befehlen ruft sie das konfigurierte Gateway über RPC auf, sodass Befehle wie `openclaw googlemeet recover-tab` gekoppelte Nodes vom Terminal aus prüfen können. Node-Befehle durchlaufen weiterhin das normale Gateway-Node-Pairing, Befehls-Allowlists und die Node-lokale Befehlsverarbeitung.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Eine TaskFlow-Laufzeit an einen vorhandenen OpenClaw-Session-Key oder vertrauenswürdigen Tool-Kontext binden und dann Task Flows erstellen und verwalten, ohne bei jedem Aufruf einen Eigentümer übergeben zu müssen.

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

    Verwenden Sie `bindSession({ sessionKey, requesterOrigin })`, wenn Sie bereits einen vertrauenswürdigen OpenClaw-Session-Key aus Ihrer eigenen Bindungsschicht haben. Binden Sie nicht aus roher Benutzereingabe.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sprachsynthese.

    ```typescript
    // Standard-TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Für Telefonie optimierte TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Verfügbare Stimmen auflisten
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl. Gibt PCM-Audiopuffer + Sample-Rate zurück.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Bild-, Audio- und Videoanalyse.

    ```typescript
    // Ein Bild beschreiben
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Audio transkribieren
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, wenn MIME nicht abgeleitet werden kann
    });

    // Ein Video beschreiben
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generische Dateianalyse
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Gibt `{ text: undefined }` zurück, wenn keine Ausgabe erzeugt wird (z. B. bei übersprungener Eingabe).

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
    Low-Level-Medien-Utilities.

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
    Konfiguration laden und schreiben.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilities auf Systemebene.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    Ereignis-Abonnements.

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
    Auflösung der Authentifizierung für Modell und Provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Auflösung des Zustandsverzeichnisses.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

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
    Kanalspezifische Laufzeit-Helper (verfügbar, wenn ein Channel-Plugin geladen ist).

    `api.runtime.channel.mentions` ist die gemeinsame Eingangsoberfläche für Mention-Richtlinien für gebündelte Channel-Plugins, die Laufzeitinjektion verwenden:

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

    Verfügbare Mention-Helper:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` stellt die älteren Kompatibilitäts-Helper `resolveMentionGating*` absichtlich nicht bereit. Bevorzugen Sie den normalisierten Pfad `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Laufzeitreferenzen speichern

Verwenden Sie `createPluginRuntimeStore`, um die Laufzeitreferenz zur Verwendung außerhalb des `register`-Callbacks zu speichern:

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
      return store.getRuntime(); // gibt einen Fehler aus, wenn nicht initialisiert
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // gibt null zurück, wenn nicht initialisiert
    }
    ```

  </Step>
</Steps>

<Note>
Bevorzugen Sie `pluginId` für die Identität des Runtime-Store. Die niedrigere Form `key` ist für seltene Fälle gedacht, in denen ein Plugin absichtlich mehr als einen Laufzeit-Slot benötigt.
</Note>

## Andere `api`-Felder der obersten Ebene

Zusätzlich zu `api.runtime` stellt das API-Objekt auch Folgendes bereit:

<ParamField path="api.id" type="string">
  Plugin-ID.
</ParamField>
<ParamField path="api.name" type="string">
  Anzeigename des Plugins.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Aktueller Konfigurations-Snapshot (aktiver In-Memory-Laufzeit-Snapshot, wenn verfügbar).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Startup-/Setup-Fenster vor dem vollständigen Entry-Load.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Einen Pfad relativ zum Plugin-Root auflösen.
</ParamField>

## Verwandt

- [Plugin internals](/de/plugins/architecture) — Fähigkeitsmodell und Registry
- [SDK entry points](/de/plugins/sdk-entrypoints) — `definePluginEntry`-Optionen
- [SDK overview](/de/plugins/sdk-overview) — Subpath-Referenz
