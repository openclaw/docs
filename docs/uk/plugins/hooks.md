---
read_when:
    - Ви створюєте plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно заблокувати, переписати або вимагати схвалення для викликів інструментів із plugin
    - Ви обираєте між внутрішніми хуками та хуками plugin
summary: 'Хуки Plugin: перехоплюють події життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-26T01:42:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це точки розширення в процесі виконання для plugin OpenClaw. Використовуйте їх,
коли plugin має перевіряти або змінювати запуски агентів, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), якщо вам потрібен невеликий
встановлюваний оператором скрипт `HOOK.md` для подій команд і Gateway, таких як
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
результат рішення (блокування, скасування, перевизначення або вимога схвалення); усі інші —
лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначити провайдера або модель до завантаження повідомлень сесії
- `before_prompt_build` — додати динамічний контекст або текст системного prompt перед викликом моделі
- `before_agent_start` — об’єднана фаза лише для сумісності; натомість віддавайте перевагу двом хукам вище
- **`before_agent_reply`** — коротко замкнути хід моделі синтетичною відповіддю або тишею
- **`before_agent_finalize`** — перевірити природну фінальну відповідь і запросити ще один прохід моделі
- `agent_end` — спостерігати фінальні повідомлення, стан успіху та тривалість запуску

**Спостереження за розмовою**

- `model_call_started` / `model_call_ended` — спостерігати очищені метадані виклику провайдера/моделі, час виконання, результат і обмежені хеші request-id без вмісту prompt або відповіді
- `llm_input` — спостерігати вхідні дані провайдера (системний prompt, prompt, історію)
- `llm_output` — спостерігати вихідні дані провайдера

**Інструменти**

- **`before_tool_call`** — переписати параметри інструмента, заблокувати виконання або вимагати схвалення
- `after_tool_call` — спостерігати результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписати повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевірити або заблокувати запис повідомлення, що виконується (рідкісний випадок)

**Повідомлення та доставка**

- **`inbound_claim`** — перехопити вхідне повідомлення до маршрутизації агента (синтетичні відповіді)
- `message_received` — спостерігати вхідний вміст, відправника, потік і метадані
- **`message_sending`** — переписати вихідний вміст або скасувати доставку
- `message_sent` — спостерігати успішну або неуспішну вихідну доставку
- **`before_dispatch`** — перевірити або переписати вихідний dispatch до передачі каналу
- **`reply_dispatch`** — брати участь у фінальному конвеєрі dispatch відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежувати межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігати або анотувати цикли Compaction
- `before_reset` — спостерігати події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координувати маршрутизацію субагентів і доставку завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускати або зупиняти сервіси, якими володіє plugin, разом із Gateway
- **`before_install`** — перевіряти сканування встановлення skill або plugin і за потреби блокувати

## Політика викликів інструментів

`before_tool_call` отримує:

- `event.toolName`
- `event.params`
- необов’язковий `event.runId`
- необов’язковий `event.toolCallId`
- поля контексту, такі як `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (встановлюється для запусків, керованих cron), і діагностичний `ctx.trace`

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
- `block: false` розглядається як відсутність рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє запуск агента і запитує користувача через схвалення plugin.
  Команда `/approve` може схвалювати як exec, так і схвалення plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати виклик після того, як хук
  з вищим пріоритетом запросив схвалення.
- `onResolution` отримує остаточне рішення щодо схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

### Збереження результатів інструментів

Результати інструментів можуть містити структуровані `details` для відображення в UI, діагностики,
маршрутизації медіа або метаданих, якими володіє plugin. Сприймайте `details` як метадані часу виконання,
а не як вміст prompt:

- OpenClaw видаляє `toolResult.details` перед повторним відтворенням провайдеру та введенням для Compaction,
  тому метадані не стають контекстом моделі.
- Записи збережених сесій містять лише обмежені `details`. Надмірно великі details
  замінюються компактним підсумком і `persistedDetailsTruncated: true`.
- `tool_result_persist` і `before_message_write` виконуються до фінального
  обмеження збереження. Хуки все одно мають зберігати повернені `details` малими й уникати
  розміщення тексту, важливого для prompt, лише в `details`; вивід інструмента, видимий моделі,
  слід поміщати в `content`.

## Хуки prompt і моделі

Для нових plugin використовуйте хуки, специфічні для фази:

- `before_model_resolve`: отримує лише поточний prompt і метадані вкладень.
  Поверніть `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний prompt і повідомлення сесії.
  Поверніть `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` залишається для сумісності. Віддавайте перевагу явним хукам вище,
