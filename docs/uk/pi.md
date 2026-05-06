---
read_when:
    - Розуміння архітектури інтеграції Pi SDK в OpenClaw
    - Змінення життєвого циклу сеансу агента, інструментарію або підключення провайдера для Pi
summary: Архітектура інтеграції вбудованого агента Pi в OpenClaw та життєвого циклу сеансу
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-05-06T04:19:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: abd9e828b0a72ac4e796f33c247bb2b5d7143ddf5e897ad9d7380cfbfce1eb64
    source_path: pi.md
    workflow: 16
---

OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) та його спорідненими пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`), щоб забезпечувати можливості AI-агента.

## Огляд

OpenClaw використовує pi SDK, щоб вбудувати AI-агента для кодування в архітектуру свого Gateway обміну повідомленнями. Замість запуску pi як підпроцесу або використання режиму RPC, OpenClaw напряму імпортує та створює екземпляр `AgentSession` pi через `createAgentSession()`. Цей вбудований підхід забезпечує:

- Повний контроль над життєвим циклом сеансу та обробкою подій
- Ін’єкцію власних інструментів (обмін повідомленнями, пісочниця, дії для конкретних каналів)
- Налаштування системного промпта для кожного каналу/контексту
- Збереження сеансів із підтримкою гілкування/Compaction
- Ротацію профілів автентифікації для кількох облікових записів із відмовостійким перемиканням
- Перемикання моделей незалежно від провайдера

## Залежності пакетів

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| Пакет            | Призначення                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Базові абстракції LLM: `Model`, `streamSimple`, типи повідомлень, API провайдерів                        |
| `pi-agent-core`  | Цикл агента, виконання інструментів, типи `AgentMessage`                                                 |
| `pi-coding-agent` | Високорівневий SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, вбудовані інструменти |
| `pi-tui`         | Компоненти термінального UI (використовуються в локальному режимі TUI OpenClaw)                          |

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

Середовища виконання дій повідомлень для конкретних каналів тепер розміщені в каталогах розширень, що належать Plugin, а не в `src/agents/tools`, наприклад:

- файли середовища виконання дій Plugin Discord
- файл середовища виконання дій Plugin Slack
- файл середовища виконання дій Plugin Telegram
- файл середовища виконання дій Plugin WhatsApp

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

### 2. Створення сеансу

Усередині `runEmbeddedAttempt()` (який викликається `runEmbeddedPiAgent()`) використовується pi SDK:

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

`subscribeEmbeddedPiSession()` підписується на події `AgentSession` pi:

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

Оброблювані події включають:

- `message_start` / `message_end` / `message_update` (потоковий текст/мислення)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Промптинг

Після налаштування до сеансу надсилається промпт:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє повний цикл агента: надсилання до LLM, виконання викликів інструментів, потокову передачу відповідей.

Ін’єкція зображень локальна для промпта: OpenClaw завантажує посилання на зображення з поточного промпта та передає їх через `images` лише для цього ходу. Він не сканує повторно старіші ходи історії, щоб повторно ін’єктувати payload зображень.

## Архітектура інструментів

### Конвеєр інструментів

1. **Базові інструменти**: `codingTools` pi (read, bash, edit, write)
2. **Власні заміни**: OpenClaw замінює bash на `exec`/`process`, налаштовує read/edit/write для пісочниці
3. **Інструменти OpenClaw**: обмін повідомленнями, браузер, canvas, сеанси, cron, Gateway тощо.
4. **Інструменти каналів**: інструменти дій, специфічні для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація політиками**: інструменти фільтруються за профілем, провайдером, агентом, групою, політиками пісочниці
6. **Нормалізація схем**: схеми очищуються з урахуванням особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: інструменти обгортаються, щоб поважати сигнали переривання

### Адаптер визначення інструментів

`AgentTool` з pi-agent-core має іншу сигнатуру `execute`, ніж `ToolDefinition` з pi-coding-agent. Адаптер у `pi-tool-definition-adapter.ts` з’єднує їх:

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

### Стратегія розділення інструментів

`splitSdkTools()` передає всі інструменти через `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Це гарантує, що фільтрація політик OpenClaw, інтеграція з пісочницею та розширений набір інструментів залишаються узгодженими між провайдерами.

## Побудова системного промпта

Системний промпт будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він складає повний промпт із розділами, зокрема Tooling, Tool Call Style, запобіжниками безпеки, довідником OpenClaw CLI, Skills, документацією, робочим простором, пісочницею, повідомленнями, тегами відповідей, голосом, тихими відповідями, Heartbeat-и, метаданими середовища виконання, а також пам’яттю і реакціями, коли їх увімкнено, та необов’язковими контекстними файлами й додатковим вмістом системного промпта. Розділи обрізаються для мінімального режиму промпта, який використовується субагентами.

