---
read_when:
    - Розуміння дизайну інтеграції Pi SDK в OpenClaw
    - Зміна життєвого циклу сесії агента, інструментів або підключення провайдера для Pi
summary: Архітектура вбудованої інтеграції агента Pi в OpenClaw і життєвий цикл сесії
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-04-27T06:26:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42dff5d5a5d8a8c4af724c70a8864346f6ef9ff0b04dbc4fb3149685b2eb64cf
    source_path: pi.md
    workflow: 15
---

OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) і пов’язаними пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`), щоб забезпечити свої можливості AI-агента.

## Огляд

OpenClaw використовує SDK pi, щоб вбудувати AI coding agent у свою архітектуру messaging gateway. Замість запуску pi як subprocess або використання режиму RPC, OpenClaw безпосередньо імпортує та створює `AgentSession` pi через `createAgentSession()`. Цей вбудований підхід забезпечує:

- Повний контроль над життєвим циклом сесії та обробкою подій
- Власну ін’єкцію інструментів (обмін повідомленнями, sandbox, дії для конкретних каналів)
- Налаштування system prompt для кожного каналу/контексту
- Збереження сесій з підтримкою branching/Compaction
- Ротацію профілів auth для кількох облікових записів із failover
- Незалежне від провайдера перемикання моделей

## Залежності пакетів

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
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
├── pi-embedded-runner.ts          # Реекспорти з pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Основна точка входу: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Логіка однієї спроби з налаштуванням сесії
│   │   ├── params.ts              # Тип RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Побудова payload відповіді з результатів запуску
│   │   ├── images.ts              # Ін’єкція зображень для vision model
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Виявлення помилки скасування
│   ├── cache-ttl.ts               # Відстеження Cache TTL для обрізання контексту
│   ├── compact.ts                 # Логіка ручної/автоматичної Compaction
│   ├── extensions.ts              # Завантаження розширень pi для вбудованих запусків
│   ├── extra-params.ts            # Параметри потокового виведення для конкретних провайдерів
│   ├── google.ts                  # Виправлення порядку ходів Google/Gemini
│   ├── history.ts                 # Обмеження історії (DM vs group)
│   ├── lanes.ts                   # Шляхи команд session/global
│   ├── logger.ts                  # Логер підсистеми
│   ├── model.ts                   # Визначення моделі через ModelRegistry
│   ├── runs.ts                    # Відстеження активних запусків, скасування, черга
│   ├── sandbox-info.ts            # Інформація sandbox для system prompt
│   ├── session-manager-cache.ts   # Кешування екземплярів SessionManager
│   ├── session-manager-init.ts    # Ініціалізація файлу сесії
│   ├── system-prompt.ts           # Побудовник system prompt
│   ├── tool-split.ts              # Поділ інструментів на builtIn і custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Відображення ThinkLevel, опис помилок
├── pi-embedded-subscribe.ts       # Підписка/диспетчеризація подій сесії
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Фабрика обробників подій
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking блоків відповіді під час потокового виведення
├── pi-embedded-messaging.ts       # Відстеження надісланих інструментом messaging повідомлень
├── pi-embedded-helpers.ts         # Класифікація помилок, перевірка ходів
├── pi-embedded-helpers/           # Допоміжні модулі
├── pi-embedded-utils.ts           # Утиліти форматування
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Обгортання AbortSignal для інструментів
├── pi-tools.policy.ts             # Політика allowlist/denylist інструментів
├── pi-tools.read.ts               # Кастомізації інструмента read
├── pi-tools.schema.ts             # Нормалізація схем інструментів
├── pi-tools.types.ts              # Псевдонім типу AnyAgentTool
├── pi-tool-definition-adapter.ts  # Адаптер AgentTool -> ToolDefinition
├── pi-settings.ts                 # Перевизначення налаштувань
├── pi-hooks/                      # Власні hooks pi
│   ├── compaction-safeguard.ts    # Розширення захисту
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Розширення обрізання контексту Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Визначення профілю auth
├── auth-profiles.ts               # Сховище профілів, cooldown, failover
├── model-selection.ts             # Визначення моделі за замовчуванням
├── models-config.ts               # Генерація models.json
├── model-catalog.ts               # Кеш каталогу моделей
├── context-window-guard.ts        # Перевірка контекстного вікна
├── failover-error.ts              # Клас FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Визначення параметрів system prompt
├── system-prompt-report.ts        # Генерація звіту налагодження
├── tool-summaries.ts              # Підсумки описів інструментів
├── tool-policy.ts                 # Визначення політики інструментів
├── transcript-policy.ts           # Політика перевірки transcript
├── skills.ts                      # Знімок Skills/побудова prompt
├── skills/                        # Підсистема Skills
├── sandbox.ts                     # Визначення контексту sandbox
├── sandbox/                       # Підсистема sandbox
├── channel-tools.ts               # Ін’єкція інструментів для конкретних каналів
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

Runtime дій повідомлень для конкретних каналів тепер знаходяться в каталогах
розширень, що належать plugin, а не в `src/agents/tools`, наприклад:

- файли runtime дій plugin Discord
- файл runtime дій plugin Slack
- файл runtime дій plugin Telegram
- файл runtime дій plugin WhatsApp

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

Усередині `runEmbeddedAttempt()` (який викликається з `runEmbeddedPiAgent()`) використовується SDK pi:

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

Обробляються такі події:

- `message_start` / `message_end` / `message_update` (потокове виведення тексту/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Надсилання prompt

Після налаштування до сесії надсилається prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє повний цикл агента: надсилання до LLM, виконання викликів інструментів, потокове передавання відповідей.

Ін’єкція зображень є локальною для prompt: OpenClaw завантажує посилання на зображення з поточного prompt і
передає їх через `images` лише для цього ходу. Він не сканує повторно старіші ходи історії,
щоб знову ін’єктувати payload зображень.

## Архітектура інструментів

### Конвеєр інструментів

1. **Базові інструменти**: `codingTools` pi (`read`, `bash`, `edit`, `write`)
2. **Власні заміни**: OpenClaw замінює `bash` на `exec`/`process`, налаштовує `read`/`edit`/`write` для sandbox
3. **Інструменти OpenClaw**: messaging, browser, canvas, sessions, cron, gateway тощо
4. **Інструменти каналів**: інструменти дій для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація політикою**: інструменти фільтруються за профілем, провайдером, агентом, групою, політиками sandbox
6. **Нормалізація схем**: схеми очищуються для особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: інструменти обгортаються для дотримання сигналів скасування

### Адаптер визначення інструментів

`AgentTool` з pi-agent-core має інший сигнатуру `execute`, ніж `ToolDefinition` у pi-coding-agent. Адаптер у `pi-tool-definition-adapter.ts` з’єднує їх:

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

Це гарантує, що фільтрація політик OpenClaw, інтеграція sandbox і розширений набір інструментів залишаються узгодженими між провайдерами.

## Побудова system prompt

System prompt будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він збирає повний prompt із секціями, що включають Tooling, Tool Call Style, Safety guardrails, довідник OpenClaw CLI, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeat-и, метадані runtime, а також Memory і Reactions, коли вони ввімкнені, і необов’язкові файли контексту та додатковий вміст system prompt. Секції обрізаються для мінімального режиму prompt, який використовують subagents.

Prompt застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це JSONL-файли з деревоподібною структурою (зв’язування через id/parentId). `SessionManager` з Pi відповідає за збереження:

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

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (DM або group).

### Compaction

Автоматичний Compaction спрацьовує при переповненні контексту. Типові сигнатури
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

## Автентифікація та визначення моделі

### Профілі auth

OpenClaw підтримує сховище профілів auth із кількома API key для кожного провайдера:

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

`FailoverError` запускає fallback моделі, коли його налаштовано:

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

### Захист Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` додає захисні механізми до Compaction, зокрема адаптивне бюджетування токенів, а також підсумки збоїв інструментів і файлових операцій:

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

