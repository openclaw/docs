---
read_when:
    - Розуміння дизайну інтеграції SDK Pi в OpenClaw
    - Зміна життєвого циклу сесії агента, інструментів або підключення провайдера для Pi
summary: Архітектура інтеграції вбудованого агента Pi в OpenClaw та життєвий цикл сесії
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-04-22T02:36:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# Архітектура інтеграції Pi

Цей документ описує, як OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) та його спорідненими пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`) для забезпечення можливостей свого AI-агента.

## Огляд

OpenClaw використовує SDK pi, щоб вбудувати AI-агента для програмування у свою архітектуру шлюзу повідомлень. Замість запуску pi як підпроцесу або використання режиму RPC, OpenClaw безпосередньо імпортує та створює `AgentSession` через `createAgentSession()`. Цей вбудований підхід забезпечує:

- Повний контроль над життєвим циклом сесії та обробкою подій
- Впровадження власних інструментів (повідомлення, пісочниця, дії для конкретного каналу)
- Налаштування системного prompt для кожного каналу/контексту
- Збереження сесії з підтримкою гілкування/Compaction
- Ротацію профілів автентифікації для кількох облікових записів із резервним перемиканням
- Незалежне від провайдера перемикання моделей

## Залежності пакетів

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Пакет            | Призначення                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Базові абстракції LLM: `Model`, `streamSimple`, типи повідомлень, API провайдерів                      |
| `pi-agent-core`  | Цикл агента, виконання інструментів, типи `AgentMessage`                                                |
| `pi-coding-agent` | Високорівневий SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, вбудовані інструменти |
| `pi-tui`         | Компоненти термінального UI (використовуються в локальному режимі TUI OpenClaw)                        |

## Структура файлів

```
src/agents/
├── pi-embedded-runner.ts          # Повторні експорти з pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Основна точка входу: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Логіка однієї спроби з налаштуванням сесії
│   │   ├── params.ts              # Тип RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Побудова корисних навантажень відповіді з результатів запуску
│   │   ├── images.ts              # Впровадження зображень для vision-моделі
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Виявлення помилки переривання
│   ├── cache-ttl.ts               # Відстеження Cache TTL для обрізання контексту
│   ├── compact.ts                 # Логіка ручного/автоматичного Compaction
│   ├── extensions.ts              # Завантаження розширень pi для вбудованих запусків
│   ├── extra-params.ts            # Параметри потоку для конкретних провайдерів
│   ├── google.ts                  # Виправлення порядку ходів для Google/Gemini
│   ├── history.ts                 # Обмеження історії (DM проти групи)
│   ├── lanes.ts                   # Лінії команд для сесії/глобальні
│   ├── logger.ts                  # Логер підсистеми
│   ├── model.ts                   # Визначення моделі через ModelRegistry
│   ├── runs.ts                    # Відстеження активних запусків, переривання, черга
│   ├── sandbox-info.ts            # Інформація про пісочницю для системного prompt
│   ├── session-manager-cache.ts   # Кешування екземпляра SessionManager
│   ├── session-manager-init.ts    # Ініціалізація файла сесії
│   ├── system-prompt.ts           # Конструктор системного prompt
│   ├── tool-split.ts              # Поділ інструментів на builtIn та custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Відображення ThinkLevel, опис помилки
├── pi-embedded-subscribe.ts       # Підписка/диспетчеризація подій сесії
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Фабрика обробників подій
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Розбиття потокової блокової відповіді на частини
├── pi-embedded-messaging.ts       # Відстеження надісланих інструментом повідомлень
├── pi-embedded-helpers.ts         # Класифікація помилок, валідація ходу
├── pi-embedded-helpers/           # Допоміжні модулі
├── pi-embedded-utils.ts           # Утиліти форматування
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Обгортання AbortSignal для інструментів
├── pi-tools.policy.ts             # Політика allowlist/denylist інструментів
├── pi-tools.read.ts               # Кастомізації інструмента читання
├── pi-tools.schema.ts             # Нормалізація схем інструментів
├── pi-tools.types.ts              # Псевдонім типу AnyAgentTool
├── pi-tool-definition-adapter.ts  # Адаптер AgentTool -> ToolDefinition
├── pi-settings.ts                 # Перевизначення налаштувань
├── pi-hooks/                      # Користувацькі хуки pi
│   ├── compaction-safeguard.ts    # Розширення-запобіжник
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Розширення обрізання контексту Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Визначення профілю автентифікації
├── auth-profiles.ts               # Сховище профілів, cooldown, резервне перемикання
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
├── skills.ts                      # Побудова знімка Skills/prompt
├── skills/                        # Підсистема Skills
├── sandbox.ts                     # Визначення контексту пісочниці
├── sandbox/                       # Підсистема пісочниці
├── channel-tools.ts               # Впровадження інструментів для конкретного каналу
├── openclaw-tools.ts              # Специфічні для OpenClaw інструменти
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

Середовища виконання дій із повідомленнями для конкретних каналів тепер розміщені в каталогах розширень, якими володіють plugin, а не в `src/agents/tools`, наприклад:

- файли середовища виконання дій plugin Discord
- файл середовища виконання дій plugin Slack
- файл середовища виконання дій plugin Telegram
- файл середовища виконання дій plugin WhatsApp

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

Усередині `runEmbeddedAttempt()` (яка викликається з `runEmbeddedPiAgent()`) використовується SDK pi:

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

Серед оброблюваних подій:

- `message_start` / `message_end` / `message_update` (потоковий текст/міркування)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Надсилання prompt

Після налаштування до сесії надсилається prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє повний цикл агента: надсилання до LLM, виконання викликів інструментів, потокову передачу відповідей.

