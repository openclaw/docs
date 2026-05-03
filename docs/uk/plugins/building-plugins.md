---
read_when:
    - Ви хочете створити новий Plugin OpenClaw
    - Вам потрібен посібник зі швидкого старту для розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin OpenClaw за лічені хвилини
title: Створення Plugin
x-i18n:
    generated_at: "2026-05-03T23:46:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння
медіа, генерація зображень, генерація відео, web fetch, web search, інструменти
агента або будь-яке поєднання.

Вам не потрібно додавати свій plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub), і користувачі встановлять його за допомогою
`openclaw plugins install clawhub:<package-name>`. Голі специфікації пакетів усе
ще встановлюються з npm під час перехідного запуску.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для plugins у репозиторії: репозиторій клоновано й виконано `pnpm install`.
  Розробка plugins у вихідному checkout підтримує лише pnpm, тому що OpenClaw
  завантажує вбудовані plugins із workspace-пакетів `extensions/*`.

## Який тип plugin?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Під’єднайте OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власну кінцеву точку)
  </Card>
  <Card title="Plugin інструментів / hooks" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, event hooks або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Для plugin каналу, який не гарантовано встановлено під час onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера налаштування і
майстра, яка повідомляє про вимогу встановлення та закрито завершується з
помилкою під час реальних записів конфігурації, доки plugin не буде встановлено.

## Швидкий старт: plugin інструментів

Цей покроковий посібник створює мінімальний plugin, який реєструє інструмент
агента. Plugins каналів і провайдерів мають окремі посібники, посилання на які
наведено вище.

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

    Кожному plugin потрібен маніфест, навіть без конфігурації. Інструменти,
    зареєстровані під час виконання, мають бути перелічені в `contracts.tools`,
    щоб OpenClaw міг знайти власний plugin без завантаження runtime кожного
    plugin. Plugins також мають свідомо оголошувати `activation.onStartup`. У
    цьому прикладі встановлено `true`. Повну схему див. у
    [Маніфесті](/uk/plugins/manifest). Канонічні фрагменти для публікації в ClawHub
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

    `definePluginEntry` призначено для plugins, що не є каналами. Для каналів
    використовуйте `defineChannelPluginEntry` — див.
    [Plugins каналів](/uk/plugins/sdk-channel-plugins). Повні параметри точки входу
    див. у [Точках входу](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні plugins:** перевірте й опублікуйте за допомогою ClawHub, потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Голі специфікації пакетів, як-от `@myorg/openclaw-my-plugin`, встановлюються
    з npm під час перехідного запуску. Використовуйте `clawhub:`, коли потрібне
    розв’язання через ClawHub.

    **Plugins у репозиторії:** розмістіть під деревом workspace вбудованих plugins — їх буде виявлено автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості plugin

Один plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість            | Метод реєстрації                                | Докладний посібник                                                            |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| Текстовий inference (LLM) | `api.registerProvider(...)`                    | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins)                          |
| Backend inference CLI | `api.registerCliBackend(...)`                  | [Backends CLI](/uk/gateway/cli-backends)                                         |
| Канал / повідомлення  | `api.registerChannel(...)`                     | [Plugins каналів](/uk/plugins/sdk-channel-plugins)                               |
| Мовлення (TTS/STT)    | `api.registerSpeechProvider(...)`              | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`       | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`  | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`     | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики      | `api.registerMusicGenerationProvider(...)`     | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`     | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch             | `api.registerWebFetchProvider(...)`            | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search            | `api.registerWebSearchProvider(...)`           | [Plugins провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)` | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                           |
| Інструменти агента    | `api.registerTool(...)`                        | Нижче                                                                         |
| Користувацькі команди | `api.registerCommand(...)`                     | [Точки входу](/uk/plugins/sdk-entrypoints)                                       |
| Plugin hooks          | `api.on(...)`                                  | [Plugin hooks](/uk/plugins/hooks)                                                |
| Внутрішні event hooks | `api.registerHook(...)`                        | [Точки входу](/uk/plugins/sdk-entrypoints)                                       |
| HTTP-маршрути         | `api.registerHttpRoute(...)`                   | [Внутрішня архітектура](/uk/plugins/architecture-internals#gateway-http-routes)  |
| Підкоманди CLI        | `api.registerCli(...)`                         | [Точки входу](/uk/plugins/sdk-entrypoints)                                       |

Повний API реєстрації див. в [Огляді SDK](/uk/plugins/sdk-overview#registration-api).

Вбудовані plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли їм
потрібне асинхронне переписування результатів інструментів до того, як модель
побачить вивід. Оголосіть цільові runtimes у
`contracts.agentToolResultMiddleware`, наприклад `["pi", "codex"]`. Це довірений
seam вбудованого plugin; зовнішнім plugins варто надавати перевагу звичайним
OpenClaw plugin hooks, доки OpenClaw не отримає явну політику довіри для цієї
можливості.

Якщо ваш plugin реєструє користувацькі RPC-методи Gateway, тримайте їх на
префіксі, специфічному для plugin. Основні admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
розв’язуються до `operator.admin`, навіть якщо plugin запитує вужчу область.

Семантика захисників hooks, про яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним і зупиняє handlers із нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через overlay схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним і зупиняє handlers із нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальним і зупиняє handlers із нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідного thread/topic. Залишайте `metadata` для додаткових даних, специфічних для каналу.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` над ключами metadata, специфічними для каналу.

