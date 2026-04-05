---
read_when:
    - Zrozumienie projektu integracji SDK Pi w OpenClaw
    - Modyfikowanie cyklu życia sesji agenta, narzędzi lub połączenia z dostawcą dla Pi
summary: Architektura osadzonej integracji agenta Pi w OpenClaw oraz cykl życia sesji
title: Architektura integracji Pi
x-i18n:
    generated_at: "2026-04-05T14:01:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 596de5fbb1430008698079f211db200e02ca8485547550fd81571a459c4c83c7
    source_path: pi.md
    workflow: 15
---

# Architektura integracji Pi

Ten dokument opisuje, jak OpenClaw integruje się z [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) i powiązanymi z nim pakietami (`pi-ai`, `pi-agent-core`, `pi-tui`), aby zapewnić możliwości swojego agenta AI.

## Przegląd

OpenClaw używa SDK pi do osadzenia agenta kodującego AI w swojej architekturze bramki wiadomości. Zamiast uruchamiać pi jako podproces lub używać trybu RPC, OpenClaw bezpośrednio importuje i tworzy instancję `AgentSession` pi za pomocą `createAgentSession()`. To osadzone podejście zapewnia:

- Pełną kontrolę nad cyklem życia sesji i obsługą zdarzeń
- Niestandardowe wstrzykiwanie narzędzi (wiadomości, sandbox, działania specyficzne dla kanału)
- Dostosowanie promptu systemowego dla każdego kanału/kontekstu
- Trwałość sesji z obsługą rozgałęziania/kompaktowania
- Rotację profili uwierzytelniania wielu kont z mechanizmem failover
- Niezależne od dostawcy przełączanie modeli

## Zależności pakietów

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Pakiet            | Przeznaczenie                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Podstawowe abstrakcje LLM: `Model`, `streamSimple`, typy wiadomości, API dostawców                    |
| `pi-agent-core`   | Pętla agenta, wykonywanie narzędzi, typy `AgentMessage`                                                |
| `pi-coding-agent` | SDK wysokiego poziomu: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, wbudowane narzędzia |
| `pi-tui`          | Komponenty terminalowego interfejsu użytkownika (używane w lokalnym trybie TUI OpenClaw)              |

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
│   │   ├── images.ts              # Wstrzykiwanie obrazów dla modeli z obsługą widzenia
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Wykrywanie błędów przerwania
│   ├── cache-ttl.ts               # Śledzenie TTL cache dla przycinania kontekstu
│   ├── compact.ts                 # Logika ręcznego/automatycznego kompaktowania
│   ├── extensions.ts              # Ładowanie rozszerzeń pi dla osadzonych uruchomień
│   ├── extra-params.ts            # Parametry strumieniowe specyficzne dla dostawcy
│   ├── google.ts                  # Poprawki kolejności tur dla Google/Gemini
│   ├── history.ts                 # Ograniczanie historii (DM vs grupa)
│   ├── lanes.ts                   # Pasy poleceń sesji/globalne
│   ├── logger.ts                  # Logger podsystemu
│   ├── model.ts                   # Rozwiązywanie modelu przez ModelRegistry
│   ├── runs.ts                    # Śledzenie aktywnych uruchomień, przerwanie, kolejka
│   ├── sandbox-info.ts            # Informacje o sandboxie dla promptu systemowego
│   ├── session-manager-cache.ts   # Cache instancji SessionManager
│   ├── session-manager-init.ts    # Inicjalizacja pliku sesji
│   ├── system-prompt.ts           # Konstruktor promptu systemowego
│   ├── tool-split.ts              # Podział narzędzi na builtIn i custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapowanie ThinkLevel, opis błędów
├── pi-embedded-subscribe.ts       # Subskrypcja/wysyłka zdarzeń sesji
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabryka obsługi zdarzeń
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Dzielenie bloków odpowiedzi strumieniowej na fragmenty
├── pi-embedded-messaging.ts       # Śledzenie wysłanych narzędzi wiadomości
├── pi-embedded-helpers.ts         # Klasyfikacja błędów, walidacja tur
├── pi-embedded-helpers/           # Moduły pomocnicze
├── pi-embedded-utils.ts           # Narzędzia formatowania
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Opakowanie AbortSignal dla narzędzi
├── pi-tools.policy.ts             # Zasady allowlist/denylist narzędzi
├── pi-tools.read.ts               # Dostosowania narzędzia odczytu
├── pi-tools.schema.ts             # Normalizacja schematu narzędzi
├── pi-tools.types.ts              # Alias typu AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Nadpisania ustawień
├── pi-hooks/                      # Niestandardowe hooki pi
│   ├── compaction-safeguard.ts    # Rozszerzenie zabezpieczające
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Rozszerzenie przycinania kontekstu opartego na TTL cache
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
├── system-prompt-params.ts        # Rozwiązywanie parametrów promptu systemowego
├── system-prompt-report.ts        # Generowanie raportu debugowania
├── tool-summaries.ts              # Podsumowania opisów narzędzi
├── tool-policy.ts                 # Rozwiązywanie polityki narzędzi
├── transcript-policy.ts           # Polityka walidacji transkryptu
├── skills.ts                      # Budowanie snapshotu/promptu Skills
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

