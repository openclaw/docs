---
read_when:
    - Zrozumienie projektu integracji Pi SDK w OpenClaw
    - Modyfikowanie cyklu życia sesji agenta, narzędzi lub połączeń z providerami dla Pi
summary: Architektura osadzonej integracji agenta Pi w OpenClaw i cyklu życia sesji
title: Architektura integracji Pi
x-i18n:
    generated_at: "2026-04-24T09:19:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

Ten dokument opisuje, jak OpenClaw integruje się z [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) i pokrewnymi pakietami (`pi-ai`, `pi-agent-core`, `pi-tui`), aby realizować możliwości swojego agenta AI.

## Przegląd

OpenClaw używa SDK pi do osadzenia agenta kodującego AI w swojej architekturze gateway komunikatów. Zamiast uruchamiać pi jako podproces albo używać trybu RPC, OpenClaw bezpośrednio importuje i tworzy `AgentSession` pi przez `createAgentSession()`. To podejście osadzone zapewnia:

- pełną kontrolę nad cyklem życia sesji i obsługą zdarzeń
- niestandardowe wstrzykiwanie narzędzi (komunikacja, sandbox, działania specyficzne dla kanału)
- dostosowywanie promptu systemowego per kanał/kontekst
- trwałość sesji ze wsparciem dla branching/Compaction
- rotację profili uwierzytelniania dla wielu kont z failover
- niezależne od providera przełączanie modeli

## Zależności pakietów

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Pakiet            | Cel                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Podstawowe abstrakcje LLM: `Model`, `streamSimple`, typy wiadomości, API providerów                  |
| `pi-agent-core`   | Pętla agenta, wykonywanie narzędzi, typy `AgentMessage`                                               |
| `pi-coding-agent` | SDK wysokiego poziomu: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, wbudowane narzędzia |
| `pi-tui`          | Komponenty terminalowego interfejsu (używane w lokalnym trybie TUI OpenClaw)                         |

## Struktura plików

