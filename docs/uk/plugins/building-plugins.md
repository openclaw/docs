---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення плагінів
x-i18n:
    generated_at: "2026-04-25T00:01:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей, мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, web fetch, web search, інструменти агента або будь-яка їх комбінація.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в [ClawHub](/uk/tools/clawhub) або npm, а користувачі встановлять його за допомогою `openclaw plugins install <package-name>`. OpenClaw спочатку намагається використати ClawHub і автоматично переходить на npm, якщо це потрібно.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для Plugin у репозиторії: репозиторій клоновано і виконано `pnpm install`

## Який тип Plugin?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделі (LLM, проксі або власну кінцеву точку)
  </Card>
  <Card title="Plugin інструменту / хука" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, хуки подій або сервіси — продовження нижче
  </Card>
</CardGroup>

Для Plugin каналу, який не гарантовано буде встановлений на момент запуску онбордингу/налаштування, використовуйте `createOptionalChannelSetupSurface(...)` з `openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера налаштування + майстра, яка повідомляє про вимогу встановлення та забороняє реальні записи конфігурації, доки Plugin не буде встановлено.

## Швидкий старт: Plugin інструменту

У цьому покроковому прикладі створюється мінімальний Plugin, який реєструє інструмент агента. Для Plugin каналів і провайдерів є окремі посібники за посиланнями вище.

<Steps>
  <Step title="Створіть пакет і маніфест">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Кожному Plugin потрібен маніфест, навіть якщо конфігурації немає. Повну схему дивіться в [Manifest](/uk/plugins/manifest). Канонічні фрагменти для публікації в ClawHub розміщено в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Напишіть точку входу">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` призначений для Plugin, які не є каналами. Для каналів використовуйте `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний список параметрів точки входу дивіться в [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugins:** перевірте й опублікуйте через ClawHub, а потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, таких як `@myorg/openclaw-my-plugin`.

    **Plugins у репозиторії:** розмістіть у дереві workspace вбудованих Plugin — їх буде виявлено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один Plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                                | Детальний посібник                                                             |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Текстовий inference (LLM) | `api.registerProvider(...)`                   | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                              |
| Бекенд inference для CLI  | `api.registerCliBackend(...)`                 | [CLI Backends](/uk/gateway/cli-backends)                                          |
| Канал / повідомлення   | `api.registerChannel(...)`                      | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                |
| Мовлення (TTS/STT)     | `api.registerSpeechProvider(...)`               | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)` | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                     |
| Інструменти агента     | `api.registerTool(...)`                         | Нижче                                                                          |
| Власні команди         | `api.registerCommand(...)`                      | [Entry Points](/uk/plugins/sdk-entrypoints)                                       |
| Хуки Plugin            | `api.on(...)`                                   | [Хуки Plugin](/uk/plugins/hooks)                                                  |
| Внутрішні хуки подій   | `api.registerHook(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                       |
| HTTP-маршрути          | `api.registerHttpRoute(...)`                    | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)               |
| Підкоманди CLI         | `api.registerCli(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                       |

Повний API реєстрації дивіться в [Огляд SDK](/uk/plugins/sdk-overview#registration-api).

Вбудовані Plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм потрібно асинхронно переписувати результати інструментів до того, як модель побачить вивід. Оголосіть цільові runtime у `contracts.agentToolResultMiddleware`, наприклад `["pi", "codex"]`. Це шов довіри для вбудованих Plugin; зовнішнім Plugins слід віддавати перевагу звичайним хукам Plugin OpenClaw, якщо тільки в OpenClaw не з’явиться явна політика довіри для цієї можливості.

Якщо ваш Plugin реєструє власні методи Gateway RPC, використовуйте префікс, специфічний для Plugin. Простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди зіставляються з `operator.admin`, навіть якщо Plugin запитує вужчу область видимості.

Семантика guard-хуків, яку варто враховувати:

- `before_tool_call`: `{ block: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` вважається відсутністю рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через накладку схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` вважається відсутністю рішення.
- `message_sending`: `{ cancel: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` вважається відсутністю рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли вам потрібна маршрутизація вхідних потоків/тем. `metadata` залишайте для специфічних для каналу доповнень.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId`, а не специфічним для каналу ключам metadata.

Команда `/approve` обробляє як схвалення exec, так і схвалення Plugin, із обмеженим fallback: якщо ідентифікатор схвалення exec не знайдено, OpenClaw повторно пробує той самий ідентифікатор через схвалення Plugin. Переспрямування схвалень Plugin можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо власна логіка схвалення має визначати той самий випадок обмеженого fallback, використовуйте `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime` замість ручного зіставлення рядків закінчення строку дії схвалення.

Приклади й довідку щодо хуків дивіться в [Хуки Plugin](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди доступні) або необов’язковими (користувач вмикає їх окремо):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Користувачі вмикають необов’язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не повинні конфліктувати з інструментами ядра (конфлікти пропускаються)
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти Plugin, додавши ідентифікатор Plugin до `tools.allow`

## Угоди щодо імпорту

Завжди імпортуйте з вузькоспрямованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів дивіться в [Огляд SDK](/uk/plugins/sdk-overview).

У межах вашого Plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Plugin провайдерів тримайте допоміжні функції, специфічні для провайдера, у цих barrel-файлах у корені пакета, якщо тільки цей шов не є справді загальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні функції для `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні функції для моделей за замовчуванням, провайдери реального часу
- OpenRouter: конструктор провайдера плюс допоміжні функції для онбордингу/конфігурації

Якщо допоміжна функція корисна лише всередині одного пакета вбудованого провайдера, залишайте її на шві кореня цього пакета замість перенесення в `openclaw/plugin-sdk/*`.

Деякі згенеровані шви допоміжних функцій `openclaw/plugin-sdk/<bundled-id>` усе ще існують для підтримки та сумісності вбудованих Plugin, наприклад `plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Сприймайте їх як зарезервовані поверхні, а не як типовий шаблон для нових сторонніх Plugin.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують вузькоспрямовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-imports через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin у репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) для анонсів релізів.
2. Протестуйте свій Plugin на beta-тезі щойно він з’явиться. Вікно до стабільного релізу зазвичай становить лише кілька годин.
3. Після тестування напишіть у гілці вашого Plugin у каналі Discord `plugin-forum`, вказавши або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, створіть або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у вашій гілці Discord. Учасники не можуть ставити мітки PR, тому назва є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR буде змерджено; блокери без нього все одно можуть потрапити в реліз. Мейнтейнери стежать за цими гілками під час beta-тестування.
6. Відсутність повідомлень означає, що все гаразд. Якщо ви пропустите вікно, ваше виправлення, імовірно, потрапить до наступного циклу.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу повідомлень
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделі
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти й шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — глибоке занурення у внутрішню архітектуру
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник SDK Plugin
- [Manifest](/uk/plugins/manifest) — формат маніфесту Plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення Plugin каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення Plugin провайдерів