щоб ваш plugin не залежав від застарілої об’єднаної фази.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може
ідентифікувати активний запуск. Те саме значення також доступне в `ctx.runId`.
Запуски, керовані Cron, також надають `ctx.jobId` (ідентифікатор вихідного cron-завдання), щоб
хуки plugin могли прив’язувати метрики, побічні ефекти або стан до конкретного запланованого
завдання.

Використовуйте `model_call_started` і `model_call_ended` для телеметрії викликів провайдера,
яка не повинна отримувати сирі prompt, історію, відповіді, заголовки, тіла запитів або
request ID провайдера. Ці хуки включають стабільні метадані, такі як
`runId`, `callId`, `provider`, `model`, необов’язкові `api`/`transport`, фінальні
`durationMs`/`outcome` і `upstreamRequestIdHash`, коли OpenClaw може обчислити
обмежений хеш request-id провайдера.

`before_agent_finalize` виконується лише тоді, коли harness збирається прийняти природну
фінальну відповідь асистента. Це не шлях скасування `/stop`, і він не
виконується, коли користувач перериває хід. Поверніть `{ action: "revise", reason }`, щоб
попросити harness виконати ще один прохід моделі перед фіналізацією, `{ action:
"finalize", reason? }`, щоб примусово завершити фіналізацію, або не повертайте результат,
щоб продовжити. Нативні хуки Codex `Stop` ретранслюються в цей хук як рішення OpenClaw
`before_agent_finalize`.

Небандловані plugin, яким потрібні `llm_input`, `llm_output`,
`before_agent_finalize` або `agent_end`, мають встановити:

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

Хуки, що змінюють prompt, можна вимкнути для окремого plugin через
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Хуки повідомлень

Використовуйте хуки повідомлень для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігати вхідний вміст, відправника, `threadId`, `messageId`,
  `senderId`, необов’язкову кореляцію запуску/сесії та метадані.
- `message_sending`: переписати `content` або повернути `{ cancel: true }`.
- `message_sent`: спостерігати фінальний успіх або помилку.

Для TTS-відповідей лише з аудіо `content` може містити приховану вимовлену транскрипцію
навіть тоді, коли payload каналу не має видимого тексту/підпису. Переписування цього
`content` оновлює лише видиму для хука транскрипцію; вона не відображається як
підпис до медіа.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Віддавайте перевагу
цим полям першого класу, перш ніж читати застарілі метадані.

Віддавайте перевагу типізованим полям `threadId` і `replyToId` перед використанням
метаданих, специфічних для каналу.

Правила прийняття рішень:

- `message_sending` з `cancel: true` є термінальним.
- `message_sending` з `cancel: false` розглядається як відсутність рішення.
- Переписаний `content` передається далі хукам із нижчим пріоритетом, якщо пізніший хук
  не скасує доставку.

## Хуки встановлення

`before_install` виконується після вбудованого сканування встановлення skill і plugin.
Поверніть додаткові висновки або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` розглядається як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів plugin, яким потрібен стан, що належить Gateway.
Контекст надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлення cron. Використовуйте `gateway_stop`, щоб очищати довготривалі
ресурси.

Не покладайтеся на внутрішній хук `gateway:startup` для сервісів часу виконання,
якими володіє plugin.

## Майбутні вилучення

Кілька поверхонь, суміжних із хуками, є застарілими, але все ще підтримуються. Перейдіть
на новий підхід до наступного великого релізу:

- **Конверти каналів у відкритому тексті** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача
  замість розбору плоского тексту конверта. Див.
  [Plaintext channel envelopes → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** залишається для сумісності. Новим plugin слід використовувати
  `before_model_resolve` і `before_prompt_build` замість об’єднаної
  фази.
- **`onResolution` у `before_tool_call`** тепер використовує типізоване об’єднання
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація можливостей пам’яті, профіль thinking провайдера,
зовнішні провайдери автентифікації, типи виявлення провайдерів, аксесори середовища виконання завдань
і перейменування `command-auth` → `command-status` — див. у
[Міграція Plugin SDK → Активні застарівання](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Міграція Plugin SDK](/uk/plugins/sdk-migration) — активні застарівання та графік вилучення
- [Створення plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура plugin](/uk/plugins/architecture-internals)
