---
read_when:
    - Das Verständnis des Pi-SDK-Integrationsdesigns in OpenClaw
    - Ändern des Agent-Sitzungslebenszyklus, der Tools oder der Provider-Verdrahtung für Pi
summary: Architektur der eingebetteten Pi-Agent-Integration von OpenClaw und des Sitzungslebenszyklus
title: Pi-Integrationsarchitektur
x-i18n:
    generated_at: "2026-04-24T15:21:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

Dieses Dokument beschreibt, wie OpenClaw sich mit [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) und seinen Schwesterpaketen (`pi-ai`, `pi-agent-core`, `pi-tui`) integriert, um seine KI-Agent-Funktionen bereitzustellen.

## Überblick

OpenClaw verwendet das pi SDK, um einen KI-Coding-Agent in seine Messaging-Gateway-Architektur einzubetten. Anstatt pi als Subprozess zu starten oder den RPC-Modus zu verwenden, importiert OpenClaw direkt die `AgentSession` von pi und instanziiert sie über `createAgentSession()`. Dieser eingebettete Ansatz bietet:

- Volle Kontrolle über den Sitzungslebenszyklus und die Ereignisbehandlung
- Benutzerdefinierte Tool-Injektion (Messaging, Sandbox, kanalspezifische Aktionen)
- Anpassung des System-Prompts pro Kanal/Kontext
- Sitzungspersistenz mit Unterstützung für Verzweigung/Compaction
- Rotation mehrerer Auth-Profile pro Konto mit Failover
- Provider-agnostisches Modellwechseln

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
| `pi-ai`           | Zentrale LLM-Abstraktionen: `Model`, `streamSimple`, Nachrichtentypen, Provider-APIs                  |
| `pi-agent-core`   | Agent-Schleife, Tool-Ausführung, `AgentMessage`-Typen                                                  |
| `pi-coding-agent` | High-Level-SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, integrierte Tools |
| `pi-tui`          | Terminal-UI-Komponenten (verwendet im lokalen TUI-Modus von OpenClaw)                                 |

## Dateistruktur

