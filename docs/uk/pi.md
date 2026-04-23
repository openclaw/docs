---
read_when:
    - Розуміння дизайну інтеграції Pi SDK в OpenClaw
    - Зміна життєвого циклу сесії агента, tooling або підключення provider для Pi
summary: Архітектура вбудованої інтеграції агента Pi в OpenClaw і життєвий цикл сесії
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-04-23T20:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fad24557f3969b9faa33b9b13fa0e811dd257099ab8bdae02644a0395bcd68b
    source_path: pi.md
    workflow: 15
---

Цей документ описує, як OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) і спорідненими пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`) для забезпечення можливостей свого AI-агента.

## Огляд

OpenClaw використовує Pi SDK для вбудовування AI-агента для кодування у свою архітектуру gateway обміну повідомленнями. Замість запуску pi як підпроцесу або використання режиму RPC, OpenClaw безпосередньо імпортує та створює `AgentSession` Pi через `createAgentSession()`. Цей вбудований підхід дає:

- Повний контроль над життєвим циклом сесії та обробкою подій
- Власне впровадження tools (обмін повідомленнями, sandbox, дії для конкретних каналів)
- Налаштування system prompt для кожного каналу/контексту
- Збереження сесій з підтримкою branching/Compaction
- Ротацію auth profiles для кількох облікових записів з failover
- Незалежне від provider перемикання моделей

## Залежності пакетів

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Пакет            | Призначення                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Базові абстракції LLM: `Model`, `streamSimple`, типи повідомлень, API provider                          |
| `pi-agent-core`  | Цикл агента, виконання tools, типи `AgentMessage`                                                        |
| `pi-coding-agent`| Високорівневий SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, вбудовані tools |
| `pi-tui`         | Компоненти інтерфейсу термінала (використовуються в локальному режимі TUI OpenClaw)                     |

## Структура файлів

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

Runtime для дій із повідомленнями, специфічних для каналу, тепер розміщуються в каталогах
extensions, якими володіє Plugin, а не в `src/agents/tools`, наприклад:

- файли runtime дій Plugin Discord
- файл runtime дій Plugin Slack
- файл runtime дій Plugin Telegram
- файл runtime дій Plugin WhatsApp

## Основний потік інтеграції

### 1. Запуск вбудованого агента

Основна точка входу — `runEmbeddedPiAgent()` у `pi-embedded-runner/run.ts`:

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

### 2. Створення сесії

Усередині `runEmbeddedAttempt()` (яку викликає `runEmbeddedPiAgent()`) використовується Pi SDK:

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

### 3. Підписка на події

`subscribeEmbeddedPiSession()` підписується на події `AgentSession` Pi:

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

Обробляються такі події:

- `message_start` / `message_end` / `message_update` (streaming тексту/міркувань)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Формування prompt

Після налаштування сесії надсилається prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє повний цикл агента: надсилання до LLM, виконання викликів tools, streaming відповідей.

Впровадження зображень є локальним для prompt: OpenClaw завантажує refs зображень із поточного prompt і
передає їх через `images` лише для цього ходу. Він не сканує повторно старіші ходи історії,
щоб знову впроваджувати payload зображень.

## Архітектура tools

### Конвеєр tools

1. **Базові tools**: `codingTools` Pi (`read`, `bash`, `edit`, `write`)
2. **Власні заміни**: OpenClaw замінює bash на `exec`/`process`, налаштовує read/edit/write для sandbox
3. **Tools OpenClaw**: messaging, browser, canvas, sessions, cron, gateway тощо
4. **Tools каналів**: tools дій, специфічні для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація політикою**: tools фільтруються за profile, provider, agent, group і політиками sandbox
6. **Нормалізація схем**: схеми очищуються для особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: tools обгортаються для поваги до сигналів переривання

### Адаптер визначень tools

`AgentTool` з pi-agent-core має іншу сигнатуру `execute`, ніж `ToolDefinition` з pi-coding-agent. Адаптер у `pi-tool-definition-adapter.ts` поєднує їх:

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

### Стратегія розділення tools

`splitSdkTools()` передає всі tools через `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Це забезпечує узгодженість фільтрації політик OpenClaw, інтеграції sandbox і розширеного набору tools для всіх provider.

## Побудова system prompt

