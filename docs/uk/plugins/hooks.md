---
read_when:
    - Ви створюєте Plugin, якому потрібні before_tool_call, before_agent_reply, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із Plugin
    - Ви обираєте між внутрішніми хуками та Plugin-хуками
summary: 'Хуки Plugin: перехоплюйте події життєвого циклу агента, інструмента, повідомлення, сеансу та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-05-06T11:46:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Хуки Plugin — це внутрішньопроцесні точки розширення для Plugin OpenClaw. Використовуйте їх, коли Plugin потрібно перевіряти або змінювати запуски агентів, виклики інструментів, потік повідомлень, життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), коли потрібен невеликий встановлений оператором сценарій `HOOK.md` для подій команд і Gateway, таких як `/new`, `/reset`, `/stop`, `agent:bootstrap` або `gateway:startup`.

## Швидкий старт

Зареєструйте типізовані хуки Plugin за допомогою `api.on(...)` із точки входу вашого Plugin:

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

Обробники хуків виконуються послідовно в порядку спадання `priority`. Хуки з однаковим пріоритетом зберігають порядок реєстрації.

`api.on(name, handler, opts?)` приймає:

- `priority` - порядок обробників (вищий виконується першим).
- `timeoutMs` - необов’язковий бюджет для окремого хука. Якщо задано, виконавець хуків перериває цей обробник після вичерпання бюджету й переходить до наступного, замість того щоб дозволити повільному налаштуванню або відновленню з пам’яті витратити налаштований для викликача тайм-аут моделі. Не вказуйте його, щоб використовувати стандартний тайм-аут спостереження/рішення, який виконавець хуків застосовує загально.

Оператори також можуть задавати бюджети хуків без змін у коді Plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` перевизначає `hooks.timeoutMs`, який перевизначає значення `api.on(..., { timeoutMs })`, задане автором Plugin. Кожне налаштоване значення має бути додатним цілим числом не більшим за 600000 мілісекунд. Надавайте перевагу перевизначенням для окремих хуків із відомо повільною роботою, щоб один Plugin не отримував довший бюджет усюди.

Кожен хук отримує `event.context.pluginConfig`, розв’язану конфігурацію для Plugin, який зареєстрував цей обробник. Використовуйте її для рішень хука, яким потрібні поточні параметри Plugin; OpenClaw впроваджує її для кожного обробника, не змінюючи спільний об’єкт події, який бачать інші Plugin.

## Каталог хуків

Хуки згруповано за поверхнею, яку вони розширюють. Назви **жирним** приймають результат рішення (блокування, скасування, перевизначення або вимогу схвалення); усі інші призначені лише для спостереження.

**Хід агента**

- `before_model_resolve` - перевизначити провайдера або модель до завантаження повідомлень сесії
- `agent_turn_prepare` - використати поставлені в чергу вставки ходу Plugin і додати контекст цього самого ходу перед хуками промпта
- `before_prompt_build` - додати динамічний контекст або текст системного промпта перед викликом моделі
- `before_agent_start` - лише сумісна об’єднана фаза; надавайте перевагу двом хукам вище
- **`before_agent_run`** - перевірити фінальний промпт і повідомлення сесії перед надсиланням до моделі та за потреби заблокувати запуск
- **`before_agent_reply`** - достроково завершити хід моделі синтетичною відповіддю або мовчанням
- **`before_agent_finalize`** - перевірити природну фінальну відповідь і запросити ще один прохід моделі
- `agent_end` - спостерігати фінальні повідомлення, стан успіху й тривалість запуску
- `heartbeat_prompt_contribution` - додати контекст лише для Heartbeat для фонових моніторів і Plugin життєвого циклу

**Спостереження за розмовою**

- `model_call_started` / `model_call_ended` - спостерігати очищені метадані виклику провайдера/моделі, таймінг, результат і обмежені хеші ідентифікаторів запитів без вмісту промпта або відповіді
- `llm_input` - спостерігати вхідні дані провайдера (системний промпт, промпт, історія)
- `llm_output` - спостерігати вихідні дані провайдера

**Інструменти**

- **`before_tool_call`** - переписати параметри інструмента, заблокувати виконання або вимагати схвалення
- `after_tool_call` - спостерігати результати інструмента, помилки й тривалість
- **`tool_result_persist`** - переписати повідомлення асистента, створене з результату інструмента
- **`before_message_write`** - перевірити або заблокувати запис повідомлення, що триває (рідко)

**Повідомлення та доставка**

- **`inbound_claim`** - заявити вхідне повідомлення до маршрутизації агента (синтетичні відповіді)
- `message_received` - спостерігати вхідний вміст, відправника, потік і метадані
- **`message_sending`** - переписати вихідний вміст або скасувати доставку
- `message_sent` - спостерігати успіх або невдачу вихідної доставки
- **`before_dispatch`** - перевірити або переписати вихідне відправлення перед передаванням каналу
- **`reply_dispatch`** - брати участь у фінальному конвеєрі відправлення відповіді

**Сесії та Compaction**

- `session_start` / `session_end` - відстежувати межі життєвого циклу сесії
- `before_compaction` / `after_compaction` - спостерігати або анотувати цикли Compaction
- `before_reset` - спостерігати події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - координувати маршрутизацію субагентів і доставку завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` - запускати або зупиняти сервіси, що належать Plugin, разом із Gateway
- `cron_changed` - спостерігати зміни життєвого циклу Cron, що належить Gateway (додано, оновлено, видалено, запущено, завершено, заплановано)
- **`before_install`** - перевіряти сканування встановлення Skills або Plugin і за потреби блокувати

