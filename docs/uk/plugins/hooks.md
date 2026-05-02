---
read_when:
    - Ви створюєте Plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів від Plugin
    - Ви обираєте між внутрішніми хуками та хуками Plugin
summary: 'Хуки Plugin: перехоплюйте події життєвого циклу агента, інструмента, повідомлення, сеансу та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-05-02T03:10:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hooks є внутрішньопроцесними точками розширення для Plugin OpenClaw. Використовуйте їх,
коли Plugin потрібно перевіряти або змінювати запуски агентів, виклики інструментів, потік повідомлень,
життєвий цикл сесій, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні hooks](/uk/automation/hooks), коли потрібен невеликий
операторський встановлений скрипт `HOOK.md` для команд і подій Gateway, як-от
`/new`, `/reset`, `/stop`, `agent:bootstrap` або `gateway:startup`.

## Швидкий старт

Реєструйте типізовані plugin hooks за допомогою `api.on(...)` з точки входу вашого Plugin:

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

Обробники hooks виконуються послідовно у спадному порядку `priority`. Hooks з однаковим `priority`
зберігають порядок реєстрації.

`api.on(name, handler, opts?)` приймає:

- `priority` — порядок обробників (вищий виконується першим).
- `timeoutMs` — необов’язковий бюджет для окремого hook. Якщо задано, runner hooks перериває цей
  обробник після вичерпання бюджету й переходить до наступного, замість того щоб
  дозволити повільному налаштуванню або відновленню даних витрачати налаштований для викликача
  таймаут моделі. Не вказуйте його, щоб використовувати типовий таймаут спостереження/рішення, який
  runner hooks застосовує загально.

Кожен hook отримує `event.context.pluginConfig`, розв’язану конфігурацію для
Plugin, який зареєстрував цей обробник. Використовуйте її для рішень hooks, яким потрібні
поточні параметри Plugin; OpenClaw інжектує її для кожного обробника без мутації
спільного об’єкта події, який бачать інші plugins.

## Каталог hooks

Hooks згруповані за поверхнею, яку вони розширюють. Назви, виділені **жирним**, приймають
результат рішення (блокування, скасування, перевизначення або вимога схвалення); усі інші є
лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначити провайдера або модель перед завантаженням повідомлень сесії
- `agent_turn_prepare` — використати поставлені в чергу ін’єкції ходу Plugin і додати контекст цього ж ходу перед prompt hooks
- `before_prompt_build` — додати динамічний контекст або текст системного промпта перед викликом моделі
- `before_agent_start` — лише сумісна об’єднана фаза; надавайте перевагу двом hooks вище
- **`before_agent_reply`** — перервати хід моделі синтетичною відповіддю або мовчанням
- **`before_agent_finalize`** — перевірити природну фінальну відповідь і запросити ще один прохід моделі
- `agent_end` — спостерігати фінальні повідомлення, стан успіху та тривалість запуску
- `heartbeat_prompt_contribution` — додати контекст лише для Heartbeat для plugins фонового моніторингу та життєвого циклу

**Спостереження за розмовою**

- `model_call_started` / `model_call_ended` — спостерігати санітизовані метадані виклику провайдера/моделі, час, результат і обмежені хеші ідентифікаторів запитів без вмісту промпта або відповіді
- `llm_input` — спостерігати вхід провайдера (системний промпт, промпт, історію)
- `llm_output` — спостерігати вихід провайдера

**Інструменти**

- **`before_tool_call`** — переписати параметри інструмента, заблокувати виконання або вимагати схвалення
- `after_tool_call` — спостерігати результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписати повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевірити або заблокувати запис повідомлення в процесі (рідко)

**Повідомлення та доставка**

- **`inbound_claim`** — заявити вхідне повідомлення перед маршрутизацією агента (синтетичні відповіді)
- `message_received` — спостерігати вхідний вміст, відправника, thread і метадані
- **`message_sending`** — переписати вихідний вміст або скасувати доставку
- `message_sent` — спостерігати успішну або невдалу вихідну доставку
- **`before_dispatch`** — перевірити або переписати вихідне dispatch перед передачею каналу
- **`reply_dispatch`** — брати участь у фінальному конвеєрі dispatch відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежувати межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігати або анотувати цикли Compaction
- `before_reset` — спостерігати події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координувати маршрутизацію субагентів і доставку результатів завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускати або зупиняти сервіси, що належать Plugin, разом із Gateway
- `cron_changed` — спостерігати зміни життєвого циклу Cron, що належить Gateway (додано, оновлено, видалено, запущено, завершено, заплановано)
- **`before_install`** — перевіряти сканування встановлення Skills або Plugin і, за потреби, блокувати

## Політика викликів інструментів

`before_tool_call` отримує:

- `event.toolName`
- `event.params`
- необов’язковий `event.runId`
- необов’язковий `event.toolCallId`
- поля контексту, як-от `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (задано для запусків, керованих Cron), і діагностичний `ctx.trace`

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

- `block: true` є кінцевим рішенням і пропускає обробники з нижчим priority.
- `block: false` трактується як відсутність рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє запуск агента й запитує користувача через схвалення Plugin.
  Команда `/approve` може схвалювати як exec, так і схвалення Plugin.
- `block: true` з нижчим priority все ще може заблокувати після того, як hook з вищим priority
  запросив схвалення.
- `onResolution` отримує розв’язане рішення схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

Вбудовані plugins, яким потрібна політика рівня host, можуть реєструвати довірені політики інструментів
за допомогою `api.registerTrustedToolPolicy(...)`. Вони виконуються перед звичайними
hooks `before_tool_call` і перед рішеннями зовнішніх plugins. Використовуйте їх лише
для довірених host бар’єрів, як-от політика робочого простору, забезпечення бюджету або
безпека зарезервованих workflow. Зовнішні plugins мають використовувати звичайні
hooks `before_tool_call`.

### Збереження результатів інструментів

Результати інструментів можуть містити структуровані `details` для рендерингу UI, діагностики,
маршрутизації медіа або метаданих, що належать Plugin. Розглядайте `details` як runtime-метадані,
а не як вміст промпта:

- OpenClaw вилучає `toolResult.details` перед повторним відтворенням провайдера та вхідними даними Compaction,
  щоб метадані не ставали контекстом моделі.
- Збережені записи сесій містять лише обмежені `details`. Надто великі details
  замінюються компактним підсумком і `persistedDetailsTruncated: true`.
- `tool_result_persist` і `before_message_write` виконуються перед фінальним
  обмеженням збереження. Hooks усе одно мають тримати повернуті `details` малими й уникати
  розміщення релевантного для промпта тексту лише в `details`; вивід інструмента, видимий моделі,
  розміщуйте в `content`.

## Hooks промптів і моделей

Використовуйте фазоспецифічні hooks для нових plugins:

- `before_model_resolve`: отримує лише поточний промпт і метадані вкладень.
  Поверніть `providerOverride` або `modelOverride`.
- `agent_turn_prepare`: отримує поточний промпт, підготовлені повідомлення сесії
  та будь-які точно-одноразові поставлені в чергу ін’єкції, витягнуті для цієї сесії. Поверніть
  `prependContext` або `appendContext`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Поверніть `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` або `appendSystemContext`.
- `heartbeat_prompt_contribution`: виконується лише для ходів Heartbeat і повертає
  `prependContext` або `appendContext`. Він призначений для фонових моніторів,
  яким потрібно підсумувати поточний стан без зміни ходів, ініційованих користувачем.

`before_agent_start` залишається для сумісності. Надавайте перевагу явним hooks вище,
щоб ваш Plugin не залежав від застарілої об’єднаної фази.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може
ідентифікувати активний запуск. Те саме значення також доступне в `ctx.runId`.
Запуски, керовані Cron, також надають `ctx.jobId` (ідентифікатор вихідного cron job), щоб
plugin hooks могли обмежувати метрики, побічні ефекти або стан конкретним запланованим
завданням.

Для запусків, що походять із каналів, `ctx.messageProvider` є поверхнею провайдера, як-от
`discord` або `telegram`, тоді як `ctx.channelId` є цільовим ідентифікатором розмови,
коли OpenClaw може вивести його з ключа сесії або метаданих доставки.

`agent_end` є hook спостереження й виконується fire-and-forget після ходу. Runner
hooks застосовує таймаут 30 секунд, щоб завислий Plugin або endpoint embeddings
не залишав promise hook у стані очікування назавжди. Таймаут записується в лог, і
OpenClaw продовжує; він не скасовує мережеву роботу, що належить Plugin, якщо
Plugin також не використовує власний сигнал переривання.

Використовуйте `model_call_started` і `model_call_ended` для телеметрії викликів провайдера,
яка не повинна отримувати сирі промпти, історію, відповіді, заголовки, тіла запитів
або ідентифікатори запитів провайдера. Ці hooks містять стабільні метадані, як-от
`runId`, `callId`, `provider`, `model`, необов’язкові `api`/`transport`, кінцеві
`durationMs`/`outcome` і `upstreamRequestIdHash`, коли OpenClaw може вивести
обмежений хеш ідентифікатора запиту провайдера.

`before_agent_finalize` виконується лише тоді, коли harness збирається прийняти природну
фінальну відповідь асистента. Це не шлях скасування `/stop`, і він не
виконується, коли користувач перериває хід. Поверніть `{ action: "revise", reason }`, щоб попросити
harness про ще один прохід моделі перед фіналізацією, `{ action:
"finalize", reason? }`, щоб примусово фіналізувати, або не повертайте результат, щоб продовжити.
Нативні hooks `Stop` Codex транслюються в цей hook як рішення OpenClaw
`before_agent_finalize`.

Невбудовані plugins, яким потрібні `llm_input`, `llm_output`,
`before_agent_finalize` або `agent_end`, повинні встановити:

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

Hooks, що змінюють промпт, і довговічні ін’єкції наступного ходу можна вимкнути для окремого Plugin
за допомогою `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Розширення сесій та ін’єкції наступного ходу

