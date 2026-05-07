---
read_when:
    - Ви хочете створити новий Plugin OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за кілька хвилин
title: Створення плагінів
x-i18n:
    generated_at: "2026-05-07T15:09:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень,
генерація відео, web fetch, web search, інструменти агентів або будь-яке
поєднання.

Вам не потрібно додавати свій plugin до репозиторію OpenClaw. Опублікуйте в
[ClawHub](/uk/tools/clawhub), і користувачі встановлять його за допомогою
`openclaw plugins install clawhub:<package-name>`. Прості специфікації пакетів усе ще
встановлюються з npm під час перехідного етапу запуску.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для plugins у репозиторії: репозиторій клоновано і виконано `pnpm install`. Розробка plugins
  з checkout вихідного коду підтримує лише pnpm, тому що OpenClaw завантажує вбудовані
  plugins із пакетів workspace `extensions/*`.

## Який тип plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власний endpoint)
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Зіставте локальний AI CLI з текстовим fallback runner OpenClaw
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або служби - продовжуйте нижче
  </Card>
</CardGroup>

Для channel plugin, встановлення якого не гарантоване під час onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару setup adapter + wizard,
яка повідомляє про вимогу встановлення і безпечно відмовляє в реальних записах конфігурації,
доки plugin не буде встановлено.

## Швидкий старт: tool plugin

Цей посібник створює мінімальний plugin, який реєструє інструмент агента. Для channel
і provider plugins є окремі посібники, посилання на які наведено вище.

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

    Кожному plugin потрібен manifest, навіть без конфігурації. Інструменти, зареєстровані runtime,
    мають бути перелічені в `contracts.tools`, щоб OpenClaw міг виявити plugin-власника
    без завантаження runtime кожного plugin. Plugins також мають свідомо оголошувати
    `activation.onStartup`. У цьому прикладі для нього встановлено `true`. Див.
    [Manifest](/uk/plugins/manifest), щоб переглянути повну schema. Канонічні фрагменти публікації ClawHub
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

    `definePluginEntry` призначений для plugins, які не є channels. Для channels використовуйте
    `defineChannelPluginEntry` - див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повні параметри entry point див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні plugins:** перевірте й опублікуйте за допомогою ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Прості специфікації пакетів на кшталт `@myorg/openclaw-my-plugin` встановлюються з npm під час
    перехідного етапу запуску. Використовуйте `clawhub:`, коли потрібна резолюція через ClawHub.

    **Plugins у репозиторії:** розмістіть у дереві workspace вбудованих plugins - вони виявляються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                                | Докладний посібник                                                             |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстове inference (LLM) | `api.registerProvider(...)`                      | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Backend inference CLI  | `api.registerCliBackend(...)`                    | [CLI Backend Plugins](/uk/plugins/cli-backend-plugins)                             |
| Channel / обмін повідомленнями | `api.registerChannel(...)`                       | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)     | `api.registerSpeechProvider(...)`                | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                             |
| Інструменти агента     | `api.registerTool(...)`                          | Нижче                                                                           |
| Власні команди         | `api.registerCommand(...)`                       | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Hooks Plugin           | `api.on(...)`                                    | [Hooks Plugin](/uk/plugins/hooks)                                                  |
| Внутрішні event hooks  | `api.registerHook(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP routes            | `api.registerHttpRoute(...)`                     | [Внутрішні компоненти](/uk/plugins/architecture-internals#gateway-http-routes)     |
| CLI subcommands        | `api.registerCli(...)`                           | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. в [Огляді SDK](/uk/plugins/sdk-overview#registration-api).

Вбудовані plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результату інструмента до того, як модель побачить output. Оголосіть
цільові runtimes у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірений seam для вбудованих plugins; зовнішнім
plugins варто віддавати перевагу звичайним hooks plugins OpenClaw, якщо OpenClaw не отримає
явної trust policy для цієї можливості.

Якщо ваш plugin реєструє власні gateway RPC methods, тримайте їх на
префіксі, специфічному для plugin. Основні admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди resolve до
`operator.admin`, навіть якщо plugin просить вужчу scope.

Семантика hook guard, яку варто мати на увазі:

- `before_tool_call`: `{ block: true }` є terminal і зупиняє handlers із нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента і просить користувача підтвердити через exec approval overlay, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому channel.
- `before_install`: `{ block: true }` є terminal і зупиняє handlers із нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є terminal і зупиняє handlers із нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація inbound thread/topic. Залишайте `metadata` для додаткових даних, специфічних для channel.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId`, а не ключам metadata, специфічним для channel.