```
src/agents/
├── pi-embedded-runner.ts          # Re-Exports aus pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Haupteinstieg: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logik für einen einzelnen Versuch mit Sitzungseinrichtung
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Antwort-Payloads aus Laufergebnissen erstellen
│   │   ├── images.ts              # Bildinjektion für Vision-Modelle
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Erkennung von Abbruchfehlern
│   ├── cache-ttl.ts               # Cache-TTL-Tracking für Context Pruning
│   ├── compact.ts                 # Logik für manuelle/automatische Compaction
│   ├── extensions.ts              # Laden von pi-Erweiterungen für eingebettete Läufe
│   ├── extra-params.ts            # Provider-spezifische Stream-Parameter
│   ├── google.ts                  # Google/Gemini-Korrekturen für Turn-Reihenfolge
│   ├── history.ts                 # Begrenzung des Verlaufs (DM vs. Gruppe)
│   ├── lanes.ts                   # Sitzungsweite/globale Befehlsbahnen
│   ├── logger.ts                  # Subsystem-Logger
│   ├── model.ts                   # Modellauflösung über ModelRegistry
│   ├── runs.ts                    # Tracking aktiver Läufe, Abbruch, Warteschlange
│   ├── sandbox-info.ts            # Sandbox-Informationen für den System-Prompt
│   ├── session-manager-cache.ts   # Caching von SessionManager-Instanzen
│   ├── session-manager-init.ts    # Initialisierung von Sitzungsdateien
│   ├── system-prompt.ts           # Builder für System-Prompts
│   ├── tool-split.ts              # Aufteilen von Tools in builtIn vs. custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel-Mapping, Fehlerbeschreibung
├── pi-embedded-subscribe.ts       # Sitzungsereignis-Abonnement/Dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory für Event-Handler
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking gestreamter Blockantworten
├── pi-embedded-messaging.ts       # Tracking gesendeter Messaging-Tools
├── pi-embedded-helpers.ts         # Fehlerklassifizierung, Turn-Validierung
├── pi-embedded-helpers/           # Hilfsmodule
├── pi-embedded-utils.ts           # Formatierungs-Utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal-Wrapping für Tools
├── pi-tools.policy.ts             # Allowlist-/Denylist-Richtlinie für Tools
├── pi-tools.read.ts               # Anpassungen für das Read-Tool
├── pi-tools.schema.ts             # Normalisierung von Tool-Schemas
├── pi-tools.types.ts              # Typalias AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Settings-Overrides
├── pi-hooks/                      # Benutzerdefinierte pi-Hooks
│   ├── compaction-safeguard.ts    # Safeguard-Erweiterung
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL-Context-Pruning-Erweiterung
│   └── context-pruning/
├── model-auth.ts                  # Auflösung von Auth-Profilen
├── auth-profiles.ts               # Profilspeicher, Cooldown, Failover
├── model-selection.ts             # Auflösung des Standardmodells
├── models-config.ts               # Generierung von models.json
├── model-catalog.ts               # Modellkatalog-Cache
├── context-window-guard.ts        # Validierung des Kontextfensters
├── failover-error.ts              # Klasse FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Auflösung von System-Prompt-Parametern
├── system-prompt-report.ts        # Generierung von Debug-Berichten
├── tool-summaries.ts              # Zusammenfassungen von Tool-Beschreibungen
├── tool-policy.ts                 # Auflösung von Tool-Richtlinien
├── transcript-policy.ts           # Validierungsrichtlinie für Transkripte
├── skills.ts                      # Skill-Snapshot-/Prompt-Erstellung
├── skills/                        # Skill-Subsystem
├── sandbox.ts                     # Auflösung des Sandbox-Kontexts
├── sandbox/                       # Sandbox-Subsystem
├── channel-tools.ts               # Injektion kanalspezifischer Tools
├── openclaw-tools.ts              # OpenClaw-spezifische Tools
├── bash-tools.ts                  # exec-/process-Tools
├── apply-patch.ts                 # Tool `apply_patch` (OpenAI)
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

Kanalspezifische Laufzeiten für Nachrichtenaktionen befinden sich jetzt in den plugin-eigenen Erweiterungsverzeichnissen statt unter `src/agents/tools`, zum Beispiel:

- die Laufzeitdateien für Discord-Plugin-Aktionen
- die Laufzeitdatei für Slack-Plugin-Aktionen
- die Laufzeitdatei für Telegram-Plugin-Aktionen
- die Laufzeitdatei für WhatsApp-Plugin-Aktionen

## Zentraler Integrationsablauf

### 1. Ausführen eines eingebetteten Agenten

Der Haupteinstiegspunkt ist `runEmbeddedPiAgent()` in `pi-embedded-runner/run.ts`:

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

Innerhalb von `runEmbeddedAttempt()` (aufgerufen durch `runEmbeddedPiAgent()`) wird das pi SDK verwendet:

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

`subscribeEmbeddedPiSession()` abonniert die `AgentSession`-Ereignisse von pi:

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

Zu den verarbeiteten Ereignissen gehören:

- `message_start` / `message_end` / `message_update` (Streaming von Text/Denken)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Nach dem Setup wird die Sitzung mit einem Prompt versorgt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Das SDK übernimmt die vollständige Agent-Schleife: Senden an das LLM, Ausführen von Tool-Aufrufen, Streamen von Antworten.

Die Bildinjektion ist prompt-lokal: OpenClaw lädt Bildreferenzen aus dem aktuellen Prompt und übergibt sie nur für diesen Turn über `images`. Ältere Verlaufs-Turns werden nicht erneut gescannt, um Bild-Payloads erneut einzuspeisen.

## Tool-Architektur

### Tool-Pipeline

1. **Basistools**: `codingTools` von pi (`read`, `bash`, `edit`, `write`)
2. **Benutzerdefinierte Ersetzungen**: OpenClaw ersetzt bash durch `exec`/`process` und passt read/edit/write für die Sandbox an
3. **OpenClaw-Tools**: Messaging, Browser, Canvas, Sitzungen, Cron, Gateway usw.
4. **Kanal-Tools**: Discord-/Telegram-/Slack-/WhatsApp-spezifische Aktions-Tools
5. **Richtlinienfilterung**: Tools werden nach Profil-, Provider-, Agent-, Gruppen- und Sandbox-Richtlinien gefiltert
6. **Schema-Normalisierung**: Schemas werden für Gemini/OpenAI-Eigenheiten bereinigt
7. **AbortSignal-Wrapping**: Tools werden so gekapselt, dass sie Abort-Signale respektieren

### ToolDefinition-Adapter

`AgentTool` aus pi-agent-core hat eine andere `execute`-Signatur als `ToolDefinition` aus pi-coding-agent. Der Adapter in `pi-tool-definition-adapter.ts` überbrückt dies:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Tool-Aufteilungsstrategie

`splitSdkTools()` übergibt alle Tools über `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Dies stellt sicher, dass die Richtlinienfilterung, Sandbox-Integration und der erweiterte Tool-Satz von OpenClaw über alle Provider hinweg konsistent bleiben.

## Erstellung des System-Prompts

Der System-Prompt wird in `buildAgentSystemPrompt()` (`system-prompt.ts`) erstellt. Er setzt einen vollständigen Prompt aus Abschnitten zusammen, darunter Tooling, Tool Call Style, Safety guardrails, OpenClaw-CLI-Referenz, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Laufzeitmetadaten sowie Memory und Reactions, wenn aktiviert, und optional Kontextdateien sowie zusätzlicher Inhalt für den System-Prompt. Für den minimalen Prompt-Modus, der von Unteragenten verwendet wird, werden die Abschnitte gekürzt.

Der Prompt wird nach der Sitzungserstellung über `applySystemPromptOverrideToSession()` angewendet:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Sitzungsverwaltung

### Sitzungsdateien

