---
read_when:
    - Ви створюєте plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із plugin
    - 'Ви вирішуєте, що обрати: внутрішні хуки чи хуки plugin'
summary: 'Хуки Plugin: перехоплюють події життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-25T18:14:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це внутрішньопроцесні точки розширення для plugin OpenClaw. Використовуйте їх,
коли plugin має перевіряти або змінювати запуски агента, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), якщо вам потрібен невеликий
скрипт `HOOK.md`, який оператор встановлює для команд і подій Gateway, таких як
`/new`, `/reset`, `/stop`, `agent:bootstrap` або `gateway:startup`.

## Швидкий старт

Зареєструйте типізовані хуки plugin за допомогою `api.on(...)` з точки входу вашого plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Обробники хуків виконуються послідовно в порядку спадання `priority`. Хуки
з однаковим пріоритетом зберігають порядок реєстрації.

## Каталог хуків

Хуки згруповано за поверхнею, яку вони розширюють. Назви, виділені **жирним**, приймають
результат рішення (блокування, скасування, перевизначення або вимога схвалення); усі інші
лише спостерігають.

**Хід агента**

- `before_model_resolve` — перевизначає provider або модель до завантаження повідомлень сесії
- `before_prompt_build` — додає динамічний контекст або текст системного промпту перед викликом моделі
- `before_agent_start` — комбінована фаза лише для сумісності; натомість віддавайте перевагу двом хукам вище
- **`before_agent_reply`** — достроково завершує хід моделі синтетичною відповіддю або беззвучним режимом
- `agent_end` — спостерігає фінальні повідомлення, стан успіху та тривалість виконання

**Спостереження за розмовою**

- `model_call_started` / `model_call_ended` — спостерігають санітизовані метадані виклику provider/моделі, час виконання, результат і обмежені хеші request-id без вмісту промпту чи відповіді
- `llm_input` — спостерігає вхідні дані provider (системний промпт, промпт, історія)
- `llm_output` — спостерігає вихідні дані provider

**Інструменти**

- **`before_tool_call`** — переписує параметри інструмента, блокує виконання або вимагає схвалення
- `after_tool_call` — спостерігає результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписує повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевіряє або блокує запис повідомлення, що виконується (рідко)

**Повідомлення та доставка**

- **`inbound_claim`** — перехоплює вхідне повідомлення до маршрутизації агента (синтетичні відповіді)
- `message_received` — спостерігає вхідний вміст, відправника, тред і метадані
- **`message_sending`** — переписує вихідний вміст або скасовує доставку
- `message_sent` — спостерігає успіх або збій вихідної доставки
- **`before_dispatch`** — перевіряє або переписує вихідну диспетчеризацію до передачі каналу
- **`reply_dispatch`** — бере участь у фінальному конвеєрі диспетчеризації відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежують межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігають або анотують цикли Compaction
- `before_reset` — спостерігає події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координують маршрутизацію субагентів і доставку після завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускають або зупиняють сервіси, що належать plugin, разом із Gateway
- **`before_install`** — перевіряє сканування встановлення skill або plugin і за потреби блокує його

## Політика викликів інструментів

`before_tool_call` отримує:

- `event.toolName`
- `event.params`
- необов’язковий `event.runId`
- необов’язковий `event.toolCallId`
- поля контексту, такі як `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, і
  діагностичний `ctx.trace`

Він може повертати:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Правила:

- `block: true` є термінальним і пропускає обробники з нижчим пріоритетом.
- `block: false` вважається відсутністю рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє виконання агента й запитує користувача через схвалення plugin.
  Команда `/approve` може схвалювати як exec, так і схвалення plugin.
- `block: true` із нижчим пріоритетом усе одно може блокувати після того, як хук
  із вищим пріоритетом запросив схвалення.
- `onResolution` отримує остаточне рішення щодо схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

## Хуки промптів і моделей

Для нових plugin використовуйте хуки, специфічні для фаз:

- `before_model_resolve`: отримує лише поточний промпт і метадані вкладень.
  Поверніть `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Поверніть `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` залишається для сумісності. Віддавайте перевагу явним хукам вище,
щоб ваш plugin не залежав від застарілої комбінованої фази.

`before_agent_start` і `agent_end` включають `event.runId`, коли OpenClaw може
ідентифікувати активний запуск. Те саме значення також доступне в `ctx.runId`.

Використовуйте `model_call_started` і `model_call_ended` для телеметрії викликів provider,
яка не повинна отримувати сирі промпти, історію, відповіді, заголовки, тіла
запитів або request ID provider. Ці хуки включають стабільні метадані, такі як
`runId`, `callId`, `provider`, `model`, необов’язкові `api`/`transport`, фінальні
`durationMs`/`outcome` і `upstreamRequestIdHash`, коли OpenClaw може отримати
обмежений хеш request-id provider.

Невбудовані plugin, яким потрібні `llm_input`, `llm_output` або `agent_end`, повинні задати:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Хуки, що змінюють промпт, можна вимкнути для окремого plugin за допомогою
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Хуки повідомлень

Використовуйте хуки повідомлень для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігає вхідний вміст, відправника, `threadId`, `messageId`,
  `senderId`, необов’язкову кореляцію запуску/сесії та метадані.
- `message_sending`: переписує `content` або повертає `{ cancel: true }`.
- `message_sent`: спостерігає фінальний успіх або збій.

Для відповідей TTS лише з аудіо `content` може містити приховану транскрипцію мовлення,
навіть якщо payload каналу не має видимого тексту/підпису. Переписування цього
`content` оновлює лише транскрипцію, видиму хукам; вона не відображається як
підпис до медіа.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Віддавайте перевагу
цим полям першого класу, перш ніж читати застарілі метадані.

Віддавайте перевагу типізованим полям `threadId` і `replyToId` перед використанням
метаданих, специфічних для каналу.

Правила рішень:

- `message_sending` із `cancel: true` є термінальним.
- `message_sending` із `cancel: false` вважається відсутністю рішення.
- Переписаний `content` передається далі хукам із нижчим пріоритетом, якщо пізніший хук
  не скасує доставку.

## Хуки встановлення

`before_install` запускається після вбудованого сканування встановлень skill і plugin.
Поверніть додаткові результати перевірки або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` вважається відсутністю рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів plugin, яким потрібен стан, що належить Gateway.
Контекст надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для перевірки та оновлення
Cron. Використовуйте `gateway_stop`, щоб очищати довготривалі ресурси.

Не покладайтеся на внутрішній хук `gateway:startup` для сервісів виконання, що належать plugin.

## Майбутні застарівання

Декілька поверхонь, суміжних із хуками, застаріли, але ще підтримуються. Виконайте міграцію
до наступного мажорного релізу:

- **Текстові конверти каналів без шифрування** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача
  замість розбору плоского тексту конверта. Див.
  [Текстові конверти каналів → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** залишається для сумісності. Нові plugin повинні використовувати
  `before_model_resolve` і `before_prompt_build` замість комбінованої
  фази.
- **`onResolution` у `before_tool_call`** тепер використовує типізоване об’єднання
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація можливостей пам’яті, профіль thinking provider,
зовнішні provider автентифікації, типи виявлення provider, аксесори середовища виконання завдань
і перейменування `command-auth` → `command-status` — див. у
[Міграція Plugin SDK → Активні застарівання](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Міграція Plugin SDK](/uk/plugins/sdk-migration) — активні застарівання та графік видалення
- [Створення plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура plugin](/uk/plugins/architecture-internals)
