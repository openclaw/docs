---
read_when:
    - Ви створюєте plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із plugin
    - Ви обираєте між внутрішніми хуками та хуками plugin
summary: 'Хуки Plugin: перехоплюють події життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-26T00:29:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9f1d08cb60b438b5478dc813600cc7c2b7a4169b0785812a04e395e1c893b02
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це внутрішньопроцесні точки розширення для plugin OpenClaw. Використовуйте їх,
коли plugin потрібно перевіряти або змінювати запуски агентів, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), коли вам потрібен невеликий
оператором встановлюваний скрипт `HOOK.md` для подій команд і Gateway, таких як
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

Обробники хуків виконуються послідовно в порядку спадання `priority`. Хуки
з однаковим пріоритетом зберігають порядок реєстрації.

## Каталог хуків

Хуки згруповано за поверхнею, яку вони розширюють. Назви, виділені **жирним**, приймають
результат рішення (блокування, скасування, перевизначення або вимога схвалення); усі інші
призначені лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначає провайдера або модель перед завантаженням повідомлень сесії
- `before_prompt_build` — додає динамічний контекст або текст системного промпту перед викликом моделі
- `before_agent_start` — комбінована фаза лише для сумісності; натомість використовуйте два хуки вище
- **`before_agent_reply`** — коротко замикає хід моделі синтетичною відповіддю або тишею
- **`before_agent_finalize`** — перевіряє природну фінальну відповідь і запитує ще один прохід моделі
- `agent_end` — спостерігає фінальні повідомлення, стан успіху та тривалість запуску

**Спостереження за розмовою**

- `model_call_started` / `model_call_ended` — спостерігають очищені метадані виклику провайдера/моделі, час, результат і обмежені хеші request-id без вмісту промпту чи відповіді
- `llm_input` — спостерігає вхід провайдера (системний промпт, промпт, історію)
- `llm_output` — спостерігає вихід провайдера

**Інструменти**

- **`before_tool_call`** — переписує параметри інструмента, блокує виконання або вимагає схвалення
- `after_tool_call` — спостерігає результати інструмента, помилки й тривалість
- **`tool_result_persist`** — переписує повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевіряє або блокує запис повідомлення в процесі (рідко)

**Повідомлення і доставка**

- **`inbound_claim`** — захоплює вхідне повідомлення перед маршрутизацією агента (синтетичні відповіді)
- `message_received` — спостерігає вхідний вміст, відправника, тред і метадані
- **`message_sending`** — переписує вихідний вміст або скасовує доставку
- `message_sent` — спостерігає успіх або помилку вихідної доставки
- **`before_dispatch`** — перевіряє або переписує вихідну диспетчеризацію перед передаванням у канал
- **`reply_dispatch`** — бере участь у фінальному конвеєрі диспетчеризації відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежують межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігають або анотують цикли Compaction
- `before_reset` — спостерігає події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координують маршрутизацію субагентів і доставку після завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускають або зупиняють сервіси plugin разом із Gateway
- **`before_install`** — перевіряє сканування встановлення skill або plugin і за потреби блокує

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
- `requireApproval` призупиняє запуск агента і запитує користувача через схвалення plugin.
  Команда `/approve` може схвалювати як exec-, так і plugin-схвалення.
- `block: true` з нижчим пріоритетом усе ще може заблокувати після того, як хук
  з вищим пріоритетом запросив схвалення.
- `onResolution` отримує остаточне рішення щодо схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

### Збереження результатів інструмента

Результати інструмента можуть містити структуровані `details` для UI-відображення, діагностики,
маршрутизації медіа або метаданих plugin. Розглядайте `details` як метадані часу виконання,
а не як вміст промпту:

- OpenClaw видаляє `toolResult.details` перед повторним відтворенням для провайдера і входом Compaction,
  щоб метадані не ставали контекстом моделі.
- Збережені записи сесії містять лише обмежені `details`. Завеликі details
  замінюються компактним підсумком і `persistedDetailsTruncated: true`.
- `tool_result_persist` і `before_message_write` виконуються перед фінальним
  обмеженням збереження. Хуки все одно мають тримати повернуті `details` невеликими й уникати
  розміщення тексту, важливого для промпту, лише в `details`; помітний для моделі вивід інструмента
  слід розміщувати в `content`.

