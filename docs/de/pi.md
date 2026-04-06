---
read_when:
    - Das Design der Pi-SDK-Integration in OpenClaw verstehen
    - Den Sitzungslebenszyklus von Agenten, Tooling oder Provider-Verdrahtung für Pi ändern
summary: Architektur der eingebetteten Pi-Agent-Integration von OpenClaw und des Sitzungslebenszyklus
title: Architektur der Pi-Integration
x-i18n:
    generated_at: "2026-04-06T03:09:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28594290b018b7cc2963d33dbb7cec6a0bd817ac486dafad59dd2ccabd482582
    source_path: pi.md
    workflow: 15
---

# Architektur der Pi-Integration

Dieses Dokument beschreibt, wie OpenClaw sich mit [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) und den zugehörigen Paketen (`pi-ai`, `pi-agent-core`, `pi-tui`) integriert, um seine KI-Agent-Funktionen bereitzustellen.

## Überblick

OpenClaw verwendet das Pi SDK, um einen KI-Coding-Agent in seine Messaging-Gateway-Architektur einzubetten. Anstatt pi als Subprozess zu starten oder den RPC-Modus zu verwenden, importiert und instanziiert OpenClaw direkt Pis `AgentSession` über `createAgentSession()`. Dieser eingebettete Ansatz bietet:

- Vollständige Kontrolle über Sitzungslebenszyklus und Ereignisbehandlung
- Benutzerdefinierte Tool-Injektion (Messaging, Sandbox, kanalspezifische Aktionen)
- Anpassung des System-Prompts pro Kanal/Kontext
- Sitzungspersistenz mit Unterstützung für Verzweigung/Kompaktierung
- Rotation von Auth-Profilen für mehrere Konten mit Failover
- Provider-unabhängiges Umschalten von Modellen

## Paketabhängigkeiten

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Package           | Zweck                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Zentrale LLM-Abstraktionen: `Model`, `streamSimple`, Nachrichtentypen, Provider-APIs                         |
| `pi-agent-core`   | Agent-Loop, Tool-Ausführung, `AgentMessage`-Typen                                                             |
| `pi-coding-agent` | High-Level-SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, integrierte Tools    |
| `pi-tui`          | Komponenten für Terminal-UI (in OpenClaws lokalem TUI-Modus verwendet)                                        |

## Dateistruktur