Команда `/approve` обробляє як exec-схвалення, так і схвалення plugin з обмеженим fallback: коли id exec-схвалення не знайдено, OpenClaw повторює той самий id через схвалення plugin. Перенаправлення схвалень plugin можна налаштувати незалежно через `approvals.plugin` у конфігурації.

Якщо користувацькі механізми схвалення мають виявляти той самий випадок
обмеженого fallback, віддавайте перевагу `isApprovalNotFoundError` з
`openclaw/plugin-sdk/error-runtime` замість ручного зіставлення рядків про
закінчення строку дії схвалення.

Приклади й довідник hooks див. у [Plugin hooks](/uk/plugins/hooks).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які LLM може викликати. Вони можуть бути
обов’язковими (завжди доступні) або необов’язковими (користувач підключає їх
самостійно):

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

Кожен інструмент, зареєстрований за допомогою `api.registerTool(...)`, також має
бути оголошений у маніфесті plugin:

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

OpenClaw захоплює та кешує перевірений дескриптор із зареєстрованого інструмента,
тому plugins не дублюють `description` або дані схеми в маніфесті. Контракт
маніфесту оголошує лише володіння та виявлення; виконання й надалі викликає
актуальну реалізацію зареєстрованого інструмента.
Установіть `toolMetadata.<tool>.optional: true` для інструментів, зареєстрованих через
`api.registerTool(..., { optional: true })`, щоб OpenClaw міг не завантажувати
середовище виконання цього plugin, доки інструмент не буде явно додано до allowlist.

Користувачі вмикають необов’язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не повинні конфліктувати з основними інструментами (конфліктні пропускаються)
- Інструменти з некоректними об’єктами реєстрації, зокрема без `parameters`, пропускаються та повідомляються в діагностиці plugin замість того, щоб ламати запуски агентів
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з plugin, додавши ідентифікатор plugin до `tools.allow`

## Реєстрація команд CLI

Plugins можуть додавати кореневі групи команд `openclaw` за допомогою `api.registerCli`. Надайте
`descriptors` для кожного кореня команди верхнього рівня, щоб OpenClaw міг показувати та маршрутизувати
команду без передчасного завантаження середовища виконання кожного plugin.

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

Для provider plugins тримайте специфічні для провайдера допоміжні функції в цих barrel-файлах
кореня пакета, якщо seam не є справді універсальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude і допоміжні функції `service_tier` / beta
- OpenAI: побудовники провайдерів, допоміжні функції моделей за замовчуванням, realtime-провайдери
- OpenRouter: побудовник провайдера плюс допоміжні функції onboarding/конфігурації

Якщо допоміжна функція корисна лише всередині одного вбудованого пакета провайдера, тримайте її на цьому
seam кореня пакета замість просування в `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні seams `openclaw/plugin-sdk/<bundled-id>` досі існують для
супроводу вбудованих plugins, коли вони мають відстежуване використання власником. Вважайте їх
зарезервованими поверхнями, а не стандартним шаблоном для нових сторонніх plugins.

## Контрольний список перед поданням

<Check>**package.json** має коректні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують сфокусовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (plugins у репозиторії)</Check>

## Тестування beta-релізу

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Beta-теги мають вигляд `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного X-акаунта OpenClaw [@openclaw](https://x.com/openclaw), щоб отримувати оголошення про релізи.
2. Протестуйте свій plugin з beta-тегом одразу після його появи. Вікно до stable зазвичай триває лише кілька годин.
3. Після тестування напишіть у треді свого plugin в Discord-каналі `plugin-forum`: або `all good`, або що зламалося. Якщо треда ще немає, створіть його.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свій тред.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у свій Discord-тред. Contributors не можуть ставити мітки на PR, тому назва є сигналом на боці PR для maintainers і автоматизації. Blockers із PR зливаються; blockers без PR можуть усе одно потрапити в реліз. Maintainers стежать за цими тредами під час beta-тестування.
6. Мовчання означає зелений статус. Якщо ви пропустите вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу обміну повідомленнями
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

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — поглиблений огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник SDK для Plugin
- [Маніфест](/uk/plugins/manifest) — формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
