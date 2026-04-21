---
read_when:
    - Zrozumienie projektu integracji Pi SDK w OpenClaw
    - Modyfikowanie cyklu życia sesji agenta, narzędzi lub połączenia dostawcy dla Pi
summary: Architektura osadzonej integracji agenta Pi w OpenClaw i cykl życia sesji
title: Architektura integracji Pi
x-i18n:
    generated_at: "2026-04-21T09:56:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# Architektura integracji Pi

Ten dokument opisuje, jak OpenClaw integruje się z [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) i jego pokrewnymi pakietami (`pi-ai`, `pi-agent-core`, `pi-tui`), aby zasilać możliwości agenta AI.

## Przegląd

OpenClaw używa Pi SDK do osadzenia agenta kodującego AI w swojej architekturze Gateway komunikacyjnego. Zamiast uruchamiać Pi jako podproces lub używać trybu RPC, OpenClaw bezpośrednio importuje i instancjuje `AgentSession` Pi przez `createAgentSession()`. To osadzone podejście zapewnia:

- Pełną kontrolę nad cyklem życia sesji i obsługą zdarzeń
- Wstrzykiwanie niestandardowych narzędzi (wiadomości, sandbox, działania specyficzne dla kanału)
- Dostosowanie system prompt per kanał/kontekst
- Trwałość sesji z obsługą branching/Compaction
- Rotację profili uwierzytelniania wielu kont z failover
- Przełączanie modeli niezależne od dostawcy

## Zależności pakietów

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Pakiet            | Cel                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Podstawowe abstrakcje LLM: `Model`, `streamSimple`, typy wiadomości, API dostawców                    |
| `pi-agent-core`   | Pętla agenta, wykonywanie narzędzi, typy `AgentMessage`                                                |
| `pi-coding-agent` | SDK wysokiego poziomu: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, wbudowane narzędzia |
| `pi-tui`          | Komponenty terminalowego interfejsu TUI (używane w lokalnym trybie TUI OpenClaw)                      |

## Struktura plików