Команда `/approve` обробляє як exec, так і plugin approvals з обмеженим fallback: коли id exec approval не знайдено, OpenClaw повторює той самий id через plugin approvals. Перенаправлення plugin approval можна налаштувати незалежно через `approvals.plugin` у config.

Якщо власній approval plumbing потрібно виявити той самий випадок обмеженого fallback,
віддавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`,
а не ручному зіставленню рядків approval-expiry.

Приклади та довідник hooks див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або optional (користувач підключає їх самостійно):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw захоплює й кешує перевірений дескриптор із зареєстрованого інструмента,
тому plugins не дублюють `description` або дані схеми в маніфесті. Контракт
маніфесту лише оголошує власника й виявлення; виконання все одно викликає
актуальну реалізацію зареєстрованого інструмента.
Установіть `toolMetadata.<tool>.optional: true` для інструментів, зареєстрованих за допомогою
`api.registerTool(..., { optional: true })`, щоб OpenClaw міг не завантажувати
runtime цього plugin, доки інструмент не буде явно внесено до allowlist.

Користувачі вмикають необов’язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не повинні конфліктувати з основними інструментами (конфлікти пропускаються)
- Інструменти з неправильно сформованими об’єктами реєстрації, зокрема без `parameters`, пропускаються й повідомляються в діагностиці plugin замість того, щоб ламати запуски агента
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з plugin, додавши ідентифікатор plugin до `tools.allow`

## Реєстрація команд CLI

Plugins можуть додавати кореневі групи команд `openclaw` за допомогою `api.registerCli`. Надайте
`descriptors` для кожного кореня команди верхнього рівня, щоб OpenClaw міг показувати й маршрутизувати
команду без завчасного завантаження runtime кожного plugin.

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

Після встановлення перевірте реєстрацію runtime і виконайте команду:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Умовні позначення імпортів

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. в [огляді SDK](/uk/plugins/sdk-overview).

У своєму plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів - ніколи не імпортуйте власний plugin через його шлях SDK.

Для provider plugins тримайте специфічні для провайдера допоміжні функції в цих barrel-файлах
кореня пакета, якщо межа не є справді універсальною. Поточні вбудовані приклади:

- Anthropic: обгортки потоку Claude та допоміжні засоби `service_tier` / beta
- OpenAI: побудовники провайдера, допоміжні засоби моделей за замовчуванням, провайдери реального часу
- OpenRouter: побудовник провайдера та допоміжні засоби onboarding/config

Якщо допоміжний засіб корисний лише всередині одного вбудованого пакета провайдера, тримайте його на цій
межі кореня пакета замість просування в `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні межі `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
обслуговування вбудованих plugins, коли вони мають відстежене використання власником. Розглядайте їх як
зарезервовані поверхні, а не як стандартний шаблон для нових сторонніх plugins.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для plugins у репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub на [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного облікового запису OpenClaw в X [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій plugin із beta-тегом, щойно він з’явиться. Вікно до стабільного релізу зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці свого plugin в каналі Discord `plugin-forum`: або `all good`, або що зламалося. Якщо гілки ще немає, створіть її.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у своїй гілці Discord. Контриб’ютори не можуть ставити мітки на PR, тому назва є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR зливаються; блокери без PR можуть потрапити в реліз попри це. Мейнтейнери стежать за цими гілками під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу повідомлень
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin провайдера моделі
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/uk/plugins/cli-backend-plugins">
    Зареєструйте локальний backend CLI для AI
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник карти імпортів і API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, субагент через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти й шаблони
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) - докладний розбір внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) - довідник SDK для Plugin
- [Маніфест](/uk/plugins/manifest) - формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) - створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) - створення provider plugins
