---
read_when:
    - Zrozumienie projektu integracji Pi SDK w OpenClaw
    - Modyfikowanie cyklu życia sesji agenta, narzędzi lub połączeń providera dla Pi
summary: Architektura osadzonej integracji agenta Pi w OpenClaw i cyklu życia sesji
title: Architektura integracji Pi
x-i18n:
    generated_at: "2026-04-22T04:24:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# Architektura integracji Pi

Ten dokument opisuje, jak OpenClaw integruje się z [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) i jego siostrzanymi pakietami (`pi-ai`, `pi-agent-core`, `pi-tui`), aby obsługiwać możliwości swojego agenta AI.

## Przegląd

OpenClaw używa SDK Pi do osadzenia agenta kodującego AI w swojej architekturze Gateway wiadomości. Zamiast uruchamiać Pi jako podproces lub używać trybu RPC, OpenClaw bezpośrednio importuje i tworzy instancję `AgentSession` Pi przez `createAgentSession()`. To osadzone podejście zapewnia:

- Pełną kontrolę nad cyklem życia sesji i obsługą zdarzeń
- Wstrzykiwanie niestandardowych narzędzi (wiadomości, sandbox, akcje specyficzne dla kanału)
- Dostosowanie system promptu dla kanału/kontekstu
- Trwałość sesji z obsługą branching/Compaction
- Rotację profili uwierzytelniania wielokontowego z failover
- Niezależne od providera przełączanie modeli

## Zależności pakietów

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Pakiet            | Cel                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Podstawowe abstrakcje LLM: `Model`, `streamSimple`, typy wiadomości, API providerów                   |
| `pi-agent-core`   | Pętla agenta, wykonywanie narzędzi, typy `AgentMessage`                                                |
| `pi-coding-agent` | SDK wysokiego poziomu: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, wbudowane narzędzia |
| `pi-tui`          | Komponenty terminalowego UI (używane w lokalnym trybie TUI OpenClaw)                                   |

## Struktura plików