```
src/agents/
├── pi-embedded-runner.ts          # Ponowne eksporty z pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Główne wejście: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika pojedynczej próby z konfiguracją sesji
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Budowanie ładunków odpowiedzi z wyników uruchomienia
│   │   ├── images.ts              # Wstrzykiwanie obrazów modelu vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Wykrywanie błędów przerwania
│   ├── cache-ttl.ts               # Śledzenie Cache TTL do przycinania kontekstu
│   ├── compact.ts                 # Logika ręcznej/automatycznej Compaction
│   ├── extensions.ts              # Ładowanie rozszerzeń Pi dla osadzonych uruchomień
│   ├── extra-params.ts            # Parametry streamingu specyficzne dla dostawcy
│   ├── google.ts                  # Poprawki kolejności tur Google/Gemini
│   ├── history.ts                 # Ograniczanie historii (DM vs grupa)
│   ├── lanes.ts                   # Linie poleceń sesji/globalne
│   ├── logger.ts                  # Logger podsystemu
│   ├── model.ts                   # Rozwiązywanie modelu przez ModelRegistry
│   ├── runs.ts                    # Śledzenie aktywnych uruchomień, przerwanie, kolejka
│   ├── sandbox-info.ts            # Informacje o sandbox dla system prompt
│   ├── session-manager-cache.ts   # Cache instancji SessionManager
│   ├── session-manager-init.ts    # Inicjalizacja pliku sesji
│   ├── system-prompt.ts           # Builder system prompt
│   ├── tool-split.ts              # Podział narzędzi na builtIn i custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapowanie ThinkLevel, opis błędów
├── pi-embedded-subscribe.ts       # Subskrypcja/dyspozycja zdarzeń sesji
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabryka handlerów zdarzeń
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Dzielenie bloków odpowiedzi streamingu
├── pi-embedded-messaging.ts       # Śledzenie wysłanych wiadomości przez narzędzie wiadomości
├── pi-embedded-helpers.ts         # Klasyfikacja błędów, walidacja tur
├── pi-embedded-helpers/           # Moduły pomocnicze
├── pi-embedded-utils.ts           # Narzędzia formatowania
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
│   ├── context-pruning.ts         # Rozszerzenie przycinania kontekstu Cache TTL
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
├── system-prompt-params.ts        # Rozwiązywanie parametrów system prompt
├── system-prompt-report.ts        # Generowanie raportu debugowania
├── tool-summaries.ts              # Podsumowania opisów narzędzi
├── tool-policy.ts                 # Rozwiązywanie polityki narzędzi
├── transcript-policy.ts           # Polityka walidacji transkryptu
├── skills.ts                      # Budowanie migawki/promptu Skills
├── skills/                        # Podsystem Skills
├── sandbox.ts                     # Rozwiązywanie kontekstu sandbox
├── sandbox/                       # Podsystem sandbox
├── channel-tools.ts               # Wstrzykiwanie narzędzi specyficznych dla kanału
├── openclaw-tools.ts              # Narzędzia specyficzne dla OpenClaw
├── bash-tools.ts                  # Narzędzia exec/process
├── apply-patch.ts                 # narzędzie apply_patch (OpenAI)
├── tools/                         # Poszczególne implementacje narzędzi
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

Środowiska uruchomieniowe działań wiadomości specyficznych dla kanału znajdują się teraz w katalogach rozszerzeń należących do Plugin zamiast w `src/agents/tools`, na przykład:

- pliki środowiska uruchomieniowego działań Plugin Discord
- plik środowiska uruchomieniowego działań Plugin Slack
- plik środowiska uruchomieniowego działań Plugin Telegram
- plik środowiska uruchomieniowego działań Plugin WhatsApp

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

Wewnątrz `runEmbeddedAttempt()` (wywoływanego przez `runEmbeddedPiAgent()`) używane jest Pi SDK:

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

- `message_start` / `message_end` / `message_update` (strumieniowany tekst/myślenie)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Po konfiguracji sesja otrzymuje prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK obsługuje pełną pętlę agenta: wysyłanie do LLM, wykonywanie wywołań narzędzi, strumieniowanie odpowiedzi.

Wstrzykiwanie obrazów jest lokalne względem promptu: OpenClaw ładuje referencje obrazów z bieżącego promptu i przekazuje je przez `images` tylko dla tej tury. Nie skanuje ponownie starszych tur historii, aby ponownie wstrzykiwać ładunki obrazów.

## Architektura narzędzi

### Potok narzędzi

1. **Narzędzia bazowe**: `codingTools` z Pi (`read`, `bash`, `edit`, `write`)
2. **Niestandardowe zamienniki**: OpenClaw zastępuje `bash` przez `exec`/`process`, dostosowuje `read`/`edit`/`write` dla sandbox
3. **Narzędzia OpenClaw**: wiadomości, przeglądarka, canvas, sesje, Cron, Gateway itd.
4. **Narzędzia kanałów**: narzędzia działań specyficzne dla Discord/Telegram/Slack/WhatsApp
5. **Filtrowanie polityk**: narzędzia filtrowane według polityk profilu, dostawcy, agenta, grupy i sandbox
6. **Normalizacja schematu**: schematy czyszczone pod kątem specyfiki Gemini/OpenAI
7. **Opakowywanie AbortSignal**: narzędzia opakowywane tak, by respektowały sygnały przerwania

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

Zapewnia to spójność filtrowania polityk OpenClaw, integracji sandbox i rozszerzonego zestawu narzędzi między dostawcami.

## Budowanie system prompt

System prompt jest budowany w `buildAgentSystemPrompt()` (`system-prompt.ts`). Składa pełny prompt z sekcjami obejmującymi Tooling, styl wywołań narzędzi, guardy bezpieczeństwa, dokumentację CLI OpenClaw, Skills, dokumentację, Workspace, Sandbox, wiadomości, Reply Tags, głos, Silent Replies, Heartbeat, metadane środowiska uruchomieniowego, a także Memory i Reactions, gdy są włączone, oraz opcjonalne pliki kontekstowe i dodatkową zawartość system prompt. Sekcje są przycinane dla minimalnego trybu prompt używanego przez podagentów.

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

`session-manager-cache.ts` przechowuje w cache instancje SessionManager, aby uniknąć wielokrotnego parsowania plików:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Ograniczanie historii

`limitHistoryTurns()` przycina historię rozmowy zależnie od typu kanału (DM vs grupa).

### Compaction

Automatyczna Compaction uruchamia się przy przepełnieniu kontekstu. Typowe sygnatury przepełnienia obejmują `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` i `ollama error: context length exceeded`. Ręczną Compaction obsługuje `compactEmbeddedPiSessionDirect()`:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Uwierzytelnianie i rozwiązywanie modeli

### Profile uwierzytelniania

OpenClaw utrzymuje magazyn profili uwierzytelniania z wieloma kluczami API per dostawca:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotują po błędach ze śledzeniem cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Rozwiązywanie modelu

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

`src/agents/pi-hooks/compaction-safeguard.ts` dodaje guardy do Compaction, w tym adaptacyjne budżetowanie tokenów oraz podsumowania błędów narzędzi i operacji na plikach:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Przycinanie kontekstu

`src/agents/pi-hooks/context-pruning.ts` implementuje przycinanie kontekstu oparte na Cache TTL:

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

`EmbeddedBlockChunker` zarządza strumieniowaniem tekstu do osobnych bloków odpowiedzi:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Usuwanie tagów thinking/final

Dane wyjściowe streamingu są przetwarzane w celu usunięcia bloków `<think>`/`<thinking>` i wyodrębnienia zawartości `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Usuń zawartość <think>...</think>
  // Jeśli enforceFinalTag, zwróć tylko zawartość <final>...</final>
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
isContextOverflowError(errorText)     // Kontekst zbyt duży
isCompactionFailureError(errorText)   // Compaction nie powiodło się
isAuthAssistantError(lastAssistant)   // Błąd uwierzytelniania
isRateLimitAssistantError(...)        // Osiągnięto limit szybkości
isFailoverAssistantError(...)         // Należy użyć failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback poziomu thinking