Workflow plugins можуть зберігати невеликий JSON-сумісний стан сесії за допомогою
`api.registerSessionExtension(...)` і оновлювати його через метод Gateway
`sessions.pluginPatch`. Рядки сесій проєктують зареєстрований стан розширення
через `pluginExtensions`, дозволяючи Control UI та іншим клієнтам рендерити
статус, що належить Plugin, без знання внутрішньої реалізації Plugin.

Використовуйте `api.enqueueNextTurnInjection(...)`, коли Plugin потрібен довговічний контекст, щоб
дійти до наступного ходу моделі рівно один раз. OpenClaw витягує поставлені в чергу ін’єкції перед
prompt hooks, відкидає прострочені ін’єкції та дедуплікує за `idempotencyKey`
для кожного Plugin. Це правильний seam для відновлень після схвалення, підсумків політик,
дельт фонових моніторів і продовжень команд, які мають бути видимі моделі на
наступному ході, але не повинні ставати постійним текстом системного промпта.

Семантика очищення є частиною контракту. Callbacks очищення розширень сесії та
runtime-життєвого циклу отримують `reset`, `delete`, `disable` або
`restart`. Host видаляє постійний стан розширення сесії належного Plugin
і відкладені ін’єкції наступного ходу для reset/delete/disable; restart зберігає
довговічний стан сесії, тоді як callbacks очищення дають plugins змогу звільнити scheduler
jobs, контекст запуску та інші позасмугові ресурси для старого покоління runtime.

## Hooks повідомлень

Використовуйте message hooks для політик маршрутизації й доставки на рівні каналу:

- `message_received`: спостерігає вхідний вміст, відправника, `threadId`, `messageId`,
  `senderId`, необов’язкову кореляцію запуску/сеансу та метадані.
- `message_sending`: перезаписує `content` або повертає `{ cancel: true }`.
- `message_sent`: спостерігає остаточний успіх або збій.

Для відповідей TTS лише з аудіо `content` може містити прихований усний транскрипт,
навіть коли корисне навантаження каналу не має видимого тексту/підпису. Перезапис цього
`content` оновлює лише видимий для хука транскрипт; він не відображається як
підпис медіа.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Віддавайте перевагу
цим першокласним полям перед читанням застарілих метаданих.

Віддавайте перевагу типізованим полям `threadId` і `replyToId` перед використанням
специфічних для каналу метаданих.

Правила ухвалення рішень:

- `message_sending` з `cancel: true` є завершальним.
- `message_sending` з `cancel: false` трактується як відсутність рішення.
- Перезаписаний `content` продовжує надходити до хуків нижчого пріоритету, якщо пізніший хук
  не скасує доставку.

## Хуки встановлення

`before_install` запускається після вбудованого сканування встановлень Skills і Plugin.
Поверніть додаткові знахідки або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є завершальним. `block: false` трактується як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів Plugin, яким потрібен стан, що належить Gateway. Контекст
надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки й оновлень Cron. Використовуйте `gateway_stop`, щоб очищати довготривалі
ресурси.

Не покладайтеся на внутрішній хук `gateway:startup` для runtime-сервісів,
що належать Plugin.

`cron_changed` спрацьовує для подій життєвого циклу Cron, що належать Gateway, з типізованим
корисним навантаженням події, яке охоплює причини `added`, `updated`, `removed`, `started`, `finished`
і `scheduled`. Подія містить знімок `PluginHookGatewayCronJob`
(зокрема `state.nextRunAtMs`, `state.lastRunStatus` і
`state.lastError`, коли наявний) плюс `PluginHookGatewayCronDeliveryStatus`
зі значенням `not-requested` | `delivered` | `not-delivered` | `unknown`. Події
видалення все ще містять знімок видаленого завдання, щоб зовнішні планувальники могли
узгодити стан. Використовуйте `ctx.getCron?.()` і `ctx.config` з runtime-
контексту під час синхронізації зовнішніх планувальників пробудження та залишайте OpenClaw
джерелом істини для перевірок строку виконання й виконання.

## Майбутні застарівання

Кілька поверхонь, суміжних із хуками, застаріли, але все ще підтримуються. Перенесіть
їх до наступного основного випуску:

- **Відкритотекстові оболонки каналів** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача
  замість розбору плоского тексту оболонки. Див.
  [Відкритотекстові оболонки каналів → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** зберігається для сумісності. Нові Plugin мають використовувати
  `before_model_resolve` і `before_prompt_build` замість комбінованої
  фази.
- **`onResolution` у `before_tool_call`** тепер використовує типізований
  union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація можливості пам’яті, профіль мислення провайдера,
зовнішні провайдери автентифікації, типи виявлення провайдерів, засоби доступу до runtime
завдань і перейменування `command-auth` → `command-status` — див. у
[Міграція Plugin SDK → Активні застарівання](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Міграція Plugin SDK](/uk/plugins/sdk-migration) — активні застарівання та графік вилучення
- [Створення Plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals)
