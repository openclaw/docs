---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin
x-i18n:
    generated_at: "2026-05-02T13:56:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f810d831db26d1e4efecf691590980b3ba1d958c4b4af3cc6a7ca9ea155a36
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрибування в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень,
генерація відео, отримання вебвмісту, вебпошук, інструменти агента або будь-яка
комбінація.

Вам не потрібно додавати свій plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub), і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку пробує ClawHub і
автоматично повертається до npm для пакетів, які все ще використовують розповсюдження через npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для plugins у репозиторії: репозиторій клоновано і виконано `pnpm install`. Розробка plugin
  з checkout вихідного коду підтримує лише pnpm, тому що OpenClaw завантажує вбудовані
  plugins із workspace-пакетів `extensions/*`.

## Який тип plugin?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власну кінцеву точку)
  </Card>
  <Card title="Plugin інструменту / hook" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для plugin каналу, який не гарантовано буде встановлений під час onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптер setup + wizard,
яка повідомляє про вимогу встановлення і відмовляє безпечно під час реальних записів конфігурації,
доки plugin не буде встановлено.

## Швидкий старт: plugin інструменту

Цей покроковий посібник створює мінімальний plugin, який реєструє інструмент агента. Для plugins каналів
і провайдерів є окремі посібники, посилання на які наведено вище.