Впровадження зображень є локальним для prompt: OpenClaw завантажує посилання на зображення з поточного prompt і передає їх через `images` лише для цього ходу. Він не сканує повторно старі ходи історії, щоб повторно впроваджувати корисні навантаження зображень.

## Архітектура інструментів

### Конвеєр інструментів

1. **Базові інструменти**: `codingTools` із pi (`read`, `bash`, `edit`, `write`)
2. **Користувацькі заміни**: OpenClaw замінює bash на `exec`/`process`, налаштовує `read`/`edit`/`write` для пісочниці
3. **Інструменти OpenClaw**: повідомлення, браузер, canvas, сесії, Cron, Gateway тощо
4. **Інструменти каналів**: інструменти дій для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація за політикою**: інструменти фільтруються за профілем, провайдером, агентом, групою, політиками пісочниці
6. **Нормалізація схем**: схеми очищуються з урахуванням особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: інструменти обгортаються для підтримки сигналів переривання

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

### Стратегія поділу інструментів

`splitSdkTools()` передає всі інструменти через `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Порожньо. Ми все перевизначаємо
    customTools: toToolDefinitions(options.tools),
  };
}
```

Це гарантує, що фільтрація за політикою OpenClaw, інтеграція з пісочницею та розширений набір інструментів залишаються узгодженими між провайдерами.

## Побудова системного prompt

Системний prompt будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він формує повний prompt із розділами, зокрема Tooling, Tool Call Style, запобіжниками безпеки, довідкою CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, метаданими runtime, а також Memory і Reactions, коли вони ввімкнені, і необов’язковими файлами контексту та додатковим вмістом системного prompt. Для мінімального режиму prompt, який використовується субагентами, розділи скорочуються.

Prompt застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це JSONL-файли з деревоподібною структурою (зв’язування через id/parentId). Збереженням керує `SessionManager` із Pi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw обгортає це через `guardSessionManager()` для безпечної обробки результатів інструментів.

### Кешування сесій

`session-manager-cache.ts` кешує екземпляри SessionManager, щоб уникати повторного парсингу файлів:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Обмеження історії

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (DM чи група).

### Compaction

Автоматичний Compaction запускається при переповненні контексту. Поширені ознаки переповнення включають
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

### Профілі автентифікації

OpenClaw підтримує сховище профілів автентифікації з кількома API-ключами для кожного провайдера:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Профілі змінюються при збоях із відстеженням cooldown:

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

// Використовує ModelRegistry і AuthStorage із Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Резервне перемикання

`FailoverError` запускає резервне перемикання моделі, якщо це налаштовано:

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

`src/agents/pi-hooks/compaction-safeguard.ts` додає запобіжники до Compaction, зокрема адаптивне бюджетування токенів, а також підсумки збоїв інструментів і файлових операцій:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Обрізання контексту

`src/agents/pi-hooks/context-pruning.ts` реалізує обрізання контексту на основі Cache TTL:

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

## Потокова передача та блокові відповіді

### Розбиття на блоки

`EmbeddedBlockChunker` керує потоковим текстом, перетворюючи його на окремі блоки відповіді:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Видалення тегів Thinking/Final

Потоковий вивід обробляється для видалення блоків `<think>`/`<thinking>` і витягування вмісту `<final>`:

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
isAuthAssistantError(lastAssistant)   // Збій автентифікації
isRateLimitAssistantError(...)        // Досягнуто обмеження швидкості
isFailoverAssistantError(...)         // Потрібно резервне перемикання
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Резервне повернення рівня thinking

Якщо рівень thinking не підтримується, використовується резервне значення:

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

Коли режим пісочниці ввімкнено, інструменти та шляхи обмежуються:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Використовувати ізольовані інструменти read/edit/write
  // Exec виконується в контейнері
  // Browser використовує URL мосту
}
```

## Обробка для конкретних провайдерів

### Anthropic

- Очищення магічного рядка відмови
- Валідація ходу для послідовних ролей
- Сувора валідація параметрів інструментів Pi на стороні upstream

### Google/Gemini

- Санітизація схем інструментів у plugin-власника

### OpenAI

- Інструмент `apply_patch` для моделей Codex
- Обробка зниження рівня thinking

## Інтеграція TUI

OpenClaw також має локальний режим TUI, який безпосередньо використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивний досвід роботи в терміналі, подібний до нативного режиму Pi.

## Ключові відмінності від CLI Pi

| Аспект          | CLI Pi                  | Вбудований OpenClaw                                                                              |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Виклик          | команда `pi` / RPC      | SDK через `createAgentSession()`                                                                 |
| Інструменти     | Стандартні інструменти для програмування | Власний набір інструментів OpenClaw                                                 |
| Системний prompt | AGENTS.md + prompts    | Динамічний для кожного каналу/контексту                                                          |
| Зберігання сесій | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Автентифікація  | Один обліковий запис    | Кілька профілів із ротацією                                                                       |
| Розширення      | Завантажуються з диска  | Програмно + шляхи на диску                                                                       |
| Обробка подій   | Рендеринг TUI           | На основі callback (`onBlockReply` тощо)                                                         |

## Майбутні міркування

Сфери для потенційного перегляду:

1. **Узгодження сигнатур інструментів**: зараз виконується адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання менеджера сесій**: `guardSessionManager` додає безпеку, але підвищує складність
3. **Завантаження розширень**: можна було б більш безпосередньо використовувати `ResourceLoader` із Pi
4. **Складність обробника потоків**: `subscribeEmbeddedPiSession` суттєво розрісся
5. **Особливості провайдерів**: багато кодових шляхів для конкретних провайдерів, які Pi потенційно міг би обробляти сам

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (увімкнути через `OPENCLAW_LIVE_TEST=1`)

Актуальні команди запуску див. у [Робочий процес розробки Pi](/uk/pi-dev).
