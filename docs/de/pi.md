---
read_when:
    - Das Design der Pi-SDK-Integration in OpenClaw verstehen
    - Ändern des Sitzungslebenszyklus von Agenten, der Tooling oder der Provider-Verdrahtung für Pi
summary: Architektur der eingebetteten Pi-Agent-Integration von OpenClaw und des Sitzungslebenszyklus
title: Pi-Integrationsarchitektur
x-i18n:
    generated_at: "2026-04-22T04:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# Pi-Integrationsarchitektur

Dieses Dokument beschreibt, wie OpenClaw sich mit [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) und den zugehörigen Paketen (`pi-ai`, `pi-agent-core`, `pi-tui`) integriert, um seine KI-Agent-Funktionen bereitzustellen.

## Überblick

OpenClaw verwendet das Pi-SDK, um einen KI-Coding-Agent in seine Messaging-Gateway-Architektur einzubetten. Anstatt Pi als Subprozess zu starten oder den RPC-Modus zu verwenden, importiert und instanziiert OpenClaw direkt Pis `AgentSession` über `createAgentSession()`. Dieser eingebettete Ansatz bietet:

- Volle Kontrolle über den Sitzungslebenszyklus und die Ereignisbehandlung
- Benutzerdefinierte Tool-Injektion (Messaging, Sandbox, kanalspezifische Aktionen)
- Anpassung des System-Prompts pro Kanal/Kontext
- Sitzungspersistenz mit Unterstützung für Branching/Compaction
- Rotation mehrerer Auth-Profile pro Konto mit Failover
- Provider-agnostisches Umschalten von Modellen

## Paketabhängigkeiten

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Paket             | Zweck                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Kernabstraktionen für LLMs: `Model`, `streamSimple`, Nachrichtentypen, Provider-APIs                          |
| `pi-agent-core`   | Agent-Loop, Tool-Ausführung, Typen für `AgentMessage`                                                          |
| `pi-coding-agent` | Höherstufiges SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, integrierte Tools |
| `pi-tui`          | Komponenten für die Terminal-UI (werden im lokalen TUI-Modus von OpenClaw verwendet)                           |

## Dateistruktur