Środowiska uruchomieniowe działań na wiadomościach specyficznych dla kanału znajdują się teraz w katalogach rozszerzeń należących do wtyczek zamiast pod `src/agents/tools`, na przykład:

- pliki środowiska uruchomieniowego działań wtyczki Discord
- plik środowiska uruchomieniowego działań wtyczki Slack
- plik środowiska uruchomieniowego działań wtyczki Telegram
- plik środowiska uruchomieniowego działań wtyczki WhatsApp

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

- `message_start` / `message_end` / `message_update` (strumieniowy tekst/myślenie)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Promptowanie

Po konfiguracji sesja otrzymuje prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK obsługuje pełną pętlę agenta: wysyłanie do LLM, wykonywanie wywołań narzędzi, strumieniowanie odpowiedzi.

Wstrzykiwanie obrazów jest lokalne względem promptu: OpenClaw ładuje referencje obrazów z bieżącego promptu i przekazuje je przez `images` tylko dla tej tury. Nie skanuje ponownie starszych tur historii, aby ponownie wstrzyknąć payloady obrazów.

## Architektura narzędzi

### Pipeline narzędzi

1. **Narzędzia bazowe**: `codingTools` z pi (`read`, `bash`, `edit`, `write`)
2. **Niestandardowe zamienniki**: OpenClaw zastępuje `bash` przez `exec`/`process`, dostosowuje `read`/`edit`/`write` dla sandboxa
3. **Narzędzia OpenClaw**: wiadomości, przeglądarka, canvas, sesje, cron, gateway itd.
4. **Narzędzia kanałów**: narzędzia działań specyficzne dla Discord/Telegram/Slack/WhatsApp
5. **Filtrowanie polityk**: narzędzia filtrowane według profilu, dostawcy, agenta, grupy i polityk sandboxa
6. **Normalizacja schematu**: schematy czyszczone pod kątem specyfiki Gemini/OpenAI
7. **Opakowanie AbortSignal**: narzędzia opakowane tak, by respektowały sygnały przerwania

### Adapter definicji narzędzia

`AgentTool` z pi-agent-core ma inną sygnaturę `execute` niż `ToolDefinition` z pi-coding-agent. Adapter w `pi-tool-definition-adapter.ts` łączy te interfejsy:

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

Dzięki temu filtrowanie polityk OpenClaw, integracja z sandboxem i rozszerzony zestaw narzędzi pozostają spójne między dostawcami.

## Konstrukcja promptu systemowego

Prompt systemowy jest budowany w `buildAgentSystemPrompt()` (`system-prompt.ts`). Składa on pełny prompt z sekcjami obejmującymi Narzędzia, Styl wywołań narzędzi, Zabezpieczenia, referencję CLI OpenClaw, Skills, Dokumentację, Obszar roboczy, Sandbox, Wiadomości, Tagi odpowiedzi, Głos, Ciche odpowiedzi, Heartbeats, metadane środowiska uruchomieniowego, a także Pamięć i Reakcje, gdy są włączone, oraz opcjonalne pliki kontekstowe i dodatkową treść promptu systemowego. Sekcje są przycinane w minimalnym trybie promptu używanym przez podagentów.

Prompt jest stosowany po utworzeniu sesji przez `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Zarządzanie sesjami

### Pliki sesji

Sesje to pliki JSONL o strukturze drzewa (powiązania `id`/`parentId`). Trwałością zarządza `SessionManager` z Pi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw opakowuje to przez `guardSessionManager()` dla bezpieczeństwa wyników narzędzi.

### Cache sesji

`session-manager-cache.ts` przechowuje instancje SessionManager w cache, aby uniknąć wielokrotnego parsowania pliku:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Ograniczanie historii

`limitHistoryTurns()` przycina historię rozmowy w zależności od typu kanału (DM vs grupa).

### Kompaktowanie

Automatyczne kompaktowanie uruchamia się przy przepełnieniu kontekstu. Typowe sygnatury przepełnienia obejmują
`request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` oraz `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` obsługuje ręczne
kompaktowanie:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Uwierzytelnianie i rozwiązywanie modeli

### Profile uwierzytelniania

OpenClaw utrzymuje magazyn profili uwierzytelniania z wieloma kluczami API dla każdego dostawcy:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotują po awariach z użyciem śledzenia cooldownu:

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

// Używa ModelRegistry i AuthStorage z pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` uruchamia awaryjne przełączenie modelu, gdy jest skonfigurowane:

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

