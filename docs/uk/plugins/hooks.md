---
read_when:
    - Ви створюєте Plugin, якому потрібні before_tool_call, before_agent_reply, хуки повідомлень або хуки життєвого циклу
    - Потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із Plugin
    - Ви обираєте між внутрішніми хуками та хуками Plugin
summary: 'Хуки Plugin: перехоплюйте події життєвого циклу агента, інструмента, повідомлення, сеансу та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-28T12:00:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa6284ea4033fd0da624a794bf7b8b62c0d93d1a4a5a1f7146c8aa55a1dd1c3
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hooks — це внутрішньопроцесні точки розширення для плагінів OpenClaw. Використовуйте їх,
коли плагіну потрібно переглядати або змінювати запуски агентів, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні hooks](/uk/automation/hooks), коли потрібен невеликий
установлений оператором скрипт `HOOK.md` для команд і подій Gateway, таких як
`/new`, `/reset`, `/stop`, `agent:bootstrap` або `gateway:startup`.

## Швидкий старт

Реєструйте типізовані plugin hooks за допомогою `api.on(...)` з точки входу вашого плагіна:

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

Обробники hooks виконуються послідовно в порядку спадання `priority`. Hooks з однаковим пріоритетом
зберігають порядок реєстрації.

Кожен hook отримує `event.context.pluginConfig`, вирішену конфігурацію для
плагіна, який зареєстрував цей обробник. Використовуйте її для рішень hook, яким потрібні
поточні параметри плагіна; OpenClaw впроваджує її окремо для кожного обробника, не змінюючи
спільний об’єкт події, який бачать інші плагіни.

## Каталог hooks

Hooks згруповано за поверхнею, яку вони розширюють. Назви, виділені **жирним**, приймають
результат рішення (заблокувати, скасувати, перевизначити або вимагати схвалення); усі інші призначені
лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначити провайдера або модель до завантаження повідомлень сесії
- `agent_turn_prepare` — спожити поставлені в чергу вставки ходу плагіна й додати контекст того самого ходу перед prompt hooks
- `before_prompt_build` — додати динамічний контекст або текст системного prompt перед викликом моделі
- `before_agent_start` — комбінована фаза лише для сумісності; віддавайте перевагу двом hooks вище
- **`before_agent_reply`** — коротко замкнути хід моделі синтетичною відповіддю або мовчанням
- **`before_agent_finalize`** — переглянути природну фінальну відповідь і запросити ще один прохід моделі
- `agent_end` — спостерігати фінальні повідомлення, стан успіху та тривалість запуску
- `heartbeat_prompt_contribution` — додати контекст лише для heartbeat для фонових моніторів і плагінів життєвого циклу

**Спостереження за розмовою**

- `model_call_started` / `model_call_ended` — спостерігати санітизовані метадані виклику провайдера/моделі, таймінг, результат і обмежені хеші ідентифікаторів запитів без вмісту prompt або відповіді
- `llm_input` — спостерігати вхідні дані провайдера (системний prompt, prompt, історія)
- `llm_output` — спостерігати вихідні дані провайдера

**Інструменти**

- **`before_tool_call`** — переписати параметри інструмента, заблокувати виконання або вимагати схвалення
- `after_tool_call` — спостерігати результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписати повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — переглянути або заблокувати запис повідомлення в процесі (рідко)

**Повідомлення та доставлення**

- **`inbound_claim`** — заявити права на вхідне повідомлення перед маршрутизацією агента (синтетичні відповіді)
- `message_received` — спостерігати вхідний вміст, відправника, thread і метадані
- **`message_sending`** — переписати вихідний вміст або скасувати доставлення
- `message_sent` — спостерігати успішне або невдале доставлення вихідного повідомлення
- **`before_dispatch`** — переглянути або переписати вихідне dispatch перед передаванням каналу
- **`reply_dispatch`** — брати участь у фінальному конвеєрі reply-dispatch

**Сесії та compaction**

- `session_start` / `session_end` — відстежувати межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігати або анотувати цикли compaction
- `before_reset` — спостерігати події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координувати маршрутизацію субагентів і доставлення завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускати або зупиняти сервіси, що належать плагіну, разом із Gateway
- `cron_changed` — спостерігати зміни життєвого циклу cron, що належать gateway (додано, оновлено, видалено, запущено, завершено, заплановано)
- **`before_install`** — переглядати сканування встановлення skill або плагіна й за потреби блокувати

## Політика викликів інструментів

`before_tool_call` отримує:

- `event.toolName`
- `event.params`
- необов’язковий `event.runId`
- необов’язковий `event.toolCallId`
- поля контексту, такі як `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (задано для запусків, керованих cron), і діагностичний `ctx.trace`

Може повертати:

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

- `block: true` є кінцевим рішенням і пропускає обробники з нижчим пріоритетом.
- `block: false` трактується як відсутність рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє запуск агента й запитує користувача через схвалення plugin. Команда `/approve` може схвалювати як exec, так і схвалення plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати виконання після того, як хук із вищим пріоритетом запросив схвалення.
- `onResolution` отримує вирішене рішення щодо схвалення — `allow-once`, `allow-always`, `deny`, `timeout` або `cancelled`.

Вбудовані plugins, яким потрібна політика рівня хоста, можуть реєструвати довірені політики інструментів за допомогою `api.registerTrustedToolPolicy(...)`. Вони виконуються перед звичайними хуками `before_tool_call` і перед рішеннями зовнішніх plugin. Використовуйте їх лише для довірених хостом обмежень, як-от політика робочого простору, контроль бюджету або безпека зарезервованих workflow. Зовнішні plugins мають використовувати звичайні хуки `before_tool_call`.

### Збереження результатів інструментів

Результати інструментів можуть містити структуровані `details` для рендерингу UI, діагностики, маршрутизації медіа або метаданих, що належать plugin. Розглядайте `details` як runtime-метадані, а не як вміст prompt:

- OpenClaw вилучає `toolResult.details` перед повторним відтворенням у provider і вхідними даними compaction, щоб метадані не потрапляли в контекст моделі.
- Збережені записи сесії залишають лише обмежені `details`. Завеликі details замінюються компактним підсумком і `persistedDetailsTruncated: true`.
- `tool_result_persist` і `before_message_write` виконуються перед фінальним обмеженням збереження. Хуки все одно мають зберігати повернені `details` малими й уникати розміщення тексту, важливого для prompt, лише в `details`; вивід інструмента, видимий моделі, розміщуйте в `content`.

## Хуки prompt і моделі

Для нових plugins використовуйте хуки, специфічні для фази:

- `before_model_resolve`: отримує лише поточний prompt і метадані вкладень. Поверніть `providerOverride` або `modelOverride`.
- `agent_turn_prepare`: отримує поточний prompt, підготовлені повідомлення сесії та будь-які інʼєкції, поставлені в чергу точно один раз і вибрані для цієї сесії. Поверніть `prependContext` або `appendContext`.
- `before_prompt_build`: отримує поточний prompt і повідомлення сесії. Поверніть `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` або `appendSystemContext`.
- `heartbeat_prompt_contribution`: виконується лише для ходів Heartbeat і повертає `prependContext` або `appendContext`. Він призначений для фонових моніторів, яким потрібно підсумовувати поточний стан без зміни ходів, ініційованих користувачем.

`before_agent_start` залишається для сумісності. Надавайте перевагу явним хукам вище, щоб ваш plugin не залежав від застарілої обʼєднаної фази.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може визначити активний запуск. Те саме значення також доступне в `ctx.runId`. Запуски, керовані Cron, також надають `ctx.jobId` (ідентифікатор вихідного cron-завдання), щоб хуки plugin могли привʼязувати метрики, побічні ефекти або стан до конкретного запланованого завдання.

`agent_end` є хуком спостереження й виконується за принципом fire-and-forget після ходу. Виконавець хуків застосовує таймаут 30 секунд, щоб завислий plugin або endpoint embedding не залишив promise хуку в очікуванні назавжди. Таймаут записується в журнал, і OpenClaw продовжує роботу; він не скасовує мережеву роботу, що належить plugin, якщо plugin також не використовує власний сигнал abort.

Використовуйте `model_call_started` і `model_call_ended` для телеметрії викликів provider, яка не повинна отримувати сирі prompts, історію, відповіді, headers, тіла запитів або ідентифікатори запитів provider. Ці хуки містять стабільні метадані, як-от `runId`, `callId`, `provider`, `model`, необовʼязкові `api`/`transport`, кінцеві `durationMs`/`outcome` і `upstreamRequestIdHash`, коли OpenClaw може вивести обмежений хеш request-id provider.

`before_agent_finalize` виконується лише тоді, коли harness збирається прийняти природну фінальну відповідь асистента. Це не шлях скасування `/stop`, і він не виконується, коли користувач перериває хід. Поверніть `{ action: "revise", reason }`, щоб попросити harness виконати ще один прохід моделі перед фіналізацією, `{ action:
"finalize", reason? }`, щоб примусово фіналізувати, або не повертайте результат, щоб продовжити. Нативні хуки Codex `Stop` передаються в цей хук як рішення OpenClaw `before_agent_finalize`.

Невбудовані plugins, яким потрібні `llm_input`, `llm_output`, `before_agent_finalize` або `agent_end`, мають установити:

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

Хуки, що змінюють prompt, і довговічні інʼєкції наступного ходу можна вимкнути для окремого plugin за допомогою `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Розширення сесії та інʼєкції наступного ходу

