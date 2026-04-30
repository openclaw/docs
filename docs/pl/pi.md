---
read_when:
    - Zrozumienie projektu integracji Pi SDK w OpenClaw
    - Modyfikowanie cyklu życia sesji agenta, narzędzi lub konfiguracji dostawców dla Pi
summary: Architektura integracji wbudowanego agenta Pi w OpenClaw i cyklu życia sesji
title: Architektura integracji z Pi
x-i18n:
    generated_at: "2026-04-30T10:03:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw integruje się z [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) i jego siostrzanymi pakietami (`pi-ai`, `pi-agent-core`, `pi-tui`), aby zasilać swoje możliwości agenta AI.

## Omówienie

OpenClaw używa pi SDK, aby osadzić agenta kodującego AI w swojej architekturze bramy komunikacyjnej. Zamiast uruchamiać pi jako podproces lub używać trybu RPC, OpenClaw bezpośrednio importuje i tworzy instancję `AgentSession` z pi przez `createAgentSession()`. To podejście osadzone zapewnia:

- Pełną kontrolę nad cyklem życia sesji i obsługą zdarzeń
- Wstrzykiwanie niestandardowych narzędzi (wiadomości, piaskownica, działania specyficzne dla kanału)
- Dostosowywanie promptu systemowego dla każdego kanału/kontekstu
- Trwałość sesji z obsługą rozgałęziania/Compaction
- Rotację profili uwierzytelniania wielu kont z przełączaniem awaryjnym
- Przełączanie modeli niezależne od dostawcy

## Zależności pakietów

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Pakiet            | Przeznaczenie                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Podstawowe abstrakcje LLM: `Model`, `streamSimple`, typy wiadomości, API dostawców                     |
| `pi-agent-core`   | Pętla agenta, wykonywanie narzędzi, typy `AgentMessage`                                                |
| `pi-coding-agent` | Wysokopoziomowe SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, wbudowane narzędzia |
| `pi-tui`          | Komponenty interfejsu terminala (używane w lokalnym trybie TUI OpenClaw)                               |

## Struktura plików

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

Środowiska uruchomieniowe działań wiadomości specyficznych dla kanału znajdują się teraz w katalogach rozszerzeń należących do Plugin, a nie pod `src/agents/tools`, na przykład:

- pliki środowiska uruchomieniowego działań Plugin Discord
- plik środowiska uruchomieniowego działań Plugin Slack
- plik środowiska uruchomieniowego działań Plugin Telegram
- plik środowiska uruchomieniowego działań Plugin WhatsApp

## Podstawowy przepływ integracji

### 1. Uruchamianie osadzonego agenta

Głównym punktem wejścia jest `runEmbeddedPiAgent()` w `pi-embedded-runner/run.ts`:

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

### 2. Tworzenie sesji

Wewnątrz `runEmbeddedAttempt()` (wywoływanego przez `runEmbeddedPiAgent()`) używane jest pi SDK:

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

### 3. Subskrypcja zdarzeń

`subscribeEmbeddedPiSession()` subskrybuje zdarzenia `AgentSession` z pi:

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

Obsługiwane zdarzenia obejmują:

- `message_start` / `message_end` / `message_update` (strumieniowanie tekstu/myślenia)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Promptowanie

Po konfiguracji sesja otrzymuje prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK obsługuje pełną pętlę agenta: wysyłanie do LLM, wykonywanie wywołań narzędzi, strumieniowanie odpowiedzi.

Wstrzykiwanie obrazów jest lokalne dla promptu: OpenClaw ładuje referencje obrazów z bieżącego promptu i przekazuje je przez `images` tylko dla tej tury. Nie skanuje ponownie starszych tur historii, aby ponownie wstrzykiwać ładunki obrazów.

## Architektura narzędzi

### Potok narzędzi

1. **Narzędzia bazowe**: `codingTools` z pi (read, bash, edit, write)
2. **Niestandardowe zamienniki**: OpenClaw zastępuje bash przez `exec`/`process`, dostosowuje read/edit/write dla piaskownicy
3. **Narzędzia OpenClaw**: wiadomości, przeglądarka, canvas, sesje, cron, gateway itd.
4. **Narzędzia kanałów**: narzędzia działań specyficzne dla Discord/Telegram/Slack/WhatsApp
5. **Filtrowanie zasad**: narzędzia filtrowane według profilu, dostawcy, agenta, grupy i zasad piaskownicy
6. **Normalizacja schematów**: schematy czyszczone pod kątem specyfiki Gemini/OpenAI
7. **Opakowywanie AbortSignal**: narzędzia opakowane tak, aby respektować sygnały przerwania

### Adapter definicji narzędzi

`AgentTool` z pi-agent-core ma inną sygnaturę `execute` niż `ToolDefinition` z pi-coding-agent. Adapter w `pi-tool-definition-adapter.ts` łączy te interfejsy:

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

### Strategia podziału narzędzi

`splitSdkTools()` przekazuje wszystkie narzędzia przez `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

To zapewnia, że filtrowanie zasad OpenClaw, integracja z sandboxem i rozszerzony zestaw narzędzi pozostają spójne między providerami.

## Konstrukcja promptu systemowego

Prompt systemowy jest budowany w `buildAgentSystemPrompt()` (`system-prompt.ts`). Składa pełny prompt z sekcjami obejmującymi narzędzia, styl wywołań narzędzi, zabezpieczenia bezpieczeństwa, referencję OpenClaw CLI, Skills, dokumentację, workspace, sandbox, wiadomości, tagi odpowiedzi, głos, ciche odpowiedzi, Heartbeats, metadane runtime, a także Memory i Reactions, gdy są włączone, oraz opcjonalne pliki kontekstu i dodatkową treść promptu systemowego. Sekcje są przycinane dla minimalnego trybu promptu używanego przez subagentów.

Prompt jest stosowany po utworzeniu sesji przez `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Zarządzanie sesjami