## Хуки промпту і моделі

Для нових plugin використовуйте хуки, специфічні для фази:

- `before_model_resolve`: отримує лише поточний промпт і метадані вкладень.
  Повертає `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Повертає `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` залишається для сумісності. Натомість використовуйте явні хуки вище,
щоб ваш plugin не залежав від застарілої комбінованої фази.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може
визначити активний запуск. Це саме значення також доступне в `ctx.runId`.

Використовуйте `model_call_started` і `model_call_ended` для телеметрії викликів провайдера,
яка не повинна отримувати сирі промпти, історію, відповіді, заголовки, тіла запитів
або request ID провайдера. Ці хуки містять стабільні метадані, такі як
`runId`, `callId`, `provider`, `model`, необов’язкові `api`/`transport`, фінальні
`durationMs`/`outcome` і `upstreamRequestIdHash`, коли OpenClaw може вивести
обмежений хеш request-id провайдера.

`before_agent_finalize` виконується лише тоді, коли harness збирається прийняти природну
фінальну відповідь асистента. Це не шлях скасування `/stop`, і він не
виконується, коли користувач перериває хід. Поверніть `{ action: "revise", reason }`, щоб
попросити harness зробити ще один прохід моделі перед фіналізацією, `{ action:
"finalize", reason? }`, щоб примусово завершити фіналізацію, або не повертайте результат, щоб продовжити.
Нативні хуки Codex `Stop` передаються в цей хук як рішення OpenClaw
`before_agent_finalize`.

Невбудовані plugin, яким потрібні `llm_input`, `llm_output`,
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

Хуки, що змінюють промпт, можна вимкнути для окремого plugin за допомогою
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Хуки повідомлень

Використовуйте хуки повідомлень для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігає вхідний вміст, відправника, `threadId`, `messageId`,
  `senderId`, необов’язкову кореляцію запуску/сесії та метадані.
- `message_sending`: переписує `content` або повертає `{ cancel: true }`.
- `message_sent`: спостерігає фінальний успіх або помилку.

Для відповідей TTS лише з аудіо `content` може містити прихований озвучений транскрипт,
навіть якщо payload каналу не має видимого тексту/підпису. Переписування цього
`content` оновлює лише транскрипт, видимий для хуків; він не відображається як
підпис медіа.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Надавайте перевагу
цим полям першого класу, перш ніж читати застарілі метадані.

Надавайте перевагу типізованим полям `threadId` і `replyToId`, а не використанню
метаданих, специфічних для каналу.

Правила рішень:

- `message_sending` з `cancel: true` є термінальним.
- `message_sending` з `cancel: false` вважається відсутністю рішення.
- Переписаний `content` передається далі в хуки з нижчим пріоритетом, якщо пізніший хук
  не скасує доставку.

## Хуки встановлення

`before_install` виконується після вбудованого сканування встановлень skill і plugin.
Поверніть додаткові висновки або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` вважається відсутністю рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів plugin, яким потрібен стан, що належить Gateway.
Контекст надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлення Cron. Використовуйте `gateway_stop` для очищення довготривалих
ресурсів.

Не покладайтеся на внутрішній хук `gateway:startup` для сервісів часу виконання, що належать plugin.

## Майбутні вилучення застарілого

Кілька поверхонь, суміжних із хуками, є застарілими, але все ще підтримуються. Мігруйте
до наступного мажорного релізу:

- **Прості текстові конверти каналів** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача
  замість розбору плоского тексту конверта. Див.
  [Прості текстові конверти каналів → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** залишається для сумісності. Нові plugin мають використовувати
  `before_model_resolve` і `before_prompt_build` замість комбінованої
  фази.
- **`onResolution` у `before_tool_call`** тепер використовує типізоване
  об’єднання `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація можливостей пам’яті, профіль thinking провайдера,
зовнішні провайдери auth, типи виявлення провайдерів, аксесори TaskFlow середовища виконання
і перейменування `command-auth` → `command-status` — див. у
[Міграція Plugin SDK → Активні застарілості](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Міграція Plugin SDK](/uk/plugins/sdk-migration) — активні застарілості та графік вилучення
- [Створення plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals)
