---
read_when:
    - Ви хочете створити новий OpenClaw Plugin
    - Вам потрібен швидкий старт для розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший OpenClaw Plugin за лічені хвилини
title: Створення плагінів
x-i18n:
    generated_at: "2026-05-01T10:03:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c80b831161c93b0a7f65baf1ccea705ccc27b8226180c0fd0ef15fbbefa3d83
    source_path: plugins/building-plugins.md
    workflow: 16
---

Плагіни розширюють OpenClaw новими можливостями: канали, постачальники моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень, генерація відео, отримання даних з вебу, вебпошук, інструменти агента або будь-яка
комбінація.

Вам не потрібно додавати свій плагін до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub), а користувачі встановлять за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку пробує ClawHub і
автоматично повертається до npm для пакетів, які все ще використовують розповсюдження через npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для плагінів у репозиторії: репозиторій клоновано й виконано `pnpm install`

## Який тип плагіна?

<CardGroup cols={3}>
  <Card title="Плагін каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Плагін постачальника" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте постачальника моделей (LLM, проксі або користувацький endpoint)
  </Card>
  <Card title="Плагін інструмента / hook" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для плагіна каналу, який не гарантовано буде встановлений під час виконання onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару setup adapter + wizard,
яка повідомляє про вимогу встановлення й завершується закрито під час реальних записів конфігурації,
доки плагін не буде встановлено.

## Швидкий старт: плагін інструмента

У цьому покроковому посібнику створюється мінімальний плагін, який реєструє інструмент агента. Для плагінів каналів
і постачальників є окремі посібники, посилання на які наведено вище.

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

    Кожному плагіну потрібен маніфест, навіть без конфігурації, і кожен плагін має
    явно оголошувати `activation.onStartup`. Інструменти, зареєстровані під час runtime, потребують
    імпорту під час запуску, тому в цьому прикладі значення встановлено на `true`. Див.
    [Маніфест](/uk/plugins/manifest) для повної схеми. Канонічні фрагменти публікації в ClawHub
    містяться в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` призначено для плагінів, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
    Повні параметри точки входу див. у [Точки входу](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні плагіни:** перевірте й опублікуйте через ClawHub, потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, як-от
    `@myorg/openclaw-my-plugin`; npm залишається fallback для пакетів, які
    ще не мігрували до ClawHub.

    **Плагіни в репозиторії:** розмістіть у дереві робочої області bundled plugin — буде виявлено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один плагін може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                              | Детальний посібник                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Текстовий inference (LLM)   | `api.registerProvider(...)`                      | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins)                               |
| CLI inference backend  | `api.registerCliBackend(...)`                    | [CLI Backends](/uk/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями    | `api.registerChannel(...)`                       | [Плагіни каналів](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі         | `api.registerRealtimeVoiceProvider(...)`         | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа    | `api.registerMediaUnderstandingProvider(...)`    | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень       | `api.registerImageGenerationProvider(...)`       | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`       | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`       | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання даних з вебу              | `api.registerWebFetchProvider(...)`              | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук             | `api.registerWebSearchProvider(...)`             | [Плагіни постачальників](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)`     | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                          |
| Інструменти агента            | `api.registerTool(...)`                          | Нижче                                                                           |
| Користувацькі команди        | `api.registerCommand(...)`                       | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| Hooks плагіна           | `api.on(...)`                                    | [Hooks плагіна](/uk/plugins/hooks)                                                  |
| Внутрішні event hooks   | `api.registerHook(...)`                          | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути            | `api.registerHttpRoute(...)`                     | [Внутрішня архітектура](/uk/plugins/architecture-internals#gateway-http-routes)                |
| Підкоманди CLI        | `api.registerCli(...)`                           | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. в [Огляд SDK](/uk/plugins/sdk-overview#registration-api).

Bundled plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результату інструмента до того, як модель побачить вивід. Оголосіть
цільові runtime у `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex"]`. Це довірена межа bundled-plugin; зовнішнім
плагінам варто віддавати перевагу звичайним hooks плагінів OpenClaw, доки OpenClaw не отримає
явну trust policy для цієї можливості.

Якщо ваш плагін реєструє користувацькі RPC-методи gateway, тримайте їх у
префіксі, специфічному для плагіна. Основні простори імен адміністрування (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди резолвляться до
`operator.admin`, навіть якщо плагін просить вужчу область доступу.

Семантика hook guard, яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через overlay схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: надавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідного thread/topic. Залишайте `metadata` для додаткових даних, специфічних для каналу.
- `message_sending`: надавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як exec approvals, так і approvals плагінів з обмеженим fallback: коли id exec approval не знайдено, OpenClaw повторює той самий id серед approvals плагінів. Перенаправлення approvals плагіна можна налаштувати незалежно через `approvals.plugin` у конфігурації.

Якщо користувацька approval plumbing має виявляти той самий випадок обмеженого fallback,
надавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків закінчення строку дії approval.

Приклади й довідник hooks див. у [Hooks плагіна](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які LLM може викликати. Вони можуть бути обов’язковими (завжди
доступні) або необов’язковими (користувач вмикає їх самостійно):

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

- Імена інструментів не повинні конфліктувати з core tools (конфлікти пропускаються)
- Інструменти з некоректними об’єктами реєстрації, включно з відсутнім `parameters`, пропускаються й повідомляються в діагностиці плагіна замість того, щоб ламати запуски агента
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до binary
- Користувачі можуть увімкнути всі інструменти з плагіна, додавши id плагіна до `tools.allow`

## Реєстрація команд CLI

Плагіни можуть додавати кореневі групи команд `openclaw` за допомогою `api.registerCli`. Надайте
`descriptors` для кожного кореня команди верхнього рівня, щоб OpenClaw міг показувати й маршрутизувати
команду без eager loading кожного runtime плагіна.

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

## Угоди щодо імпортів

Завжди імпортуйте зі сфокусованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. у [огляді SDK](/uk/plugins/sdk-overview).

У межах свого plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний plugin через його шлях SDK.

Для provider plugins тримайте специфічні для провайдера допоміжні засоби в цих barrel-файлах
кореня пакета, якщо seam не є справді універсальним. Поточні bundled приклади:

- Anthropic: обгортки потоку Claude та допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби моделей за замовчуванням, realtime-провайдери
- OpenRouter: конструктор провайдера та допоміжні засоби onboarding/config

Якщо допоміжний засіб корисний лише всередині одного bundled пакета провайдера, тримайте його на цьому
seam кореня пакета замість просування в `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні seams `openclaw/plugin-sdk/<bundled-id>` досі існують для
супроводу bundled-plugin, коли мають відстежене використання власником. Сприймайте їх як
зарезервовані поверхні, а не як стандартний шаблон для нових third-party plugins.

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (plugins у репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub на [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги виглядають як `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного акаунта OpenClaw в X [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій plugin із beta-тегом щойно він з'явиться. Вікно до stable зазвичай триває лише кілька годин.
3. Після тестування напишіть у треді свого plugin в каналі Discord `plugin-forum` або `all good`, або що зламалося. Якщо треда ще немає, створіть його.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свій тред.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у свій тред Discord. Учасники не можуть додавати мітки до PR, тому назва є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR зливають; блокери без PR можуть потрапити в реліз попри це. Мейнтейнери стежать за цими тредами під час beta-тестування.
6. Мовчання означає зелений стан. Якщо ви пропустите вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу повідомлень
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Мапа імпортів і довідник API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Тестові утиліти та шаблони
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов'язане

- [Архітектура Plugin](/uk/plugins/architecture) — глибокий огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Маніфест](/uk/plugins/manifest) — формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
