---
read_when:
    - Ви створюєте plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно заблокувати, переписати або вимагати схвалення для викликів інструментів із plugin
    - Ви обираєте між внутрішніми хуками та хуками plugin
summary: 'Хуки Plugin: перехоплюють події життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-24T20:11:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e880a8eb3b69e67450ddedd40e0356645e0cbd1825d8846a069d972b7e0c858c
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це внутрішньопроцесні точки розширення для plugin OpenClaw. Використовуйте їх,
коли plugin має перевіряти або змінювати запуски агентів, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), коли вам потрібен невеликий
встановлений оператором скрипт `HOOK.md` для команд і подій Gateway, таких як
`/new`, `/reset`, `/stop`, `agent:bootstrap` або `gateway:startup`.

## Швидкий старт

Зареєструйте типізовані хуки plugin за допомогою `api.on(...)` у точці входу вашого plugin:

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

Обробники хуків виконуються послідовно у порядку спадання `priority`. Хуки
з однаковим пріоритетом зберігають порядок реєстрації.

## Каталог хуків

Хуки згруповано за поверхнею, яку вони розширюють. Назви **жирним** приймають
результат рішення (блокування, скасування, перевизначення або вимога схвалення); усі інші
призначені лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначити провайдера або модель до завантаження повідомлень сесії
- `before_prompt_build` — додати динамічний контекст або текст системного промпту перед викликом моделі
- `before_agent_start` — сумісний комбінований етап; натомість надавайте перевагу двом хукам вище
- **`before_agent_reply`** — коротко замкнути хід моделі синтетичною відповіддю або мовчанням
- `agent_end` — спостерігати фінальні повідомлення, стан успішності та тривалість запуску

**Спостереження за розмовою**

- `llm_input` — спостерігати вхід провайдера (системний промпт, промпт, історія)
- `llm_output` — спостерігати вихід провайдера

**Інструменти**

- **`before_tool_call`** — переписати параметри інструмента, заблокувати виконання або вимагати схвалення
- `after_tool_call` — спостерігати результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписати повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевірити або заблокувати запис повідомлення, що виконується (рідкісний випадок)

**Повідомлення та доставка**

- **`inbound_claim`** — перехопити вхідне повідомлення до маршрутизації агентом (синтетичні відповіді)
- `message_received` — спостерігати вхідний вміст, відправника, тред і метадані
- **`message_sending`** — переписати вихідний вміст або скасувати доставку
- `message_sent` — спостерігати успішну або неуспішну доставку вихідного повідомлення
- **`before_dispatch`** — перевірити або переписати вихідне відправлення до передавання каналу
- **`reply_dispatch`** — брати участь у фінальному конвеєрі відправлення відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежувати межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігати або анотувати цикли Compaction
- `before_reset` — спостерігати події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координувати маршрутизацію субагентів і доставку завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускати або зупиняти сервіси plugin, якими володіє Gateway
- **`before_install`** — перевіряти сканування встановлення skill або plugin і за потреби блокувати

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
- `block: false` трактується як відсутність рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє запуск агента й запитує користувача через
  схвалення plugin. Команда `/approve` може схвалювати як exec, так і схвалення plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати виконання після того, як хук
  з вищим пріоритетом запросив схвалення.
- `onResolution` отримує остаточне рішення щодо схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

## Хуки промпту та моделі

Для нових plugin використовуйте хуки, специфічні для етапу:

- `before_model_resolve`: отримує лише поточний промпт і метадані
  вкладень. Поверніть `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Поверніть `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` зберігається для сумісності. Надавайте перевагу явним хукам вище,
щоб ваш plugin не залежав від застарілого комбінованого етапу.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може
ідентифікувати активний запуск. Те саме значення також доступне в `ctx.runId`.

Небандловані plugin, яким потрібні `llm_input`, `llm_output` або `agent_end`, мають встановити:

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

Хуки, що змінюють промпт, можна вимкнути для кожного plugin за допомогою
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Хуки повідомлень

Використовуйте хуки повідомлень для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігати вхідний вміст, відправника, `threadId`, `messageId`,
  `senderId`, необов’язкову кореляцію запуску/сесії та метадані.
- `message_sending`: переписати `content` або повернути `{ cancel: true }`.
- `message_sent`: спостерігати фінальний успіх або збій.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Надавайте перевагу
цим першокласним полям перед читанням застарілих метаданих.

Надавайте перевагу типізованим полям `threadId` і `replyToId` перед використанням
метаданих, специфічних для каналу.

Правила рішень:

- `message_sending` з `cancel: true` є термінальним.
- `message_sending` з `cancel: false` трактується як відсутність рішення.
- Переписаний `content` передається далі хукам із нижчим пріоритетом, якщо пізніший хук
  не скасує доставку.

## Хуки встановлення

`before_install` виконується після вбудованого сканування встановлень skill і plugin.
Поверніть додаткові результати перевірки або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` трактується як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів plugin, яким потрібен стан, що належить Gateway.
Контекст надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлення Cron. Використовуйте `gateway_stop`, щоб очищати довгоживучі
ресурси.

Не покладайтеся на внутрішній хук `gateway:startup` для сервісів часу виконання,
якими володіє plugin.

## Майбутні вилучення застарілого

Кілька поверхонь, суміжних із хуками, є застарілими, але все ще підтримуються. Виконайте міграцію
до наступного мажорного релізу:

- **Текстові конверти каналів** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача
  замість розбору плаского тексту конверта. Див.
  [Текстові конверти каналів → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** зберігається для сумісності. Нові plugin мають використовувати
  `before_model_resolve` і `before_prompt_build` замість комбінованого
  етапу.
- **`onResolution` у `before_tool_call`** тепер використовує типізоване
  об’єднання `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація можливостей пам’яті, thinking profile провайдера,
зовнішні провайдери автентифікації, типи виявлення провайдерів, засоби доступу
до TaskFlow під час виконання та перейменування `command-auth` → `command-status` — див.
у [Міграція Plugin SDK → Активні застарілі елементи](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Міграція Plugin SDK](/uk/plugins/sdk-migration) — активні застарілі елементи та графік вилучення
- [Створення plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура plugin](/uk/plugins/architecture-internals)