```
src/agents/
├── pi-embedded-runner.ts          # Re-Exports aus pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Haupteinstieg: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logik für einen einzelnen Versuch mit Sitzungs-Setup
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Antwort-Payloads aus Laufergebnissen erstellen
│   │   ├── images.ts              # Bildinjektion für Vision-Modelle
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Erkennung von Abbruchfehlern
│   ├── cache-ttl.ts               # Verfolgung der Cache-TTL für Context Pruning
│   ├── compact.ts                 # Logik für manuelle/automatische Kompaktierung
│   ├── extensions.ts              # Pi-Erweiterungen für eingebettete Läufe laden
│   ├── extra-params.ts            # Provider-spezifische Stream-Parameter
│   ├── google.ts                  # Korrekturen der Turn-Reihenfolge für Google/Gemini
│   ├── history.ts                 # Verlaufsbegrenzung (DM vs Gruppe)
│   ├── lanes.ts                   # Session-/globale Befehlsspuren
│   ├── logger.ts                  # Subsystem-Logger
│   ├── model.ts                   # Modellauflösung über ModelRegistry
│   ├── runs.ts                    # Verfolgung aktiver Läufe, Abbruch, Warteschlange
│   ├── sandbox-info.ts            # Sandbox-Informationen für den System-Prompt
│   ├── session-manager-cache.ts   # Caching von SessionManager-Instanzen
│   ├── session-manager-init.ts    # Initialisierung von Sitzungsdateien
│   ├── system-prompt.ts           # Builder für System-Prompt
│   ├── tool-split.ts              # Tools in builtIn vs custom aufteilen
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel-Mapping, Fehlerbeschreibung
├── pi-embedded-subscribe.ts       # Sitzungsereignis-Abonnement/-Dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory für Event-Handler
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking blockweiser Streaming-Antworten
├── pi-embedded-messaging.ts       # Verfolgung gesendeter Nachrichten durch Messaging-Tool
├── pi-embedded-helpers.ts         # Fehlerklassifizierung, Turn-Validierung
├── pi-embedded-helpers/           # Hilfsmodule
├── pi-embedded-utils.ts           # Formatierungs-Hilfsfunktionen
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal-Wrapping für Tools
├── pi-tools.policy.ts             # Tool-Allowlist-/Denylist-Richtlinie
├── pi-tools.read.ts               # Anpassungen für Read-Tool
├── pi-tools.schema.ts             # Tool-Schema-Normalisierung
├── pi-tools.types.ts              # Type-Alias AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Überschreibungen für Einstellungen
├── pi-hooks/                      # Benutzerdefinierte Pi-Hooks
│   ├── compaction-safeguard.ts    # Safeguard-Erweiterung
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL-basierte Context-Pruning-Erweiterung
│   └── context-pruning/
├── model-auth.ts                  # Auflösung von Auth-Profilen
├── auth-profiles.ts               # Profilspeicher, Cooldown, Failover
├── model-selection.ts             # Auflösung des Standardmodells
├── models-config.ts               # Generierung von models.json
├── model-catalog.ts               # Cache für Modellkatalog
├── context-window-guard.ts        # Validierung des Kontextfensters
├── failover-error.ts              # Klasse FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Auflösung von System-Prompt-Parametern
├── system-prompt-report.ts        # Erzeugung von Debug-Berichten
├── tool-summaries.ts              # Zusammenfassungen von Tool-Beschreibungen
├── tool-policy.ts                 # Auflösung von Tool-Richtlinien
├── transcript-policy.ts           # Richtlinie für Transkriptvalidierung
├── skills.ts                      # Skill-Snapshot-/Prompt-Erstellung
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

Kanalspezifische Runtime-Dateien für Nachrichtenaktionen befinden sich jetzt in den
plugin-eigenen Erweiterungsverzeichnissen statt unter `src/agents/tools`, zum Beispiel:

- die Action-Runtime-Dateien des Discord-Plugins
- die Action-Runtime-Datei des Slack-Plugins
- die Action-Runtime-Datei des Telegram-Plugins
- die Action-Runtime-Datei des WhatsApp-Plugins

## Zentrale Integrationsabläufe

### 1. Einen eingebetteten Agenten ausführen

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

Innerhalb von `runEmbeddedAttempt()` (aufgerufen von `runEmbeddedPiAgent()`) wird das Pi SDK verwendet:

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

### 3. Event-Abonnement

`subscribeEmbeddedPiSession()` abonniert Pis `AgentSession`-Ereignisse:

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

Verarbeitete Ereignisse umfassen:

- `message_start` / `message_end` / `message_update` (Streaming von Text/Thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Prompting

Nach dem Setup wird die Sitzung mit einem Prompt versehen:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Das SDK verarbeitet den vollständigen Agent-Loop: Senden an das LLM, Ausführen von Tool-Aufrufen, Streamen von Antworten.

Die Bildinjektion ist promptlokal: OpenClaw lädt Bildreferenzen aus dem aktuellen Prompt und
übergibt sie nur für diesen Turn über `images`. Ältere Turns im Verlauf werden nicht erneut
gescannt, um Bild-Payloads erneut einzuspeisen.

## Tool-Architektur

### Tool-Pipeline

1. **Basistools**: Pis `codingTools` (read, bash, edit, write)
2. **Benutzerdefinierte Ersetzungen**: OpenClaw ersetzt bash durch `exec`/`process` und passt read/edit/write für die Sandbox an
3. **OpenClaw-Tools**: Messaging, Browser, Canvas, Sessions, Cron, Gateway usw.
4. **Kanal-Tools**: Discord-/Telegram-/Slack-/WhatsApp-spezifische Action-Tools
5. **Richtlinienfilterung**: Tools werden nach Profil-, Provider-, Agent-, Gruppen- und Sandbox-Richtlinien gefiltert
6. **Schema-Normalisierung**: Schemata werden für Gemini-/OpenAI-Besonderheiten bereinigt
7. **AbortSignal-Wrapping**: Tools werden so gewrappt, dass sie Abort-Signale beachten

### Adapter für Tool-Definitionen

`AgentTool` aus pi-agent-core hat eine andere `execute`-Signatur als `ToolDefinition` aus pi-coding-agent. Der Adapter in `pi-tool-definition-adapter.ts` überbrückt dies:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // Die Signatur von pi-coding-agent unterscheidet sich von pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategie für die Aufteilung von Tools

`splitSdkTools()` übergibt alle Tools über `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Leer. Wir überschreiben alles
    customTools: toToolDefinitions(options.tools),
  };
}
```

Dadurch bleiben OpenClaws Richtlinienfilterung, Sandbox-Integration und erweiterter Tool-Satz über alle Provider hinweg konsistent.

## Konstruktion des System-Prompts

Der System-Prompt wird in `buildAgentSystemPrompt()` (`system-prompt.ts`) erstellt. Er setzt einen vollständigen Prompt mit Abschnitten wie Tooling, Tool-Call-Stil, Sicherheitsleitplanken, OpenClaw-CLI-Referenz, Skills, Dokumentation, Workspace, Sandbox, Messaging, Antwort-Tags, Voice, stillen Antworten, Heartbeats, Runtime-Metadaten sowie Memory und Reactions, wenn aktiviert, und optionalen Kontextdateien und zusätzlichem System-Prompt-Inhalt zusammen. Abschnitte werden für den minimalen Prompt-Modus gekürzt, der von Subagents verwendet wird.

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

OpenClaw kapselt dies mit `guardSessionManager()` für die Sicherheit von Tool-Ergebnissen.

### Sitzungs-Caching

`session-manager-cache.ts` cached SessionManager-Instanzen, um wiederholtes Parsen von Dateien zu vermeiden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Verlaufsbegrenzung

`limitHistoryTurns()` kürzt den Gesprächsverlauf basierend auf dem Kanaltyp (DM vs Gruppe).

### Kompaktierung

Die automatische Kompaktierung wird bei Kontextüberlauf ausgelöst. Häufige Signaturen für einen Überlauf
umfassen `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` und `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` verarbeitet die manuelle
Kompaktierung:

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

Profile werden bei Fehlern mit Cooldown-Verfolgung rotiert:

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

// Verwendet Pis ModelRegistry und AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` löst Modell-Fallback aus, wenn es konfiguriert ist:

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

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` fügt Leitplanken zur Kompaktierung hinzu, einschließlich adaptiver Token-Budgetierung sowie Zusammenfassungen von Tool-Fehlern und Dateivorgängen:

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

## Streaming und Block-Antworten

### Block-Chunking

`EmbeddedBlockChunker` verwaltet Streaming-Text in diskrete Antwortblöcke:

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

`pi-embedded-helpers.ts` klassifiziert Fehler für eine passende Behandlung:

```typescript
isContextOverflowError(errorText)     // Kontext zu groß
isCompactionFailureError(errorText)   // Kompaktierung fehlgeschlagen
isAuthAssistantError(lastAssistant)   // Auth-Fehler
isRateLimitAssistantError(...)        // Rate-Limit erreicht
isFailoverAssistantError(...)         // Sollte Failover auslösen
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking-Level-Fallback

