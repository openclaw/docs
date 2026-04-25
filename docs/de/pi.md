---
read_when:
    - Das Design der Pi-SDK-Integration in OpenClaw verstehen
    - Sitzungslebenszyklus, Tooling oder Provider-Verdrahtung für Pi ändern
summary: Architektur der eingebetteten Pi-Agent-Integration von OpenClaw und des Sitzungslebenszyklus
title: Pi-Integrationsarchitektur
x-i18n:
    generated_at: "2026-04-25T13:50:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

Dieses Dokument beschreibt, wie OpenClaw mit [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) und dessen Schwesterpaketen (`pi-ai`, `pi-agent-core`, `pi-tui`) integriert wird, um seine KI-Agent-Funktionen bereitzustellen.

## Überblick

OpenClaw verwendet das Pi-SDK, um einen KI-Coding-Agenten in seine Messaging-Gateway-Architektur einzubetten. Statt Pi als Subprozess zu starten oder einen RPC-Modus zu verwenden, importiert und instanziiert OpenClaw direkt `AgentSession` von Pi über `createAgentSession()`. Dieser eingebettete Ansatz bietet:

- Volle Kontrolle über Sitzungslebenszyklus und Ereignisbehandlung
- Benutzerdefinierte Tool-Injektion (Messaging, Sandbox, kanalspezifische Aktionen)
- Anpassung des System-Prompts pro Kanal/Kontext
- Sitzungspersistenz mit Unterstützung für Branching/Compaction
- Rotation von Auth-Profilen über mehrere Konten hinweg mit Failover
- Provider-agnostisches Umschalten von Modellen

## Paketabhängigkeiten

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Paket             | Zweck                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Core-LLM-Abstraktionen: `Model`, `streamSimple`, Nachrichtentypen, Provider-APIs                      |
| `pi-agent-core`   | Agent-Schleife, Tool-Ausführung, Typen `AgentMessage`                                                  |
| `pi-coding-agent` | High-Level-SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, integrierte Tools |
| `pi-tui`          | Terminal-UI-Komponenten (werden im lokalen TUI-Modus von OpenClaw verwendet)                           |

## Dateistruktur