```
src/agents/
├── pi-embedded-runner.ts          # Re-Exporte aus pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Haupteinstieg: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logik für einen einzelnen Versuch mit Sitzungseinrichtung
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Antwort-Nutzlasten aus Laufergebnissen erstellen
│   │   ├── images.ts              # Bildinjektion für Vision-Modelle
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Erkennung von Abbruchfehlern
│   ├── cache-ttl.ts               # Verfolgung von Cache-TTL für Context-Pruning
│   ├── compact.ts                 # Logik für manuelle/automatische Compaction
│   ├── extensions.ts              # Pi-Erweiterungen für eingebettete Läufe laden
│   ├── extra-params.ts            # Provider-spezifische Stream-Parameter
│   ├── google.ts                  # Korrekturen der Reihenfolge von Turns für Google/Gemini
│   ├── history.ts                 # Begrenzung des Verlaufs (DM vs. Gruppe)
│   ├── lanes.ts                   # Lanes für Sitzung/globale Befehle
│   ├── logger.ts                  # Logger des Subsystems
│   ├── model.ts                   # Modellauflösung über ModelRegistry
│   ├── runs.ts                    # Verfolgung aktiver Läufe, Abbruch, Warteschlange
│   ├── sandbox-info.ts            # Sandbox-Informationen für den System-Prompt
│   ├── session-manager-cache.ts   # Caching von SessionManager-Instanzen
│   ├── session-manager-init.ts    # Initialisierung von Sitzungsdateien
│   ├── system-prompt.ts           # Builder für den System-Prompt
│   ├── tool-split.ts              # Aufteilen von Tools in builtIn vs. custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapping von ThinkLevel, Fehlerbeschreibung
├── pi-embedded-subscribe.ts       # Abonnement/Dispatch von Sitzungsereignissen
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory für Ereignis-Handler
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking von Streaming-Blockantworten
├── pi-embedded-messaging.ts       # Verfolgung gesendeter Messaging-Tools
├── pi-embedded-helpers.ts         # Fehlerklassifizierung, Validierung von Turns
├── pi-embedded-helpers/           # Hilfsmodule
├── pi-embedded-utils.ts           # Formatierungs-Utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal-Wrapping für Tools
├── pi-tools.policy.ts             # Richtlinie für Tool-Allowlist/Denylist
├── pi-tools.read.ts               # Anpassungen des Read-Tools
├── pi-tools.schema.ts             # Normalisierung des Tool-Schemas
├── pi-tools.types.ts              # Typalias AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Settings-Overrides
├── pi-hooks/                      # Benutzerdefinierte Pi-Hooks
│   ├── compaction-safeguard.ts    # Safeguard-Erweiterung
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL-Context-Pruning-Erweiterung
│   └── context-pruning/
├── model-auth.ts                  # Auflösung von Auth-Profilen
├── auth-profiles.ts               # Profilspeicher, Cooldown, Failover
├── model-selection.ts             # Auflösung des Standardmodells
├── models-config.ts               # Generierung von models.json
├── model-catalog.ts               # Cache für den Modellkatalog
├── context-window-guard.ts        # Validierung des Kontextfensters
├── failover-error.ts              # Klasse FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Auflösung der Parameter des System-Prompts
├── system-prompt-report.ts        # Generierung von Debug-Berichten
├── tool-summaries.ts              # Zusammenfassungen von Tool-Beschreibungen
├── tool-policy.ts                 # Auflösung von Tool-Richtlinien
├── transcript-policy.ts           # Richtlinie zur Validierung von Transkripten
├── skills.ts                      # Snapshot-/Prompt-Erstellung für Skills
├── skills/                        # Skills-Subsystem
├── sandbox.ts                     # Auflösung des Sandbox-Kontexts
├── sandbox/                       # Sandbox-Subsystem
├── channel-tools.ts               # Kanalspezifische Tool-Injektion
├── openclaw-tools.ts              # OpenClaw-spezifische Tools
├── bash-tools.ts                  # exec-/process-Tools
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

Kanalspezifische Laufzeitumgebungen für Nachrichtenaktionen liegen jetzt in den Plugin-eigenen Erweiterungsverzeichnissen statt unter `src/agents/tools`, zum Beispiel:

- die Laufzeitdateien für Aktionsruntimes des Discord-Plugins
- die Laufzeitdatei für Aktionen des Slack-Plugins
- die Laufzeitdatei für Aktionen des Telegram-Plugins
- die Laufzeitdatei für Aktionen des WhatsApp-Plugins

## Zentraler Integrationsablauf

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

Zu den behandelten Ereignissen gehören:

- `message_start` / `message_end` / `message_update` (Streaming von Text/Denken)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Nach der Einrichtung wird die Sitzung gepromptet:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Das SDK verarbeitet den vollständigen Agent-Loop: an das LLM senden, Tool-Aufrufe ausführen, Antworten streamen.

Die Bildinjektion ist promptlokal: OpenClaw lädt Bildreferenzen aus dem aktuellen Prompt und
übergibt sie über `images` nur für diesen Turn. Es durchsucht nicht erneut ältere Verlaufsturns,
um Bild-Nutzlasten erneut zu injizieren.

## Tool-Architektur

### Tool-Pipeline

1. **Basis-Tools**: Pis `codingTools` (read, bash, edit, write)
2. **Benutzerdefinierte Ersetzungen**: OpenClaw ersetzt bash durch `exec`/`process`, passt read/edit/write für die Sandbox an
3. **OpenClaw-Tools**: Messaging, Browser, Canvas, Sitzungen, Cron, Gateway usw.
4. **Kanal-Tools**: Aktions-Tools speziell für Discord/Telegram/Slack/WhatsApp
5. **Richtlinienfilterung**: Tools werden nach Profil-, Provider-, Agent-, Gruppen- und Sandbox-Richtlinien gefiltert
6. **Schema-Normalisierung**: Schemata werden für Besonderheiten von Gemini/OpenAI bereinigt
7. **AbortSignal-Wrapping**: Tools werden so umschlossen, dass sie Abort-Signale beachten

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

### Strategie zur Aufteilung von Tools

`splitSdkTools()` übergibt alle Tools über `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Leer. Wir überschreiben alles
    customTools: toToolDefinitions(options.tools),
  };
}
```

Dies stellt sicher, dass die Richtlinienfilterung, Sandbox-Integration und der erweiterte Tool-Satz von OpenClaw providerübergreifend konsistent bleiben.

## Aufbau des System-Prompts

Der System-Prompt wird in `buildAgentSystemPrompt()` (`system-prompt.ts`) erstellt. Er setzt einen vollständigen Prompt mit Abschnitten zusammen, darunter Tooling, Tool-Aufrufstil, Safety-Leitplanken, OpenClaw-CLI-Referenz, Skills, Dokumentation, Workspace, Sandbox, Messaging, Antwort-Tags, Voice, stille Antworten, Heartbeat, Laufzeitmetadaten sowie Memory und Reactions, wenn aktiviert, und optionalen Kontextdateien und zusätzlichem System-Prompt-Inhalt. Für den minimalen Prompt-Modus, der von Subagenten verwendet wird, werden Abschnitte gekürzt.

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

### Sitzungs-Caching

`session-manager-cache.ts` cached SessionManager-Instanzen, um wiederholtes Parsen von Dateien zu vermeiden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Begrenzung des Verlaufs

`limitHistoryTurns()` kürzt den Gesprächsverlauf basierend auf dem Kanaltyp (DM vs. Gruppe).

### Compaction

Automatische Compaction wird bei Kontextüberlauf ausgelöst. Häufige Überlauf-Signaturen
sind `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` und `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` behandelt die manuelle
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

// Verwendet Pis ModelRegistry und AuthStorage
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

### Compaction-Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` fügt Compaction Leitplanken hinzu, einschließlich adaptiver Token-Budgetierung sowie Zusammenfassungen von Tool-Fehlern und Dateivorgängen:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context-Pruning

