---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен короткий посібник зі швидкого старту для розробки Plugin-ів
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-04-24T03:06:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin-и розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень,
генерація відео, отримання даних із вебу, вебпошук, інструменти агента або будь-яка
комбінація.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається використати ClawHub, а
потім автоматично переходить до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знання TypeScript (ESM)
- Для Plugin-ів у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип Plugin-а?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключає OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додає провайдера моделей (LLM, проксі або власну кінцеву точку)
  </Card>
  <Card title="Plugin інструмента / hook" icon="wrench">
    Реєструє інструменти агента, hook-и подій або сервіси — продовження нижче
  </Card>
</CardGroup>

Для Plugin-а каналу, який не гарантовано буде встановлено на момент запуску
onboarding/налаштування, використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера налаштування та майстра,
яка повідомляє про вимогу встановлення і блокує реальні записи конфігурації
до встановлення Plugin-а.

## Швидкий старт: Plugin інструмента

Цей приклад створює мінімальний Plugin, який реєструє інструмент агента. Для Plugin-ів
каналів і провайдерів є окремі посібники за посиланнями вище.

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

    Кожному Plugin-у потрібен маніфест, навіть без конфігурації. Див.
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні фрагменти для публікації в ClawHub
    розміщені в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` призначено для Plugin-ів, що не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів точки входу див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugin-и:** перевірте й опублікуйте через ClawHub, потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, таких як
    `@myorg/openclaw-my-plugin`.

    **Plugin-и в репозиторії:** розміщуйте у дереві робочого простору вбудованих Plugin-ів — вони виявляються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin-а

Один Plugin може реєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                               | Детальний посібник                                                              |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Текстовий inference (LLM) | `api.registerProvider(...)`                 | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Бекенд CLI inference   | `api.registerCliBackend(...)`                  | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями | `api.registerChannel(...)`                | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)     | `api.registerSpeechProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`  | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання даних із вебу | `api.registerWebFetchProvider(...)`           | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук               | `api.registerWebSearchProvider(...)`           | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вбудоване розширення Pi | `api.registerEmbeddedExtensionFactory(...)`   | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агента     | `api.registerTool(...)`                        | Нижче                                                                           |
| Власні команди         | `api.registerCommand(...)`                     | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Hook-и подій           | `api.registerHook(...)`                        | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути          | `api.registerHttpRoute(...)`                   | [Internals](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI         | `api.registerCli(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли Plugin-у потрібні
Pi-native hook-и embedded-runner, наприклад асинхронне переписування `tool_result`
перед надсиланням фінального повідомлення з результатом інструмента. Віддавайте перевагу
звичайним hook-ам Plugin-ів OpenClaw, якщо робота не потребує таймінгу розширення Pi.

Якщо ваш Plugin реєструє власні gateway RPC-методи, використовуйте для них
префікс, специфічний для Plugin-а. Простори імен core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
прив’язуються до `operator.admin`, навіть якщо Plugin запитує вужчу область доступу.

Семантика guard для hook-ів, яку варто враховувати:

- `before_tool_call`: `{ block: true }` є остаточним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` розглядається як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через оверлей схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є остаточним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` розглядається як відсутність рішення.
- `message_sending`: `{ cancel: true }` є остаточним рішенням і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` розглядається як відсутність рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних потоків/тем. `metadata` залишайте для додаткових даних, специфічних для каналу.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як схвалення exec, так і схвалення Plugin-ів, із обмеженим резервним сценарієм: коли ідентифікатор схвалення exec не знайдено, OpenClaw повторно пробує той самий ідентифікатор для схвалень Plugin-ів. Переспрямування схвалень Plugin-ів можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо для власної логіки схвалення потрібно визначати той самий випадок
обмеженого резервного сценарію, використовуйте
`isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про завершення терміну дії схвалення.

Докладніше див. у [SDK Overview hook decision semantics](/uk/plugins/sdk-overview#hook-decision-semantics).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими
(завжди доступні) або необов’язковими (користувач повинен увімкнути їх вручну):

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

- Імена інструментів не повинні конфліктувати з інструментами core (конфліктні пропускаються)
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти Plugin-а, додавши ідентифікатор Plugin-а до `tools.allow`

## Правила імпорту

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник щодо subpath див. у [SDK Overview](/uk/plugins/sdk-overview).

Усередині вашого Plugin-а використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Plugin-ів провайдерів зберігайте допоміжні функції, специфічні для провайдера, у цих
barrel-файлах кореня пакета, якщо лише цей інтерфейс не є справді загальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби моделей за замовчуванням, провайдери realtime
- OpenRouter: конструктор провайдера плюс допоміжні засоби onboarding/конфігурації

Якщо допоміжна функція корисна лише в межах одного вбудованого пакета провайдера, зберігайте її в межах
інтерфейсу кореня цього пакета замість перенесення до `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні інтерфейси `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки bundled-plugin і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Розглядайте їх як зарезервовані
інтерфейси, а не як типовий шаблон для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-imports через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin-ів у репозиторії)</Check>

## Тестування бета-релізу

1. Слідкуйте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) для анонсів релізів.
2. Протестуйте свій Plugin на бета-тегу, щойно він з’явиться. Вікно до стабільного релізу зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці вашого Plugin-а в каналі Discord `plugin-forum`, вказавши `all good` або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, створіть або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і додайте мітку `beta-blocker`. Додайте посилання на issue у вашу гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue і в PR, і у вашу гілку в Discord. Учасники не можуть ставити мітки PR, тому назва є сигналом на боці PR для мейнтейнерів та автоматизації. Блокери з PR зливаються; блокери без PR усе одно можуть потрапити в реліз. Мейнтейнери стежать за цими гілками під час бета-тестування.
6. Відсутність повідомлень означає, що все гаразд. Якщо ви пропустите це вікно, ваш виправлений код, імовірно, потрапить уже в наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Plugin-и каналів" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Plugin-и провайдерів" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник з API реєстрації
  </Card>
  <Card title="Допоміжні засоби runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Маніфест Plugin-а" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Plugin Architecture](/uk/plugins/architecture) — поглиблений огляд внутрішньої архітектури
- [SDK Overview](/uk/plugins/sdk-overview) — довідник з Plugin SDK
- [Manifest](/uk/plugins/manifest) — формат маніфесту plugin-а
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення plugin-ів каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення plugin-ів провайдерів
