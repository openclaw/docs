---
read_when:
    - Ви створюєте plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із plugin
    - Ви обираєте між внутрішніми хуками та хуками plugin
summary: 'Хуки Plugin: перехоплюють події життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-27T22:37:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aae1c2321491ed0eb82b6306be61cd7e4bffccf8e22d1455267110fdf4fc62b
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це внутрішньопроцесні точки розширення для plugin OpenClaw. Використовуйте їх,
коли plugin має перевіряти або змінювати запуски агента, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію сабагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), коли вам потрібен невеликий
скрипт `HOOK.md`, встановлений оператором, для подій команд і Gateway, таких як
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

Обробники хуків виконуються послідовно у порядку спадання `priority`. Хуки з однаковим пріоритетом
зберігають порядок реєстрації.

Кожен хук отримує `event.context.pluginConfig` — розв’язану конфігурацію для
plugin, який зареєстрував цей обробник. Використовуйте її для рішень у хуках, яким
потрібні поточні параметри plugin; OpenClaw інжектує її для кожного обробника, не змінюючи
спільний об’єкт події, який бачать інші plugins.

## Каталог хуків

Хуки згруповано за поверхнею, яку вони розширюють. Назви, виділені **жирним**, приймають
результат рішення (block, cancel, override або require approval); усі інші призначені
лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначити провайдера або модель до завантаження повідомлень сесії
- `before_prompt_build` — додати динамічний контекст або текст системного промпту перед викликом моделі
- `before_agent_start` — сумісна комбінована фаза; натомість віддавайте перевагу двом хукам вище
- **`before_agent_reply`** — завершити хід моделі достроково синтетичною відповіддю або тишею
- **`before_agent_finalize`** — перевірити природну фінальну відповідь і запросити ще один прохід моделі
- `agent_end` — спостерігати за фінальними повідомленнями, станом успіху та тривалістю запуску

**Спостереження за розмовою**

- `model_call_started` / `model_call_ended` — спостерігати за очищеними метаданими виклику провайдера/моделі, часом, результатом і обмеженими хешами request id без вмісту промпту або відповіді
- `llm_input` — спостерігати за входом провайдера (системний промпт, промпт, історія)
- `llm_output` — спостерігати за виходом провайдера

**Інструменти**

- **`before_tool_call`** — переписати параметри інструмента, заблокувати виконання або вимагати схвалення
- `after_tool_call` — спостерігати за результатами інструментів, помилками та тривалістю
- **`tool_result_persist`** — переписати повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевірити або заблокувати запис повідомлення в процесі (рідко)

**Повідомлення та доставка**

- **`inbound_claim`** — перехопити вхідне повідомлення до маршрутизації агента (синтетичні відповіді)
- `message_received` — спостерігати за вхідним вмістом, відправником, потоком і метаданими
- **`message_sending`** — переписати вихідний вміст або скасувати доставку
- `message_sent` — спостерігати за успіхом або невдачею вихідної доставки
- **`before_dispatch`** — перевірити або переписати вихідний dispatch перед передачею каналу
- **`reply_dispatch`** — брати участь у фінальному конвеєрі dispatch відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежувати межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігати за циклами Compaction або анотувати їх
- `before_reset` — спостерігати за подіями скидання сесії (`/reset`, програмні скидання)

**Сабагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координувати маршрутизацію сабагентів і доставку завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускати або зупиняти сервіси, якими володіє plugin, разом із Gateway
- **`before_install`** — перевіряти сканування встановлення skill або plugin та за потреби блокувати

## Політика викликів інструментів

`before_tool_call` отримує:

- `event.toolName`
- `event.params`
- необов’язковий `event.runId`
- необов’язковий `event.toolCallId`
- поля контексту, такі як `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (встановлюється для запусків, ініційованих Cron), і діагностичний `ctx.trace`

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
- `requireApproval` призупиняє запуск агента й запитує користувача через схвалення plugin.
  Команда `/approve` може схвалювати як exec, так і схвалення plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати після того, як хук із вищим пріоритетом
  запросив схвалення.
- `onResolution` отримує підсумкове рішення щодо схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

### Збереження результатів інструментів

Результати інструментів можуть містити структуровані `details` для рендерингу в UI, діагностики,
маршрутизації медіа або метаданих, якими володіє plugin. Сприймайте `details` як метадані
середовища виконання, а не як вміст промпту:

- OpenClaw видаляє `toolResult.details` перед повторним відтворенням у провайдері та входом Compaction,
  щоб метадані не ставали контекстом моделі.
- Збережені записи сесії зберігають лише обмежені `details`. Надто великі details
  замінюються компактним підсумком і `persistedDetailsTruncated: true`.
- `tool_result_persist` і `before_message_write` виконуються перед фінальним
  обмеженням збереження. Хуки все одно мають зберігати повернуті `details` невеликими й уникати
  розміщення важливого для промпту тексту лише в `details`; видимий для моделі вихід інструмента
  слід поміщати в `content`.

## Хуки промпту та моделі

Для нових plugins використовуйте хуки, специфічні для фази:

- `before_model_resolve`: отримує лише поточний промпт і метадані вкладень. Поверніть `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Поверніть `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` залишається для сумісності. Надавайте перевагу явним хукам вище,
щоб ваш plugin не залежав від застарілої комбінованої фази.