`src/agents/pi-hooks/context-pruning.ts` implementiert Cache-TTL-basiertes Context-Pruning:

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

`EmbeddedBlockChunker` verwaltet Streaming-Text in diskrete Antwortblöcke:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Entfernen von Thinking-/Final-Tags

Die Streaming-Ausgabe wird verarbeitet, um `<think>`-/`<thinking>`-Blöcke zu entfernen und `<final>`-Inhalt zu extrahieren:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Inhalt von <think>...</think> entfernen
  // Wenn enforceFinalTag gesetzt ist, nur Inhalt von <final>...</final> zurückgeben
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
isContextOverflowError(errorText)     // Kontext zu groß
isCompactionFailureError(errorText)   // Compaction fehlgeschlagen
isAuthAssistantError(lastAssistant)   // Auth-Fehler
isRateLimitAssistantError(...)        // Rate-Limit erreicht
isFailoverAssistantError(...)         // Sollte auf Failover umschalten
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback für Thinking-Level

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
  // Sandboxed read/edit/write-Tools verwenden
  // Exec läuft im Container
  // Browser verwendet Bridge-URL
}
```

## Provider-spezifische Behandlung

### Anthropic

- Bereinigung des Magic Strings für Verweigerungen
- Validierung von Turns für aufeinanderfolgende Rollen
- Strikte vorgelagerte Pi-Validierung von Tool-Parametern

### Google/Gemini

- Plugin-eigene Bereinigung des Tool-Schemas

### OpenAI

- Tool `apply_patch` für Codex-Modelle
- Behandlung der Herabstufung von Thinking-Leveln

## TUI-Integration

OpenClaw hat außerdem einen lokalen TUI-Modus, der Komponenten von pi-tui direkt verwendet:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Dies bietet die interaktive Terminal-Erfahrung ähnlich zu Pis nativem Modus.

## Wichtige Unterschiede zur Pi-CLI

| Aspekt          | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Aufruf          | `pi`-Befehl / RPC       | SDK über `createAgentSession()`                                                                |
| Tools           | Standard-Coding-Tools   | Benutzerdefinierte OpenClaw-Tool-Suite                                                         |
| System-Prompt   | AGENTS.md + Prompts     | Dynamisch pro Kanal/Kontext                                                                    |
| Sitzungsspeicher | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oder `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Einzelne Anmeldedaten   | Mehrere Profile mit Rotation                                                                   |
| Erweiterungen   | Von der Festplatte geladen | Programmatisch + Festplattenpfade                                                           |
| Ereignisbehandlung | TUI-Rendering        | Callback-basiert (`onBlockReply` usw.)                                                         |

## Zukünftige Überlegungen

Bereiche für mögliche Überarbeitungen:

1. **Abgleich der Tool-Signaturen**: Derzeit Anpassung zwischen den Signaturen von pi-agent-core und pi-coding-agent
2. **Umschließen des Session Managers**: `guardSessionManager` erhöht die Sicherheit, aber auch die Komplexität
3. **Laden von Erweiterungen**: Könnte Pis `ResourceLoader` direkter verwenden
4. **Komplexität des Streaming-Handlers**: `subscribeEmbeddedPiSession` ist umfangreich geworden
5. **Provider-Besonderheiten**: Viele provider-spezifische Codepfade, die Pi möglicherweise selbst behandeln könnte

## Tests

Die Abdeckung der Pi-Integration umfasst diese Suites:

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` aktivieren)

Für aktuelle Ausführungsbefehle siehe [Pi Development Workflow](/de/pi-dev).