System prompt будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він збирає повний prompt із розділами, зокрема Tooling, Tool Call Style, Safety guardrails, довідник CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, метадані runtime, а також Memory і Reactions, коли вони ввімкнені, плюс необов’язкові context files і додатковий вміст system prompt. Розділи обрізаються для мінімального режиму prompt, який використовується субагентами.

Prompt застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це JSONL-файли з деревоподібною структурою (зв’язки через id/parentId). `SessionManager` Pi відповідає за збереження:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw обгортає це через `guardSessionManager()` для безпеки результатів tools.

### Кешування сесій

`session-manager-cache.ts` кешує екземпляри SessionManager, щоб уникати повторного розбору файлів:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Обмеження історії

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (DM чи group).

### Compaction

Автоматичний Compaction запускається при переповненні контексту. Типові сигнатури
переповнення включають `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` і `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` обробляє ручний
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Автентифікація та розв’язання моделі

### Auth profiles

OpenClaw підтримує сховище auth profiles з кількома API-ключами для кожного provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiles обертаються після збоїв із відстеженням cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Розв’язання моделі

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

`FailoverError` запускає fallback моделі, якщо це налаштовано:

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

## Pi extensions

OpenClaw завантажує власні extensions Pi для спеціалізованої поведінки:

### Safeguard для Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` додає guardrails до Compaction, зокрема адаптивне бюджетування токенів плюс підсумки збоїв tools і файлових операцій:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Pruning контексту

`src/agents/pi-hooks/context-pruning.ts` реалізує pruning контексту на основі cache-TTL:

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

## Streaming і block replies

### Block chunking

`EmbeddedBlockChunker` керує перетворенням streaming-тексту на окремі блоки відповідей:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Видалення тегів Thinking/Final

Streaming-вивід обробляється для видалення блоків `<think>`/`<thinking>` і витягання вмісту `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Директиви відповідей

Директиви відповіді, такі як `[[media:url]]`, `[[voice]]`, `[[reply:id]]`, розбираються й витягаються:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Обробка помилок

### Класифікація помилок

`pi-embedded-helpers.ts` класифікує помилки для належної обробки:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback для рівня thinking

Якщо рівень thinking не підтримується, використовується fallback:

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

## Інтеграція sandbox

Коли режим sandbox увімкнений, tools і шляхи обмежуються:

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

## Обробка, специфічна для provider

### Anthropic

- Очищення magic string відмов
- Валідація ходів для послідовних ролей
- Сувора валідація параметрів tools Pi на рівні upstream

### Google/Gemini

- Санітизація схем tools, якими володіє Plugin

### OpenAI

- Tool `apply_patch` для моделей Codex
- Обробка пониження рівня thinking

## Інтеграція TUI

OpenClaw також має локальний режим TUI, який безпосередньо використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивну роботу в терміналі, подібну до нативного режиму Pi.

## Ключові відмінності від Pi CLI

| Аспект            | Pi CLI                  | Вбудований OpenClaw                                                                              |
| ----------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Виклик            | команда `pi` / RPC      | SDK через `createAgentSession()`                                                                 |
| Tools             | Типові tools для кодування | Власний набір tools OpenClaw                                                                   |
| System prompt     | AGENTS.md + prompts     | Динамічний для кожного каналу/контексту                                                         |
| Зберігання сесій  | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth              | Один обліковий запис    | Кілька profiles з ротацією                                                                       |
| Extensions        | Завантажуються з диска  | Програмно + шляхи на диску                                                                       |
| Обробка подій     | Рендеринг TUI           | На основі callback (`onBlockReply` тощо)                                                        |

## Майбутні міркування

Області для можливого перероблення:

1. **Узгодження сигнатур tools**: зараз виконується адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання session manager**: `guardSessionManager` додає безпеку, але підвищує складність
3. **Завантаження extensions**: можна було б безпосередніше використовувати `ResourceLoader` Pi
4. **Складність обробника streaming**: `subscribeEmbeddedPiSession` став занадто великим
5. **Особливості provider**: багато кодових шляхів, специфічних для provider, які Pi потенційно міг би обробляти сам

## Тести

Покриття інтеграції Pi охоплює такі набори тестів:

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

Живі/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (увімкніть `OPENCLAW_LIVE_TEST=1`)

Актуальні команди запуску див. у [Pi Development Workflow](/uk/pi-dev).