`before_agent_start` і `agent_end` включають `event.runId`, коли OpenClaw може
ідентифікувати активний запуск. Це саме значення також доступне в `ctx.runId`.
Запуски, ініційовані Cron, також мають `ctx.jobId` (ідентифікатор вихідного завдання cron), щоб
хуки plugin могли прив’язувати метрики, побічні ефекти або стан до конкретного запланованого
завдання.

Використовуйте `model_call_started` і `model_call_ended` для телеметрії викликів провайдера,
яка не повинна отримувати сирі промпти, історію, відповіді, заголовки, тіла запитів
або request id провайдера. Ці хуки містять стабільні метадані, такі як
`runId`, `callId`, `provider`, `model`, необов’язкові `api`/`transport`, фінальні
`durationMs`/`outcome` і `upstreamRequestIdHash`, коли OpenClaw може вивести
обмежений хеш request id провайдера.

`before_agent_finalize` виконується лише тоді, коли harness збирається прийняти природну
фінальну відповідь асистента. Це не шлях скасування `/stop`, і він не
виконується, коли користувач перериває хід. Поверніть `{ action: "revise", reason }`, щоб
попросити harness зробити ще один прохід моделі перед фіналізацією, `{ action:
"finalize", reason? }`, щоб примусово завершити фіналізацію, або не повертайте результат,
щоб продовжити. Нативні хуки Codex `Stop` ретранслюються в цей хук як рішення OpenClaw
`before_agent_finalize`.

Зовнішні plugins, не включені до складу, яким потрібні `llm_input`, `llm_output`,
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

Хуки, що змінюють промпт, можна вимкнути для кожного plugin через
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Хуки повідомлень

Використовуйте хуки повідомлень для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігати за вхідним вмістом, відправником, `threadId`, `messageId`,
  `senderId`, необов’язковою кореляцією запуску/сесії та метаданими.
- `message_sending`: переписати `content` або повернути `{ cancel: true }`.
- `message_sent`: спостерігати за остаточним успіхом або невдачею.

Для аудіо-відповідей TTS без тексту `content` може містити приховану озвучену транскрипцію,
навіть якщо payload каналу не має видимого тексту/підпису. Переписування цього
`content` оновлює лише транскрипцію, видиму для хука; воно не рендериться як
підпис до медіа.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Надавайте перевагу
цим полям першого класу, а не читанню застарілих метаданих.

Надавайте перевагу типізованим полям `threadId` і `replyToId`, а не використанню
метаданих, специфічних для каналу.

Правила рішень:

- `message_sending` з `cancel: true` є термінальним.
- `message_sending` з `cancel: false` вважається відсутністю рішення.
- Переписаний `content` передається далі хукам із нижчим пріоритетом, якщо пізніший хук
  не скасує доставку.

## Хуки встановлення

`before_install` виконується після вбудованого сканування для встановлень skill і plugin.
Поверніть додаткові findings або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` вважається відсутністю рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів plugin, яким потрібен стан, що належить Gateway.
Контекст надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлення Cron. Використовуйте `gateway_stop`, щоб очищати довготривалі
ресурси.

Не покладайтеся на внутрішній хук `gateway:startup` для сервісів середовища виконання,
якими володіє plugin.

## Майбутні застарівання

Кілька поверхонь, суміжних із хуками, є застарілими, але все ще підтримуються. Виконайте
міграцію до наступного мажорного релізу:

- **Текстові plaintext-конверти каналів** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача
  замість розбору плаского тексту конверта. Див.
  [Plaintext channel envelopes → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** залишається для сумісності. Нові plugins мають використовувати
  `before_model_resolve` і `before_prompt_build` замість комбінованої
  фази.
- **`onResolution` у `before_tool_call`** тепер використовує типізоване
  об’єднання `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація можливостей пам’яті, профіль thinking провайдера,
зовнішні провайдери auth, типи виявлення провайдерів, аксесори TaskFlow середовища виконання
та перейменування `command-auth` → `command-status` — див. у
[Plugin SDK migration → Active deprecations](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язані матеріали

- [Plugin SDK migration](/uk/plugins/sdk-migration) — активні застарівання та графік видалення
- [Building plugins](/uk/plugins/building-plugins)
- [Plugin SDK overview](/uk/plugins/sdk-overview)
- [Plugin entry points](/uk/plugins/sdk-entrypoints)
- [Internal hooks](/uk/automation/hooks)
- [Plugin architecture internals](/uk/plugins/architecture-internals)