OpenClaw ładuje niestandardowe rozszerzenia pi dla wyspecjalizowanych zachowań:

### Zabezpieczenie kompaktowania

`src/agents/pi-hooks/compaction-safeguard.ts` dodaje zabezpieczenia do kompaktowania, w tym adaptacyjne budżetowanie tokenów oraz podsumowania awarii narzędzi i operacji na plikach:

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

## Strumieniowanie i odpowiedzi blokowe

### Dzielenie bloków

`EmbeddedBlockChunker` zarządza strumieniowaniem tekstu do oddzielnych bloków odpowiedzi:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Usuwanie tagów thinking/final

Dane wyjściowe strumieniowania są przetwarzane w celu usunięcia bloków `<think>`/`<thinking>` i wyodrębnienia treści `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Usuń treść <think>...</think>
  // Jeśli enforceFinalTag, zwracaj tylko treść <final>...</final>
};
```

### Dyrektywy odpowiedzi

Dyrektywy odpowiedzi takie jak `[[media:url]]`, `[[voice]]`, `[[reply:id]]` są parsowane i wyodrębniane:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Obsługa błędów

### Klasyfikacja błędów

`pi-embedded-helpers.ts` klasyfikuje błędy do odpowiedniej obsługi:

```typescript
isContextOverflowError(errorText)     // Kontekst jest zbyt duży
isCompactionFailureError(errorText)   // Kompaktowanie nie powiodło się
isAuthAssistantError(lastAssistant)   // Błąd uwierzytelniania
isRateLimitAssistantError(...)        // Ograniczenie szybkości
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

Gdy tryb sandbox jest włączony, narzędzia i ścieżki są ograniczone:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Użyj narzędzi read/edit/write w sandboxie
  // Exec działa w kontenerze
  // Browser używa adresu URL mostu
}
```

## Obsługa specyficzna dla dostawcy

### Anthropic

- Usuwanie magicznego ciągu odmowy
- Walidacja tur dla kolejnych ról
- Zgodność parametrów Claude Code

### Google/Gemini

- Oczyszczanie schematu narzędzi należących do wtyczki

### OpenAI

- Narzędzie `apply_patch` dla modeli Codex
- Obsługa obniżenia poziomu myślenia

## Integracja TUI

OpenClaw ma też lokalny tryb TUI, który bezpośrednio używa komponentów pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Zapewnia to interaktywne środowisko terminalowe podobne do natywnego trybu pi.

## Kluczowe różnice względem Pi CLI

| Aspekt          | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Wywołanie       | Polecenie `pi` / RPC    | SDK przez `createAgentSession()`                                                               |
| Narzędzia       | Domyślne narzędzia do kodowania | Niestandardowy zestaw narzędzi OpenClaw                                                  |
| Prompt systemowy | AGENTS.md + prompty    | Dynamiczny dla każdego kanału/kontekstu                                                        |
| Przechowywanie sesji | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (lub `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Uwierzytelnianie | Pojedyncze poświadczenie | Wiele profili z rotacją                                                                      |
| Rozszerzenia    | Ładowane z dysku        | Ścieżki programowe + dyskowe                                                                   |
| Obsługa zdarzeń | Renderowanie TUI        | Oparta na callbackach (`onBlockReply` itd.)                                                    |

## Przyszłe kwestie do rozważenia

Obszary potencjalnej przebudowy:

1. **Dopasowanie sygnatur narzędzi**: obecnie trwa adaptacja między sygnaturami pi-agent-core i pi-coding-agent
2. **Opakowanie menedżera sesji**: `guardSessionManager` zwiększa bezpieczeństwo, ale podnosi złożoność
3. **Ładowanie rozszerzeń**: można by bardziej bezpośrednio używać `ResourceLoader` z pi
4. **Złożoność obsługi strumieniowania**: `subscribeEmbeddedPiSession` znacznie się rozrósł
5. **Specyfika dostawców**: wiele ścieżek kodu zależnych od dostawcy, które pi mogłoby potencjalnie obsługiwać

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

Na żywo / opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (włącz `OPENCLAW_LIVE_TEST=1`)

Aby zobaczyć aktualne polecenia uruchamiania, zobacz [Przepływ prac rozwojowych Pi](/pl/pi-dev).