```
src/agents/
├── pi-embedded-runner.ts          # Re-eksporty z pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Główne wejście: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika pojedynczej próby z konfiguracją sesji
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Budowanie ładunków odpowiedzi z wyników uruchomienia
│   │   ├── images.ts              # Wstrzykiwanie obrazów dla modeli vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Wykrywanie błędów przerwania
│   ├── cache-ttl.ts               # Śledzenie cache TTL dla context pruning
│   ├── compact.ts                 # Logika ręcznego/automatycznego Compaction
│   ├── extensions.ts              # Ładowanie rozszerzeń pi dla uruchomień osadzonych
│   ├── extra-params.ts            # Parametry strumieniowania specyficzne dla providera
│   ├── google.ts                  # Poprawki kolejności tur Google/Gemini
│   ├── history.ts                 # Ograniczanie historii (DM vs grupa)
│   ├── lanes.ts                   # Ścieżki poleceń sesji/globalne
│   ├── logger.ts                  # Logger podsystemu
│   ├── model.ts                   # Rozwiązywanie modelu przez ModelRegistry
│   ├── runs.ts                    # Śledzenie aktywnych uruchomień, abort, kolejka
│   ├── sandbox-info.ts            # Informacje o sandbox dla promptu systemowego
│   ├── session-manager-cache.ts   # Cache instancji SessionManager
│   ├── session-manager-init.ts    # Inicjalizacja pliku sesji
│   ├── system-prompt.ts           # Budowniczy promptu systemowego
│   ├── tool-split.ts              # Podział narzędzi na builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapowanie ThinkLevel, opis błędów
├── pi-embedded-subscribe.ts       # Subskrypcja/wysyłka zdarzeń sesji
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabryka handlerów zdarzeń
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Fragmentacja odpowiedzi blokowych przy strumieniowaniu
├── pi-embedded-messaging.ts       # Śledzenie wysłanych wiadomości przez narzędzie komunikacji
├── pi-embedded-helpers.ts         # Klasyfikacja błędów, walidacja tury
├── pi-embedded-helpers/           # Moduły pomocnicze
├── pi-embedded-utils.ts           # Narzędzia formatowania
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Owijanie AbortSignal dla narzędzi
├── pi-tools.policy.ts             # Zasady allowlist/denylist narzędzi
├── pi-tools.read.ts               # Dostosowania narzędzia read
├── pi-tools.schema.ts             # Normalizacja schematu narzędzi
├── pi-tools.types.ts              # Alias typu AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Nadpisania ustawień
├── pi-hooks/                      # Niestandardowe hooki pi
│   ├── compaction-safeguard.ts    # Rozszerzenie safeguard
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Rozszerzenie context pruning oparte na Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Rozwiązywanie profilu auth
├── auth-profiles.ts               # Magazyn profili, cooldown, failover
├── model-selection.ts             # Rozwiązywanie modelu domyślnego
├── models-config.ts               # Generowanie models.json
├── model-catalog.ts               # Cache katalogu modeli
├── context-window-guard.ts        # Walidacja okna kontekstu
├── failover-error.ts              # Klasa FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Rozwiązywanie parametrów promptu systemowego
├── system-prompt-report.ts        # Generowanie raportu debugowania
├── tool-summaries.ts              # Podsumowania opisów narzędzi
├── tool-policy.ts                 # Rozwiązywanie zasad narzędzi
├── transcript-policy.ts           # Zasady walidacji transkryptu
├── skills.ts                      # Budowanie migawki/promptu Skills
├── skills/                        # Podsystem Skills
├── sandbox.ts                     # Rozwiązywanie kontekstu sandbox
├── sandbox/                       # Podsystem sandbox
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

Runtime działań wiadomości specyficznych dla kanałów znajdują się teraz w katalogach
rozszerzeń należących do Pluginów zamiast w `src/agents/tools`, na przykład:

- pliki runtime działań Pluginu Discord
- plik runtime działań Pluginu Slack
- plik runtime działań Pluginu Telegram
- plik runtime działań Pluginu WhatsApp

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

Wewnątrz `runEmbeddedAttempt()` (wywoływanego przez `runEmbeddedPiAgent()`) używane jest SDK pi:

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

- `message_start` / `message_end` / `message_update` (strumieniowanie tekstu/thinking)
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
przekazuje je przez `images` tylko dla tej tury. Nie skanuje ponownie starszych tur historii,
aby ponownie wstrzykiwać ładunki obrazów.

## Architektura narzędzi

### Potok narzędzi

1. **Narzędzia bazowe**: `codingTools` z pi (read, bash, edit, write)
2. **Niestandardowe zamienniki**: OpenClaw zastępuje bash przez `exec`/`process`, dostosowuje read/edit/write dla sandbox
3. **Narzędzia OpenClaw**: komunikacja, browser, canvas, sessions, cron, gateway itd.
4. **Narzędzia kanałowe**: narzędzia działań specyficzne dla Discord/Telegram/Slack/WhatsApp
5. **Filtrowanie zasad**: narzędzia filtrowane przez profile, providera, agenta, grupę i zasady sandbox
6. **Normalizacja schematu**: schematy czyszczone pod niuanse Gemini/OpenAI
7. **Owijanie AbortSignal**: narzędzia owijane tak, aby respektowały sygnały abort

### Adapter definicji narzędzia

`AgentTool` z pi-agent-core ma inną sygnaturę `execute` niż `ToolDefinition` z pi-coding-agent. Adapter w `pi-tool-definition-adapter.ts` łączy te światy:

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

Dzięki temu filtrowanie zasad OpenClaw, integracja z sandbox i rozszerzony zestaw narzędzi pozostają spójne między providerami.

## Budowanie promptu systemowego

Prompt systemowy jest budowany w `buildAgentSystemPrompt()` (`system-prompt.ts`). Składa pełny prompt z sekcjami obejmującymi Tooling, Tool Call Style, zabezpieczenia Safety, dokumentację CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, metadane Runtime, a także Memory i Reactions, gdy są włączone, oraz opcjonalne pliki kontekstowe i dodatkową treść promptu systemowego. Sekcje są przycinane dla minimalnego trybu promptu używanego przez subagentów.

Prompt jest stosowany po utworzeniu sesji przez `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Zarządzanie sesją

### Pliki sesji

Sesje to pliki JSONL o strukturze drzewa (łączenie przez id/parentId). Trwałość obsługuje `SessionManager` z Pi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw owija to przez `guardSessionManager()` dla bezpieczeństwa wyników narzędzi.

### Cache sesji

`session-manager-cache.ts` przechowuje instancje SessionManager w cache, aby uniknąć wielokrotnego parsowania plików:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Ograniczanie historii

`limitHistoryTurns()` przycina historię rozmowy zależnie od typu kanału (DM vs grupa).

### Compaction

Automatyczny Compaction uruchamia się przy przepełnieniu kontekstu. Typowe sygnatury przepełnienia
obejmują `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` oraz `ollama error: context
length exceeded`. Ręczny Compaction obsługuje `compactEmbeddedPiSessionDirect()`:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Uwierzytelnianie i rozwiązywanie modelu