Workflow plugins можуть зберігати невеликий JSON-сумісний стан сесії за допомогою `api.registerSessionExtension(...)` і оновлювати його через метод Gateway `sessions.pluginPatch`. Рядки сесії проєктують зареєстрований стан розширення через `pluginExtensions`, даючи Control UI та іншим клієнтам змогу рендерити статус, що належить plugin, без знання внутрішньої реалізації plugin.

Використовуйте `api.enqueueNextTurnInjection(...)`, коли plugin потрібен довговічний контекст, який має потрапити до наступного ходу моделі рівно один раз. OpenClaw вибирає поставлені в чергу інʼєкції перед хуками prompt, відкидає прострочені інʼєкції та дедуплікує за `idempotencyKey` для кожного plugin. Це правильний шов для відновлень після схвалення, підсумків політик, дельт фонових моніторів і продовжень команд, які мають бути видимі моделі на наступному ході, але не повинні ставати постійним текстом system prompt.

Семантика очищення є частиною контракту. Очищення розширень сесії та callbacks очищення життєвого циклу runtime отримують `reset`, `delete`, `disable` або `restart`. Хост видаляє постійний стан розширення сесії plugin-власника та очікувані інʼєкції наступного ходу для reset/delete/disable; restart зберігає довговічний стан сесії, тоді як callbacks очищення дають plugins змогу звільняти завдання scheduler, контекст запуску та інші позасмугові ресурси для старого покоління runtime.

## Хуки повідомлень

Використовуйте хуки повідомлень для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігає вхідний вміст, відправника, `threadId`, `messageId`, `senderId`, необовʼязкову кореляцію запуску/сесії та метадані.
- `message_sending`: переписує `content` або повертає `{ cancel: true }`.
- `message_sent`: спостерігає фінальний успіх або невдачу.

Для audio-only TTS-відповідей `content` може містити прихований озвучений transcript, навіть коли payload каналу не має видимого тексту/caption. Переписування цього `content` оновлює лише transcript, видимий хукам; він не рендериться як media caption.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Віддавайте
перевагу цим полям першого класу перед читанням застарілих метаданих.

Віддавайте перевагу типізованим полям `threadId` і `replyToId` перед
використанням метаданих, специфічних для каналу.

Правила ухвалення рішень:

- `message_sending` з `cancel: true` є термінальним.
- `message_sending` з `cancel: false` вважається відсутністю рішення.
- Переписаний `content` продовжує передаватися хукам нижчого пріоритету, якщо
  пізніший хук не скасує доставлення.

## Установлення хуків

`before_install` виконується після вбудованого сканування для встановлення Skills і Plugin.
Поверніть додаткові знахідки або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` вважається відсутністю рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів Plugin, яким потрібен стан, що належить Gateway. Контекст надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлення Cron. Використовуйте `gateway_stop`, щоб очищати довготривалі
ресурси.

Не покладайтеся на внутрішній хук `gateway:startup` для runtime-сервісів, що належать Plugin.

`cron_changed` спрацьовує для подій життєвого циклу Cron, що належать Gateway, з типізованим
payload події, який охоплює причини `added`, `updated`, `removed`, `started`, `finished`
і `scheduled`. Подія містить знімок `PluginHookGatewayCronJob`
(зокрема `state.nextRunAtMs`, `state.lastRunStatus` і
`state.lastError`, коли наявні), а також `PluginHookGatewayCronDeliveryStatus`
зі значеннями `not-requested` | `delivered` | `not-delivered` | `unknown`. Події видалення
все одно містять знімок видаленого завдання, щоб зовнішні планувальники могли
узгодити стан. Використовуйте `ctx.getCron?.()` і `ctx.config` із runtime-контексту
під час синхронізації зовнішніх планувальників пробудження та залишайте OpenClaw
джерелом істини для перевірок настання строку й виконання.

## Майбутні застарівання

Кілька поверхонь, суміжних із хуками, застаріли, але все ще підтримуються. Перейдіть
на нові підходи до наступного мажорного випуску:

- **Plaintext channel envelopes** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача
  замість розбору плоского тексту envelope. Див.
  [Plaintext channel envelopes → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** лишається для сумісності. Нові Plugin мають використовувати
  `before_model_resolve` і `before_prompt_build` замість об’єднаної
  фази.
- **`onResolution` у `before_tool_call`** тепер використовує типізований
  union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація memory capability, профіль мислення провайдера,
зовнішні провайдери автентифікації, типи виявлення провайдерів, accessors runtime завдань
і перейменування `command-auth` → `command-status` — див.
[Міграція Plugin SDK → Активні застарівання](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Міграція Plugin SDK](/uk/plugins/sdk-migration) — активні застарівання та графік видалення
- [Створення Plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals)
