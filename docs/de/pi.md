---
read_when:
    - Das Design der Pi-SDK-Integration in OpenClaw verstehen
    - Ändern des Lebenszyklus von Agentensitzungen, der Werkzeuginfrastruktur oder der Provider-Anbindung für Pi
summary: Architektur der eingebetteten Pi-Agenten-Integration von OpenClaw und des Sitzungslebenszyklus
title: Pi-Integrationsarchitektur
x-i18n:
    generated_at: "2026-05-10T19:41:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93f468416b453f4f3277406f5f40386748b7388502444266f611926cd66c96ba
    source_path: pi.md
    workflow: 16
---

OpenClaw integriert sich mit [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) und dessen Schwesterpaketen (`pi-ai`, `pi-agent-core`, `pi-tui`), um seine KI-Agent-Funktionen bereitzustellen.

## Überblick

OpenClaw verwendet das pi SDK, um einen KI-Coding-Agent in seine Messaging-Gateway-Architektur einzubetten. Anstatt pi als Unterprozess zu starten oder den RPC-Modus zu verwenden, importiert und instanziiert OpenClaw pi's `AgentSession` direkt über `createAgentSession()`. Dieser eingebettete Ansatz bietet:

- Vollständige Kontrolle über Sitzungslebenszyklus und Ereignisbehandlung
- Benutzerdefinierte Tool-Injektion (Messaging, Sandbox, kanalspezifische Aktionen)
- Anpassung des System-Prompts pro Kanal/Kontext
- Sitzungspersistenz mit Unterstützung für Branching/Compaction
- Rotation von Auth-Profilen für mehrere Konten mit Failover
- Provider-unabhängiger Modellwechsel

## Paketabhängigkeiten

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| Paket             | Zweck                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Kernabstraktionen für LLMs: `Model`, `streamSimple`, Nachrichtentypen, Provider-APIs                   |
| `pi-agent-core`   | Agent-Schleife, Tool-Ausführung, `AgentMessage`-Typen                                                  |
| `pi-coding-agent` | High-Level-SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, integrierte Tools |
| `pi-tui`          | Terminal-UI-Komponenten (verwendet im lokalen TUI-Modus von OpenClaw)                                  |

## Dateistruktur

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports from pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Main entry: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Single attempt logic with session setup
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # Build response payloads from run results
│   │   ├── images.ts              # Vision model image injection
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error detection
│   ├── cache-ttl.ts               # Cache TTL tracking for context pruning
│   ├── compact.ts                 # Manual/auto compaction logic
│   ├── extensions.ts              # Load pi extensions for embedded runs
│   ├── extra-params.ts            # Provider-specific stream params
│   ├── google.ts                  # Google/Gemini turn ordering fixes
│   ├── history.ts                 # History limiting (DM vs group)
│   ├── lanes.ts                   # Session/global command lanes
│   ├── logger.ts                  # Subsystem logger
│   ├── model.ts                   # Model resolution via ModelRegistry
│   ├── runs.ts                    # Active run tracking, abort, queue
│   ├── sandbox-info.ts            # Sandbox info for system prompt
│   ├── session-manager-cache.ts   # SessionManager instance caching
│   ├── session-manager-init.ts    # Session file initialization
│   ├── system-prompt.ts           # System prompt builder
│   ├── tool-split.ts              # Split tools into builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel mapping, error description
├── pi-embedded-subscribe.ts       # Session event subscription/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool sent tracking
├── pi-embedded-helpers.ts         # Error classification, turn validation
├── pi-embedded-helpers/           # Helper modules
├── pi-embedded-utils.ts           # Formatting utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal wrapping for tools
├── pi-tools.policy.ts             # Tool allowlist/denylist policy
├── pi-tools.read.ts               # Read tool customizations
├── pi-tools.schema.ts             # Tool schema normalization
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings overrides
├── pi-hooks/                      # Custom pi hooks
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile resolution
├── auth-profiles.ts               # Profile store, cooldown, failover
├── model-selection.ts             # Default model resolution
├── models-config.ts               # models.json generation
├── model-catalog.ts               # Model catalog cache
├── context-window-guard.ts        # Context window validation
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt parameter resolution
├── system-prompt-report.ts        # Debug report generation
├── tool-summaries.ts              # Tool description summaries
├── tool-policy.ts                 # Tool policy resolution
├── transcript-policy.ts           # Transcript validation policy
├── skills.ts                      # Skill snapshot/prompt building
├── skills/                        # Skill subsystem
├── sandbox.ts                     # Sandbox context resolution
├── sandbox/                       # Sandbox subsystem
├── channel-tools.ts               # Channel-specific tool injection
├── openclaw-tools.ts              # OpenClaw-specific tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # Individual tool implementations
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