### Profile auth

OpenClaw utrzymuje magazyn profili auth z wieloma kluczami API na providera:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotują przy błędach z użyciem śledzenia cooldown:

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

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` dodaje zabezpieczenia do Compaction, w tym adaptacyjne budżetowanie tokenów oraz podsumowania błędów narzędzi i operacji na plikach:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` implementuje context pruning oparty na Cache-TTL:

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

### Fragmentacja bloków

`EmbeddedBlockChunker` zarządza strumieniowaniem tekstu do dyskretnych bloków odpowiedzi:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Usuwanie tagów Thinking/Final

Wyjście strumieniowe jest przetwarzane w celu usunięcia bloków `<think>`/`<thinking>` i wyodrębnienia treści `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Usuń treść <think>...</think>
  // Jeśli enforceFinalTag, zwróć tylko treść <final>...</final>
};
```

### Dyrektywy odpowiedzi

Dyrektywy odpowiedzi takie jak `[[media:url]]`, `[[voice]]`, `[[reply:id]]` są parsowane i wyodrębniane:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Obsługa błędów

### Klasyfikacja błędów

`pi-embedded-helpers.ts` klasyfikuje błędy do odpowiedniego przetwarzania:

```typescript
isContextOverflowError(errorText)     // Zbyt duży kontekst
isCompactionFailureError(errorText)   // Nieudany Compaction
isAuthAssistantError(lastAssistant)   // Błąd auth
isRateLimitAssistantError(...)        // Ograniczenie szybkości
isFailoverAssistantError(...)         // Należy uruchomić failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback poziomu Thinking

Jeśli poziom thinking nie jest obsługiwany, następuje fallback:

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

## Integracja z sandbox

Gdy włączony jest tryb sandbox, narzędzia i ścieżki są ograniczane:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Użyj narzędzi read/edit/write w sandbox
  // Exec działa w kontenerze
  // Browser używa adresu bridge
}
```

## Obsługa specyficzna dla providera

### Anthropic

- Czyszczenie magicznych ciągów odmowy
- Walidacja tur dla kolejnych ról
- Ścisła walidacja parametrów narzędzi Pi po stronie upstream

### Google/Gemini

- Sanitizacja schematu narzędzi należąca do Pluginu

### OpenAI

- narzędzie `apply_patch` dla modeli Codex
- obsługa obniżania poziomu thinking

## Integracja TUI

OpenClaw ma również lokalny tryb TUI, który bezpośrednio używa komponentów pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Zapewnia to interaktywne doświadczenie terminalowe podobne do natywnego trybu Pi.

## Kluczowe różnice względem Pi CLI

| Aspekt           | Pi CLI                  | OpenClaw Embedded                                                                              |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Wywołanie        | polecenie `pi` / RPC    | SDK przez `createAgentSession()`                                                               |
| Narzędzia        | domyślne narzędzia coding | niestandardowy zestaw narzędzi OpenClaw                                                      |
| Prompt systemowy | AGENTS.md + prompty     | dynamiczny per kanał/kontekst                                                                  |
| Przechowywanie sesji | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (albo `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth             | pojedyncze poświadczenie | wiele profili z rotacją                                                                       |
| Rozszerzenia     | ładowane z dysku        | ścieżki programistyczne + dyskowe                                                              |
| Obsługa zdarzeń  | renderowanie TUI        | oparta na callbackach (`onBlockReply` itd.)                                                    |

## Przyszłe kwestie do rozważenia

Obszary potencjalnych przeróbek:

1. **Dopasowanie sygnatur narzędzi**: obecnie zachodzi adaptacja pomiędzy sygnaturami pi-agent-core i pi-coding-agent
2. **Owijanie session manager**: `guardSessionManager` dodaje bezpieczeństwo, ale zwiększa złożoność
3. **Ładowanie rozszerzeń**: można by używać `ResourceLoader` z Pi bardziej bezpośrednio
4. **Złożoność obsługi strumieniowania**: `subscribeEmbeddedPiSession` znacznie się rozrosło
5. **Niuanse providerów**: wiele ścieżek kodu specyficznych dla providerów, które potencjalnie mogłoby obsłużyć samo Pi

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (włącz przez `OPENCLAW_LIVE_TEST=1`)

Aktualne polecenia uruchamiania znajdziesz w [Pi Development Workflow](/pl/pi-dev).

## Powiązane

- [Pi development workflow](/pl/pi-dev)
- [Przegląd instalacji](/pl/install)