```
src/agents/
├── pi-embedded-runner.ts          # Re-Exports aus pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Haupteinstieg: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logik eines einzelnen Versuchs mit Sitzungseinrichtung
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Antwort-Payloads aus Laufergebnissen erstellen
│   │   ├── images.ts              # Bildinjektion für Vision-Modelle
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Erkennung von Abort-Fehlern
│   ├── cache-ttl.ts               # Tracking der Cache-TTL für Kontextbereinigung
│   ├── compact.ts                 # Manuelle/automatische Compaction-Logik
│   ├── extensions.ts              # Pi-Erweiterungen für eingebettete Läufe laden
│   ├── extra-params.ts            # Provider-spezifische Stream-Parameter
│   ├── google.ts                  # Korrekturen der Turn-Reihenfolge für Google/Gemini
│   ├── history.ts                 # Begrenzung des Verlaufs (DM vs Gruppe)
│   ├── lanes.ts                   # Sitzungs-/globale Befehls-Lanes
│   ├── logger.ts                  # Logger des Subsystems
│   ├── model.ts                   # Modellauflösung über ModelRegistry
│   ├── runs.ts                    # Tracking aktiver Läufe, Abbruch, Warteschlange
│   ├── sandbox-info.ts            # Sandbox-Informationen für den System-Prompt
│   ├── session-manager-cache.ts   # Caching von SessionManager-Instanzen
│   ├── session-manager-init.ts    # Initialisierung von Sitzungsdateien
│   ├── system-prompt.ts           # Builder für den System-Prompt
│   ├── tool-split.ts              # Aufteilen von Tools in builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapping von ThinkLevel, Fehlerbeschreibung
├── pi-embedded-subscribe.ts       # Abonnieren/Dispatchen von Sitzungsereignissen
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory für Event-Handler
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking gestreamter Blockantworten
├── pi-embedded-messaging.ts       # Tracking von mit Messaging-Tool gesendeten Nachrichten
├── pi-embedded-helpers.ts         # Fehlerklassifikation, Turn-Validierung
├── pi-embedded-helpers/           # Hilfsmodule
├── pi-embedded-utils.ts           # Formatierungs-Utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal-Wrapping für Tools
├── pi-tools.policy.ts             # Tool-Allowlist-/Denylist-Richtlinie
├── pi-tools.read.ts               # Anpassungen des Read-Tools
├── pi-tools.schema.ts             # Normalisierung von Tool-Schemas
├── pi-tools.types.ts              # Typalias AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Settings-Overrides
├── pi-hooks/                      # Benutzerdefinierte Pi-Hooks
│   ├── compaction-safeguard.ts    # Safeguard-Erweiterung
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Erweiterung für Kontextbereinigung mit Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Auflösung von Auth-Profilen
├── auth-profiles.ts               # Profilspeicher, Cooldown, Failover
├── model-selection.ts             # Standard-Modellauflösung
├── models-config.ts               # Erzeugung von models.json
├── model-catalog.ts               # Cache des Modellkatalogs
├── context-window-guard.ts        # Validierung des Kontextfensters
├── failover-error.ts              # Klasse FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Auflösung von System-Prompt-Parametern
├── system-prompt-report.ts        # Erzeugung von Debug-Berichten
├── tool-summaries.ts              # Tool-Beschreibungszusammenfassungen
├── tool-policy.ts                 # Auflösung von Tool-Richtlinien
├── transcript-policy.ts           # Richtlinie zur Transkriptvalidierung
├── skills.ts                      # Erzeugung von Skill-Snapshots/Prompts
├── skills/                        # Skill-Subsystem
├── sandbox.ts                     # Auflösung des Sandbox-Kontexts
├── sandbox/                       # Sandbox-Subsystem
├── channel-tools.ts               # Injektion kanalspezifischer Tools
├── openclaw-tools.ts              # OpenClaw-spezifische Tools
├── bash-tools.ts                  # exec/process-Tools
├── apply-patch.ts                 # Tool apply_patch (OpenAI)
├── tools/                         # Einzelne Tool-Implementierungen
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Kanalspezifische Laufzeiten für Nachrichtenaktionen befinden sich jetzt in den
Plugin-eigenen Erweiterungsverzeichnissen statt unter `src/agents/tools`, zum Beispiel:

- die Laufzeitdateien für Aktionen des Discord-Plugins
- die Laufzeitdatei für Aktionen des Slack-Plugins
- die Laufzeitdatei für Aktionen des Telegram-Plugins
- die Laufzeitdatei für Aktionen des WhatsApp-Plugins

## Core-Integrationsablauf

### 1. Einen eingebetteten Agenten ausführen

Der Haupteinstieg ist `runEmbeddedPiAgent()` in `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Sitzungserstellung

Innerhalb von `runEmbeddedAttempt()` (aufgerufen von `runEmbeddedPiAgent()`) wird das Pi-SDK verwendet:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Ereignisabonnement

`subscribeEmbeddedPiSession()` abonniert die `AgentSession`-Ereignisse von Pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Behandelte Ereignisse umfassen:

- `message_start` / `message_end` / `message_update` (Streaming von Text/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Nach der Einrichtung wird die Sitzung gepromptet:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Das SDK übernimmt die vollständige Agent-Schleife: an das LLM senden, Tool-Aufrufe ausführen, Antworten streamen.

Die Bildinjektion ist promptlokal: OpenClaw lädt Bild-Refs aus dem aktuellen Prompt und
übergibt sie nur für diesen Turn über `images`. Ältere Verlaufsturns werden nicht erneut gescannt,
um Bild-Payloads erneut zu injizieren.

## Tool-Architektur

### Tool-Pipeline

1. **Basis-Tools**: `codingTools` von Pi (read, bash, edit, write)
2. **Benutzerdefinierte Ersetzungen**: OpenClaw ersetzt bash durch `exec`/`process`, passt read/edit/write für die Sandbox an
3. **OpenClaw-Tools**: Messaging, Browser, Canvas, Sitzungen, Cron, Gateway usw.
4. **Kanal-Tools**: kanalbezogene Aktionstools für Discord/Telegram/Slack/WhatsApp
5. **Richtlinienfilterung**: Tools werden nach Profil-, Provider-, Agent-, Gruppen- und Sandbox-Richtlinien gefiltert
6. **Schema-Normalisierung**: Schemas werden für Gemini-/OpenAI-Eigenheiten bereinigt
7. **AbortSignal-Wrapping**: Tools werden gewrappt, damit sie Abort-Signale berücksichtigen

### Adapter für Tool-Definitionen

`AgentTool` aus pi-agent-core hat eine andere `execute`-Signatur als `ToolDefinition` aus pi-coding-agent. Der Adapter in `pi-tool-definition-adapter.ts` überbrückt das:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent-Signatur unterscheidet sich von pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategie zum Aufteilen von Tools

`splitSdkTools()` übergibt alle Tools über `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Leer. Wir überschreiben alles
    customTools: toToolDefinitions(options.tools),
  };
}
```

Dadurch bleibt die Richtlinienfilterung, Sandbox-Integration und der erweiterte Tool-Satz von OpenClaw über Provider hinweg konsistent.

## Aufbau des System-Prompts

Der System-Prompt wird in `buildAgentSystemPrompt()` (`system-prompt.ts`) erstellt. Er setzt einen vollständigen Prompt mit Abschnitten zusammen, darunter Tooling, Tool Call Style, Safety-Guardrails, OpenClaw-CLI-Referenz, Skills, Dokumentation, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Laufzeitmetadaten sowie Memory und Reactions, wenn aktiviert, und optional Kontextdateien und zusätzlicher Inhalt für den System-Prompt. Für den minimalen Prompt-Modus, der von Subagenten verwendet wird, werden Abschnitte gekürzt.

Der Prompt wird nach der Sitzungserstellung über `applySystemPromptOverrideToSession()` angewendet:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Sitzungsverwaltung

### Sitzungsdateien

Sitzungen sind JSONL-Dateien mit Baumstruktur (Verknüpfung über id/parentId). `SessionManager` von Pi übernimmt die Persistenz:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw kapselt dies mit `guardSessionManager()` für die Sicherheit von Tool-Ergebnissen.

### Sitzungscaching

`session-manager-cache.ts` cached `SessionManager`-Instanzen, um wiederholtes Parsen von Dateien zu vermeiden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Begrenzung des Verlaufs

`limitHistoryTurns()` kürzt den Gesprächsverlauf basierend auf dem Kanaltyp (DM vs Gruppe).

### Compaction

Automatische Compaction wird bei Kontextüberlauf ausgelöst. Häufige Signaturen für Überlauf
umfassen `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` und `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` übernimmt die manuelle
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentifizierung und Modellauflösung

### Auth-Profile

OpenClaw verwaltet einen Speicher für Auth-Profile mit mehreren API-Schlüsseln pro Provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotieren bei Fehlern mit Tracking von Cooldowns:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Modellauflösung

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Verwendet ModelRegistry und AuthStorage von Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` löst Modell-Fallback aus, wenn dies konfiguriert ist:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi-Erweiterungen

OpenClaw lädt benutzerdefinierte Pi-Erweiterungen für spezialisiertes Verhalten:

### Compaction-Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` fügt Guardrails für Compaction hinzu, einschließlich adaptiver Token-Budgetierung sowie Zusammenfassungen von Tool-Fehlern und Dateioperationen:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Kontextbereinigung

`src/agents/pi-hooks/context-pruning.ts` implementiert kontextbezogene Bereinigung auf Basis von Cache-TTL:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Streaming und Block-Antworten

### Block-Chunking

`EmbeddedBlockChunker` verwaltet das Streaming von Text in diskrete Antwortblöcke:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Entfernen von Thinking-/Final-Tags

Streaming-Ausgaben werden verarbeitet, um Blöcke `<think>`/`<thinking>` zu entfernen und Inhalte aus `<final>` zu extrahieren:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Inhalt von <think>...</think> entfernen
  // Wenn enforceFinalTag, nur Inhalt von <final>...</final> zurückgeben
};
```

### Antwortdirektiven

Antwortdirektiven wie `[[media:url]]`, `[[voice]]`, `[[reply:id]]` werden geparst und extrahiert:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Fehlerbehandlung

### Fehlerklassifikation

`pi-embedded-helpers.ts` klassifiziert Fehler für eine geeignete Behandlung:

```typescript
isContextOverflowError(errorText)     // Kontext zu groß
isCompactionFailureError(errorText)   // Compaction fehlgeschlagen
isAuthAssistantError(lastAssistant)   // Auth-Fehler
isRateLimitAssistantError(...)        // Rate-Limit erreicht
isFailoverAssistantError(...)         // Sollte Failover auslösen
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback für die Thinking-Stufe