Промпт застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це JSONL-файли з деревоподібною структурою (зв’язування `id`/`parentId`). `SessionManager` Pi відповідає за збереження:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw обгортає це через `guardSessionManager()` для безпеки результатів інструментів.

### Кешування сесій

`session-manager-cache.ts` кешує екземпляри SessionManager, щоб уникати повторного розбору файлів:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Обмеження історії

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (особисте повідомлення або група).

### Compaction

Автоматична Compaction запускається за переповнення контексту. Поширені сигнатури переповнення
включають `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` і `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` обробляє ручну
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Автентифікація та визначення моделі

### Профілі автентифікації

OpenClaw підтримує сховище профілів автентифікації з кількома ключами API для кожного провайдера:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Профілі ротуються після збоїв із відстеженням періоду охолодження:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Визначення моделі

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

### Аварійне перемикання

`FailoverError` запускає резервне перемикання моделі, коли це налаштовано:

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

## Розширення Pi

OpenClaw завантажує власні розширення Pi для спеціалізованої поведінки:

### Запобіжник Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` додає запобіжники до Compaction, зокрема адаптивне планування бюджету токенів, а також підсумки збоїв інструментів і файлових операцій:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Обрізання контексту

`src/agents/pi-hooks/context-pruning.ts` реалізує обрізання контексту на основі TTL кешу:

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

## Стримінг і блокові відповіді

### Розбиття блоків

`EmbeddedBlockChunker` керує стримінговим текстом, перетворюючи його на окремі блоки відповідей:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Вилучення тегів мислення/фінальної відповіді

Стримінговий вивід обробляється, щоб вилучати блоки `<think>`/`<thinking>` і витягати вміст `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Директиви відповідей

Директиви відповідей на кшталт `[[media:url]]`, `[[voice]]`, `[[reply:id]]` розбираються й витягуються:

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

### Резервний рівень мислення

Якщо рівень мислення не підтримується, використовується резервний варіант:

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

## Інтеграція з пісочницею

Коли режим пісочниці ввімкнено, інструменти й шляхи обмежуються:

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

## Обробка для окремих провайдерів

### Anthropic

- Очищення магічного рядка відмови
- Перевірка ходів для послідовних ролей
- Сувора перевірка параметрів інструментів upstream Pi

### Google/Gemini

- Санітизація схеми інструментів, що належить Plugin

### OpenAI

- Інструмент `apply_patch` для моделей Codex
- Обробка зниження рівня мислення

## Інтеграція з TUI

OpenClaw також має локальний режим TUI, який напряму використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивний термінальний досвід, подібний до нативного режиму Pi.

## Ключові відмінності від Pi CLI

| Аспект             | Pi CLI                         | Вбудований OpenClaw                                                                                 |
| ------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| Виклик             | команда `pi` / RPC             | SDK через `createAgentSession()`                                                                    |
| Інструменти        | Типові інструменти кодування   | Власний набір інструментів OpenClaw                                                                 |
| Системний промпт   | AGENTS.md + промпти            | Динамічний для каналу/контексту                                                                     |
| Сховище сесій      | `~/.pi/agent/sessions/`        | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`)     |
| Автентифікація     | Одна облікова інформація       | Кілька профілів із ротацією                                                                         |
| Розширення         | Завантажуються з диска         | Програмні + дискові шляхи                                                                           |
| Обробка подій      | Рендеринг TUI                  | На основі callback-ів (`onBlockReply` тощо)                                                         |

## Майбутні міркування

Сфери для потенційної переробки:

1. **Узгодження сигнатур інструментів**: зараз виконується адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання менеджера сесій**: `guardSessionManager` додає безпеку, але підвищує складність
3. **Завантаження розширень**: можна пряміше використовувати `ResourceLoader` Pi
4. **Складність обробника стримінгу**: `subscribeEmbeddedPiSession` став великим
5. **Особливості провайдерів**: багато кодових шляхів, специфічних для провайдерів, які потенційно міг би обробляти Pi

## Тести

Покриття інтеграції Pi охоплює такі набори:

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

Живі/за явним увімкненням:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (увімкнути `OPENCLAW_LIVE_TEST=1`)

Поточні команди запуску див. у [робочому процесі розробки Pi](/uk/pi-dev).

## Пов’язане

- [Робочий процес розробки Pi](/uk/pi-dev)
- [Огляд установлення](/uk/install)