Sitzungen sind JSONL-Dateien mit Baumstruktur (Verknüpfung über id/parentId). Der `SessionManager` von Pi übernimmt die Persistenz:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw kapselt dies mit `guardSessionManager()` für die Sicherheit von Tool-Ergebnissen.

### Sitzungs-Caching

`session-manager-cache.ts` cached `SessionManager`-Instanzen, um wiederholtes Parsen von Dateien zu vermeiden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Begrenzung des Verlaufs

`limitHistoryTurns()` kürzt den Gesprächsverlauf anhand des Kanaltyps (DM vs. Gruppe).

### Compaction

Automatische Compaction wird bei Kontextüberlauf ausgelöst. Häufige Überlauf-Signaturen
sind `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` und `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` verarbeitet manuelle
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentifizierung und Modellauflösung

### Auth-Profile

OpenClaw verwaltet einen Auth-Profilspeicher mit mehreren API-Schlüsseln pro Provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile werden bei Fehlern mit Cooldown-Tracking rotiert:

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

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` löst einen Modell-Fallback aus, wenn dies konfiguriert ist:

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

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` implementiert Cache-TTL-basiertes Context Pruning:

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

## Streaming und Blockantworten

### Block-Chunking

`EmbeddedBlockChunker` verwaltet das Streaming von Text in diskrete Antwortblöcke:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Entfernen von Thinking-/Final-Tags

Die Streaming-Ausgabe wird verarbeitet, um `<think>`-/`<thinking>`-Blöcke zu entfernen und den Inhalt von `<final>` zu extrahieren:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Antwortdirektiven

Antwortdirektiven wie `[[media:url]]`, `[[voice]]`, `[[reply:id]]` werden geparst und extrahiert:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Fehlerbehandlung

### Fehlerklassifizierung

`pi-embedded-helpers.ts` klassifiziert Fehler für eine geeignete Behandlung:

```typescript
isContextOverflowError(errorText)     // Kontext zu groß
isCompactionFailureError(errorText)   // Compaction fehlgeschlagen
isAuthAssistantError(lastAssistant)   // Auth-Fehler
isRateLimitAssistantError(...)        // Rate-Limit erreicht
isFailoverAssistantError(...)         // Sollte Failover auslösen
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking-Level-Fallback

Wenn ein Thinking-Level nicht unterstützt wird, wird auf einen Fallback zurückgegriffen:

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
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## Provider-spezifische Behandlung

### Anthropic

- Bereinigung von Refusal-Magic-Strings
- Turn-Validierung für aufeinanderfolgende Rollen
- Strikte vorgelagerte Validierung von Pi-Tool-Parametern

### Google/Gemini

- Bereinigung plugin-eigener Tool-Schemas

### OpenAI

- Tool `apply_patch` für Codex-Modelle
- Behandlung der Herabstufung von Thinking-Levels

## TUI-Integration

OpenClaw verfügt auch über einen lokalen TUI-Modus, der pi-tui-Komponenten direkt verwendet:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Dies bietet eine interaktive Terminal-Erfahrung ähnlich dem nativen Modus von Pi.

## Wichtige Unterschiede zur Pi-CLI

| Aspekt          | Pi CLI                  | OpenClaw Embedded                                                                                  |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Aufruf          | Befehl `pi` / RPC       | SDK über `createAgentSession()`                                                                    |
| Tools           | Standard-Coding-Tools   | Benutzerdefinierte OpenClaw-Tool-Suite                                                             |
| System-Prompt   | AGENTS.md + Prompts     | Dynamisch pro Kanal/Kontext                                                                        |
| Sitzungsspeicher | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oder `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Einzelne Anmeldedaten   | Mehrere Profile mit Rotation                                                                       |
| Erweiterungen   | Von Festplatte geladen  | Programmatisch + Festplattenpfade                                                                  |
| Ereignisbehandlung | TUI-Rendering        | Callback-basiert (onBlockReply usw.)                                                               |

## Zukünftige Überlegungen

Bereiche für mögliche Überarbeitung:

1. **Abgleich der Tool-Signaturen**: Derzeit Anpassung zwischen Signaturen von pi-agent-core und pi-coding-agent
2. **SessionManager-Wrapping**: `guardSessionManager` erhöht die Sicherheit, aber auch die Komplexität
3. **Laden von Erweiterungen**: Könnte den `ResourceLoader` von Pi direkter verwenden
4. **Komplexität des Streaming-Handlers**: `subscribeEmbeddedPiSession` ist umfangreich geworden
5. **Provider-Eigenheiten**: Viele provider-spezifische Codepfade, die Pi potenziell selbst behandeln könnte

## Tests

Die Testabdeckung der Pi-Integration umfasst diese Suites:

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

Live/Opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (aktivieren mit `OPENCLAW_LIVE_TEST=1`)

Aktuelle Ausführungsbefehle finden Sie unter [Pi-Entwicklungsworkflow](/de/pi-dev).

## Verwandt

- [Pi-Entwicklungsworkflow](/de/pi-dev)
- [Installationsübersicht](/de/install)