Jeśli poziom thinking nie jest obsługiwany, używany jest fallback:

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

## Integracja sandbox

Gdy tryb sandbox jest włączony, narzędzia i ścieżki są ograniczone:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Używaj narzędzi read/edit/write w sandbox
  // Exec działa w kontenerze
  // Przeglądarka używa bridge URL
}
```

## Obsługa specyficzna dla dostawcy

### Anthropic

- Czyszczenie magicznego ciągu odmowy
- Walidacja tur dla kolejnych ról
- Ścisła walidacja parametrów narzędzi upstream Pi

### Google/Gemini

- Sanityzacja schematu narzędzi należąca do Plugin

### OpenAI

- narzędzie `apply_patch` dla modeli Codex
- Obsługa obniżenia poziomu thinking

## Integracja TUI

OpenClaw ma także lokalny tryb TUI, który bezpośrednio używa komponentów pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Zapewnia to interaktywne doświadczenie terminalowe podobne do natywnego trybu Pi.

## Kluczowe różnice względem Pi CLI

| Aspekt          | Pi CLI                  | Wbudowany OpenClaw                                                                              |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Wywołanie       | polecenie `pi` / RPC    | SDK przez `createAgentSession()`                                                                |
| Narzędzia       | Domyślne narzędzia kodowania | Niestandardowy zestaw narzędzi OpenClaw                                                    |
| System prompt   | AGENTS.md + prompty     | Dynamiczny per kanał/kontekst                                                                   |
| Przechowywanie sesji | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (lub `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Uwierzytelnianie | Pojedyncze poświadczenie | Wiele profili z rotacją                                                                        |
| Rozszerzenia    | Ładowane z dysku        | Ścieżki programowe + dyskowe                                                                    |
| Obsługa zdarzeń | Renderowanie TUI        | Oparte na callbackach (`onBlockReply` itd.)                                                     |

## Przyszłe kwestie do rozważenia

Obszary potencjalnych zmian:

1. **Dopasowanie sygnatur narzędzi**: obecnie trwa adaptacja między sygnaturami pi-agent-core i pi-coding-agent
2. **Opakowywanie menedżera sesji**: `guardSessionManager` zwiększa bezpieczeństwo, ale podnosi złożoność
3. **Ładowanie rozszerzeń**: można by bezpośredniej używać `ResourceLoader` z Pi
4. **Złożoność handlera streamingu**: `subscribeEmbeddedPiSession` znacznie się rozrósł
5. **Specyfika dostawców**: wiele ścieżek kodu specyficznych dla dostawców, które Pi mógłby potencjalnie obsłużyć

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

Na żywo/po włączeniu:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (włącz `OPENCLAW_LIVE_TEST=1`)

Aktualne polecenia uruchamiania znajdziesz w [Pi Development Workflow](/pl/pi-dev).