```
src/agents/
├── pi-embedded-runner.ts          # Reeksporty z pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Główne wejście: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika pojedynczej próby z konfiguracją sesji
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Budowanie payloadów odpowiedzi z wyników uruchomienia
│   │   ├── images.ts              # Wstrzykiwanie obrazów do modelu vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Wykrywanie błędów przerwania
│   ├── cache-ttl.ts               # Śledzenie TTL cache dla przycinania kontekstu
│   ├── compact.ts                 # Ręczna/automatyczna logika Compaction
│   ├── extensions.ts              # Ładowanie rozszerzeń Pi dla osadzonych uruchomień
│   ├── extra-params.ts            # Parametry strumieniowania specyficzne dla providera
│   ├── google.ts                  # Poprawki kolejności tur dla Google/Gemini
│   ├── history.ts                 # Ograniczanie historii (wiadomości prywatne vs grupy)
│   ├── lanes.ts                   # Ścieżki poleceń sesji/globalne
│   ├── logger.ts                  # Logger podsystemu
│   ├── model.ts                   # Rozwiązywanie modelu przez ModelRegistry
│   ├── runs.ts                    # Śledzenie aktywnych uruchomień, przerwanie, kolejka
│   ├── sandbox-info.ts            # Informacje o sandboxie do system promptu
│   ├── session-manager-cache.ts   # Cache instancji SessionManager
│   ├── session-manager-init.ts    # Inicjalizacja plików sesji
│   ├── system-prompt.ts           # Konstruktor system promptu
│   ├── tool-split.ts              # Podział narzędzi na builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapowanie ThinkLevel, opis błędów
├── pi-embedded-subscribe.ts       # Subskrypcja/wysyłanie zdarzeń sesji
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabryka handlerów zdarzeń
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Dzielenie blokowych odpowiedzi strumieniowych na części
├── pi-embedded-messaging.ts       # Śledzenie wysyłek narzędzia wiadomości
├── pi-embedded-helpers.ts         # Klasyfikacja błędów, walidacja tur
├── pi-embedded-helpers/           # Moduły pomocnicze
├── pi-embedded-utils.ts           # Narzędzia formatujące
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Opakowywanie AbortSignal dla narzędzi
├── pi-tools.policy.ts             # Polityka listy dozwolonych/zabronionych narzędzi
├── pi-tools.read.ts               # Dostosowania narzędzia read
├── pi-tools.schema.ts             # Normalizacja schematu narzędzi
├── pi-tools.types.ts              # Alias typu AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Nadpisania ustawień
├── pi-hooks/                      # Niestandardowe hooki Pi
│   ├── compaction-safeguard.ts    # Rozszerzenie zabezpieczające
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Rozszerzenie przycinania kontekstu Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Rozwiązywanie profilu uwierzytelniania
├── auth-profiles.ts               # Magazyn profili, cooldown, failover
├── model-selection.ts             # Rozwiązywanie modelu domyślnego
├── models-config.ts               # Generowanie models.json
├── model-catalog.ts               # Cache katalogu modeli
├── context-window-guard.ts        # Walidacja okna kontekstu
├── failover-error.ts              # Klasa FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Rozwiązywanie parametrów system promptu
├── system-prompt-report.ts        # Generowanie raportu debugowego
├── tool-summaries.ts              # Podsumowania opisów narzędzi
├── tool-policy.ts                 # Rozwiązywanie polityki narzędzi
├── transcript-policy.ts           # Polityka walidacji transkryptu
├── skills.ts                      # Budowanie migawek/promptów Skills
├── skills/                        # Podsystem Skills
├── sandbox.ts                     # Rozwiązywanie kontekstu sandboxa
├── sandbox/                       # Podsystem sandboxa
├── channel-tools.ts               # Wstrzykiwanie narzędzi specyficznych dla kanału
├── openclaw-tools.ts              # Narzędzia specyficzne dla OpenClaw
├── bash-tools.ts                  # Narzędzia exec/process
├── apply-patch.ts                 # Narzędzie apply_patch (OpenAI)
├── tools/                         # Implementacje poszczególnych narzędzi
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

Runtimy akcji wiadomości specyficzne dla kanału znajdują się teraz w należących do pluginów
katalogach rozszerzeń zamiast w `src/agents/tools`, na przykład:

- pliki runtime akcji pluginu Discord
- plik runtime akcji pluginu Slack
- plik runtime akcji pluginu Telegram
- plik runtime akcji pluginu WhatsApp

## Główny przepływ integracji

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

Wewnątrz `runEmbeddedAttempt()` (wywoływanego przez `runEmbeddedPiAgent()`) używane jest SDK Pi:

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

`subscribeEmbeddedPiSession()` subskrybuje zdarzenia `AgentSession` z Pi:

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

Wstrzykiwanie obrazów jest lokalne dla promptu: OpenClaw ładuje referencje obrazów z bieżącego promptu i
przekazuje je przez `images` tylko dla tej tury. Nie skanuje ponownie starszych tur historii
w celu ponownego wstrzyknięcia payloadów obrazów.

## Architektura narzędzi

### Pipeline narzędzi

1. **Narzędzia bazowe**: `codingTools` z Pi (`read`, `bash`, `edit`, `write`)
2. **Niestandardowe zamienniki**: OpenClaw zastępuje `bash` przez `exec`/`process`, dostosowuje `read`/`edit`/`write` pod sandbox
3. **Narzędzia OpenClaw**: wiadomości, browser, canvas, sesje, Cron, Gateway itd.
4. **Narzędzia kanałów**: narzędzia akcji specyficzne dla Discord/Telegram/Slack/WhatsApp
5. **Filtrowanie polityk**: narzędzia filtrowane według profilu, providera, agenta, grupy i polityk sandboxa
6. **Normalizacja schematu**: schematy czyszczone pod kątem specyfiki Gemini/OpenAI
7. **Opakowywanie AbortSignal**: narzędzia opakowywane tak, aby respektowały sygnały przerwania

### Adapter definicji narzędzi

`AgentTool` z pi-agent-core ma inną sygnaturę `execute` niż `ToolDefinition` z pi-coding-agent. Adapter w `pi-tool-definition-adapter.ts` łączy te dwa światy:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // sygnatura pi-coding-agent różni się od pi-agent-core
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
    builtInTools: [], // Puste. Nadpisujemy wszystko
    customTools: toToolDefinitions(options.tools),
  };
}
```

To zapewnia, że filtrowanie polityk OpenClaw, integracja sandboxa i rozszerzony zestaw narzędzi pozostają spójne między providerami.

## Budowanie system promptu

System prompt jest budowany w `buildAgentSystemPrompt()` (`system-prompt.ts`). Składa on pełny prompt z sekcjami obejmującymi Tooling, Tool Call Style, zabezpieczenia Safety, referencję CLI OpenClaw, Skills, dokumentację, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeat, metadane runtime, a także Memory i Reactions, gdy są włączone, plus opcjonalne pliki kontekstowe i dodatkową zawartość system promptu. Sekcje są przycinane dla minimalnego trybu promptu używanego przez subagentów.

