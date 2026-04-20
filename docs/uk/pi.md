---
read_when:
    - Розуміння дизайну інтеграції Pi SDK в OpenClaw
    - Зміна життєвого циклу сесії агента, інструментів або підключення провайдера для Pi
summary: Архітектура інтеграції вбудованого агента Pi в OpenClaw та життєвий цикл сесії
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-04-20T18:52:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# Архітектура інтеграції Pi

Цей документ описує, як OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) та його спорідненими пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`) для забезпечення можливостей свого AI-агента.

## Огляд

OpenClaw використовує Pi SDK, щоб вбудувати AI-агента для програмування у свою архітектуру шлюзу повідомлень. Замість запуску pi як підпроцесу або використання режиму RPC, OpenClaw напряму імпортує та створює `AgentSession` через `createAgentSession()`. Такий вбудований підхід забезпечує:

- Повний контроль над життєвим циклом сесії та обробкою подій
- Ін'єкцію власних інструментів (повідомлення, sandbox, дії, специфічні для каналу)
- Налаштування системного prompt для кожного каналу/контексту
- Збереження сесій із підтримкою розгалуження/Compaction
- Ротацію кількох auth-профілів облікових записів із failover
- Незалежне від провайдера перемикання моделей

## Залежності пакетів

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Package           | Призначення                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Базові абстракції LLM: `Model`, `streamSimple`, типи повідомлень, API провайдерів                    |
| `pi-agent-core`   | Цикл агента, виконання інструментів, типи `AgentMessage`                                              |
| `pi-coding-agent` | Високорівневий SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, вбудовані інструменти |
| `pi-tui`          | Компоненти термінального UI (використовуються в локальному режимі TUI OpenClaw)                      |

## Структура файлів

```
src/agents/
├── pi-embedded-runner.ts          # Реекспорти з pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Головна точка входу: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Логіка однієї спроби з налаштуванням сесії
│   │   ├── params.ts              # Тип RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Побудова payload відповіді з результатів запуску
│   │   ├── images.ts              # Ін'єкція зображень для vision-моделі
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Визначення помилки скасування
│   ├── cache-ttl.ts               # Відстеження TTL кешу для обрізання контексту
│   ├── compact.ts                 # Логіка ручного/автоматичного Compaction
│   ├── extensions.ts              # Завантаження розширень pi для вбудованих запусків
│   ├── extra-params.ts            # Додаткові параметри потоку для конкретних провайдерів
│   ├── google.ts                  # Виправлення порядку ходів Google/Gemini
│   ├── history.ts                 # Обмеження історії (DM проти групи)
│   ├── lanes.ts                   # Доріжки команд сесії/глобальних команд
│   ├── logger.ts                  # Логер підсистеми
│   ├── model.ts                   # Визначення моделі через ModelRegistry
│   ├── runs.ts                    # Відстеження активних запусків, скасування, черга
│   ├── sandbox-info.ts            # Інформація про sandbox для системного prompt
│   ├── session-manager-cache.ts   # Кешування екземплярів SessionManager
│   ├── session-manager-init.ts    # Ініціалізація файлу сесії
│   ├── system-prompt.ts           # Побудова системного prompt
│   ├── tool-split.ts              # Розділення інструментів на builtIn і custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Відображення ThinkLevel, опис помилок
├── pi-embedded-subscribe.ts       # Підписка на події сесії та диспетчеризація
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Фабрика обробників подій
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Розбиття потокових блочних відповідей
├── pi-embedded-messaging.ts       # Відстеження надісланих інструментом повідомлень
├── pi-embedded-helpers.ts         # Класифікація помилок, валідація ходів
├── pi-embedded-helpers/           # Допоміжні модулі
├── pi-embedded-utils.ts           # Утиліти форматування
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Обгортання AbortSignal для інструментів
├── pi-tools.policy.ts             # Політика allowlist/denylist для інструментів
├── pi-tools.read.ts               # Налаштування інструмента читання
├── pi-tools.schema.ts             # Нормалізація схем інструментів
├── pi-tools.types.ts              # Псевдонім типу AnyAgentTool
├── pi-tool-definition-adapter.ts  # Адаптер AgentTool -> ToolDefinition
├── pi-settings.ts                 # Перевизначення налаштувань
├── pi-hooks/                      # Власні хуки pi
│   ├── compaction-safeguard.ts    # Розширення-запобіжник
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Розширення обрізання контексту за Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Визначення auth-профілю
├── auth-profiles.ts               # Сховище профілів, cooldown, failover
├── model-selection.ts             # Визначення моделі за замовчуванням
├── models-config.ts               # Генерація models.json
├── model-catalog.ts               # Кеш каталогу моделей
├── context-window-guard.ts        # Валідація вікна контексту
├── failover-error.ts              # Клас FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Визначення параметрів системного prompt
├── system-prompt-report.ts        # Генерація звіту для налагодження
├── tool-summaries.ts              # Підсумки описів інструментів
├── tool-policy.ts                 # Визначення політики інструментів
├── transcript-policy.ts           # Політика валідації транскрипту
├── skills.ts                      # Знімок Skills / побудова prompt
├── skills/                        # Підсистема Skills
├── sandbox.ts                     # Визначення контексту sandbox
├── sandbox/                       # Підсистема sandbox
├── channel-tools.ts               # Ін'єкція інструментів, специфічних для каналу
├── openclaw-tools.ts              # Інструменти, специфічні для OpenClaw
├── bash-tools.ts                  # Інструменти exec/process
├── apply-patch.ts                 # Інструмент apply_patch (OpenAI)
├── tools/                         # Окремі реалізації інструментів
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