## Потокове виведення та блоки відповідей

### Block Chunking

`EmbeddedBlockChunker` керує потоковим текстом, перетворюючи його на окремі блоки відповіді:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Вилучення тегів Thinking/Final

Вивід потокового виведення обробляється для вилучення блоків `<think>`/`<thinking>` і виділення вмісту `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Вилучити вміст <think>...</think>
  // Якщо enforceFinalTag, повертати лише вміст <final>...</final>
};
```

### Директиви відповіді

Директиви відповіді на кшталт `[[media:url]]`, `[[voice]]`, `[[reply:id]]` розбираються та виділяються:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Обробка помилок

### Класифікація помилок

`pi-embedded-helpers.ts` класифікує помилки для належної обробки:

```typescript
isContextOverflowError(errorText)     // Контекст завеликий
isCompactionFailureError(errorText)   // Compaction не вдався
isAuthAssistantError(lastAssistant)   // Збій auth
isRateLimitAssistantError(...)        // Досягнуто обмеження швидкості
isFailoverAssistantError(...)         // Потрібен failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback рівня thinking

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

Коли режим sandbox увімкнено, інструменти та шляхи обмежуються:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Використовувати read/edit/write інструменти в sandbox
  // Exec виконується в контейнері
  // Browser використовує bridge URL
}
```

## Обробка для конкретних провайдерів

### Anthropic

- Очищення magic string відмови
- Перевірка ходу для послідовних ролей
- Сувора перевірка параметрів інструментів Pi з боку upstream

### Google/Gemini

- Санітизація схем інструментів, що належать plugin

### OpenAI

- Інструмент `apply_patch` для моделей Codex
- Обробка зниження рівня thinking

## Інтеграція TUI

OpenClaw також має локальний режим TUI, який безпосередньо використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивний термінальний досвід, подібний до рідного режиму Pi.

## Ключові відмінності від Pi CLI

| Аспект           | Pi CLI                  | Вбудований OpenClaw                                                                            |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Виклик           | команда `pi` / RPC      | SDK через `createAgentSession()`                                                               |
| Інструменти      | Типові coding tools     | Власний набір інструментів OpenClaw                                                            |
| System prompt    | AGENTS.md + prompts     | Динамічний для кожного каналу/контексту                                                        |
| Сховище сесій    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth             | Один обліковий запис    | Кілька профілів із ротацією                                                                    |
| Розширення       | Завантажуються з диска  | Програмно + шляхи на диску                                                                     |
| Обробка подій    | Відображення TUI        | На основі callback (`onBlockReply` тощо)                                                       |

## Майбутні міркування

Області для потенційного перегляду:

1. **Вирівнювання сигнатур інструментів**: зараз відбувається адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання session manager**: `guardSessionManager` додає безпеку, але збільшує складність
3. **Завантаження розширень**: можна було б безпосередніше використовувати `ResourceLoader` з Pi
4. **Складність обробника потокового виведення**: `subscribeEmbeddedPiSession` став занадто великим
5. **Особливості провайдерів**: багато кодових шляхів для конкретних провайдерів, які Pi потенційно міг би обробляти сам

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (увімкніть `OPENCLAW_LIVE_TEST=1`)

Актуальні команди запуску див. у [Робочий процес розробки Pi](/uk/pi-dev).

## Пов’язане

- [Робочий процес розробки Pi](/uk/pi-dev)
- [Огляд встановлення](/uk/install)
