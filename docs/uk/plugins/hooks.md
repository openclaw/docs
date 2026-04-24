---
read_when:
    - Ви створюєте plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із plugin
    - 'Ви вирішуєте, що вибрати: внутрішні хуки чи хуки Plugin'
summary: 'Хуки Plugin: перехоплення подій життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-24T18:11:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 620f4a4c54c26efbab67b9e466624f8d72789937d7e056b88cdd00022b561943
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це точки розширення в межах процесу для plugin OpenClaw. Використовуйте їх,
коли plugin має перевіряти або змінювати запуски агента, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію subagent, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), коли вам потрібен невеликий
встановлюваний оператором скрипт `HOOK.md` для команд і подій Gateway, таких як
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

Обробники хуків виконуються послідовно у спадному порядку `priority`. Хуки
з однаковим пріоритетом зберігають порядок реєстрації.

## Каталог хуків

Хуки згруповані за поверхнею, яку вони розширюють. Назви **жирним** приймають
результат рішення (блокування, скасування, перевизначення або вимогу схвалення); усі інші
лише для спостереження.

**Хід агента**

- `before_model_resolve` — перевизначити provider або модель до завантаження повідомлень сесії
- `before_prompt_build` — додати динамічний контекст або текст системного prompt перед викликом моделі
- `before_agent_start` — комбінована фаза лише для сумісності; натомість використовуйте два хуки вище
- **`before_agent_reply`** — замкнути хід моделі на синтетичній відповіді або тиші
- `agent_end` — спостерігати фінальні повідомлення, стан успіху та тривалість запуску

**Спостереження за розмовою**

- `llm_input` — спостерігати вхід provider (системний prompt, prompt, історія)
- `llm_output` — спостерігати вихід provider

**Інструменти**

- **`before_tool_call`** — переписати параметри інструмента, заблокувати виконання або вимагати схвалення
- `after_tool_call` — спостерігати результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписати повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевірити або заблокувати запис повідомлення в процесі (рідко)

**Повідомлення та доставка**

- **`inbound_claim`** — взяти вхідне повідомлення до маршрутизації агента (синтетичні відповіді)
- `message_received` — спостерігати вхідний вміст, відправника, гілку та метадані
- **`message_sending`** — переписати вихідний вміст або скасувати доставку
- `message_sent` — спостерігати успіх або збій вихідної доставки
- **`before_dispatch`** — перевірити або переписати вихідне dispatch до передавання каналу
- **`reply_dispatch`** — брати участь у фінальному конвеєрі dispatch відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежувати межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігати або анотувати цикли Compaction
- `before_reset` — спостерігати події скидання сесії (`/reset`, програмні скидання)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координувати маршрутизацію subagent і доставку після завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускати або зупиняти сервіси plugin, що належать Gateway
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

- `block: true` є фінальним і пропускає обробники з нижчим пріоритетом.
- `block: false` трактується як відсутність рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє запуск агента й запитує користувача через
  схвалення plugin. Команда `/approve` може схвалювати як exec, так і схвалення plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати після того, як хук з вищим пріоритетом
  запросив схвалення.
- `onResolution` отримує остаточне рішення щодо схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

## Хуки prompt і моделі

Для нових plugin використовуйте хуки, прив’язані до конкретної фази:

- `before_model_resolve`: отримує лише поточний prompt і метадані
  вкладень. Поверніть `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний prompt і повідомлення сесії.
  Поверніть `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` залишається для сумісності. Надавайте перевагу явним хукам вище,
щоб ваш plugin не залежав від застарілої комбінованої фази.

Plugin, що не входять до комплекту, і яким потрібні `llm_input`, `llm_output` або `agent_end`, мають задати:

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

Використовуйте хуки повідомлень для політики маршрутизації та доставки на рівні каналу:

- `message_received`: спостерігати вхідний вміст, відправника, `threadId` і метадані.
- `message_sending`: переписати `content` або повернути `{ cancel: true }`.
- `message_sent`: спостерігати фінальний успіх або збій.

Надавайте перевагу типізованим полям `threadId` і `replyToId`, перш ніж використовувати метадані,
специфічні для каналу.

Правила рішень:

- `message_sending` з `cancel: true` є фінальним.
- `message_sending` з `cancel: false` трактується як відсутність рішення.
- Переписаний `content` передається хукам з нижчим пріоритетом, якщо пізніший хук
  не скасує доставку.

## Хуки встановлення

`before_install` запускається після вбудованого сканування встановлень skill і plugin.
Поверніть додаткові результати або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є фінальним. `block: false` трактується як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для сервісів plugin, яким потрібен стан, що належить Gateway. Контекст
надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлення Cron. Використовуйте `gateway_stop` для очищення довготривалих
ресурсів.

Не покладайтеся на внутрішній хук `gateway:startup` для сервісів часу виконання,
що належать plugin.

## Пов’язане

- [Створення plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура plugin](/uk/plugins/architecture-internals)