Середовища виконання дій повідомлень, специфічних для каналу, тепер знаходяться у директоріях розширень, що належать Plugin, а не в `src/agents/tools`, наприклад:

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

### 2. Створення сесії

Усередині `runEmbeddedAttempt()` (який викликається з `runEmbeddedPiAgent()`) використовується Pi SDK:

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

`subscribeEmbeddedPiSession()` підписується на події `AgentSession` у pi:

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

- `message_start` / `message_end` / `message_update` (потоковий текст/мислення)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Після налаштування сесія отримує prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє повний цикл агента: надсилання до LLM, виконання викликів інструментів, потокову передачу відповідей.

Ін'єкція зображень є локальною для prompt: OpenClaw завантажує посилання на зображення з поточного prompt і передає їх через `images` лише для цього ходу. Він не сканує повторно старі ходи історії, щоб повторно ін'єктувати payload зображень.

## Архітектура інструментів

### Конвеєр інструментів

1. **Базові інструменти**: `codingTools` у pi (`read`, `bash`, `edit`, `write`)
2. **Власні заміни**: OpenClaw замінює bash на `exec`/`process`, налаштовує `read`/`edit`/`write` для sandbox
3. **Інструменти OpenClaw**: повідомлення, браузер, canvas, сесії, Cron, Gateway тощо
4. **Інструменти каналу**: інструменти дій, специфічні для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація за політиками**: інструменти фільтруються за профілем, провайдером, агентом, групою, політиками sandbox
6. **Нормалізація схем**: схеми очищуються з урахуванням особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: інструменти обгортаються для підтримки сигналів скасування

### Адаптер визначення інструментів

`AgentTool` у pi-agent-core має іншу сигнатуру `execute`, ніж `ToolDefinition` у pi-coding-agent. Адаптер у `pi-tool-definition-adapter.ts` з'єднує їх:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // сигнатура pi-coding-agent відрізняється від pi-agent-core
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
    builtInTools: [], // Порожньо. Ми все перевизначаємо
    customTools: toToolDefinitions(options.tools),
  };
}
```

Це гарантує, що фільтрація за політиками, інтеграція sandbox і розширений набір інструментів в OpenClaw залишаються узгодженими для всіх провайдерів.

## Побудова системного prompt

Системний prompt будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він збирає повний prompt із секціями, зокрема Tooling, Tool Call Style, захисні обмеження безпеки, довідка CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, метадані середовища виконання, а також Memory і Reactions, коли вони ввімкнені, і додатково — необов’язкові файли контексту та додатковий вміст системного prompt. Секції обрізаються для мінімального режиму prompt, який використовується підлеглими агентами.

Prompt застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це JSONL-файли з деревоподібною структурою (зв’язування через id/parentId). `SessionManager` у Pi відповідає за збереження стану:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw обгортає це через `guardSessionManager()` для безпечної обробки результатів інструментів.

### Кешування сесій

`session-manager-cache.ts` кешує екземпляри SessionManager, щоб уникнути повторного парсингу файлів:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Обмеження історії

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (DM чи група).

### Compaction

Автоматичний Compaction запускається при переповненні контексту. Типові ознаки такого переповнення включають
`request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` і `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` обробляє ручний
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Автентифікація та визначення моделі

### Auth-профілі

OpenClaw підтримує сховище auth-профілів із кількома API-ключами для кожного провайдера:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Профілі ротуються після збоїв із відстеженням cooldown:

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

// Використовує ModelRegistry і AuthStorage з Pi
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

## Розширення Pi

OpenClaw завантажує власні розширення Pi для спеціалізованої поведінки:

### Запобіжник Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` додає захисні обмеження до Compaction, зокрема адаптивне бюджетування токенів, а також підсумки збоїв інструментів і файлових операцій:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Обрізання контексту