Prompt jest stosowany po utworzeniu sesji przez `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Zarządzanie sesją

### Pliki sesji

Sesje są plikami JSONL o strukturze drzewa (łączenie przez id/parentId). Trwałość obsługuje `SessionManager` z Pi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw opakowuje to przez `guardSessionManager()` dla bezpieczeństwa wyników narzędzi.

### Cache sesji

`session-manager-cache.ts` przechowuje instancje SessionManager w cache, aby uniknąć wielokrotnego parsowania plików:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Ograniczanie historii

`limitHistoryTurns()` przycina historię konwersacji zależnie od typu kanału (wiadomości prywatne vs grupa).

### Compaction

Automatyczny Compaction uruchamia się przy przepełnieniu kontekstu. Typowe sygnatury
przepełnienia obejmują `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` oraz `ollama error: context
length exceeded`. Ręczny Compaction obsługuje `compactEmbeddedPiSessionDirect()`:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Uwierzytelnianie i rozwiązywanie modeli

### Profile uwierzytelniania

OpenClaw utrzymuje magazyn profili uwierzytelniania z wieloma kluczami API na providera:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotują po awariach z użyciem śledzenia cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Rozwiązywanie modeli

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Używa ModelRegistry i AuthStorage z Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` wyzwala fallback modelu, gdy jest skonfigurowany:

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

`src/agents/pi-hooks/context-pruning.ts` implementuje przycinanie kontekstu oparte na Cache-TTL:

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

## Strumieniowanie i odpowiedzi blokowe

### Dzielenie bloków na części

`EmbeddedBlockChunker` zarządza strumieniowaniem tekstu do oddzielnych bloków odpowiedzi:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Usuwanie tagów thinking/final

Wyjście strumieniowe jest przetwarzane w celu usunięcia bloków `<think>`/`<thinking>` i wyodrębnienia zawartości `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Usuń zawartość <think>...</think>
  // Jeśli enforceFinalTag, zwracaj tylko zawartość <final>...</final>
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
isContextOverflowError(errorText)     // Zbyt duży kontekst
isCompactionFailureError(errorText)   // Compaction nie powiódł się
isAuthAssistantError(lastAssistant)   // Awaria uwierzytelniania
isRateLimitAssistantError(...)        // Osiągnięto limit szybkości
isFailoverAssistantError(...)         // Należy wykonać failover
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

## Integracja sandboxa

Gdy tryb sandboxa jest włączony, narzędzia i ścieżki są ograniczone:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Użyj narzędzi read/edit/write działających w sandboxie
  // Exec działa w kontenerze
  // Browser używa URL bridge
}
```

## Obsługa specyficzna dla providera

### Anthropic

- Usuwanie magicznego ciągu odmowy
- Walidacja tur dla kolejnych ról
- Ścisła walidacja parametrów narzędzi Pi po stronie upstream

### Google/Gemini

- Sanitizacja schematu narzędzi należących do pluginów

### OpenAI

- Narzędzie `apply_patch` dla modeli Codex
- Obsługa obniżenia poziomu myślenia

## Integracja TUI

OpenClaw ma też lokalny tryb TUI, który bezpośrednio używa komponentów pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Zapewnia to interaktywne środowisko terminalowe podobne do natywnego trybu Pi.

## Kluczowe różnice względem Pi CLI

| Aspekt          | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Wywołanie       | polecenie `pi` / RPC    | SDK przez `createAgentSession()`                                                               |
| Narzędzia       | Domyślne narzędzia kodujące | Niestandardowy zestaw narzędzi OpenClaw                                                    |
| System prompt   | AGENTS.md + prompty     | Dynamiczny per kanał/kontekst                                                                  |
| Przechowywanie sesji | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (lub `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Jedno poświadczenie     | Wiele profili z rotacją                                                                        |
| Rozszerzenia    | Ładowane z dysku        | Ścieżki programowe + dyskowe                                                                   |
| Obsługa zdarzeń | Renderowanie TUI        | Oparte na callbackach (`onBlockReply` itd.)                                                    |

## Przyszłe kwestie do rozważenia

Obszary potencjalnej przebudowy:

1. **Dopasowanie sygnatur narzędzi**: obecnie trwa adaptacja między sygnaturami pi-agent-core i pi-coding-agent
2. **Opakowanie session managera**: `guardSessionManager` dodaje bezpieczeństwo, ale zwiększa złożoność
3. **Ładowanie rozszerzeń**: można by używać `ResourceLoader` z Pi bardziej bezpośrednio
4. **Złożoność handlera strumieniowania**: `subscribeEmbeddedPiSession` znacznie się rozrósł
5. **Specyfika providerów**: wiele ścieżek kodu specyficznych dla providerów, które Pi mógłby potencjalnie obsługiwać

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

Na żywo/opcjonalnie:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (włącz przez `OPENCLAW_LIVE_TEST=1`)

Aktualne polecenia uruchamiania znajdziesz w [Pi Development Workflow](/pl/pi-dev).