<Steps>
  <Step title="Створіть пакет і manifest">
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
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Кожному plugin потрібен manifest, навіть без конфігурації. Інструменти, зареєстровані під час виконання,
    мають бути перелічені в `contracts.tools`, щоб OpenClaw міг знайти власника
    plugin без завантаження runtime кожного plugin. Plugins також мають свідомо оголошувати
    `activation.onStartup`. У цьому прикладі встановлено `true`. Див.
    [Manifest](/uk/plugins/manifest) для повної схеми. Канонічні snippets публікації ClawHub
    розміщені в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Напишіть entry point">

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

    `definePluginEntry` призначений для plugins, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Plugins каналів](/uk/plugins/sdk-channel-plugins).
    Повні параметри entry point наведено в [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні plugins:** перевірте й опублікуйте за допомогою ClawHub, а потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, як-от
    `@myorg/openclaw-my-plugin`; npm залишається fallback для пакетів, які
    ще не мігрували до ClawHub.

    **Plugins у репозиторії:** розмістіть під деревом workspace вбудованих plugins — буде знайдено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один plugin може зареєструвати будь-яку кількість можливостей через об'єкт `api`:

| Можливість             | Метод реєстрації                              | Докладний посібник                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстове inference (LLM)   | `api.registerProvider(...)`                      | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins)                               |
| Backend inference для CLI  | `api.registerCliBackend(...)`                    | [Backends CLI](/uk/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями    | `api.registerChannel(...)`                       | [Plugins каналів](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрибування в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі         | `api.registerRealtimeVoiceProvider(...)`         | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа    | `api.registerMediaUnderstandingProvider(...)`    | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень       | `api.registerImageGenerationProvider(...)`       | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`       | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання вебвмісту              | `api.registerWebFetchProvider(...)`              | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук             | `api.registerWebSearchProvider(...)`             | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агента            | `api.registerTool(...)`                          | Нижче                                                                           |
| Власні команди        | `api.registerCommand(...)`                       | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/uk/plugins/hooks)                                                  |
| Внутрішні event hooks   | `api.registerHook(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP routes            | `api.registerHttpRoute(...)`                     | [Внутрішня архітектура](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний registration API див. в [Огляд SDK](/uk/plugins/sdk-overview#registration-api).

Вбудовані plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результатів інструментів до того, як модель побачить output. Оголосіть
цільові runtimes у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірений seam для вбудованих plugins; зовнішнім
plugins варто віддавати перевагу звичайним hooks OpenClaw plugin, якщо OpenClaw не додасть
явної trust policy для цієї можливості.

Якщо ваш plugin реєструє власні RPC-методи gateway, тримайте їх на
префіксі, специфічному для plugin. Core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди розв'язуються до
`operator.admin`, навіть якщо plugin просить вужчий scope.

Семантика guard для hooks, яку варто пам'ятати:

- `before_tool_call`: `{ block: true }` є terminal і зупиняє handlers з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через overlay схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є terminal і зупиняє handlers з нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є terminal і зупиняє handlers з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних thread/topic. Залишайте `metadata` для додаткових даних, специфічних для каналу.
- `message_sending`: віддавайте перевагу типізованим routing-полям `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як exec, так і plugin approvals з обмеженим fallback: коли id exec approval не знайдено, OpenClaw повторює той самий id через plugin approvals. Forwarding plugin approval можна налаштувати незалежно через `approvals.plugin` у конфігурації.

Якщо власна approval plumbing має виявити той самий випадок обмеженого fallback,
віддавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про expiration approval.

Приклади та довідник hooks див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які LLM може викликати. Вони можуть бути обов'язковими (завжди
доступні) або необов'язковими (користувач вмикає самостійно):

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

Кожен інструмент, зареєстрований через `api.registerTool(...)`, також має бути оголошений у
manifest plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw захоплює й кешує перевірений descriptor із зареєстрованого інструмента,
тому plugins не дублюють `description` або дані schema в manifest. Контракт
manifest лише оголошує ownership і discovery; виконання все одно викликає
живу зареєстровану реалізацію інструмента.

Користувачі вмикають необов'язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не мають конфліктувати з основними інструментами (конфлікти пропускаються)
- Інструменти з некоректними об’єктами реєстрації, зокрема без `parameters`, пропускаються й повідомляються в діагностиці plugin замість того, щоб ламати запуски агента
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з plugin, додавши ідентифікатор plugin до `tools.allow`

## Реєстрація команд CLI

Plugins можуть додавати кореневі групи команд `openclaw` за допомогою `api.registerCli`. Надайте
`descriptors` для кожного кореня команди верхнього рівня, щоб OpenClaw міг показувати й маршрутизувати
команду без завчасного завантаження кожного середовища виконання plugin.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Після встановлення перевірте реєстрацію середовища виконання та виконайте команду:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Угоди щодо імпорту

Завжди імпортуйте зі сфокусованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. у [Огляді SDK](/uk/plugins/sdk-overview).

У межах вашого plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний plugin через його SDK-шлях.

Для provider plugins тримайте специфічні для провайдера допоміжні функції в цих barrel-файлах кореня пакета,
якщо цей seam не є справді універсальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоку Claude та допоміжні функції `service_tier` / beta
- OpenAI: побудовники провайдера, допоміжні функції стандартної моделі, realtime-провайдери
- OpenRouter: побудовник провайдера плюс допоміжні функції onboarding/config

Якщо допоміжна функція корисна лише всередині одного вбудованого пакета провайдера, тримайте її на цьому
seam кореня пакета замість просування в `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні seam `openclaw/plugin-sdk/<bundled-id>` досі існують для
супроводу вбудованих plugins, коли для них відстежується використання власником. Сприймайте їх як
зарезервовані поверхні, а не як типовий шаблон для нових сторонніх plugins.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (plugins усередині репозиторію)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій plugin з beta-тегом щойно він з’явиться. Вікно до стабільного релізу зазвичай триває лише кілька годин.
3. Напишіть у гілці свого plugin в Discord-каналі `plugin-forum` після тестування: або `all good`, або що зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось ламається, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у своїй гілці Discord. Контриб’ютори не можуть ставити мітки на PR, тому назва є сигналом з боку PR для мейнтейнерів і автоматизації. Блокери з PR зливаються; блокери без PR можуть усе одно потрапити в реліз. Мейнтейнери стежать за цими гілками під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите це вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу повідомлень
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, субагент через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти й шаблони
  </Card>
  <Card title="Маніфест Plugin" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — глибокий огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Маніфест](/uk/plugins/manifest) — формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення plugins каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення plugins провайдерів
