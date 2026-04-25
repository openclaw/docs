---
read_when:
    - Ви створюєте Plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із Plugin
    - Ви обираєте між внутрішніми хуками та хуками Plugin
summary: 'Хуки Plugin: перехоплення подій життєвого циклу агента, інструментів, повідомлень, сесій і Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-25T05:57:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це внутрішньопроцесні точки розширення для Plugins OpenClaw. Використовуйте їх,
коли Plugin має перевіряти або змінювати запуски агентів, виклики інструментів, потік повідомлень,
життєвий цикл сесій, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), якщо вам потрібен невеликий
операторський скрипт `HOOK.md` для подій команд і Gateway, таких як
`/new`, `/reset`, `/stop`, `agent:bootstrap` або `gateway:startup`.

## Швидкий старт

Зареєструйте типізовані хуки Plugin через `api.on(...)` у точці входу вашого Plugin:

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

Обробники хуків виконуються послідовно у спадному порядку `priority`. Хуки з однаковим пріоритетом
зберігають порядок реєстрації.

## Каталог хуків

Хуки згруповано за поверхнею, яку вони розширюють. Назви, виділені **жирним**, приймають
результат рішення (block, cancel, override або require approval); усі інші
призначені лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначити постачальника або модель до завантаження повідомлень сесії
- `before_prompt_build` — додати динамічний контекст або текст системного промпту перед викликом моделі
- `before_agent_start` — об’єднана фаза лише для сумісності; натомість використовуйте два хуки вище
- **`before_agent_reply`** — перервати хід моделі синтетичною відповіддю або тишею
- `agent_end` — спостерігати фінальні повідомлення, стан успіху та тривалість запуску

**Спостереження за розмовою**

- `llm_input` — спостерігати вхід постачальника (системний промпт, промпт, історія)
- `llm_output` — спостерігати вихід постачальника

**Інструменти**

- **`before_tool_call`** — переписати параметри інструмента, заблокувати виконання або вимагати схвалення
- `after_tool_call` — спостерігати результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписати повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевірити або заблокувати запис повідомлення в процесі виконання (рідко)

**Повідомлення та доставка**

- **`inbound_claim`** — перехопити вхідне повідомлення до маршрутизації агента (синтетичні відповіді)
- `message_received` — спостерігати вхідний вміст, відправника, потік і metadata
- **`message_sending`** — переписати вихідний вміст або скасувати доставку
- `message_sent` — спостерігати успіх або помилку вихідної доставки
- **`before_dispatch`** — перевірити або переписати вихідне dispatch перед передаванням каналу
- **`reply_dispatch`** — брати участь у фінальному конвеєрі dispatch відповідей

**Сесії та Compaction**

- `session_start` / `session_end` — відстежувати межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігати або анотувати цикли Compaction
- `before_reset` — спостерігати події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координувати маршрутизацію субагентів і доставку завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускати або зупиняти сервіси, що належать Plugin, разом із Gateway
- **`before_install`** — перевіряти сканування встановлення Skills або Plugins і за потреби блокувати

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
- `requireApproval` призупиняє запуск агента і запитує користувача через
  схвалення Plugin. Команда `/approve` може схвалювати як exec, так і схвалення Plugin.
- `block: true` з нижчим пріоритетом усе одно може заблокувати виконання після того, як хук із вищим пріоритетом
  запросив схвалення.
- `onResolution` отримує підсумкове рішення схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

## Хуки промптів і моделей

Для нових Plugins використовуйте хуки, специфічні для фази:

- `before_model_resolve`: отримує лише поточний промпт і metadata
  вкладень. Поверніть `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Поверніть `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` залишається для сумісності. Надавайте перевагу явним хукам вище,
щоб ваш Plugin не залежав від застарілої об’єднаної фази.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може
ідентифікувати активний запуск. Те саме значення також доступне в `ctx.runId`.

Не вбудовані Plugins, яким потрібні `llm_input`, `llm_output` або `agent_end`, мають задати:

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

Хуки, що змінюють промпт, можна вимкнути для окремого Plugin через
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Хуки повідомлень

Використовуйте хуки повідомлень для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігати вхідний вміст, відправника, `threadId`, `messageId`,
  `senderId`, необов’язкову кореляцію запуску/сесії та metadata.
- `message_sending`: переписати `content` або повернути `{ cancel: true }`.
- `message_sent`: спостерігати фінальний успіх або помилку.

Для аудіовідповідей TTS без тексту `content` може містити прихований
озвучений транскрипт, навіть якщо payload каналу не має видимого тексту/підпису. Переписування цього
`content` оновлює лише видимий для хука транскрипт; він не рендериться як
підпис медіа.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Надавайте перевагу
цим полям першого класу перед читанням застарілої metadata.

Надавайте перевагу типізованим полям `threadId` і `replyToId` перед використанням channel-specific
metadata.

Правила рішень:

- `message_sending` із `cancel: true` є термінальним.
- `message_sending` із `cancel: false` трактується як відсутність рішення.
- Переписаний `content` переходить до хуків із нижчим пріоритетом, якщо пізніший хук не
  скасує доставку.

## Хуки встановлення

`before_install` виконується після вбудованого сканування встановлень Skills і Plugins.
Поверніть додаткові findings або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` трактується як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів Plugin, яким потрібен стан, що належить Gateway. Контекст
надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлення Cron. Використовуйте `gateway_stop` для очищення довготривалих
ресурсів.

Не покладайтеся на внутрішній хук `gateway:startup` для сервісів середовища виконання, що належать Plugin.

## Майбутні застарівання

Кілька поверхонь, суміжних із хуками, є застарілими, але досі підтримуються. Виконайте міграцію
до наступного мажорного випуску:

- **Plaintext channel envelopes** в обробниках `inbound_claim` і `message_received`.
  Читайте `BodyForAgent` і структуровані блоки контексту користувача,
  замість розбору плаского тексту envelope. Див.
  [Plaintext channel envelopes → BodyForAgent](/uk/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** залишається для сумісності. Нові Plugins мають використовувати
  `before_model_resolve` і `before_prompt_build` замість об’єднаної
  фази.
- **`onResolution` у `before_tool_call`** тепер використовує типізоване
  об’єднання `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) замість довільного `string`.

Повний список — реєстрація можливостей пам’яті, профіль thinking
постачальника, зовнішні постачальники автентифікації, типи виявлення постачальників, accessor-и
середовища виконання завдань і перейменування `command-auth` → `command-status` — див. у
[Plugin SDK migration → Active deprecations](/uk/plugins/sdk-migration#active-deprecations).

## Пов’язане

- [Plugin SDK migration](/uk/plugins/sdk-migration) — активні застарівання і графік видалення
- [Створення Plugins](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals)