Kanalspezifische Message-Action-Runtimes befinden sich jetzt in den Plugin-eigenen
Plugin-Verzeichnissen statt unter `src/agents/tools`, zum Beispiel:

- die Action-Runtime-Dateien des Discord-Plugins
- die Action-Runtime-Datei des Slack-Plugins
- die Action-Runtime-Datei des Telegram-Plugins
- die Action-Runtime-Datei des WhatsApp-Plugins

## Kernintegrationsablauf

### 1. Einen eingebetteten Agent ausführen

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

Innerhalb von `runEmbeddedAttempt()` (aufgerufen von `runEmbeddedPiAgent()`) wird das pi SDK verwendet:

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

`subscribeEmbeddedPiSession()` abonniert Ereignisse von pi's `AgentSession`:

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

- `message_start` / `message_end` / `message_update` (Streaming von Text/Thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Nach der Einrichtung erhält die Sitzung den Prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Das SDK übernimmt die vollständige Agent-Schleife: Senden an das LLM, Ausführen von Tool-Aufrufen, Streaming von Antworten.

Die Bildinjektion ist prompt-lokal: OpenClaw lädt Bildreferenzen aus dem aktuellen Prompt und
übergibt sie nur für diesen Turn über `images`. Ältere Historien-Turns werden nicht erneut
gescannt, um Bild-Payloads erneut zu injizieren.

## Tool-Architektur

### Tool-Pipeline

1. **Basistools**: pi's `codingTools` (read, bash, edit, write)
2. **Benutzerdefinierte Ersetzungen**: OpenClaw ersetzt bash durch `exec`/`process` und passt read/edit/write für die Sandbox an
3. **OpenClaw-Tools**: Messaging, Browser, Canvas, Sitzungen, Cron, Gateway usw.
4. **Kanaltools**: Discord-/Telegram-/Slack-/WhatsApp-spezifische Aktionstools
5. **Policy-Filterung**: Tools werden nach Profil, Provider, Agent, Gruppe und Sandbox-Policies gefiltert
6. **Schemanormalisierung**: Schemas werden für Gemini-/OpenAI-Besonderheiten bereinigt
7. **AbortSignal-Wrapping**: Tools werden umschlossen, damit sie Abort-Signale respektieren

### Tool-Definitionsadapter

pi-agent-core's `AgentTool` hat eine andere `execute`-Signatur als pi-coding-agent's `ToolDefinition`. Der Adapter in `pi-tool-definition-adapter.ts` überbrückt dies:

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

Dadurch bleiben OpenClaws Richtlinienfilterung, Sandbox-Integration und erweiterter Toolset über Provider hinweg konsistent.

## System-Prompt-Konstruktion

Der System-Prompt wird in `buildAgentSystemPrompt()` (`system-prompt.ts`) erstellt. Er setzt einen vollständigen Prompt aus Abschnitten wie Tooling, Tool-Aufrufstil, Sicherheitsleitplanken, OpenClaw-Steuerung, Skills, Dokumentation, Arbeitsbereich, Sandbox, Messaging, Ausgaberichtlinien für den Assistant, Stimme, stille Antworten, Heartbeats, Laufzeitmetadaten sowie Memory und Reaktionen, wenn aktiviert, und optionalen Kontextdateien und zusätzlichen System-Prompt-Inhalten zusammen. Abschnitte werden für den minimalen Prompt-Modus gekürzt, der von Subagents verwendet wird.

Der Prompt wird nach der Sitzungserstellung über `applySystemPromptOverrideToSession()` angewendet:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Sitzungsverwaltung

### Sitzungsdateien

Sitzungen sind JSONL-Dateien mit Baumstruktur (Verknüpfung über id/parentId). Pis `SessionManager` übernimmt die Persistenz:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw umschließt dies mit `guardSessionManager()` für die Sicherheit von Tool-Ergebnissen.

### Sitzungscaching

`session-manager-cache.ts` cached SessionManager-Instanzen, um wiederholtes Parsen von Dateien zu vermeiden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Verlaufsbegrenzung

`limitHistoryTurns()` kürzt den Gesprächsverlauf basierend auf dem Kanaltyp (DM vs. Gruppe).

### Compaction

Automatische Compaction wird bei Kontextüberlauf ausgelöst. Häufige Überlaufsignaturen
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

OpenClaw verwaltet einen Auth-Profil-Speicher mit mehreren API-Schlüsseln pro Provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotieren bei Fehlern mit Cooldown-Tracking:

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

`FailoverError` löst einen Modell-Fallback aus, wenn er konfiguriert ist:

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

### Compaction-Absicherung

`src/agents/pi-hooks/compaction-safeguard.ts` fügt Leitplanken für Compaction hinzu, einschließlich adaptiver Token-Budgetierung sowie Zusammenfassungen von Tool-Fehlern und Dateioperationen:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Kontextbereinigung

`src/agents/pi-hooks/context-pruning.ts` implementiert Cache-TTL-basierte Kontextbereinigung:

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

Streaming-Ausgabe wird verarbeitet, um `<think>`-/`<thinking>`-Blöcke zu entfernen und `<final>`-Inhalte zu extrahieren:

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

`pi-embedded-helpers.ts` klassifiziert Fehler für eine angemessene Behandlung:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking-Level-Fallback

Wenn ein Thinking-Level nicht unterstützt wird, wird darauf zurückgefallen:

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

- Bereinigung magischer Verweigerungsstrings
- Turn-Validierung für aufeinanderfolgende Rollen
- Strikte Upstream-Pi-Validierung von Tool-Parametern

### Google/Gemini

- Plugin-eigene Tool-Schema-Bereinigung

### OpenAI

- `apply_patch`-Tool für Codex-Modelle
- Behandlung von Thinking-Level-Downgrades

## TUI-Integration

OpenClaw hat außerdem einen lokalen TUI-Modus, der pi-tui-Komponenten direkt verwendet:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Dies bietet die interaktive Terminal-Erfahrung ähnlich dem nativen Modus von Pi.

## Wesentliche Unterschiede zur Pi CLI

| Aspekt              | Pi CLI                         | Eingebettetes OpenClaw                                                                         |
| ------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Aufruf              | `pi`-Befehl / RPC              | SDK über `createAgentSession()`                                                                |
| Tools               | Standard-Coding-Tools          | Benutzerdefinierte OpenClaw-Tool-Suite                                                         |
| System-Prompt       | AGENTS.md + Prompts            | Dynamisch pro Kanal/Kontext                                                                    |
| Sitzungsspeicherung | `~/.pi/agent/sessions/`        | `~/.openclaw/agents/<agentId>/sessions/` (oder `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth                | Einzelne Zugangsdaten          | Mehrere Profile mit Rotation                                                                   |
| Erweiterungen       | Von Festplatte geladen         | Programmatische + Festplattenpfade                                                             |
| Ereignisbehandlung  | TUI-Rendering                  | Callback-basiert (onBlockReply usw.)                                                           |

## Zukünftige Überlegungen

Bereiche für potenzielle Überarbeitung:

1. **Tool-Signatur-Abgleich**: Derzeitige Anpassung zwischen pi-agent-core- und pi-coding-agent-Signaturen
2. **SessionManager-Wrapper**: `guardSessionManager` erhöht die Sicherheit, aber auch die Komplexität
3. **Laden von Erweiterungen**: Könnte Pis `ResourceLoader` direkter verwenden
4. **Komplexität des Streaming-Handlers**: `subscribeEmbeddedPiSession` ist stark gewachsen
5. **Provider-Eigenheiten**: Viele Provider-spezifische Codepfade, die Pi potenziell übernehmen könnte

## Tests

Die Pi-Integrationsabdeckung umfasst diese Suiten:

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (mit `OPENCLAW_LIVE_TEST=1` aktivieren)

Aktuelle Ausführungsbefehle finden Sie unter [Pi-Entwicklungsworkflow](/de/pi-dev).

## Verwandt

- [Pi-Entwicklungsworkflow](/de/pi-dev)
- [Installationsübersicht](/de/install)