Wenn ein Thinking-Level nicht unterstützt wird, wird auf ein anderes zurückgefallen:

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

- Bereinigung des Refusal-Magic-Strings
- Turn-Validierung für aufeinanderfolgende Rollen
- Strikte vorgelagerte Pi-Validierung von Tool-Parametern

### Google/Gemini

- Plugin-eigene Bereinigung von Tool-Schemata

### OpenAI

- Tool `apply_patch` für Codex-Modelle
- Behandlung von Downgrade für Thinking-Level

## TUI-Integration

OpenClaw hat außerdem einen lokalen TUI-Modus, der Pi-TUI-Komponenten direkt verwendet:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Das bietet eine interaktive Terminal-Erfahrung ähnlich dem nativen Modus von pi.

## Wichtige Unterschiede zur Pi CLI

| Aspekt          | Pi CLI                  | OpenClaw Embedded                                                                                 |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Aufruf          | Befehl `pi` / RPC       | SDK über `createAgentSession()`                                                                   |
| Tools           | Standard-Coding-Tools   | Benutzerdefinierte OpenClaw-Tool-Suite                                                            |
| System-Prompt   | AGENTS.md + Prompts     | Dynamisch pro Kanal/Kontext                                                                       |
| Sitzungsspeicher | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oder `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Einzelne Zugangsdaten   | Mehrere Profile mit Rotation                                                                      |
| Erweiterungen   | Von Datenträger geladen | Programmatisch + Datenträgerpfade                                                                 |
| Event-Behandlung | TUI-Rendering          | Callback-basiert (`onBlockReply` usw.)                                                            |

## Zukünftige Überlegungen

Bereiche für mögliche Überarbeitungen:

1. **Ausrichtung der Tool-Signaturen**: Derzeit Anpassung zwischen den Signaturen von pi-agent-core und pi-coding-agent
2. **Wrapping von Session-Managern**: `guardSessionManager` fügt Sicherheit hinzu, erhöht aber die Komplexität
3. **Laden von Erweiterungen**: Könnte `ResourceLoader` von Pi direkter verwenden
4. **Komplexität der Streaming-Handler**: `subscribeEmbeddedPiSession` ist groß geworden
5. **Provider-Besonderheiten**: Viele Provider-spezifische Codepfade, die Pi möglicherweise selbst behandeln könnte

## Tests

Die Testabdeckung für die Pi-Integration umfasst diese Suites:

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

Aktuelle Ausführungsbefehle finden Sie unter [Pi Development Workflow](/de/pi-dev).