`src/agents/pi-hooks/context-pruning.ts` реалізує обрізання контексту на основі Cache-TTL:

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

## Потокова передача та блочні відповіді

### Розбиття на блоки

`EmbeddedBlockChunker` керує потоковим текстом, перетворюючи його на окремі блоки відповіді:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Видалення тегів thinking/final

Потоковий вивід обробляється так, щоб видаляти блоки `<think>`/`<thinking>` і витягати вміст `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Видалити вміст <think>...</think>
  // Якщо enforceFinalTag увімкнено, повертати лише вміст <final>...</final>
};
```

### Директиви відповіді

Директиви відповіді, такі як `[[media:url]]`, `[[voice]]`, `[[reply:id]]`, розбираються та витягуються:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Обробка помилок

### Класифікація помилок

`pi-embedded-helpers.ts` класифікує помилки для належної обробки:

```typescript
isContextOverflowError(errorText)     // Контекст завеликий
isCompactionFailureError(errorText)   // Compaction не вдався
isAuthAssistantError(lastAssistant)   // Помилка автентифікації
isRateLimitAssistantError(...)        // Спрацювало обмеження частоти
isFailoverAssistantError(...)         // Потрібен failover
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

Коли режим sandbox увімкнено, інструменти й шляхи обмежуються:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Використовувати ізольовані інструменти read/edit/write
  // Exec виконується в контейнері
  // Browser використовує bridge URL
}
```

## Обробка, специфічна для провайдера

### Anthropic

- Очищення magic string для відмов
- Валідація ходів для послідовних ролей
- Строга валідація параметрів інструментів Pi на upstream-рівні

### Google/Gemini

- Санітизація схем інструментів, що належать Plugin

### OpenAI

- Інструмент `apply_patch` для моделей Codex
- Обробка пониження рівня thinking

## Інтеграція TUI

OpenClaw також має локальний режим TUI, який напряму використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивний досвід у терміналі, подібний до нативного режиму pi.

## Основні відмінності від Pi CLI

| Aspect          | Pi CLI                  | Вбудований OpenClaw                                                                              |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Invocation      | Команда `pi` / RPC      | SDK через `createAgentSession()`                                                                 |
| Tools           | Стандартні інструменти для кодування | Власний набір інструментів OpenClaw                                                    |
| System prompt   | AGENTS.md + prompts     | Динамічний, для кожного каналу/контексту                                                         |
| Session storage | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Один обліковий запис    | Кілька профілів із ротацією                                                                      |
| Extensions      | Завантажуються з диска  | Програмно + шляхи з диска                                                                        |
| Event handling  | Рендеринг TUI           | На основі callback-функцій (`onBlockReply` тощо)                                                 |

## Майбутні міркування

Сфери для потенційного перегляду:

1. **Вирівнювання сигнатур інструментів**: наразі є адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання менеджера сесій**: `guardSessionManager` додає безпеку, але підвищує складність
3. **Завантаження розширень**: можна було б безпосередніше використовувати `ResourceLoader` із Pi
4. **Складність обробника потоків**: `subscribeEmbeddedPiSession` став занадто великим
5. **Особливості провайдерів**: багато гілок коду, специфічних для провайдерів, які Pi потенційно міг би обробляти сам

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (увімкніть `OPENCLAW_LIVE_TEST=1`)

Актуальні команди запуску дивіться в [Робочий процес розробки Pi](/uk/pi-dev).