### Pliki sesji

Sesje są plikami JSONL ze strukturą drzewa (powiązanie id/parentId). `SessionManager` Pi obsługuje utrwalanie:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw opakowuje to przez `guardSessionManager()` dla bezpieczeństwa wyników narzędzi.

### Buforowanie sesji

`session-manager-cache.ts` buforuje instancje SessionManager, aby uniknąć wielokrotnego parsowania plików:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Ograniczanie historii

`limitHistoryTurns()` przycina historię rozmowy na podstawie typu kanału (DM vs grupa).

### Compaction

Automatyczna Compaction uruchamia się przy przepełnieniu kontekstu. Typowe sygnatury przepełnienia obejmują `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` oraz `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` obsługuje ręczną Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Uwierzytelnianie i rozpoznawanie modeli

### Profile uwierzytelniania

OpenClaw utrzymuje magazyn profili uwierzytelniania z wieloma kluczami API na providera:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotują po awariach ze śledzeniem cooldownu:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Rozpoznawanie modelu

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

`FailoverError` uruchamia fallback modelu, gdy jest skonfigurowany:

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

## Rozszerzenia Pi

OpenClaw ładuje niestandardowe rozszerzenia Pi dla wyspecjalizowanego zachowania:

### Zabezpieczenie Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` dodaje zabezpieczenia do Compaction, w tym adaptacyjne budżetowanie tokenów oraz podsumowania awarii narzędzi i operacji na plikach:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Przycinanie kontekstu

`src/agents/pi-hooks/context-pruning.ts` implementuje przycinanie kontekstu oparte na TTL cache:

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

## Streaming i odpowiedzi blokowe

### Dzielenie bloków

`EmbeddedBlockChunker` zarządza streamowaniem tekstu do odrębnych bloków odpowiedzi:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Usuwanie tagów myślenia/końcowych

Wynik streamowania jest przetwarzany w celu usunięcia bloków `<think>`/`<thinking>` i wyodrębnienia treści `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Dyrektywy odpowiedzi

Dyrektywy odpowiedzi, takie jak `[[media:url]]`, `[[voice]]`, `[[reply:id]]`, są parsowane i wyodrębniane:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Obsługa błędów

### Klasyfikacja błędów

`pi-embedded-helpers.ts` klasyfikuje błędy do odpowiedniej obsługi:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback poziomu myślenia

Jeśli poziom myślenia nie jest obsługiwany, następuje fallback:

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

## Integracja z sandboxem

Gdy tryb sandbox jest włączony, narzędzia i ścieżki są ograniczane:

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

## Obsługa specyficzna dla providera

### Anthropic

- Czyszczenie magicznego ciągu odmowy
- Walidacja tur dla kolejnych ról
- Ścisła walidacja parametrów narzędzi upstream Pi

### Google/Gemini

- Sanityzacja schematu narzędzi należąca do Plugin

### OpenAI

- Narzędzie `apply_patch` dla modeli Codex
- Obsługa obniżania poziomu myślenia

## Integracja TUI

OpenClaw ma także lokalny tryb TUI, który bezpośrednio używa komponentów pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Zapewnia to interaktywne doświadczenie terminalowe podobne do natywnego trybu Pi.

## Kluczowe różnice względem Pi CLI

| Aspekt          | Pi CLI                  | Osadzony OpenClaw                                                                               |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Wywołanie       | polecenie `pi` / RPC    | SDK przez `createAgentSession()`                                                                |
| Narzędzia       | Domyślne narzędzia kodowania | Niestandardowy zestaw narzędzi OpenClaw                                                    |
| Prompt systemowy | AGENTS.md + prompty    | Dynamiczny według kanału/kontekstu                                                              |
| Przechowywanie sesji | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (lub `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Uwierzytelnianie | Pojedyncze poświadczenie | Wiele profili z rotacją                                                                       |
| Rozszerzenia    | Ładowane z dysku        | Programowe + ścieżki dyskowe                                                                    |
| Obsługa zdarzeń | Renderowanie TUI        | Oparta na callbackach (onBlockReply itd.)                                                       |

## Przyszłe kwestie

Obszary potencjalnych zmian:

1. **Wyrównanie sygnatur narzędzi**: obecnie adaptacja między sygnaturami pi-agent-core i pi-coding-agent
2. **Opakowanie menedżera sesji**: `guardSessionManager` dodaje bezpieczeństwo, ale zwiększa złożoność
3. **Ładowanie rozszerzeń**: można używać `ResourceLoader` Pi bardziej bezpośrednio
4. **Złożoność handlera streamingu**: `subscribeEmbeddedPiSession` znacznie się rozrósł
5. **Osobliwości providerów**: wiele ścieżek kodu specyficznych dla providerów, które Pi mógłby potencjalnie obsłużyć

## Testy

Pokrycie integracji Pi obejmuje te zestawy:

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

Na żywo/opcjonalne:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (włącz `OPENCLAW_LIVE_TEST=1`)

Aktualne polecenia uruchamiania znajdziesz w [Workflow rozwoju Pi](/pl/pi-dev).

## Powiązane

- [Workflow rozwoju Pi](/pl/pi-dev)
- [Przegląd instalacji](/pl/install)