## Політика виклику інструментів

`before_tool_call` отримує:

- `event.toolName`
- `event.params`
- необов’язковий `event.runId`
- необов’язковий `event.toolCallId`
- поля контексту, як-от `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (задано для запусків, керованих Cron), і діагностичний `ctx.trace`

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
- `requireApproval` призупиняє запуск агента й запитує користувача через схвалення Plugin. Команда `/approve` може схвалювати як exec, так і схвалення Plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати після того, як хук із вищим пріоритетом запросив схвалення.
- `onResolution` отримує розв’язане рішення схвалення - `allow-once`, `allow-always`, `deny`, `timeout` або `cancelled`.

Вбудовані Plugin, яким потрібна політика рівня хоста, можуть реєструвати довірені політики інструментів через `api.registerTrustedToolPolicy(...)`. Вони виконуються перед звичайними хуками `before_tool_call` і перед рішеннями зовнішніх Plugin. Використовуйте їх лише для довірених хостом шлюзів, таких як політика робочого простору, застосування бюджету або безпека зарезервованих робочих процесів. Зовнішні Plugin мають використовувати звичайні хуки `before_tool_call`.

### Збереження результатів інструментів

Результати інструментів можуть містити структуровані `details` для рендерингу UI, діагностики, маршрутизації медіа або метаданих, що належать Plugin. Розглядайте `details` як метадані часу виконання, а не як вміст промпта:

- OpenClaw вилучає `toolResult.details` перед повторним відтворенням у провайдері та вхідними даними Compaction, щоб метадані не ставали контекстом моделі.
- Збережені записи сесії залишають лише обмежені `details`. Надмірно великі details замінюються компактним підсумком і `persistedDetailsTruncated: true`.
- `tool_result_persist` і `before_message_write` виконуються перед фінальним обмеженням збереження. Хуки все одно мають тримати повернуті `details` невеликими й не розміщувати текст, релевантний для промпта, лише в `details`; видимий для моделі вивід інструмента розміщуйте в `content`.

## Хуки промпта й моделі

Для нових Plugin використовуйте хуки, специфічні для фази:

- `before_model_resolve`: отримує лише поточний промпт і метадані вкладень. Поверніть `providerOverride` або `modelOverride`.
- `agent_turn_prepare`: отримує поточний промпт, підготовлені повідомлення сесії та будь-які одноразові поставлені в чергу вставки, зчитані для цієї сесії. Поверніть `prependContext` або `appendContext`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії. Поверніть `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` або `appendSystemContext`.
- `heartbeat_prompt_contribution`: виконується лише для ходів Heartbeat і повертає `prependContext` або `appendContext`. Він призначений для фонових моніторів, яким потрібно підсумовувати поточний стан без зміни ходів, ініційованих користувачем.

`before_agent_start` залишається для сумісності. Надавайте перевагу явним хукам вище, щоб ваш Plugin не залежав від застарілої об’єднаної фази.

`before_agent_run` виконується після побудови промпта й перед будь-яким входом моделі, включно із завантаженням зображень, локальних для промпта, і спостереженням `llm_input`. Він отримує поточний ввід користувача як `prompt`, а також завантажену історію сесії в `messages` і активний системний промпт. Поверніть `{ outcome: "block", reason, message? }`, щоб зупинити запуск до того, як модель зможе прочитати промпт. `reason` є внутрішнім; `message` є заміною, видимою користувачу. Єдині підтримувані результати — `pass` і `block`; непідтримувані форми рішень завершуються закритим відмовленням.

Коли запуск заблоковано, OpenClaw зберігає лише текст заміни в `message.content` разом із нечутливими метаданими блокування, такими як ідентифікатор Plugin, що заблокував, і позначка часу. Оригінальний текст користувача не зберігається в транскрипті або майбутньому контексті. Внутрішні причини блокування вважаються чутливими й виключаються з транскрипту, історії, трансляції, журналу та діагностичних payload. Спостережуваність має використовувати очищені поля, такі як ідентифікатор блокувальника, результат, позначка часу або безпечна категорія.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може визначити активний запуск. Те саме значення також доступне в `ctx.runId`. Запуски, керовані Cron, також надають `ctx.jobId` (ідентифікатор початкового завдання Cron), щоб хуки Plugin могли прив’язувати метрики, побічні ефекти або стан до конкретного запланованого завдання.

Для запусків, що походять із каналу, `ctx.messageProvider` є поверхнею провайдера, як-от `discord` або `telegram`, тоді як `ctx.channelId` є цільовим ідентифікатором розмови, коли OpenClaw може вивести його з ключа сесії або метаданих доставки.

`agent_end` є хуком спостереження й виконується fire-and-forget після ходу. Виконавець хуків застосовує тайм-аут 30 секунд, щоб завислий Plugin або endpoint embeddings не залишав promise хука в очікуванні назавжди. Тайм-аут записується в журнал, і OpenClaw продовжує роботу; він не скасовує мережеву роботу, що належить Plugin, якщо Plugin також не використовує власний сигнал переривання.

Використовуйте `model_call_started` і `model_call_ended` для телеметрії викликів провайдера, яка не має отримувати сирі промпти, історію, відповіді, заголовки, тіла запитів або ідентифікатори запитів провайдера. Ці хуки містять стабільні метадані, такі як `runId`, `callId`, `provider`, `model`, необов’язкові `api`/`transport`, термінальні `durationMs`/`outcome` і `upstreamRequestIdHash`, коли OpenClaw може вивести обмежений хеш ідентифікатора запиту провайдера.

`before_agent_finalize` виконується лише тоді, коли harness збирається прийняти природну фінальну відповідь асистента. Це не шлях скасування `/stop`, і він не виконується, коли користувач перериває хід. Поверніть `{ action: "revise", reason }`, щоб попросити harness виконати ще один прохід моделі перед фіналізацією, `{ action: "finalize", reason? }`, щоб примусово виконати фіналізацію, або не повертайте результат, щоб продовжити. Нативні хуки Codex `Stop` передаються в цей хук як рішення OpenClaw `before_agent_finalize`.

Повертаючи `action: "revise"`, Plugin можуть включати метадані `retry`, щоб зробити додатковий прохід моделі обмеженим і безпечним для повторного відтворення:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` додається до причини ревізії, яку надсилають до harness.
`idempotencyKey` дає host змогу рахувати повторні спроби для того самого запиту plugin у
еквівалентних рішеннях finalize, а `maxAttempts` обмежує кількість додаткових проходів,
які host дозволить перед продовженням із природною фінальною відповіддю.

