---
read_when:
    - Ви створюєте Plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із Plugin
    - Ви обираєте між внутрішніми хуками та хуками Plugin
summary: 'Хуки Plugin: перехоплення подій життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-24T17:33:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e25ad31350ca129e99a7e6ec42ee699857b8aaa016479bd1f79be32a37784b4
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це внутрішньопроцесні точки розширення для Plugin OpenClaw. Використовуйте їх,
коли Plugin має перевіряти або змінювати запуски агента, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), коли вам потрібен невеликий
встановлюваний оператором скрипт `HOOK.md` для команд і подій Gateway, таких як
`/new`, `/reset`, `/stop`, `agent:bootstrap` або `gateway:startup`.

## Швидкий старт

Зареєструйте типізовані хуки Plugin за допомогою `api.on(...)` у точці входу вашого Plugin:

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

## Поширені хуки

| Hook                                                                                     | Для чого використовувати                                                             |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `before_tool_call`                                                                       | Переписати параметри інструмента, заблокувати виконання або запросити схвалення користувача перед запуском інструмента. |
| `after_tool_call`                                                                        | Спостерігати за результатами інструмента, помилками та тривалістю після виконання.   |
| `before_prompt_build`                                                                    | Додати динамічний контекст або текст системного промпту перед викликом моделі.       |
| `before_model_resolve`                                                                   | Перевизначити провайдера або модель до завантаження повідомлень сесії.               |
| `before_agent_reply`                                                                     | Достроково завершити хід моделі синтетичною відповіддю або без відповіді.            |
| `llm_input` / `llm_output`                                                               | Спостерігати за вхідними/вихідними даними провайдера для Plugin, що враховують контекст розмови. |
| `agent_end`                                                                              | Спостерігати за фінальними повідомленнями, станом успіху та тривалістю запуску.      |
| `message_received`                                                                       | Спостерігати за вхідними повідомленнями каналу після обробки каналу.                 |
| `message_sending`                                                                        | Переписати або скасувати вихідні повідомлення каналу.                                |
| `message_sent`                                                                           | Спостерігати за успіхом або помилкою вихідної доставки.                              |
| `session_start` / `session_end`                                                          | Відстежувати межі життєвого циклу сесії.                                              |
| `before_compaction` / `after_compaction`                                                 | Спостерігати за циклами Compaction або анотувати їх.                                  |
| `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` | Координувати маршрутизацію субагентів і доставку після завершення.                   |
| `gateway_start` / `gateway_stop`                                                         | Запускати або зупиняти сервіси Plugin разом із Gateway.                              |
| `before_install`                                                                         | Перевіряти сканування встановлення skill або Plugin і за потреби блокувати його.     |

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
    onResolution?: (decision: string) => Promise<void> | void;
  };
};
```

Правила:

- `block: true` є термінальним і пропускає обробники з нижчим пріоритетом.
- `block: false` трактується як відсутність рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє запуск агента і запитує користувача через схвалення Plugin.
  Команда `/approve` може схвалювати як exec, так і схвалення Plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати виконання після того, як хук
  з вищим пріоритетом запросив схвалення.

## Хуки промпту та моделі

Для нових Plugin використовуйте хуки, специфічні для фази:

- `before_model_resolve`: отримує лише поточний промпт і метадані вкладень.
  Поверніть `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Поверніть `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` залишається для сумісності. Надавайте перевагу явним хукам вище,
щоб ваш Plugin не залежав від застарілої об’єднаної фази.

Для небандлованих Plugin, яким потрібні `llm_input`, `llm_output` або `agent_end`, потрібно вказати:

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

- `message_received`: спостерігати за вхідним вмістом, відправником, `threadId` і метаданими.
- `message_sending`: переписати `content` або повернути `{ cancel: true }`.
- `message_sent`: спостерігати за фінальним успіхом або помилкою.

Надавайте перевагу типізованим полям `threadId` і `replyToId`, перш ніж використовувати
метадані, специфічні для каналу.

Правила прийняття рішень:

- `message_sending` з `cancel: true` є термінальним.
- `message_sending` з `cancel: false` трактується як відсутність рішення.
- Переписаний `content` передається далі хукам із нижчим пріоритетом, якщо пізніший хук
  не скасовує доставку.

## Хуки встановлення

`before_install` виконується після вбудованого сканування встановлень skill і Plugin.
Поверніть додаткові результати або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` трактується як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів Plugin, яким потрібен стан, що належить Gateway.
Контекст надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для перевірки та оновлення
Cron. Використовуйте `gateway_stop` для очищення довготривалих ресурсів.

Не покладайтеся на внутрішній хук `gateway:startup` для runtime-сервісів, що належать Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішні принципи архітектури Plugin](/uk/plugins/architecture-internals)
