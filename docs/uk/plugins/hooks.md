---
read_when:
    - Ви створюєте plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із plugin
    - Ви обираєте між внутрішніми хуками та хуками plugin
summary: 'Хуки Plugin: перехоплюють події життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-25T18:51:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fc848daa4a0da6f55bf0f75d184ffa4925b64c3f22529c99623535842bd6733
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це внутрішньопроцесні точки розширення для plugin OpenClaw. Використовуйте їх,
коли plugin має інспектувати або змінювати запуски агента, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), коли вам потрібен невеликий
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

Обробники хуків виконуються послідовно у спадному порядку `priority`. Хуки
з однаковим пріоритетом зберігають порядок реєстрації.

## Каталог хуків

Хуки згруповано за поверхнею, яку вони розширюють. Назви, виділені **жирним**, приймають
результат рішення (блокування, скасування, перевизначення або вимога схвалення); усі інші
призначені лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначає провайдера або модель до завантаження повідомлень сесії
- `before_prompt_build` — додає динамічний контекст або текст системного промпту перед викликом моделі
- `before_agent_start` — об’єднана фаза лише для сумісності; надавайте перевагу двом хукам вище
- **`before_agent_reply`** — коротко замикає хід моделі синтетичною відповіддю або тишею
- `agent_end` — спостерігає фінальні повідомлення, стан успішності та тривалість запуску

**Спостереження за розмовою**

- `model_call_started` / `model_call_ended` — спостерігають за санітованими метаданими виклику провайдера/моделі, часом, результатом і обмеженими хешами request-id без вмісту промпту чи відповіді
- `llm_input` — спостерігає вхідні дані провайдера (системний промпт, промпт, історію)
- `llm_output` — спостерігає вихідні дані провайдера

**Інструменти**

- **`before_tool_call`** — переписує параметри інструмента, блокує виконання або вимагає схвалення
- `after_tool_call` — спостерігає результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписує повідомлення помічника, створене з результату інструмента
- **`before_message_write`** — інспектує або блокує запис повідомлення, що виконується (рідко)

**Повідомлення та доставка**

- **`inbound_claim`** — перехоплює вхідне повідомлення до маршрутизації агента (синтетичні відповіді)
- `message_received` — спостерігає вхідний вміст, відправника, тред і метадані
- **`message_sending`** — переписує вихідний вміст або скасовує доставку
- `message_sent` — спостерігає успішну чи неуспішну вихідну доставку
- **`before_dispatch`** — інспектує або переписує вихідну dispatch-операцію перед передаванням каналу
- **`reply_dispatch`** — бере участь у фінальному конвеєрі dispatch-відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежують межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігають або анотують цикли Compaction
- `before_reset` — спостерігає події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координують маршрутизацію субагентів і доставку результату завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускають або зупиняють сервіси, якими володіє plugin, разом із Gateway
- **`before_install`** — інспектує сканування встановлення Skills або plugin і за потреби блокує

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
- `block: false` розглядається як відсутність рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє запуск агента й запитує користувача через схвалення plugin.
  Команда `/approve` може схвалювати і `exec`, і схвалення plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати виконання після того, як хук
  з вищим пріоритетом запросив схвалення.
- `onResolution` отримує підсумкове рішення щодо схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

### Збереження результату інструмента

Результати інструментів можуть містити структуровані `details` для рендерингу UI, діагностики,
маршрутизації медіа або метаданих, якими володіє plugin. Розглядайте `details` як метадані виконання,
а не як вміст промпту:

- OpenClaw видаляє `toolResult.details` перед повторним відтворенням для провайдера та введенням
  Compaction, щоб метадані не ставали контекстом моделі.
- Збережені записи сесії містять лише обмежені `details`. Надмірно великі details
  замінюються компактним підсумком і `persistedDetailsTruncated: true`.
- `tool_result_persist` і `before_message_write` виконуються до остаточного
  обмеження збереження. Хуки все одно мають повертати невеликі `details` і уникати
  розміщення релевантного для промпту тексту лише в `details`; вивід інструмента, видимий моделі,
  розміщуйте в `content`.

## Хуки промпту та моделі

Для нових plugin використовуйте хуки, специфічні для фази:

- `before_model_resolve`: отримує лише поточний промпт і метадані вкладень.
  Повертає `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Повертає `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` залишається для сумісності. Надавайте перевагу явним хукам вище,
щоб ваш plugin не залежав від застарілої об’єднаної фази.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може
ідентифікувати активний запуск. Те саме значення також доступне в `ctx.runId`.

Використовуйте `model_call_started` і `model_call_ended` для телеметрії викликів провайдера,
яка не повинна отримувати сирі промпти, історію, відповіді, заголовки, тіла запитів
або request ID провайдера. Ці хуки містять стабільні метадані, такі як
`runId`, `callId`, `provider`, `model`, необов’язкові `api`/`transport`, фінальні
`durationMs`/`outcome` і `upstreamRequestIdHash`, коли OpenClaw може отримати
обмежений хеш request-id провайдера.

Невбудовані plugin, яким потрібні `llm_input`, `llm_output` або `agent_end`, мають встановити:

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
- `message_sent`: спостерігає фінальний успіх або помилку.

Для TTS-відповідей лише з аудіо `content` може містити приховану озвучену транскрипцію,
навіть коли payload каналу не має видимого тексту/підпису. Переписування цього
`content` оновлює лише транскрипцію, видиму хуку; вона не рендериться як
підпис до медіа.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Надавайте перевагу
цим першокласним полям, перш ніж читати застарілі метадані.

Надавайте перевагу типізованим полям `threadId` і `replyToId`, перш ніж використовувати
метадані, специфічні для каналу.

Правила рішень:

- `message_sending` з `cancel: true` є термінальним.
- `message_sending` з `cancel: false` розглядається як відсутність рішення.
- Переписаний `content` передається далі хукам з нижчим пріоритетом, якщо пізніший хук
  не скасує доставку.

## Хуки встановлення

`before_install` виконується після вбудованого сканування встановлень Skills і plugin.
Поверніть додаткові знахідки або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` розглядається як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів plugin, яким потрібен стан, яким володіє Gateway. Контекст
надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки й оновлення Cron. Використовуйте `gateway_stop` для очищення довготривалих
ресурсів.

Не покладайтеся на внутрішній хук `gateway:startup` для сервісів виконання, якими володіє plugin.

## Майбутні застарівання

Декілька поверхонь, суміжних із хуками, застаріли, але досі підтримуються. Перейдіть
на нові варіанти до наступного мажорного релізу:

- **Конверти каналів у відкритому тексті** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача
  замість парсингу плаского тексту конверта. Див.
  [Конверти каналів у відкритому тексті → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** залишається для сумісності. Нові plugin мають використовувати
  `before_model_resolve` і `before_prompt_build` замість об’єднаної
  фази.
- **`onResolution` у `before_tool_call`** тепер використовує типізоване
  об’єднання `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація можливостей пам’яті, профіль thinking провайдера,
зовнішні провайдери автентифікації, типи виявлення провайдерів, аксесори середовища виконання завдань
і перейменування `command-auth` → `command-status` — див. у
[Міграція Plugin SDK → Активні застарівання](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Міграція Plugin SDK](/uk/plugins/sdk-migration) — активні застарівання та графік видалення
- [Створення plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішні архітектурні деталі plugin](/uk/plugins/architecture-internals)