Wenn eine Thinking-Stufe nicht unterstützt wird, wird ein Fallback verwendet:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Sandbox-Integration

Wenn der Sandbox-Modus aktiviert ist, werden Tools und Pfade eingeschränkt:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Sandboxed read/edit/write-Tools verwenden
  // Exec läuft im Container
  // Browser verwendet Bridge-URL
}
```

## Providerspezifische Behandlung

### Anthropic

- Bereinigung von magischen Strings für Verweigerungen
- Turn-Validierung für aufeinanderfolgende Rollen
- Strikte vorgelagerte Pi-Validierung von Tool-Parametern

### Google/Gemini

- Plugin-eigene Bereinigung von Tool-Schemas

### OpenAI

- Tool `apply_patch` für Codex-Modelle
- Behandlung von Downgrades der Thinking-Stufe

## TUI-Integration

OpenClaw hat außerdem einen lokalen TUI-Modus, der Komponenten von pi-tui direkt verwendet:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Dies bietet ein interaktives Terminal-Erlebnis ähnlich dem nativen Modus von Pi.

## Wichtige Unterschiede zur Pi-CLI

| Aspekt          | Pi-CLI                  | Eingebettetes OpenClaw                                                                          |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Aufruf          | Befehl `pi` / RPC       | SDK über `createAgentSession()`                                                                 |
| Tools           | Standard-Coding-Tools   | Benutzerdefinierte OpenClaw-Tool-Suite                                                          |
| System-Prompt   | AGENTS.md + Prompts     | Dynamisch pro Kanal/Kontext                                                                     |
| Sitzungsspeicher | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oder `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Einzelne Anmeldedaten   | Mehrere Profile mit Rotation                                                                    |
| Erweiterungen   | Von Datenträger geladen | Programmatisch + Pfade auf Datenträger                                                          |
| Ereignisbehandlung | TUI-Rendering        | Callback-basiert (onBlockReply usw.)                                                            |

## Zukünftige Überlegungen

Bereiche für mögliche Überarbeitung:

1. **Angleichung von Tool-Signaturen**: Derzeit Anpassung zwischen Signaturen von pi-agent-core und pi-coding-agent
2. **Wrapping von Session-Managern**: `guardSessionManager` erhöht die Sicherheit, aber auch die Komplexität
3. **Laden von Erweiterungen**: Könnte `ResourceLoader` von Pi direkter verwenden
4. **Komplexität des Streaming-Handlers**: `subscribeEmbeddedPiSession` ist groß geworden
5. **Provider-Eigenheiten**: Viele providerspezifische Codepfade, die Pi potenziell selbst behandeln könnte

## Tests

Die Abdeckung der Pi-Integration erstreckt sich über diese Suites:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Live/optional:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` aktivieren)

Aktuelle Ausführungsbefehle finden Sie unter [Pi-Entwicklungsablauf](/de/pi-dev).

## Verwandt

- [Pi-Entwicklungsablauf](/de/pi-dev)
- [Installationsüberblick](/de/install)