Невбудовані plugins, яким потрібні сирі hooks розмови (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` або `before_agent_run`), мають установити:

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

Hooks, що змінюють prompt, і довговічні ін’єкції наступного ходу можна вимкнути для кожного plugin
за допомогою `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Розширення сесії та ін’єкції наступного ходу

Workflow plugins можуть зберігати невеликий JSON-сумісний стан сесії за допомогою
`api.registerSessionExtension(...)` і оновлювати його через метод Gateway
`sessions.pluginPatch`. Рядки сесій проєктують зареєстрований стан розширень
через `pluginExtensions`, даючи Control UI та іншим клієнтам змогу відображати
статус, що належить plugin, без знання внутрішньої будови plugin.

Використовуйте `api.enqueueNextTurnInjection(...)`, коли plugin потрібен довговічний контекст, який
має потрапити в наступний хід моделі рівно один раз. OpenClaw спорожнює чергу ін’єкцій перед
prompt hooks, відкидає прострочені ін’єкції та дедуплікує за `idempotencyKey`
для кожного plugin. Це правильний seam для відновлень після approval, підсумків політик,
дельт фонового монітора та продовжень команд, які мають бути видимі для
моделі на наступному ході, але не мають ставати постійним текстом системного prompt.

Семантика очищення є частиною контракту. Cleanup розширень сесії та
callbacks очищення життєвого циклу runtime отримують `reset`, `delete`, `disable` або
`restart`. Host видаляє постійний стан розширення сесії належного plugin
і pending ін’єкції наступного ходу для reset/delete/disable; restart зберігає
довговічний стан сесії, тоді як callbacks очищення дають plugins змогу звільнити scheduler
jobs, run context та інші позасмугові ресурси старого покоління runtime.

## Hooks повідомлень

Використовуйте message hooks для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігати inbound content, sender, `threadId`, `messageId`,
  `senderId`, optional run/session correlation і metadata.
- `message_sending`: переписати `content` або повернути `{ cancel: true }`.
- `message_sent`: спостерігати фінальний успіх або failure.

Для TTS-відповідей лише з аудіо `content` може містити прихований усний transcript
навіть тоді, коли payload каналу не має видимого тексту/caption. Переписування цього
`content` оновлює лише transcript, видимий для hook; він не відображається як
media caption.

Контексти message hook відкривають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Надавайте перевагу
цим first-class полям перед читанням legacy metadata.

Надавайте перевагу typed полям `threadId` і `replyToId` перед використанням channel-specific
metadata.

Правила прийняття рішень:

- `message_sending` із `cancel: true` є terminal.
- `message_sending` із `cancel: false` трактують як відсутність рішення.
- Переписаний `content` продовжує передаватися hooks із нижчим пріоритетом, якщо пізніший hook
  не скасує доставку.

## Install hooks

`before_install` запускається після вбудованого сканування встановлень skill і plugin.
Поверніть додаткові findings або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є terminal. `block: false` трактують як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для служб plugin, яким потрібен стан, що належить Gateway. Контекст
відкриває `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлень cron. Використовуйте `gateway_stop`, щоб очистити довготривалі
ресурси.

Не покладайтеся на внутрішній hook `gateway:startup` для runtime services, що належать plugin.

`cron_changed` спрацьовує для подій життєвого циклу cron, що належить gateway, із typed
payload події, який охоплює причини `added`, `updated`, `removed`, `started`, `finished`
і `scheduled`. Подія несе snapshot `PluginHookGatewayCronJob`
(включно з `state.nextRunAtMs`, `state.lastRunStatus` і
`state.lastError`, коли вони присутні), а також `PluginHookGatewayCronDeliveryStatus`
зі значенням `not-requested` | `delivered` | `not-delivered` | `unknown`. Події removed
усе ще несуть snapshot видаленого job, щоб зовнішні schedulers могли
узгодити стан. Використовуйте `ctx.getCron?.()` і `ctx.config` із runtime
context під час синхронізації зовнішніх wake schedulers і зберігайте OpenClaw як
джерело істини для перевірок строків виконання та виконання.

## Майбутні deprecations

Кілька суміжних із hooks поверхонь застарілі, але все ще підтримуються. Мігруйте
до наступного major release:

- **Plaintext channel envelopes** у handlers `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки user-context
  замість парсингу плаского envelope text. Див.
  [Plaintext channel envelopes → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** залишається для сумісності. Нові plugins мають використовувати
  `before_model_resolve` і `before_prompt_build` замість combined
  phase.
- **`onResolution` у `before_tool_call`** тепер використовує typed
  union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість free-form `string`.

Повний список - реєстрація memory capability, provider thinking
profile, зовнішні auth providers, provider discovery types, task runtime
accessors і перейменування `command-auth` → `command-status` - див.
[Plugin SDK migration → Active deprecations](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Plugin SDK migration](/uk/plugins/sdk-migration) - активні deprecations і графік вилучення
- [Створення plugins](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Entry points Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні hooks](/uk/automation/hooks)
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals)
